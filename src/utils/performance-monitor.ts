/**
 * MCP Feedback Collector - 性能监控工具
 */

import { logger } from './logger.js';

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  // 内存使用
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  
  // CPU使用
  cpuUsage: {
    user: number;
    system: number;
  };
  
  // 运行时间
  uptime: number;
  
  // 请求统计
  requestStats: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  
  // WebSocket连接
  websocketStats: {
    activeConnections: number;
    totalConnections: number;
    messagesReceived: number;
    messagesSent: number;
  };
  
  // 会话统计
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
export class PerformanceMonitor {
  private startTime: number;
  private requestStats = {
    total: 0,
    successful: 0,
    failed: 0,
    responseTimes: [] as number[]
  };
  
  private websocketStats = {
    activeConnections: 0,
    totalConnections: 0,
    messagesReceived: 0,
    messagesSent: 0
  };
  
  private sessionStats = {
    activeSessions: 0,
    totalSessions: 0,
    completedSessions: 0,
    timeoutSessions: 0
  };

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * 记录HTTP请求
   */
  recordRequest(responseTime: number, success: boolean): void {
    this.requestStats.total++;
    this.requestStats.responseTimes.push(responseTime);
    
    if (success) {
      this.requestStats.successful++;
    } else {
      this.requestStats.failed++;
    }
    
    // 保持最近1000个响应时间记录
    if (this.requestStats.responseTimes.length > 1000) {
      this.requestStats.responseTimes = this.requestStats.responseTimes.slice(-1000);
    }
  }

  /**
   * 记录WebSocket连接
   */
  recordWebSocketConnection(): void {
    this.websocketStats.activeConnections++;
    this.websocketStats.totalConnections++;
  }

  /**
   * 记录WebSocket断开连接
   */
  recordWebSocketDisconnection(): void {
    this.websocketStats.activeConnections = Math.max(0, this.websocketStats.activeConnections - 1);
  }

  /**
   * 记录WebSocket消息
   */
  recordWebSocketMessage(direction: 'received' | 'sent'): void {
    if (direction === 'received') {
      this.websocketStats.messagesReceived++;
    } else {
      this.websocketStats.messagesSent++;
    }
  }

  /**
   * 记录会话创建
   */
  recordSessionCreated(): void {
    this.sessionStats.activeSessions++;
    this.sessionStats.totalSessions++;
  }

  /**
   * 记录会话完成
   */
  recordSessionCompleted(): void {
    this.sessionStats.activeSessions = Math.max(0, this.sessionStats.activeSessions - 1);
    this.sessionStats.completedSessions++;
  }

  /**
   * 记录会话超时
   */
  recordSessionTimeout(): void {
    this.sessionStats.activeSessions = Math.max(0, this.sessionStats.activeSessions - 1);
    this.sessionStats.timeoutSessions++;
  }

  /**
   * 获取当前性能指标
   */
  getMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: Date.now() - this.startTime,
      requestStats: {
        total: this.requestStats.total,
        successful: this.requestStats.successful,
        failed: this.requestStats.failed,
        averageResponseTime: this.calculateAverageResponseTime()
      },
      websocketStats: { ...this.websocketStats },
      sessionStats: { ...this.sessionStats }
    };
  }

  /**
   * 计算平均响应时间
   */
  private calculateAverageResponseTime(): number {
    if (this.requestStats.responseTimes.length === 0) {
      return 0;
    }
    
    const sum = this.requestStats.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.requestStats.responseTimes.length;
  }

  /**
   * 获取格式化的性能报告
   */
  getFormattedReport(): string {
    const metrics = this.getMetrics();
    
    return `
📊 性能监控报告
================

💾 内存使用:
  - 堆内存使用: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
  - 堆内存总量: ${(metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
  - 外部内存: ${(metrics.memoryUsage.external / 1024 / 1024).toFixed(2)} MB
  - RSS: ${(metrics.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB

⏱️ 运行时间: ${(metrics.uptime / 1000).toFixed(2)} 秒

🌐 HTTP请求统计:
  - 总请求数: ${metrics.requestStats.total}
  - 成功请求: ${metrics.requestStats.successful}
  - 失败请求: ${metrics.requestStats.failed}
  - 平均响应时间: ${metrics.requestStats.averageResponseTime.toFixed(2)} ms

🔌 WebSocket统计:
  - 活跃连接: ${metrics.websocketStats.activeConnections}
  - 总连接数: ${metrics.websocketStats.totalConnections}
  - 接收消息: ${metrics.websocketStats.messagesReceived}
  - 发送消息: ${metrics.websocketStats.messagesSent}

📋 会话统计:
  - 活跃会话: ${metrics.sessionStats.activeSessions}
  - 总会话数: ${metrics.sessionStats.totalSessions}
  - 完成会话: ${metrics.sessionStats.completedSessions}
  - 超时会话: ${metrics.sessionStats.timeoutSessions}
`;
  }

  /**
   * 检查性能警告
   */
  checkPerformanceWarnings(): string[] {
    const metrics = this.getMetrics();
    const warnings: string[] = [];
    
    // 内存使用警告
    const heapUsedMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 200) {
      warnings.push(`内存使用过高: ${heapUsedMB.toFixed(2)} MB`);
    }
    
    // 响应时间警告
    if (metrics.requestStats.averageResponseTime > 2000) {
      warnings.push(`平均响应时间过长: ${metrics.requestStats.averageResponseTime.toFixed(2)} ms`);
    }
    
    // 失败率警告
    const failureRate = metrics.requestStats.total > 0 
      ? (metrics.requestStats.failed / metrics.requestStats.total) * 100 
      : 0;
    if (failureRate > 5) {
      warnings.push(`请求失败率过高: ${failureRate.toFixed(2)}%`);
    }
    
    // 会话超时警告
    const timeoutRate = metrics.sessionStats.totalSessions > 0
      ? (metrics.sessionStats.timeoutSessions / metrics.sessionStats.totalSessions) * 100
      : 0;
    if (timeoutRate > 20) {
      warnings.push(`会话超时率过高: ${timeoutRate.toFixed(2)}%`);
    }
    
    return warnings;
  }

  /**
   * 启动定期性能监控
   */
  startPeriodicMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      const warnings = this.checkPerformanceWarnings();
      
      if (warnings.length > 0) {
        logger.warn('性能警告:', warnings);
      }
      
      // 记录性能指标到日志
      const metrics = this.getMetrics();
      logger.debug('性能指标:', {
        memoryMB: (metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        uptime: (metrics.uptime / 1000).toFixed(2),
        requests: metrics.requestStats.total,
        avgResponseTime: metrics.requestStats.averageResponseTime.toFixed(2),
        activeConnections: metrics.websocketStats.activeConnections,
        activeSessions: metrics.sessionStats.activeSessions
      });
    }, intervalMs);
  }

  /**
   * 重置统计数据
   */
  reset(): void {
    this.startTime = Date.now();
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      responseTimes: []
    };
    this.websocketStats = {
      activeConnections: 0,
      totalConnections: 0,
      messagesReceived: 0,
      messagesSent: 0
    };
    this.sessionStats = {
      activeSessions: 0,
      totalSessions: 0,
      completedSessions: 0,
      timeoutSessions: 0
    };
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();
