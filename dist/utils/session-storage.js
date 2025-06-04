/**
 * 会话存储管理器
 * 提供内存存储和可选的持久化存储
 */
import { logger } from './logger.js';
import { MCPError } from '../types/index.js';
export class SessionStorage {
    cleanupIntervalMs;
    sessions = new Map();
    cleanupInterval = null;
    constructor(cleanupIntervalMs = 60000) {
        this.cleanupIntervalMs = cleanupIntervalMs;
        this.startCleanupTimer();
    }
    /**
     * 创建会话
     */
    createSession(sessionId, data) {
        this.sessions.set(sessionId, data);
        logger.debug(`会话已创建: ${sessionId}`);
    }
    /**
     * 获取会话
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            // 检查会话是否过期
            const now = Date.now();
            const elapsed = now - session.startTime;
            if (elapsed > session.timeout) {
                logger.debug(`会话已过期: ${sessionId}`);
                this.deleteSession(sessionId);
                return undefined;
            }
        }
        return session;
    }
    /**
     * 更新会话
     */
    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        Object.assign(session, updates);
        this.sessions.set(sessionId, session);
        logger.debug(`会话已更新: ${sessionId}`);
        return true;
    }
    /**
     * 删除会话
     */
    deleteSession(sessionId) {
        const deleted = this.sessions.delete(sessionId);
        if (deleted) {
            logger.debug(`会话已删除: ${sessionId}`);
        }
        return deleted;
    }
    /**
     * 获取所有活跃会话
     */
    getAllSessions() {
        return new Map(this.sessions);
    }
    /**
     * 获取活跃会话数量
     */
    getSessionCount() {
        return this.sessions.size;
    }
    /**
     * 清理过期会话
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [sessionId, session] of this.sessions) {
            const elapsed = now - session.startTime;
            if (elapsed > session.timeout) {
                // 通知会话超时
                if (session.reject) {
                    session.reject(new MCPError(`Session timeout after ${session.timeout / 1000} seconds`, 'SESSION_TIMEOUT'));
                }
                this.sessions.delete(sessionId);
                cleanedCount++;
                logger.debug(`清理过期会话: ${sessionId}`);
            }
        }
        if (cleanedCount > 0) {
            logger.info(`清理了 ${cleanedCount} 个过期会话`);
        }
        return cleanedCount;
    }
    /**
     * 启动清理定时器
     */
    startCleanupTimer() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, this.cleanupIntervalMs);
    }
    /**
     * 停止清理定时器
     */
    stopCleanupTimer() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    /**
     * 清理所有会话
     */
    clear() {
        // 通知所有会话关闭
        for (const [sessionId, session] of this.sessions) {
            if (session.reject) {
                session.reject(new MCPError('Server is shutting down', 'SERVER_SHUTDOWN'));
            }
        }
        this.sessions.clear();
        logger.info('所有会话已清理');
    }
    /**
     * 获取会话统计信息
     */
    getStats() {
        const now = Date.now();
        let activeSessions = 0;
        let expiredSessions = 0;
        for (const session of this.sessions.values()) {
            const elapsed = now - session.startTime;
            if (elapsed > session.timeout) {
                expiredSessions++;
            }
            else {
                activeSessions++;
            }
        }
        return {
            totalSessions: this.sessions.size,
            activeSessions,
            expiredSessions
        };
    }
}
//# sourceMappingURL=session-storage.js.map