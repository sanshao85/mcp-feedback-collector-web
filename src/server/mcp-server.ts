/**
 * MCP Feedback Collector - MCP服务器实现
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolResult, TextContent, ImageContent } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Config, CollectFeedbackParams, MCPError, FeedbackData, ImageData } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { WebServer } from './web-server.js';

/**
 * MCP服务器类
 */
export class MCPServer {
  private mcpServer: McpServer;
  private webServer: WebServer;
  private config: Config;
  private isRunning = false;

  constructor(config: Config) {
    this.config = config;

    // 创建MCP服务器实例
    this.mcpServer = new McpServer({
      name: 'mcp-feedback-collector',
      version: '2.0.8'
    }, {
      capabilities: {
        tools: {}
      }
    });

    // 设置初始化完成回调
    this.mcpServer.server.oninitialized = () => {
      logger.info('✅ MCP初始化完成');
    };

    // 创建Web服务器实例
    this.webServer = new WebServer(config);

    // 注册MCP工具函数
    this.registerTools();
  }

  /**
   * 注册MCP工具函数
   */
  private registerTools(): void {
    // 注册collect_feedback工具 - 使用新的registerTool方法
    this.mcpServer.registerTool(
      'collect_feedback',
      {
        description: 'Collect feedback from users about AI work summary. This tool opens a web interface for users to provide feedback on the AI\'s work.',
        inputSchema: {
          work_summary: z.string().describe('AI工作汇报内容，描述AI完成的工作和结果')
        }
      },
      async (args: { work_summary: string }): Promise<CallToolResult> => {
        const params: CollectFeedbackParams = {
          work_summary: args.work_summary
        };

        logger.mcp('collect_feedback', params);

        try {
          const result = await this.collectFeedback(params);
          logger.mcp('collect_feedback', params, result);
          return result;
        } catch (error) {
          logger.error('collect_feedback工具调用失败:', error);

          if (error instanceof MCPError) {
            throw error;
          }

          throw new MCPError(
            'Failed to collect feedback',
            'COLLECT_FEEDBACK_ERROR',
            error
          );
        }
      }
    );

    if (logger.getLevel() !== 'silent') {
      logger.info('MCP工具函数注册完成');
    }
  }

