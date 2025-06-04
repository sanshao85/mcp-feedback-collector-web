/**
 * MCP Feedback Collector - MCP服务器实现
 */
import { Config } from '../types/index.js';
/**
 * MCP服务器类
 */
export declare class MCPServer {
    private mcpServer;
    private webServer;
    private config;
    private isRunning;
    constructor(config: Config);
    /**
     * 注册MCP工具函数
     */
    private registerTools;
    /**
     * 实现collect_feedback功能
     */
    private collectFeedback;
    /**
     * 将反馈数据格式化为MCP内容（支持图片显示）
     */
    private formatFeedbackForMCP;
    /**
     * 将反馈数据格式化为文本（保留用于其他用途）
     */
    private formatFeedbackAsText;
    /**
     * 启动MCP服务器
     */
    start(): Promise<void>;
    /**
     * 仅启动Web模式
     */
    startWebOnly(): Promise<void>;
    /**
     * 停止服务器
     */
    stop(): Promise<void>;
    /**
     * 获取服务器状态
     */
    getStatus(): {
        running: boolean;
        webPort?: number | undefined;
    };
}
//# sourceMappingURL=mcp-server.d.ts.map