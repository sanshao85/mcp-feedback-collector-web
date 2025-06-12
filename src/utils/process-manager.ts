/**
 * MCP Feedback Collector - 增强的跨平台进程管理工具
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';
import { MCPError } from '../types/index.js';

const execAsync = promisify(exec);

export interface ProcessInfo {
  pid: number;
  name: string;
  command: string;
  port?: number;
  ppid?: number;  // 父进程ID
  user?: string;  // 进程所有者
}

/**
 * 增强的跨平台进程管理器
 */
export class ProcessManager {
  private readonly isWindows = process.platform === 'win32';
  private readonly isMacOS = process.platform === 'darwin';
  private readonly isLinux = process.platform === 'linux';

  /**
   * 获取占用指定端口的进程信息
   */
  async getPortProcess(port: number): Promise<ProcessInfo | null> {
    try {
      if (this.isWindows) {
        return await this.getPortProcessWindows(port);
      } else {
        return await this.getPortProcessUnix(port);
      }
    } catch (error) {
      logger.debug(`获取端口 ${port} 进程信息失败:`, error);
      return null;
    }
  }

  /**
   * Windows系统获取端口进程
   */
  private async getPortProcessWindows(port: number): Promise<ProcessInfo | null> {
    try {
      // 使用netstat查找端口占用
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1] && parts[1].includes(`:${port}`)) {
          const pidStr = parts[4];
          if (pidStr) {
            const pid = parseInt(pidStr, 10);
            if (!isNaN(pid)) {
              // 获取进程详细信息
              try {
                const { stdout: processInfo } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV`);
                const processLines = processInfo.trim().split('\n');
                if (processLines.length > 1 && processLines[1]) {
                  const processData = processLines[1].split(',');
                  const name = processData[0]?.replace(/"/g, '') || 'Unknown';
                  return {
                    pid,
                    name,
                    command: name,
                    port
                  };
                }
              } catch (error) {
                logger.debug(`获取PID ${pid} 详细信息失败:`, error);
              }

              return {
                pid,
                name: 'Unknown',
                command: 'Unknown',
                port
              };
            }
          }
        }
      }
    } catch (error) {
      logger.debug('Windows端口进程查询失败:', error);
    }
    
    return null;
  }

  /**
   * Unix系统获取端口进程
   */
  private async getPortProcessUnix(port: number): Promise<ProcessInfo | null> {
    try {
      // 使用lsof查找端口占用
      const { stdout } = await execAsync(`lsof -i :${port} -t`);
      const pids = stdout.trim().split('\n').filter(pid => pid);
      
      if (pids.length > 0 && pids[0]) {
        const pid = parseInt(pids[0], 10);
        if (!isNaN(pid)) {
          try {
            // 获取进程详细信息
            const { stdout: processInfo } = await execAsync(`ps -p ${pid} -o comm=,args=`);
            const lines = processInfo.trim().split('\n');
            if (lines.length > 0 && lines[0]) {
              const parts = lines[0].trim().split(/\s+/);
              const name = parts[0] || 'Unknown';
              const command = lines[0] || 'Unknown';
              
              return {
                pid,
                name,
                command,
                port
              };
            }
          } catch (error) {
            logger.debug(`获取PID ${pid} 详细信息失败:`, error);
          }
          
          return {
            pid,
            name: 'Unknown',
            command: 'Unknown',
            port
          };
        }
      }
    } catch (error) {
      logger.debug('Unix端口进程查询失败:', error);
    }
    
    return null;
  }

  /**
   * 终止进程
   */
  async killProcess(pid: number, force: boolean = false): Promise<boolean> {
    try {
      if (this.isWindows) {
        return await this.killProcessWindows(pid, force);
      } else {
        return await this.killProcessUnix(pid, force);
      }
    } catch (error) {
      logger.error(`终止进程 ${pid} 失败:`, error);
      return false;
    }
  }

  /**
   * Windows系统终止进程
   */
  private async killProcessWindows(pid: number, force: boolean): Promise<boolean> {
    try {
      const command = force ? `taskkill /F /PID ${pid}` : `taskkill /PID ${pid}`;
      await execAsync(command);
      logger.info(`已终止Windows进程: ${pid}`);
      return true;
    } catch (error) {
      logger.error(`Windows进程终止失败 (PID: ${pid}):`, error);
      return false;
    }
  }

  /**
   * Unix系统终止进程
   */
  private async killProcessUnix(pid: number, force: boolean): Promise<boolean> {
    try {
      const signal = force ? '9' : '15';  // SIGKILL=9, SIGTERM=15
      await execAsync(`kill -${signal} ${pid}`);
      logger.info(`已终止Unix进程: ${pid} (信号${signal})`);
      return true;
    } catch (error) {
      logger.error(`Unix进程终止失败 (PID: ${pid}):`, error);
      return false;
    }
  }

  /**
   * 检查是否是自己的进程（僵尸进程）
   */
  isOwnProcess(processInfo: ProcessInfo): boolean {
    const ownProcessNames = [
      'node',
      'mcp-feedback-collector',
      'tsx'
    ];

    const ownKeywords = [
      'mcp-feedback-collector',
      'cli.js',
      'cli.ts',
      'dist/cli.js',
      'src/cli.ts'
    ];

    const processName = processInfo.name.toLowerCase();
    const processCommand = processInfo.command.toLowerCase();

    // 检查进程名
    const nameMatches = ownProcessNames.some(name =>
      processName.includes(name.toLowerCase())
    );

    // 检查命令行参数
    const commandMatches = ownKeywords.some(keyword =>
      processCommand.includes(keyword.toLowerCase())
    );

    const isOwn = nameMatches && commandMatches;

    if (isOwn) {
      logger.debug(`识别为自己的进程: ${processInfo.name} (PID: ${processInfo.pid})`);
      logger.debug(`命令行: ${processInfo.command}`);
    }

    return isOwn;
  }

  /**
   * 检查进程是否安全可终止
   */
  isSafeToKill(processInfo: ProcessInfo): boolean {
    // 如果是自己的进程，总是安全的
    if (this.isOwnProcess(processInfo)) {
      return true;
    }

    const safePrefixes = [
      'node',
      'npm',
      'npx',
      'mcp-feedback-collector',
      'tsx'
    ];

    const dangerousNames = [
      'system',
      'kernel',
      'init',
      'systemd',
      'explorer.exe',
      'winlogon.exe',
      'csrss.exe',
      'smss.exe',
      'services.exe',
      'launchd',      // macOS
      'kextd',        // macOS
      'WindowServer', // macOS
      'loginwindow'   // macOS
    ];

    const processName = processInfo.name.toLowerCase();
    const processCommand = processInfo.command.toLowerCase();

    // 检查是否是危险进程
    for (const dangerous of dangerousNames) {
      if (processName.includes(dangerous) || processCommand.includes(dangerous)) {
        return false;
      }
    }

    // 检查是否是安全进程
    for (const safe of safePrefixes) {
      if (processName.includes(safe) || processCommand.includes(safe)) {
        return true;
      }
    }

    // 默认不安全
    return false;
  }

  /**
   * 等待指定时间
   */
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查进程是否已死亡
   */
  async isProcessDead(pid: number): Promise<boolean> {
    try {
      if (this.isWindows) {
        const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV`);
        return !stdout.includes(`"${pid}"`);
      } else {
        // Unix系统：使用 kill -0 检查进程是否存在
        await execAsync(`kill -0 ${pid}`);
        return false; // 如果没有抛出异常，说明进程还存在
      }
    } catch (error) {
      return true; // 抛出异常说明进程不存在
    }
  }

