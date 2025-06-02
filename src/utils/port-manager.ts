/**
 * MCP Feedback Collector - 端口管理工具
 */

import { createServer } from 'net';
import { MCPError, PortInfo } from '../types/index.js';
import { logger } from './logger.js';

/**
 * 端口管理器
 */
export class PortManager {
  private readonly PORT_RANGE_START = 5000;
  private readonly PORT_RANGE_END = 5019;
  private readonly MAX_RETRIES = 20;

  /**
   * 检查端口是否可用
   */
  async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer();

      server.listen(port, () => {
        // 端口可用，立即关闭测试服务器
        server.close(() => {
          resolve(true);
        });
      });

      server.on('error', (err: any) => {
        // 端口不可用
        resolve(false);
      });
    });
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
   * 等待端口释放
   */
  async waitForPortRelease(port: number, timeoutMs: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await this.isPortAvailable(port)) {
        logger.info(`端口 ${port} 已释放`);
        return;
      }
      
      // 等待100ms后重试
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new MCPError(
      `Port ${port} was not released within ${timeoutMs}ms`,
      'PORT_RELEASE_TIMEOUT',
      { port, timeoutMs }
    );
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
