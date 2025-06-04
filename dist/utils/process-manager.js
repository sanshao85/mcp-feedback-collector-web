/**
 * MCP Feedback Collector - 跨平台进程管理工具
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';
import { MCPError } from '../types/index.js';
const execAsync = promisify(exec);
/**
 * 跨平台进程管理器
 */
export class ProcessManager {
    isWindows = process.platform === 'win32';
    /**
     * 获取占用指定端口的进程信息
     */
    async getPortProcess(port) {
        try {
            if (this.isWindows) {
                return await this.getPortProcessWindows(port);
            }
            else {
                return await this.getPortProcessUnix(port);
            }
        }
        catch (error) {
            logger.debug(`获取端口 ${port} 进程信息失败:`, error);
            return null;
        }
    }
    /**
     * Windows系统获取端口进程
     */
    async getPortProcessWindows(port) {
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
                            }
                            catch (error) {
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
        }
        catch (error) {
            logger.debug('Windows端口进程查询失败:', error);
        }
        return null;
    }
    /**
     * Unix系统获取端口进程
     */
    async getPortProcessUnix(port) {
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
                    }
                    catch (error) {
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
        catch (error) {
            logger.debug('Unix端口进程查询失败:', error);
        }
        return null;
    }
    /**
     * 终止进程
     */
    async killProcess(pid, force = false) {
        try {
            if (this.isWindows) {
                return await this.killProcessWindows(pid, force);
            }
            else {
                return await this.killProcessUnix(pid, force);
            }
        }
        catch (error) {
            logger.error(`终止进程 ${pid} 失败:`, error);
            return false;
        }
    }
    /**
     * Windows系统终止进程
     */
    async killProcessWindows(pid, force) {
        try {
            const command = force ? `taskkill /F /PID ${pid}` : `taskkill /PID ${pid}`;
            await execAsync(command);
            logger.info(`已终止Windows进程: ${pid}`);
            return true;
        }
        catch (error) {
            logger.error(`Windows进程终止失败 (PID: ${pid}):`, error);
            return false;
        }
    }
    /**
     * Unix系统终止进程
     */
    async killProcessUnix(pid, force) {
        try {
            const signal = force ? '9' : '15'; // SIGKILL=9, SIGTERM=15
            await execAsync(`kill -${signal} ${pid}`);
            logger.info(`已终止Unix进程: ${pid} (信号${signal})`);
            return true;
        }
        catch (error) {
            logger.error(`Unix进程终止失败 (PID: ${pid}):`, error);
            return false;
        }
    }
    /**
     * 检查进程是否安全可终止
     */
    isSafeToKill(processInfo) {
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
            'services.exe'
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
     * 强制释放端口（安全版本）
     */
    async forceReleasePort(port) {
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
        // 安全检查
        if (!this.isSafeToKill(processInfo)) {
            throw new MCPError(`不安全的进程，拒绝终止: ${processInfo.name} (PID: ${processInfo.pid})`, 'UNSAFE_PROCESS_KILL', { processInfo });
        }
        // 先尝试优雅终止
        logger.info(`尝试优雅终止进程: ${processInfo.pid}`);
        let success = await this.killProcess(processInfo.pid, false);
        if (!success) {
            // 等待2秒后强制终止
            logger.warn(`优雅终止失败，2秒后强制终止进程: ${processInfo.pid}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            success = await this.killProcess(processInfo.pid, true);
        }
        if (success) {
            // 等待进程完全退出
            await new Promise(resolve => setTimeout(resolve, 1000));
            // 验证端口是否已释放
            const stillOccupied = await this.getPortProcess(port);
            if (!stillOccupied) {
                logger.info(`端口 ${port} 已成功释放`);
                return true;
            }
            else {
                logger.error(`端口 ${port} 仍被占用`);
                return false;
            }
        }
        return false;
    }
}
// 导出单例实例
export const processManager = new ProcessManager();
//# sourceMappingURL=process-manager.js.map