  /**
   * 获取平台适配的终止命令列表
   */
  private getKillCommands(pid: number): string[] {
    if (this.isWindows) {
      return [
        `taskkill /PID ${pid}`,                           // 优雅终止
        `taskkill /F /PID ${pid}`,                        // 强制终止
        `wmic process where processid=${pid} delete`,     // 备用方案
        `powershell "Stop-Process -Id ${pid} -Force"`     // PowerShell强制终止
      ];
    } else {
      return [
        `kill -TERM ${pid}`,    // 优雅终止 (SIGTERM)
        `kill -KILL ${pid}`,    // 强制终止 (SIGKILL)
      ];
    }
  }

  /**
   * 渐进式进程终止
   */
  async progressiveKill(pid: number): Promise<boolean> {
    logger.info(`开始渐进式终止进程: ${pid}`);

    const commands = this.getKillCommands(pid);

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      const isLast = i === commands.length - 1;

      // 确保命令不为空
      if (!cmd || cmd.trim() === '') {
        logger.warn(`跳过空命令 (索引: ${i})`);
        continue;
      }

      try {
        logger.debug(`执行终止命令: ${cmd}`);
        await execAsync(cmd);

        // 等待进程退出
        const waitTime = this.isWindows ? 2000 : 1000;
        await this.wait(waitTime);

        // 检查进程是否已死亡
        if (await this.isProcessDead(pid)) {
          logger.info(`进程 ${pid} 已成功终止 (使用命令: ${cmd})`);
          return true;
        }

        if (!isLast) {
          logger.warn(`命令 "${cmd}" 未能终止进程 ${pid}，尝试下一个命令`);
        }

      } catch (error) {
        logger.debug(`命令 "${cmd}" 执行失败:`, error);

        // 如果是最后一个命令，记录错误
        if (isLast) {
          logger.error(`所有终止命令都失败了，进程 ${pid} 可能无法终止`);
        }
      }
    }

