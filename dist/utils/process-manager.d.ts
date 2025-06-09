/**
 * MCP Feedback Collector - 增强的跨平台进程管理工具
 */
export interface ProcessInfo {
    pid: number;
    name: string;
    command: string;
    port?: number;
    ppid?: number;
    user?: string;
}
/**
 * 增强的跨平台进程管理器
 */
export declare class ProcessManager {
    private readonly isWindows;
    private readonly isMacOS;
    private readonly isLinux;
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
     * 检查是否是自己的进程（僵尸进程）
     */
    isOwnProcess(processInfo: ProcessInfo): boolean;
    /**
     * 检查进程是否安全可终止
     */
    isSafeToKill(processInfo: ProcessInfo): boolean;
    /**
     * 等待指定时间
     */
    private wait;
    /**
     * 检查进程是否已死亡
     */
    isProcessDead(pid: number): Promise<boolean>;
    /**
     * 获取平台适配的终止命令列表
     */
    private getKillCommands;
    /**
     * 渐进式进程终止
     */
    progressiveKill(pid: number): Promise<boolean>;
    /**
     * 强制释放端口（增强版本）
     */
    forceReleasePort(port: number): Promise<boolean>;
    /**
     * 等待端口释放
     */
    waitForPortRelease(port: number, maxWait?: number): Promise<boolean>;
}
export declare const processManager: ProcessManager;
//# sourceMappingURL=process-manager.d.ts.map