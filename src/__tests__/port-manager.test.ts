/**
 * 端口管理器测试
 */

import { PortManager } from '../utils/port-manager.js';
import { MCPError } from '../types/index.js';

describe('端口管理器', () => {
  let portManager: PortManager;

  beforeEach(() => {
    portManager = new PortManager();
  });

  describe('isPortAvailable', () => {
    test('应该检测端口可用性', async () => {
      // 测试一个很可能可用的端口
      const available = await portManager.isPortAvailable(65432);
      expect(typeof available).toBe('boolean');
    });

    test('应该检测已占用端口', async () => {
      // 创建一个服务器占用端口
      const { createServer } = await import('net');
      const server = createServer();
      
      await new Promise<void>((resolve) => {
        server.listen(0, () => {
          resolve();
        });
      });

      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      
      if (port > 0) {
        const available = await portManager.isPortAvailable(port);
        expect(available).toBe(false);
      }
      
      server.close();
    });
  });

  describe('findAvailablePort', () => {
    test('应该找到可用端口', async () => {
      const port = await portManager.findAvailablePort();
      
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThanOrEqual(65535);
    });

    test('应该使用首选端口（如果可用）', async () => {
      // 使用一个很可能可用的高端口
      const preferredPort = 65431;
      const port = await portManager.findAvailablePort(preferredPort);
      
      // 如果首选端口可用，应该返回该端口
      const isPreferredAvailable = await portManager.isPortAvailable(preferredPort);
      if (isPreferredAvailable) {
        expect(port).toBe(preferredPort);
      } else {
        expect(port).not.toBe(preferredPort);
        expect(port).toBeGreaterThan(0);
      }
    });

    test('应该在首选端口不可用时找到替代端口', async () => {
      // 使用一个很可能被占用的端口（如80）
      const preferredPort = 80;
      const port = await portManager.findAvailablePort(preferredPort);
      
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThanOrEqual(65535);
      // 由于80端口通常被占用或需要管理员权限，应该返回其他端口
    });
  });

  describe('getPortInfo', () => {
    test('应该返回端口信息', async () => {
      const port = 65430;
      const info = await portManager.getPortInfo(port);
      
      expect(info).toMatchObject({
        port: port,
        available: expect.any(Boolean),
        pid: undefined // 当前实现中PID检测未实现
      });
    });
  });

  describe('getPortRangeStatus', () => {
    test('应该返回端口范围状态', async () => {
      const status = await portManager.getPortRangeStatus();
      
      expect(Array.isArray(status)).toBe(true);
      expect(status.length).toBe(20); // 5000-5019 共20个端口
      
      for (const info of status) {
        expect(info).toMatchObject({
          port: expect.any(Number),
          available: expect.any(Boolean),
          pid: undefined
        });
        expect(info.port).toBeGreaterThanOrEqual(5000);
        expect(info.port).toBeLessThanOrEqual(5019);
      }
    });
  });

  describe('waitForPortRelease', () => {
    test('应该在端口可用时立即返回', async () => {
      const port = 65429;
      const startTime = Date.now();
      
      await portManager.waitForPortRelease(port, 1000);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // 应该很快返回
    });

    test('应该在超时时抛出错误', async () => {
      // 创建一个服务器占用端口
      const { createServer } = await import('net');
      const server = createServer();
      
      await new Promise<void>((resolve) => {
        server.listen(0, () => {
          resolve();
        });
      });

      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      
      if (port > 0) {
        await expect(
          portManager.waitForPortRelease(port, 100)
        ).rejects.toThrow(MCPError);
      }
      
      server.close();
    });
  });

  describe('错误处理', () => {
    test('应该在没有可用端口时抛出错误', async () => {
      // 模拟所有端口都被占用的情况（通过mock）
      const originalIsPortAvailable = portManager.isPortAvailable;
      portManager.isPortAvailable = jest.fn().mockResolvedValue(false);
      
      await expect(portManager.findAvailablePort()).rejects.toThrow(MCPError);
      await expect(portManager.findAvailablePort()).rejects.toThrow('No available ports found');
      
      // 恢复原方法
      portManager.isPortAvailable = originalIsPortAvailable;
    });
  });
});