  /**
   * 实现collect_feedback功能
   */
  private async collectFeedback(params: CollectFeedbackParams): Promise<CallToolResult> {
    const { work_summary } = params;
    const timeout_seconds = this.config.dialogTimeout;

    logger.info(`开始收集反馈，工作汇报长度: ${work_summary.length}字符，超时: ${timeout_seconds}秒`);

    try {
      // 启动Web服务器（如果未运行）
      if (!this.webServer.isRunning()) {
        await this.webServer.start();
      }

      // 收集用户反馈
      const feedback = await this.webServer.collectFeedback(work_summary, timeout_seconds);

      logger.info(`反馈收集完成，收到 ${feedback.length} 条反馈`);

      // 格式化反馈数据为MCP内容（支持图片）
      const content = this.formatFeedbackForMCP(feedback);

      return {
        content,
        isError: false
      };

    } catch (error) {
      logger.error('反馈收集失败:', error);

      const errorMessage = error instanceof MCPError ? error.message : 'Failed to collect user feedback';

      return {
        content: [{
          type: 'text',
          text: `错误: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  /**
   * 将反馈数据格式化为MCP内容（支持图片显示）
   */
  private formatFeedbackForMCP(feedback: FeedbackData[]): (TextContent | ImageContent)[] {
    if (feedback.length === 0) {
      return [{
        type: 'text',
        text: '未收到用户反馈'
      }];
    }

    const content: (TextContent | ImageContent)[] = [];

    // 添加总结文本
    content.push({
      type: 'text',
      text: `收到 ${feedback.length} 条用户反馈：\n`
    });

    feedback.forEach((item, index) => {
      // 添加反馈标题
      content.push({
        type: 'text',
        text: `\n--- 反馈 ${index + 1} ---`
      });

      // 添加文字反馈
      if (item.text) {
        content.push({
          type: 'text',
          text: `文字反馈: ${item.text}`
        });
      }

      // 添加图片（转换为base64格式）
      if (item.images && item.images.length > 0) {
        content.push({
          type: 'text',
          text: `图片数量: ${item.images.length}`
        });

        item.images.forEach((img: ImageData, imgIndex: number) => {
          // 添加图片信息
          content.push({
            type: 'text',
            text: `图片 ${imgIndex + 1}: ${img.name} (${img.type}, ${(img.size / 1024).toFixed(1)}KB)`
          });

          // 添加图片内容（Cursor格式）
          if (img.data) {
            // 确保是纯净的base64数据（移除data:image/...;base64,前缀）
            const base64Data = img.data.replace(/^data:image\/[^;]+;base64,/, '');

            content.push({
              type: 'image',
              data: base64Data, // 纯净的base64字符串
              mimeType: img.type
            });
          }
        });
      }

      // 添加时间戳
      content.push({
        type: 'text',
        text: `提交时间: ${new Date(item.timestamp).toLocaleString()}\n`
      });
    });

    return content;
  }

  /**
   * 将反馈数据格式化为文本（保留用于其他用途）
   */
  private formatFeedbackAsText(feedback: FeedbackData[]): string {
    if (feedback.length === 0) {
      return '未收到用户反馈';
    }

    const parts: string[] = [];
    parts.push(`收到 ${feedback.length} 条用户反馈：\n`);

    feedback.forEach((item, index) => {
      parts.push(`--- 反馈 ${index + 1} ---`);

      if (item.text) {
        parts.push(`文字反馈: ${item.text}`);
      }

      if (item.images && item.images.length > 0) {
        parts.push(`图片数量: ${item.images.length}`);
        item.images.forEach((img: ImageData, imgIndex: number) => {
          parts.push(`  图片 ${imgIndex + 1}: ${img.name} (${img.type}, ${(img.size / 1024).toFixed(1)}KB)`);
        });
      }

      parts.push(`提交时间: ${new Date(item.timestamp).toLocaleString()}`);
      parts.push('');
    });

    return parts.join('\n');
  }

  /**
   * 启动MCP服务器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('MCP服务器已在运行中');
      return;
    }

    try {
      logger.info('正在启动MCP服务器...');
      
      // 启动Web服务器
      await this.webServer.start();
      
      // 连接MCP传输
      const transport = new StdioServerTransport();

      // 设置传输错误处理
      transport.onerror = (error: Error) => {
        logger.error('MCP传输错误:', error);
      };

      transport.onclose = () => {
        logger.info('MCP传输连接已关闭');
        this.isRunning = false;
      };

      // 添加消息调试
      const originalOnMessage = transport.onmessage;
      transport.onmessage = (message) => {
        logger.debug('📥 收到MCP消息:', JSON.stringify(message, null, 2));
        if (originalOnMessage) {
          originalOnMessage(message);
        }
      };

      const originalSend = transport.send.bind(transport);
      transport.send = (message) => {
        logger.debug('📤 发送MCP消息:', JSON.stringify(message, null, 2));
        return originalSend(message);
      };

      await this.mcpServer.connect(transport);
      
      this.isRunning = true;
      logger.info('✅ MCP服务器启动成功');
      
    } catch (error) {
      logger.error('MCP服务器启动失败:', error);
      throw new MCPError(
        'Failed to start MCP server',
        'SERVER_START_ERROR',
        error
      );
    }
  }

  /**
   * 仅启动Web模式
   */
  async startWebOnly(): Promise<void> {
    try {
      logger.info('正在启动Web模式...');
      
      // 仅启动Web服务器
      await this.webServer.start();
      
      this.isRunning = true;
      logger.info('✅ Web服务器启动成功');
      
      // 保持进程运行
      process.stdin.resume();
      
    } catch (error) {
      logger.error('Web服务器启动失败:', error);
      throw new MCPError(
        'Failed to start web server',
        'WEB_SERVER_START_ERROR',
        error
      );
    }
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      logger.info('正在停止服务器...');
      
      // 停止Web服务器
      await this.webServer.stop();
      
      // 关闭MCP服务器
      if (this.mcpServer) {
        await this.mcpServer.close();
      }
      
      this.isRunning = false;
      logger.info('✅ 服务器已停止');
      
    } catch (error) {
      logger.error('停止服务器时出错:', error);
      throw new MCPError(
        'Failed to stop server',
        'SERVER_STOP_ERROR',
        error
      );
    }
  }

  /**
   * 获取服务器状态
   */
  getStatus(): { running: boolean; webPort?: number | undefined } {
    return {
      running: this.isRunning,
      webPort: this.webServer.isRunning() ? this.webServer.getPort() : undefined
    };
  }
}
