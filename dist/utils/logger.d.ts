/**
 * MCP Feedback Collector - 日志工具
 */
import { LogLevel } from '../types/index.js';
declare class Logger {
    private currentLevel;
    private logFile?;
    private fileLoggingEnabled;
    private colorsDisabled;
    /**
     * 设置日志级别
     */
    setLevel(level: LogLevel): void;
    /**
     * 获取当前日志级别
     */
    getLevel(): LogLevel;
    /**
     * 禁用颜色输出（用于MCP模式）
     */
    disableColors(): void;
    /**
     * 启用文件日志记录
     */
    enableFileLogging(logDir?: string): void;
    /**
     * 检查是否应该输出指定级别的日志
     */
    private shouldLog;
    /**
     * 格式化时间戳
     */
    private formatTimestamp;
    /**
     * 格式化日志消息
     */
    private formatMessage;
    /**
     * 输出日志
     */
    private log;
    /**
     * 移除颜色代码
     */
    private removeColorCodes;
    /**
     * 错误日志
     */
    error(message: string, ...args: unknown[]): void;
    /**
     * 警告日志
     */
    warn(message: string, ...args: unknown[]): void;
    /**
     * 信息日志
     */
    info(message: string, ...args: unknown[]): void;
    /**
     * 调试日志
     */
    debug(message: string, ...args: unknown[]): void;
    /**
     * 记录HTTP请求
     */
    request(method: string, url: string, statusCode?: number, duration?: number): void;
    /**
     * 记录WebSocket事件
     */
    socket(event: string, sessionId?: string, data?: unknown): void;
    /**
     * 记录MCP工具调用
     */
    mcp(tool: string, params?: unknown, result?: unknown): void;
}
export declare const logger: Logger;
export type { LogLevel };
//# sourceMappingURL=logger.d.ts.map