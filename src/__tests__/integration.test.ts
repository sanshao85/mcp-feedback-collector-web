/**
 * 集成测试 - 完整的反馈收集流程
 */

import { MCPServer } from '../server/mcp-server.js';
import { createDefaultConfig } from '../config/index.js';
import { ImageData } from '../types/index.js';

describe('集成测试', () => {
  let mcpServer: MCPServer;
  let config: any;

  beforeAll(async () => {
    config = createDefaultConfig();
    config.webPort = 0; // 使用随机端口
    config.logLevel = 'error'; // 减少测试日志
    mcpServer = new MCPServer(config);
  });

  afterAll(async () => {
    if (mcpServer) {
      await mcpServer.stop();
    }
  });

  describe('Web服务器启动', () => {
    test('应该能够启动Web服务器', async () => {
      await mcpServer.startWebOnly();
      
      const status = mcpServer.getStatus();
      expect(status.webRunning).toBe(true);
      expect(status.webPort).toBeGreaterThan(0);
    }, 10000);

    test('应该能够获取服务器状态', () => {
      const status = mcpServer.getStatus();
      
      expect(status).toMatchObject({
        webRunning: true,
        webPort: expect.any(Number),
        mcpRunning: false
      });
    });
  });

  describe('API端点测试', () => {
    test('健康检查端点应该正常工作', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });
    });

    test('配置端点应该返回配置信息', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/api/config`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        api_key: null,
        api_base_url: expect.any(String),
        model: expect.any(String),
        enable_chat: expect.any(Boolean),
        max_file_size: expect.any(Number)
      });
    });

    test('测试会话创建端点', async () => {
      const status = mcpServer.getStatus();
      const testData = {
        work_summary: '这是一个集成测试的工作汇报',
        timeout_seconds: 60
      };
      
      const response = await fetch(`http://localhost:${status.webPort}/api/test-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        session_id: expect.any(String),
        feedback_url: expect.any(String)
      });
      
      // 验证会话ID格式
      expect(data.session_id).toMatch(/^feedback_\d+_[a-z0-9]+$/);
      
      // 验证反馈URL格式
      expect(data.feedback_url).toContain(`localhost:${status.webPort}`);
      expect(data.feedback_url).toContain(`session=${data.session_id}`);
    });
  });

  describe('静态文件服务', () => {
    test('应该能够访问主页', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });

    test('应该能够访问JavaScript文件', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/app.js`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('javascript');
    });

    test('应该能够访问CSS文件', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/style.css`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('css');
    });

    test('应该能够访问测试页面', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/test.html`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });
  });

  describe('错误处理', () => {
    test('不存在的路径应该返回404', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/nonexistent`);
      
      expect(response.status).toBe(404);
    });

    test('无效的API请求应该返回错误', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/api/test-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // 缺少必要字段
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        error: expect.any(String)
      });
    });
  });

  describe('性能测试', () => {
    test('服务器启动时间应该合理', async () => {
      const startTime = Date.now();
      
      const newConfig = createDefaultConfig();
      newConfig.webPort = 0;
      newConfig.logLevel = 'error';
      const testServer = new MCPServer(newConfig);
      
      await testServer.startWebOnly();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5秒内启动
      
      await testServer.stop();
    }, 10000);

    test('API响应时间应该合理', async () => {
      const status = mcpServer.getStatus();
      const startTime = Date.now();
      
      const response = await fetch(`http://localhost:${status.webPort}/health`);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // 1秒内响应
      expect(response.status).toBe(200);
    });

    test('并发请求处理', async () => {
      const status = mcpServer.getStatus();
      const requests = [];
      
      // 创建10个并发请求
      for (let i = 0; i < 10; i++) {
        requests.push(
          fetch(`http://localhost:${status.webPort}/health`)
        );
      }
      
      const responses = await Promise.all(requests);
      
      // 所有请求都应该成功
      for (const response of responses) {
        expect(response.status).toBe(200);
      }
    });
  });

  describe('内存和资源管理', () => {
    test('多次启动停止不应该造成内存泄漏', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 多次启动停止服务器
      for (let i = 0; i < 3; i++) {
        const testConfig = createDefaultConfig();
        testConfig.webPort = 0;
        testConfig.logLevel = 'error';
        const testServer = new MCPServer(testConfig);
        
        await testServer.startWebOnly();
        await testServer.stop();
      }
      
      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该在合理范围内（小于50MB）
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, 30000);
  });
});
