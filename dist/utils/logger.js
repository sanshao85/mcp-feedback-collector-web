/**
 * MCP Feedback Collector - 日志工具
 */
import fs from 'fs';
import path from 'path';
// 日志级别优先级
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    silent: 999
};
// 日志颜色
const LOG_COLORS = {
    error: '\x1b[31m', // 红色
    warn: '\x1b[33m', // 黄色
    info: '\x1b[36m', // 青色
    debug: '\x1b[37m', // 白色
    silent: '' // 无颜色
};
const RESET_COLOR = '\x1b[0m';
class Logger {
    currentLevel = 'info';
    logFile;
    fileLoggingEnabled = false;
    colorsDisabled = false;
    /**
     * 设置日志级别
     */
    setLevel(level) {
        this.currentLevel = level;
    }
    /**
     * 获取当前日志级别
     */
    getLevel() {
        return this.currentLevel;
    }
    /**
     * 禁用颜色输出（用于MCP模式）
     */
    disableColors() {
        this.colorsDisabled = true;
    }
    /**
     * 启用文件日志记录
     */
    enableFileLogging(logDir = 'logs') {
        try {
            // 确保日志目录存在
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            // 生成日志文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            this.logFile = path.join(logDir, `mcp-debug-${timestamp}.log`);
            this.fileLoggingEnabled = true;
            // 写入日志文件头
            const header = `=== MCP Feedback Collector Debug Log ===\n` +
                `Start Time: ${new Date().toISOString()}\n` +
                `Log Level: ${this.currentLevel}\n` +
                `==========================================\n\n`;
            fs.writeFileSync(this.logFile, header);
            console.log(`📁 日志文件已创建: ${this.logFile}`);
        }
        catch (error) {
            console.error('❌ 无法创建日志文件:', error);
            this.fileLoggingEnabled = false;
        }
    }
    /**
     * 检查是否应该输出指定级别的日志
     */
    shouldLog(level) {
        // silent模式下不输出任何日志
        if (this.currentLevel === 'silent') {
            return false;
        }
        return LOG_LEVELS[level] <= LOG_LEVELS[this.currentLevel];
    }
    /**
     * 格式化时间戳
     */
    formatTimestamp() {
        return new Date().toISOString();
    }
    /**
     * 格式化日志消息
     */
    formatMessage(level, message, ...args) {
        const timestamp = this.formatTimestamp();
        const levelStr = level.toUpperCase().padEnd(5);
        let formattedMessage;
        if (this.colorsDisabled) {
            // 无颜色模式（用于MCP）
            formattedMessage = `[${timestamp}] ${levelStr} ${message}`;
        }
        else {
            // 有颜色模式（用于终端）
            const color = LOG_COLORS[level];
            formattedMessage = `${color}[${timestamp}] ${levelStr}${RESET_COLOR} ${message}`;
        }
        if (args.length > 0) {
            const argsStr = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
            formattedMessage += ` ${argsStr}`;
        }
        return formattedMessage;
    }
    /**
     * 输出日志
     */
    log(level, message, ...args) {
        if (!this.shouldLog(level))
            return;
        const formattedMessage = this.formatMessage(level, message, ...args);
        // 控制台输出
        if (level === 'error') {
            console.error(formattedMessage);
        }
        else if (level === 'warn') {
            console.warn(formattedMessage);
        }
        else {
            console.log(formattedMessage);
        }
        // 文件输出（去除颜色代码）
        if (this.fileLoggingEnabled && this.logFile) {
            try {
                const cleanMessage = this.removeColorCodes(formattedMessage);
                fs.appendFileSync(this.logFile, cleanMessage + '\n');
            }
            catch (error) {
                console.error('❌ 写入日志文件失败:', error);
            }
        }
    }
    /**
     * 移除颜色代码
     */
    removeColorCodes(text) {
        return text.replace(/\x1b\[[0-9;]*m/g, '');
    }
    /**
     * 错误日志
     */
    error(message, ...args) {
        this.log('error', message, ...args);
    }
    /**
     * 警告日志
     */
    warn(message, ...args) {
        this.log('warn', message, ...args);
    }
    /**
     * 信息日志
     */
    info(message, ...args) {
        this.log('info', message, ...args);
    }
    /**
     * 调试日志
     */
    debug(message, ...args) {
        this.log('debug', message, ...args);
    }
    /**
     * 记录HTTP请求
     */
    request(method, url, statusCode, duration) {
        const parts = [method.toUpperCase(), url];
        if (statusCode !== undefined)
            parts.push(`${statusCode}`);
        if (duration !== undefined)
            parts.push(`${duration}ms`);
        this.info(`HTTP ${parts.join(' ')}`);
    }
    /**
     * 记录WebSocket事件
     */
    socket(event, sessionId, data) {
        const parts = ['WebSocket', event];
        if (sessionId)
            parts.push(`session:${sessionId}`);
        this.debug(parts.join(' '), data);
    }
    /**
     * 记录MCP工具调用
     */
    mcp(tool, params, result) {
        this.info(`MCP Tool: ${tool}`, { params, result });
    }
}
// 创建全局日志实例
export const logger = new Logger();
//# sourceMappingURL=logger.js.map