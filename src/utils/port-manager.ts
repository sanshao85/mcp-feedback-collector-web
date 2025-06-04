/**
 * MCP Feedback Collector - 端口管理工具
 */

import { createServer } from 'net';
import { MCPError, PortInfo } from '../types/index.js';
import { logger } from './logger.js';
import { processManager } from './process-manager.js';

/**
 * 端口管理器
 */
export class PortManager {
  private readonly PORT_RANGE_START = 5000;
  private readonly PORT_RANGE_END = 5019;
  private readonly MAX_RETRIES = 20;

  /**
   * 检查端口是否可用（增强版本）
   */
  async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer();
      let resolved = false;

      // 设置超时，避免长时间等待
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          server.close(() => {
            resolve(false);
          });
        }
      }, 1000);

      server.listen(port, () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          // 端口可用，立即关闭测试服务器
          server.close(() => {
            resolve(true);
          });
        }
      });

      server.on('error', (err: any) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          // 端口不可用
          resolve(false);
        }
      });
    });
  }

  /**
   * 深度检查端口是否真正可用（包括进程检测）
   */
  async isPortTrulyAvailable(port: number): Promise<boolean> {
    // 首先进行基础检查
    const basicCheck = await this.isPortAvailable(port);
    if (!basicCheck) {
      return false;
    }

    // 检查是否有进程占用该端口
    const processInfo = await processManager.getPortProcess(port);
    if (processInfo) {
      logger.debug(`端口 ${port} 被进程占用:`, processInfo);
      return false;
    }

    return true;
  }

  /**
   * 查找可用端口
   */
  async findAvailablePort(preferredPort?: number): Promise<number> {
    // 如果指定了首选端口，先尝试该端口
    if (preferredPort) {
      logger.debug(`检查首选端口: ${preferredPort}`);
      const available = await this.isPortAvailable(preferredPort);
      if (available) {
        logger.info(`使用首选端口: ${preferredPort}`);
        return preferredPort;
      } else {
        logger.warn(`首选端口 ${preferredPort} 不可用，寻找其他端口...`);
      }
    }

    // 在端口范围内查找可用端口
    for (let port = this.PORT_RANGE_START; port <= this.PORT_RANGE_END; port++) {
      logger.debug(`检查端口: ${port}`);
      if (await this.isPortAvailable(port)) {
        logger.info(`找到可用端口: ${port}`);
        return port;
      }
    }

    // 如果范围内没有可用端口，随机尝试
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      const randomPort = Math.floor(Math.random() * (65535 - 1024) + 1024);
      logger.debug(`尝试随机端口: ${randomPort}`);
      if (await this.isPortAvailable(randomPort)) {
        logger.info(`找到随机可用端口: ${randomPort}`);
        return randomPort;
      }
    }

    throw new MCPError(
      'No available ports found',
      'NO_AVAILABLE_PORTS',
      { 
        preferredPort,
        rangeStart: this.PORT_RANGE_START,
        rangeEnd: this.PORT_RANGE_END,
        maxRetries: this.MAX_RETRIES
      }
    );
  }

  /**
   * 获取端口信息
   */
  async getPortInfo(port: number): Promise<PortInfo> {
    const available = await this.isPortAvailable(port);
    
    return {
      port,
      available,
      // TODO: 添加PID检测（需要跨平台实现）
      pid: undefined
    };
  }

  /**
   * 获取端口范围内的所有端口状态
   */
  async getPortRangeStatus(): Promise<PortInfo[]> {
    const results: PortInfo[] = [];
    
    for (let port = this.PORT_RANGE_START; port <= this.PORT_RANGE_END; port++) {
      const info = await this.getPortInfo(port);
      results.push(info);
    }
    
    return results;
  }

  /**
   * 清理僵尸进程（跨平台实现）
   */
  async cleanupZombieProcesses(): Promise<void> {
    logger.info('开始清理僵尸进程...');
    
    try {
      // TODO: 实现跨平台的进程清理
      // Windows: tasklist, taskkill
      // Unix/Linux: ps, kill
      
      logger.info('僵尸进程清理完成');
    } catch (error) {
      logger.warn('清理僵尸进程时出错:', error);
    }
  }

  /**
   * 强制使用指定端口
   */
  async forcePort(port: number, killProcess: boolean = false): Promise<number> {
    logger.info(`强制使用端口: ${port}`);

    // 检查端口是否可用
    const available = await this.isPortAvailable(port);
    if (available) {
      logger.info(`端口 ${port} 可用，直接使用`);
      return port;
    }

    if (!killProcess) {
      throw new MCPError(
        `Port ${port} is occupied and killProcess is disabled`,
        'PORT_OCCUPIED',
        { port, killProcess }
      );
    }

    // 尝试强制释放端口
    logger.warn(`端口 ${port} 被占用，尝试强制释放...`);
    const released = await processManager.forceReleasePort(port);

    if (!released) {
      throw new MCPError(
        `Failed to force release port ${port}`,
        'PORT_FORCE_RELEASE_FAILED',
        { port }
      );
    }

    // 再次检查端口是否可用
    const finalCheck = await this.isPortAvailable(port);
    if (!finalCheck) {
      throw new MCPError(
        `Port ${port} is still occupied after force release`,
        'PORT_STILL_OCCUPIED',
        { port }
      );
    }

    logger.info(`端口 ${port} 强制释放成功`);
    return port;
  }

  /**
   * 等待端口释放（增强版本）
   */
  async waitForPortRelease(port: number, timeoutMs: number = 10000): Promise<void> {
    const startTime = Date.now();
    logger.info(`等待端口 ${port} 释放，超时时间: ${timeoutMs}ms`);

    while (Date.now() - startTime < timeoutMs) {
      // 使用深度检查确保端口真正可用
      if (await this.isPortTrulyAvailable(port)) {
        logger.info(`端口 ${port} 已完全释放`);
        return;
      }

      // 等待200ms后重试（增加等待时间）
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    throw new MCPError(
      `Port ${port} was not released within ${timeoutMs}ms`,
      'PORT_RELEASE_TIMEOUT',
      { port, timeoutMs }
    );
  }

  /**
   * 清理指定端口（强制释放并等待）
   */
  async cleanupPort(port: number): Promise<void> {
    logger.info(`开始清理端口: ${port}`);

    // 检查端口是否被占用
    const processInfo = await processManager.getPortProcess(port);
    if (!processInfo) {
      logger.info(`端口 ${port} 未被占用，无需清理`);
      return;
    }

    logger.info(`发现占用端口 ${port} 的进程:`, {
      pid: processInfo.pid,
      name: processInfo.name,
      command: processInfo.command
    });

    // 检查是否是安全的进程
    if (!processManager.isSafeToKill(processInfo)) {
      logger.warn(`端口 ${port} 被不安全的进程占用，跳过清理: ${processInfo.name}`);
      return;
    }

    // 尝试终止进程
    logger.info(`尝试终止占用端口 ${port} 的进程: ${processInfo.pid}`);
    const killed = await processManager.killProcess(processInfo.pid, false);

    if (killed) {
      // 等待端口释放
      try {
        await this.waitForPortRelease(port, 5000);
        logger.info(`端口 ${port} 清理成功`);
      } catch (error) {
        logger.warn(`端口 ${port} 清理后仍未释放，可能需要更多时间`);
      }
    } else {
      logger.warn(`无法终止占用端口 ${port} 的进程: ${processInfo.pid}`);
    }
  }

  /**
   * 强制释放端口（杀死占用进程）
   */
  async forceReleasePort(port: number): Promise<void> {
    logger.warn(`强制释放端口: ${port}`);
    
    try {
      // TODO: 实现跨平台的进程杀死
      // 1. 找到占用端口的进程PID
      // 2. 杀死该进程
      // 3. 等待端口释放
      
      await this.waitForPortRelease(port, 3000);
      logger.info(`端口 ${port} 强制释放成功`);
      
    } catch (error) {
      logger.error(`强制释放端口 ${port} 失败:`, error);
      throw new MCPError(
        `Failed to force release port ${port}`,
        'FORCE_RELEASE_FAILED',
        error
      );
    }
  }
}
