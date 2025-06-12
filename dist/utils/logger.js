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
// MCP日志级别优先级
const MCP_LOG_LEVELS = {
    emergency: 0,
    alert: 1,
    critical: 2,
    error: 3,
    warning: 4,
    notice: 5,
    info: 6,
    debug: 7
};
// 内部日志级别到MCP日志级别的映射
const LOG_LEVEL_TO_MCP = {
    error: 'error',
    warn: 'warning',
    info: 'info',
    debug: 'debug',
    silent: 'info' // silent模式下如果需要发送MCP日志，使用info级别
};
/**
 * 检测是否为远程环境
 */
function isRemoteEnvironment() {
    // 检测常见的远程环境标识
    return !!(process.env['SSH_CLIENT'] ||
        process.env['SSH_TTY'] ||
        process.env['VSCODE_REMOTE'] ||
        process.env['CODESPACES'] ||
        process.env['GITPOD_WORKSPACE_ID'] ||
        process.env['REMOTE_CONTAINERS'] ||
        process.env['WSL_DISTRO_NAME']);
}
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
    // MCP日志相关
    mcpLogLevel = 'info';
    mcpLogCallback = undefined;
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
     * 设置MCP日志级别
     */
    setMCPLogLevel(level) {
        this.mcpLogLevel = level;
    }
    /**
     * 获取MCP日志级别
     */
    getMCPLogLevel() {
        return this.mcpLogLevel;
    }
    /**
     * 设置MCP日志回调函数
     */
    setMCPLogCallback(callback) {
        this.mcpLogCallback = callback;
    }
    /**
     * 清除MCP日志回调函数
     */
    clearMCPLogCallback() {
        this.mcpLogCallback = undefined;
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
            console.log(`日志文件已创建: ${this.logFile}`);
        }
        catch (error) {
            console.error('无法创建日志文件:', error);
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
     * 检查是否应该发送MCP日志
     */
    shouldSendMCPLog(level) {
        return MCP_LOG_LEVELS[level] <= MCP_LOG_LEVELS[this.mcpLogLevel];
    }
    /**
     * 发送MCP日志通知
     */
    sendMCPLog(level, message, data) {
        if (!this.mcpLogCallback || !this.shouldSendMCPLog(level)) {
            return;
        }
        const mcpMessage = {
            level,
            logger: 'mcp-feedback-collector',
            data: data !== undefined ? data : message
        };
        try {
            this.mcpLogCallback(mcpMessage);
        }
        catch (error) {
            // 避免日志回调错误导致程序崩溃
            console.error('MCP log callback error:', error);
        }
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
                console.error('写入日志文件失败:', error);
            }
        }
        // 发送MCP日志通知
        const mcpLevel = LOG_LEVEL_TO_MCP[level];
        const logData = args.length > 0 ? { message, args } : message;
        this.sendMCPLog(mcpLevel, message, logData);
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
    /**
     * 发送MCP通知级别日志
     */
    mcpNotice(message, data) {
        this.sendMCPLog('notice', message, data);
    }
    /**
     * 发送MCP警告级别日志
     */
    mcpWarning(message, data) {
        this.sendMCPLog('warning', message, data);
    }
    /**
     * 发送MCP错误级别日志
     */
    mcpError(message, data) {
        this.sendMCPLog('error', message, data);
    }
    /**
     * 发送MCP关键级别日志
     */
    mcpCritical(message, data) {
        this.sendMCPLog('critical', message, data);
    }
    /**
     * 发送服务器启动信息到MCP客户端
     */
    mcpServerStarted(port, url) {
        const isRemote = isRemoteEnvironment();
        this.mcpNotice('Web服务器已启动', {
            port: port,
            url: url,
            status: 'ready',
            remote_environment: isRemote
        });
        if (isRemote) {
            this.mcpNotice('检测到远程环境，建议配置端口转发', {
                local_port: port,
                forward_url: url,
                vscode_tip: 'VSCode会自动提示端口转发，或手动在端口面板中添加'
            });
        }
    }
    /**
     * 发送反馈页面创建信息到MCP客户端
     */
    mcpFeedbackPageCreated(sessionId, feedbackUrl, timeoutSeconds) {
        const isRemote = isRemoteEnvironment();
        this.mcpNotice('反馈页面已创建', {
            session_id: sessionId,
            feedback_url: feedbackUrl,
            expires_in: `${timeoutSeconds}秒`,
            remote_environment: isRemote
        });
        if (isRemote) {
            this.mcpNotice('远程访问提示', {
                original_url: feedbackUrl,
                access_tip: '请确保已配置端口转发，然后访问转发后的地址',
                vscode_ports_panel: '查看VSCode底部的"端口"面板'
            });
        }
    }
    /**
     * 发送工具调用开始信息到MCP客户端
     */
    mcpToolCallStarted(toolName, params) {
        this.mcpNotice(`MCP工具调用: ${toolName}`, {
            tool: toolName,
            parameters: params,
            timestamp: new Date().toISOString()
        });
    }
}
// 创建全局日志实例
export const logger = new Logger();
//# sourceMappingURL=logger.js.map