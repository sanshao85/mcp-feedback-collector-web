/**
 * MCP Feedback Collector - 跨平台进程管理工具
 */
export interface ProcessInfo {
    pid: number;
    name: string;
    command: string;
    port?: number;
}
/**
 * 跨平台进程管理器
 */
export declare class ProcessManager {
    private readonly isWindows;
    /**
     * 获取占用指定端口的进程信息
     */
    getPortProcess(port: number): Promise<ProcessInfo | null>;
    /**
     * Windows系统获取端口进程
     */
    private getPortProcessWindows;
    /**
     * Unix系统获取端口进程
     */
    private getPortProcessUnix;
    /**
     * 终止进程
     */
    killProcess(pid: number, force?: boolean): Promise<boolean>;
    /**
     * Windows系统终止进程
     */
    private killProcessWindows;
    /**
     * Unix系统终止进程
     */
    private killProcessUnix;
    /**
     * 检查进程是否安全可终止
     */
    isSafeToKill(processInfo: ProcessInfo): boolean;
    /**
     * 强制释放端口（安全版本）
     */
    forceReleasePort(port: number): Promise<boolean>;
}
export declare const processManager: ProcessManager;
//# sourceMappingURL=process-manager.d.ts.map