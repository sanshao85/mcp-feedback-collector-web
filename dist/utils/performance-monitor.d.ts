/**
 * MCP Feedback Collector - 性能监控工具
 */
/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
    memoryUsage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    cpuUsage: {
        user: number;
        system: number;
    };
    uptime: number;
    requestStats: {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
    };
    websocketStats: {
        activeConnections: number;
        totalConnections: number;
        messagesReceived: number;
        messagesSent: number;
    };
    sessionStats: {
        activeSessions: number;
        totalSessions: number;
        completedSessions: number;
        timeoutSessions: number;
    };
}
/**
 * 性能监控器类
 */
export declare class PerformanceMonitor {
    private startTime;
    private requestStats;
    private websocketStats;
    private sessionStats;
    constructor();
    /**
     * 记录HTTP请求
     */
    recordRequest(responseTime: number, success: boolean): void;
    /**
     * 记录WebSocket连接
     */
    recordWebSocketConnection(): void;
    /**
     * 记录WebSocket断开连接
     */
    recordWebSocketDisconnection(): void;
    /**
     * 记录WebSocket消息
     */
    recordWebSocketMessage(direction: 'received' | 'sent'): void;
    /**
     * 记录会话创建
     */
    recordSessionCreated(): void;
    /**
     * 记录会话完成
     */
    recordSessionCompleted(): void;
    /**
     * 记录会话超时
     */
    recordSessionTimeout(): void;
    /**
     * 获取当前性能指标
     */
    getMetrics(): PerformanceMetrics;
    /**
     * 计算平均响应时间
     */
    private calculateAverageResponseTime;
    /**
     * 获取格式化的性能报告
     */
    getFormattedReport(): string;
    /**
     * 检查性能警告
     */
    checkPerformanceWarnings(): string[];
    /**
     * 启动定期性能监控
     */
    startPeriodicMonitoring(intervalMs?: number): NodeJS.Timeout;
    /**
     * 重置统计数据
     */
    reset(): void;
}
export declare const performanceMonitor: PerformanceMonitor;
//# sourceMappingURL=performance-monitor.d.ts.map