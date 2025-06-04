/**
 * MCP Feedback Collector - 端口管理工具
 */
import { PortInfo } from '../types/index.js';
/**
 * 端口管理器
 */
export declare class PortManager {
    private readonly PORT_RANGE_START;
    private readonly PORT_RANGE_END;
    private readonly MAX_RETRIES;
    /**
     * 检查端口是否可用（增强版本）
     */
    isPortAvailable(port: number): Promise<boolean>;
    /**
     * 深度检查端口是否真正可用（包括进程检测）
     */
    isPortTrulyAvailable(port: number): Promise<boolean>;
    /**
     * 查找可用端口
     */
    findAvailablePort(preferredPort?: number): Promise<number>;
    /**
     * 获取端口信息
     */
    getPortInfo(port: number): Promise<PortInfo>;
    /**
     * 获取端口范围内的所有端口状态
     */
    getPortRangeStatus(): Promise<PortInfo[]>;
    /**
     * 清理僵尸进程（跨平台实现）
     */
    cleanupZombieProcesses(): Promise<void>;
    /**
     * 强制使用指定端口
     */
    forcePort(port: number, killProcess?: boolean): Promise<number>;
    /**
     * 等待端口释放（增强版本）
     */
    waitForPortRelease(port: number, timeoutMs?: number): Promise<void>;
    /**
     * 清理指定端口（强制释放并等待）
     */
    cleanupPort(port: number): Promise<void>;
    /**
     * 强制释放端口（杀死占用进程）
     */
    forceReleasePort(port: number): Promise<void>;
}
//# sourceMappingURL=port-manager.d.ts.map