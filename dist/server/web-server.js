/**
 * MCP Feedback Collector - Web服务器实现
 */
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPError } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { PortManager } from '../utils/port-manager.js';
import { ImageProcessor } from '../utils/image-processor.js';
import { performanceMonitor } from '../utils/performance-monitor.js';
import { SessionStorage } from '../utils/session-storage.js';
import { VERSION } from '../index.js';
/**
 * Web服务器类
 */
export class WebServer {
    app;
    server;
    io;
    config;
    port = 0;
    isServerRunning = false;
    portManager;
    imageProcessor;
    sessionStorage;
    constructor(config) {
        this.config = config;
        this.portManager = new PortManager();
        this.imageProcessor = new ImageProcessor({
            maxFileSize: config.maxFileSize,
            maxWidth: 2048,
            maxHeight: 2048
        });
        this.sessionStorage = new SessionStorage();
        // 创建Express应用
        this.app = express();
        // 创建HTTP服务器
        this.server = createServer(this.app);
        // 创建Socket.IO服务器
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: config.corsOrigin,
                methods: ['GET', 'POST']
            }
        });
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }
    /**
     * 设置中间件
     */
    setupMiddleware() {
        // 安全中间件
        this.app.use(helmet({
            contentSecurityPolicy: false // 允许内联脚本
        }));
        // 压缩中间件
        this.app.use(compression());
        // CORS中间件
        this.app.use(cors({
            origin: this.config.corsOrigin,
            credentials: true
        }));
        // JSON解析中间件
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        // 请求日志和性能监控中间件
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                const success = res.statusCode < 400;
                // 记录请求日志
                logger.request(req.method, req.url, res.statusCode, duration);
                // 记录性能指标
                performanceMonitor.recordRequest(duration, success);
                // 记录慢请求
                if (duration > 1000) {
                    logger.warn(`慢请求: ${req.method} ${req.path} - ${duration}ms`);
                }
            });
            next();
        });
    }
    /**
     * 设置路由
     */
    setupRoutes() {
        // 获取当前文件的目录路径（ES模块兼容）
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const staticPath = path.resolve(__dirname, '../static');
        // 静态文件服务 - 使用绝对路径
        this.app.use(express.static(staticPath));
        // 主页路由
        this.app.get('/', (req, res) => {
            res.sendFile('index.html', { root: staticPath });
        });
        // API配置路由
        this.app.get('/api/config', (req, res) => {
            const chatConfig = {
                api_key: this.config.apiKey || '',
                api_base_url: this.config.apiBaseUrl || 'https://api.openai.com/v1',
                model: this.config.defaultModel || 'gpt-4o-mini',
                enable_chat: this.config.enableChat !== false, // 默认启用
                max_file_size: this.config.maxFileSize,
                temperature: 0.7,
                max_tokens: 2000
            };
            logger.info('返回聊天配置:', {
                hasApiKey: !!chatConfig.api_key,
                apiBaseUrl: chatConfig.api_base_url,
                model: chatConfig.model,
                enableChat: chatConfig.enable_chat
            });
            res.json(chatConfig);
        });
        // 测试会话创建路由
        this.app.post('/api/test-session', (req, res) => {
            const { work_summary, timeout_seconds = 300 } = req.body;
            if (!work_summary) {
                res.status(400).json({ error: '缺少work_summary参数' });
                return;
            }
            const sessionId = this.generateSessionId();
            // 创建测试会话
            const session = {
                workSummary: work_summary,
                feedback: [],
                startTime: Date.now(),
                timeout: timeout_seconds * 1000
            };
            this.sessionStorage.createSession(sessionId, session);
            // 记录会话创建
            performanceMonitor.recordSessionCreated();
            logger.info(`创建测试会话: ${sessionId}`);
            res.json({
                success: true,
                session_id: sessionId,
                feedback_url: this.generateFeedbackUrl(sessionId)
            });
        });
        // 版本信息API
        this.app.get('/api/version', (req, res) => {
            res.json({
                version: VERSION,
                timestamp: new Date().toISOString()
            });
        });
        // 健康检查路由
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: VERSION,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                active_sessions: this.sessionStorage.getSessionCount()
            });
        });
        // 性能监控路由
        this.app.get('/api/metrics', (req, res) => {
            const metrics = performanceMonitor.getMetrics();
            res.json(metrics);
        });
        // 性能报告路由
        this.app.get('/api/performance-report', (req, res) => {
            const report = performanceMonitor.getFormattedReport();
            res.type('text/plain').send(report);
        });
        // 错误处理中间件
        this.app.use((error, req, res, next) => {
            logger.error('Express错误:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        });
    }
    /**
     * 设置Socket.IO事件处理
     */
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            logger.socket('connect', socket.id);
            logger.info(`✅ 新的WebSocket连接: ${socket.id}`);
            // 记录WebSocket连接
            performanceMonitor.recordWebSocketConnection();
            // 测试消息处理
            socket.on('test_message', (data) => {
                logger.socket('test_message', socket.id, data);
                socket.emit('test_response', { message: 'Test message received!', timestamp: Date.now() });
            });
            // 处理会话请求（固定URL模式）
            socket.on('request_session', () => {
                logger.socket('request_session', socket.id);
                // 查找最新的活跃会话
                const activeSessions = this.sessionStorage.getAllSessions();
                let latestSession = null;
                for (const [sessionId, session] of activeSessions) {
                    if (!latestSession || session.startTime > latestSession.session.startTime) {
                        latestSession = { sessionId, session };
                    }
                }
                if (latestSession) {
                    // 有活跃会话，分配给客户端
                    logger.info(`为客户端 ${socket.id} 分配会话: ${latestSession.sessionId}`);
                    socket.emit('session_assigned', {
                        session_id: latestSession.sessionId,
                        work_summary: latestSession.session.workSummary
                    });
                }
                else {
                    // 无活跃会话
                    logger.info(`客户端 ${socket.id} 请求会话，但无活跃会话`);
                    socket.emit('no_active_session', {
                        message: '当前无活跃的反馈会话'
                    });
                }
            });
            // 处理最新工作汇报请求
            socket.on('request_latest_summary', () => {
                logger.socket('request_latest_summary', socket.id);
                // 查找最新的活跃会话
                const activeSessions = this.sessionStorage.getAllSessions();
                let latestSession = null;
                for (const [sessionId, session] of activeSessions) {
                    if (!latestSession || session.startTime > latestSession.session.startTime) {
                        latestSession = { sessionId, session };
                    }
                }
                if (latestSession && latestSession.session.workSummary) {
                    // 找到最新的工作汇报
                    logger.info(`为客户端 ${socket.id} 返回最新工作汇报`);
                    socket.emit('latest_summary_response', {
                        success: true,
                        work_summary: latestSession.session.workSummary,
                        session_id: latestSession.sessionId,
                        timestamp: latestSession.session.startTime
                    });
                }
                else {
                    // 没有找到工作汇报
                    logger.info(`客户端 ${socket.id} 请求最新工作汇报，但未找到`);
                    socket.emit('latest_summary_response', {
                        success: false,
                        message: '暂无最新工作汇报，请等待AI调用collect_feedback工具函数'
                    });
                }
            });
            // 获取工作汇报数据
            socket.on('get_work_summary', (data) => {
                logger.socket('get_work_summary', socket.id, data);
                const session = this.sessionStorage.getSession(data.feedback_session_id);
                if (session) {
                    socket.emit('work_summary_data', {
                        work_summary: session.workSummary
                    });
                }
                else {
                    socket.emit('feedback_error', {
                        error: '会话不存在或已过期'
                    });
                }
            });
            // 提交反馈
            socket.on('submit_feedback', async (data) => {
                logger.socket('submit_feedback', socket.id, {
                    sessionId: data.sessionId,
                    textLength: data.text?.length || 0,
                    imageCount: data.images?.length || 0
                });
                await this.handleFeedbackSubmission(socket, data);
            });
            // 断开连接
            socket.on('disconnect', (reason) => {
                logger.socket('disconnect', socket.id, { reason });
                logger.info(`❌ WebSocket连接断开: ${socket.id}, 原因: ${reason}`);
                // 记录WebSocket断开连接
                performanceMonitor.recordWebSocketDisconnection();
            });
        });
    }
    /**
     * 处理反馈提交
     */
    async handleFeedbackSubmission(socket, feedbackData) {
        const session = this.sessionStorage.getSession(feedbackData.sessionId);
        if (!session) {
            socket.emit('feedback_error', {
                error: '会话不存在或已过期'
            });
            return;
        }
        try {
            // 验证反馈数据
            if (!feedbackData.text && (!feedbackData.images || feedbackData.images.length === 0)) {
                socket.emit('feedback_error', {
                    error: '请提供文字反馈或上传图片'
                });
                return;
            }
            // 处理图片数据
            let processedFeedback = { ...feedbackData };
            if (feedbackData.images && feedbackData.images.length > 0) {
                logger.info(`开始处理 ${feedbackData.images.length} 张图片...`);
                try {
                    const processedImages = await this.imageProcessor.processImages(feedbackData.images);
                    processedFeedback.images = processedImages;
                    const stats = this.imageProcessor.getImageStats(processedImages);
                    logger.info(`图片处理完成: ${stats.totalCount} 张图片, 总大小: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);
                }
                catch (error) {
                    logger.error('图片处理失败:', error);
                    socket.emit('feedback_error', {
                        error: `图片处理失败: ${error instanceof Error ? error.message : '未知错误'}`
                    });
                    return;
                }
            }
            // 添加反馈到会话
            session.feedback.push(processedFeedback);
            this.sessionStorage.updateSession(feedbackData.sessionId, { feedback: session.feedback });
            // 通知提交成功
            socket.emit('feedback_submitted', {
                success: true,
                message: '反馈提交成功'
            });
            // 完成反馈收集
            if (session.resolve) {
                session.resolve(session.feedback);
                this.sessionStorage.deleteSession(feedbackData.sessionId);
            }
        }
        catch (error) {
            logger.error('处理反馈提交时出错:', error);
            socket.emit('feedback_error', {
                error: '服务器处理错误，请稍后重试'
            });
        }
    }
    /**
     * 收集用户反馈
     */
    async collectFeedback(workSummary, timeoutSeconds) {
        const sessionId = this.generateSessionId();
        logger.info(`创建反馈会话: ${sessionId}, 超时: ${timeoutSeconds}秒`);
        return new Promise((resolve, reject) => {
            // 创建会话
            const session = {
                workSummary,
                feedback: [],
                startTime: Date.now(),
                timeout: timeoutSeconds * 1000,
                resolve,
                reject
            };
            this.sessionStorage.createSession(sessionId, session);
            // 设置超时
            const timeoutId = setTimeout(() => {
                this.sessionStorage.deleteSession(sessionId);
                reject(new MCPError(`Feedback collection timeout after ${timeoutSeconds} seconds`, 'FEEDBACK_TIMEOUT'));
            }, timeoutSeconds * 1000);
            // 打开浏览器
            this.openFeedbackPage(sessionId).catch(error => {
                logger.error('打开反馈页面失败:', error);
                clearTimeout(timeoutId);
                this.sessionStorage.deleteSession(sessionId);
                reject(error);
            });
        });
    }
    /**
     * 生成反馈页面URL
     */
    generateFeedbackUrl(sessionId) {
        // 如果启用了固定URL模式，返回根路径
        if (this.config.useFixedUrl) {
            // 优先使用配置的服务器基础URL
            if (this.config.serverBaseUrl) {
                return this.config.serverBaseUrl;
            }
            // 使用配置的主机名
            const host = this.config.serverHost || 'localhost';
            return `http://${host}:${this.port}`;
        }
        // 传统模式：包含会话ID参数
        if (this.config.serverBaseUrl) {
            return `${this.config.serverBaseUrl}/?mode=feedback&session=${sessionId}`;
        }
        const host = this.config.serverHost || 'localhost';
        return `http://${host}:${this.port}/?mode=feedback&session=${sessionId}`;
    }
    /**
     * 打开反馈页面
     */
    async openFeedbackPage(sessionId) {
        const url = this.generateFeedbackUrl(sessionId);
        logger.info(`打开反馈页面: ${url}`);
        try {
            const open = await import('open');
            await open.default(url);
            logger.info('浏览器已打开反馈页面');
        }
        catch (error) {
            logger.warn('无法自动打开浏览器:', error);
            logger.info(`请手动打开浏览器访问: ${url}`);
        }
    }
    /**
     * 生成会话ID
     */
    generateSessionId() {
        return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 启动Web服务器
     */
    async start() {
        if (this.isServerRunning) {
            logger.warn('Web服务器已在运行中');
            return;
        }
        try {
            // 根据配置选择端口策略
            if (this.config.forcePort) {
                // 强制端口模式
                logger.info(`强制端口模式: 尝试使用端口 ${this.config.webPort}`);
                // 根据配置决定是否清理端口
                if (this.config.cleanupPortOnStart) {
                    logger.info(`启动时端口清理已启用，清理端口 ${this.config.webPort}`);
                    await this.portManager.cleanupPort(this.config.webPort);
                }
                this.port = await this.portManager.forcePort(this.config.webPort, this.config.killProcessOnPortConflict || false);
            }
            else {
                // 传统模式：查找可用端口
                // 如果启用了端口清理且指定了首选端口，先尝试清理
                if (this.config.cleanupPortOnStart && this.config.webPort) {
                    logger.info(`启动时端口清理已启用，尝试清理首选端口 ${this.config.webPort}`);
                    await this.portManager.cleanupPort(this.config.webPort);
                }
                this.port = await this.portManager.findAvailablePort(this.config.webPort);
            }
            // 启动服务器前再次确认端口可用
            logger.info(`准备在端口 ${this.port} 启动服务器...`);
            // 启动服务器
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Server start timeout'));
                }, 10000);
                this.server.listen(this.port, (error) => {
                    clearTimeout(timeout);
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
            this.isServerRunning = true;
            // 根据配置显示不同的启动信息
            if (this.config.forcePort) {
                logger.info(`✅ Web服务器启动成功 (强制端口): http://localhost:${this.port}`);
            }
            else {
                logger.info(`✅ Web服务器启动成功: http://localhost:${this.port}`);
            }
            if (this.config.useFixedUrl) {
                logger.info(`🔗 固定URL模式已启用，访问地址: http://localhost:${this.port}`);
            }
        }
        catch (error) {
            logger.error('Web服务器启动失败:', error);
            throw new MCPError('Failed to start web server', 'WEB_SERVER_START_ERROR', error);
        }
    }
    /**
     * 停止Web服务器
     */
    async stop() {
        if (!this.isServerRunning) {
            return;
        }
        const currentPort = this.port;
        logger.info(`正在停止Web服务器 (端口: ${currentPort})...`);
        try {
            // 清理所有活跃会话
            this.sessionStorage.clear();
            this.sessionStorage.stopCleanupTimer();
            // 关闭所有WebSocket连接
            this.io.disconnectSockets(true);
            // 关闭Socket.IO
            this.io.close();
            // 关闭HTTP服务器
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Server close timeout'));
                }, 5000);
                this.server.close((error) => {
                    clearTimeout(timeout);
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
            this.isServerRunning = false;
            logger.info(`✅ Web服务器已停止 (端口: ${currentPort})`);
            // 等待端口完全释放
            logger.info(`等待端口 ${currentPort} 完全释放...`);
            try {
                await this.portManager.waitForPortRelease(currentPort, 3000);
                logger.info(`✅ 端口 ${currentPort} 已完全释放`);
            }
            catch (error) {
                logger.warn(`端口 ${currentPort} 释放超时，但服务器已停止`);
            }
        }
        catch (error) {
            logger.error('停止Web服务器时出错:', error);
            throw error;
        }
    }
    /**
     * 检查服务器是否运行
     */
    isRunning() {
        return this.isServerRunning;
    }
    /**
     * 获取服务器端口
     */
    getPort() {
        return this.port;
    }
}
//# sourceMappingURL=web-server.js.map