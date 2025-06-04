/**
 * MCP Feedback Collector - Web服务器实现
 */
import { Config, FeedbackData } from '../types/index.js';
/**
 * Web服务器类
 */
export declare class WebServer {
    private app;
    private server;
    private io;
    private config;
    private port;
    private isServerRunning;
    private portManager;
    private imageProcessor;
    private sessionStorage;
    constructor(config: Config);
    /**
     * 设置中间件
     */
    private setupMiddleware;
    /**
     * 设置路由
     */
    private setupRoutes;
    /**
     * 设置Socket.IO事件处理
     */
    private setupSocketHandlers;
    /**
     * 处理反馈提交
     */
    private handleFeedbackSubmission;
    /**
     * 收集用户反馈
     */
    collectFeedback(workSummary: string, timeoutSeconds: number): Promise<FeedbackData[]>;
    /**
     * 生成反馈页面URL
     */
    private generateFeedbackUrl;
    /**
     * 打开反馈页面
     */
    private openFeedbackPage;
    /**
     * 生成会话ID
     */
    private generateSessionId;
    /**
     * 启动Web服务器
     */
    start(): Promise<void>;
    /**
     * 停止Web服务器
     */
    stop(): Promise<void>;
    /**
     * 检查服务器是否运行
     */
    isRunning(): boolean;
    /**
     * 获取服务器端口
     */
    getPort(): number;
}
//# sourceMappingURL=web-server.d.ts.map