    return false;
  }

  /**
   * 强制释放端口（增强版本）
   */
  async forceReleasePort(port: number): Promise<boolean> {
    logger.info(`尝试强制释放端口: ${port}`);

    const processInfo = await this.getPortProcess(port);
    if (!processInfo) {
      logger.info(`端口 ${port} 未被占用`);
      return true;
    }

    logger.info(`发现占用端口 ${port} 的进程:`, {
      pid: processInfo.pid,
      name: processInfo.name,
      command: processInfo.command
    });

    // 检查是否是自己的进程
    if (this.isOwnProcess(processInfo)) {
      logger.info(`发现自己的僵尸进程，直接清理: ${processInfo.name} (PID: ${processInfo.pid})`);

      const success = await this.progressiveKill(processInfo.pid);
      if (success) {
        // 等待端口释放
        if (await this.waitForPortRelease(port, 10000)) {
          logger.info(`端口 ${port} 已成功释放`);
          return true;
        }
      }

      logger.error(`无法清理自己的僵尸进程: PID ${processInfo.pid}`);
      return false;
    }

    // 安全检查
    if (!this.isSafeToKill(processInfo)) {
      logger.warn(`不安全的进程，跳过终止: ${processInfo.name} (PID: ${processInfo.pid})`);
      return false;
    }

    // 尝试渐进式终止
    logger.info(`尝试终止安全进程: ${processInfo.name} (PID: ${processInfo.pid})`);
    const success = await this.progressiveKill(processInfo.pid);

    if (success) {
      // 等待端口释放
      if (await this.waitForPortRelease(port, 10000)) {
        logger.info(`端口 ${port} 已成功释放`);
        return true;
      } else {
        logger.error(`进程已终止但端口 ${port} 仍被占用`);
        return false;
      }
    }

    logger.error(`无法终止进程: ${processInfo.name} (PID: ${processInfo.pid})`);
    return false;
  }

  /**
   * 等待端口释放
   */
  async waitForPortRelease(port: number, maxWait: number = 10000): Promise<boolean> {
    logger.debug(`等待端口 ${port} 释放，最大等待时间: ${maxWait}ms`);

    const startTime = Date.now();
    const checkInterval = this.isWindows ? 1000 : 500; // Windows需要更长的等待时间

    while (Date.now() - startTime < maxWait) {
      const processInfo = await this.getPortProcess(port);
      if (!processInfo) {
        logger.debug(`端口 ${port} 已释放`);
        return true;
      }

      logger.debug(`端口 ${port} 仍被占用，继续等待...`);
      await this.wait(checkInterval);
    }

    logger.warn(`等待端口 ${port} 释放超时`);
    return false;
  }
}

// 导出单例实例
export const processManager = new ProcessManager();
