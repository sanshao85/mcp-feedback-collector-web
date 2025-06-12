/**
 * 配置管理模块测试
 */

import { createDefaultConfig, validateConfig } from '../config/index.js';
import { MCPError } from '../types/index.js';

describe('配置管理', () => {
  beforeEach(() => {
    // 清理环境变量
    delete process.env.MCP_WEB_PORT;
    delete process.env.MCP_DIALOG_TIMEOUT;
    delete process.env.MCP_API_BASE_URL;
    delete process.env.LOG_LEVEL;
  });

  describe('createDefaultConfig', () => {
    test('应该创建默认配置', () => {
      const config = createDefaultConfig();
      
      expect(config).toMatchObject({
        apiBaseUrl: 'https://api.ssopen.top',
        defaultModel: 'gpt-4o-mini',
        webPort: 5000,
        dialogTimeout: 60000,
        enableChat: true,
        corsOrigin: '*',
        maxFileSize: 10485760,
        logLevel: 'info'
      });
      
      expect(config.apiKey).toBeUndefined();
    });

    test('应该使用环境变量覆盖默认值', () => {
      process.env.MCP_WEB_PORT = '8080';
      process.env.MCP_DIALOG_TIMEOUT = '600';
      process.env.MCP_API_BASE_URL = 'https://custom.api.com';
      process.env.LOG_LEVEL = 'debug';
      
      const config = createDefaultConfig();
      
      expect(config.webPort).toBe(8080);
      expect(config.dialogTimeout).toBe(600);
      expect(config.apiBaseUrl).toBe('https://custom.api.com');
      expect(config.logLevel).toBe('debug');
    });

    test('应该处理无效的数字环境变量', () => {
      process.env.MCP_WEB_PORT = 'invalid';
      process.env.MCP_DIALOG_TIMEOUT = 'not-a-number';
      
      const config = createDefaultConfig();
      
      expect(config.webPort).toBe(5000); // 回退到默认值
      expect(config.dialogTimeout).toBe(60000); // 回退到默认值
    });
  });

  describe('validateConfig', () => {
    test('应该验证有效配置', () => {
      const config = createDefaultConfig();
      
      expect(() => validateConfig(config)).not.toThrow();
    });

    test('应该拒绝无效端口', () => {
      const config = createDefaultConfig();
      config.webPort = 80; // 小于1024
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid port number');
    });

    test('应该拒绝过大端口', () => {
      const config = createDefaultConfig();
      config.webPort = 70000; // 大于65535
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid port number');
    });

    test('应该拒绝无效超时时间', () => {
      const config = createDefaultConfig();
      config.dialogTimeout = 5; // 小于10秒
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid timeout');
    });

    test('应该拒绝过长超时时间', () => {
      const config = createDefaultConfig();
      config.dialogTimeout = 70000; // 大于60000秒

      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid timeout');
    });

    test('应该拒绝无效文件大小', () => {
      const config = createDefaultConfig();
      config.maxFileSize = 500; // 小于1KB
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid max file size');
    });

    test('应该拒绝过大文件大小', () => {
      const config = createDefaultConfig();
      config.maxFileSize = 200 * 1024 * 1024; // 大于100MB
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid max file size');
    });

    test('应该拒绝无效API URL', () => {
      const config = createDefaultConfig();
      config.apiBaseUrl = 'not-a-valid-url';
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid API base URL');
    });

    test('应该拒绝无效日志级别', () => {
      const config = createDefaultConfig();
      config.logLevel = 'invalid-level';
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid log level');
    });

    test('应该接受有效日志级别', () => {
      const config = createDefaultConfig();
      const validLevels = ['error', 'warn', 'info', 'debug'];
      
      for (const level of validLevels) {
        config.logLevel = level;
        expect(() => validateConfig(config)).not.toThrow();
      }
    });
  });
});
