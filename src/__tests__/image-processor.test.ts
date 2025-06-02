/**
 * 图片处理器测试
 */

import { ImageProcessor } from '../utils/image-processor.js';
import { MCPError, ImageData } from '../types/index.js';

describe('图片处理器', () => {
  let imageProcessor: ImageProcessor;

  beforeEach(() => {
    imageProcessor = new ImageProcessor({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxWidth: 1024,
      maxHeight: 1024
    });
  });

  describe('validateImageFormat', () => {
    test('应该接受有效的图片格式', () => {
      const validCases = [
        { filename: 'test.jpg', mimeType: 'image/jpeg' },
        { filename: 'test.jpeg', mimeType: 'image/jpeg' },
        { filename: 'test.png', mimeType: 'image/png' },
        { filename: 'test.gif', mimeType: 'image/gif' },
        { filename: 'test.webp', mimeType: 'image/webp' },
        { filename: 'test.bmp', mimeType: 'image/bmp' }
      ];

      for (const { filename, mimeType } of validCases) {
        expect(imageProcessor.validateImageFormat(filename, mimeType)).toBe(true);
      }
    });

    test('应该拒绝无效的图片格式', () => {
      const invalidCases = [
        { filename: 'test.txt', mimeType: 'text/plain' },
        { filename: 'test.pdf', mimeType: 'application/pdf' },
        { filename: 'test.mp4', mimeType: 'video/mp4' },
        { filename: 'test.jpg', mimeType: 'text/plain' }, // 扩展名和MIME类型不匹配
        { filename: 'test', mimeType: 'image/jpeg' } // 无扩展名
      ];

      for (const { filename, mimeType } of invalidCases) {
        expect(imageProcessor.validateImageFormat(filename, mimeType)).toBe(false);
      }
    });

    test('应该处理大小写不敏感', () => {
      expect(imageProcessor.validateImageFormat('TEST.JPG', 'IMAGE/JPEG')).toBe(true);
      expect(imageProcessor.validateImageFormat('test.PNG', 'image/png')).toBe(true);
    });
  });

  describe('validateImageSize', () => {
    test('应该接受有效的文件大小', () => {
      expect(imageProcessor.validateImageSize(1024)).toBe(true);
      expect(imageProcessor.validateImageSize(1024 * 1024)).toBe(true);
      expect(imageProcessor.validateImageSize(5 * 1024 * 1024 - 1)).toBe(true);
    });

    test('应该拒绝无效的文件大小', () => {
      expect(imageProcessor.validateImageSize(0)).toBe(false);
      expect(imageProcessor.validateImageSize(-1)).toBe(false);
      expect(imageProcessor.validateImageSize(5 * 1024 * 1024 + 1)).toBe(false);
    });
  });

  describe('getImageStats', () => {
    test('应该计算图片统计信息', () => {
      const images: ImageData[] = [
        {
          name: 'test1.jpg',
          data: 'data:image/jpeg;base64,test1',
          size: 1024,
          type: 'image/jpeg'
        },
        {
          name: 'test2.png',
          data: 'data:image/png;base64,test2',
          size: 2048,
          type: 'image/png'
        },
        {
          name: 'test3.jpg',
          data: 'data:image/jpeg;base64,test3',
          size: 1536,
          type: 'image/jpeg'
        }
      ];

      const stats = imageProcessor.getImageStats(images);

      expect(stats).toMatchObject({
        totalCount: 3,
        totalSize: 4608, // 1024 + 2048 + 1536
        averageSize: 1536, // 4608 / 3
        formats: {
          jpeg: 2,
          png: 1
        }
      });
    });

    test('应该处理空图片数组', () => {
      const stats = imageProcessor.getImageStats([]);

      expect(stats).toMatchObject({
        totalCount: 0,
        totalSize: 0,
        averageSize: 0,
        formats: {}
      });
    });
  });

  describe('validateAndProcessImage', () => {
    test('应该拒绝缺少必要字段的图片数据', async () => {
      const invalidImages = [
        { name: '', data: 'test', size: 1024, type: 'image/jpeg' },
        { name: 'test.jpg', data: '', size: 1024, type: 'image/jpeg' },
        { name: 'test.jpg', data: 'test', size: 1024, type: '' }
      ];

      for (const image of invalidImages) {
        await expect(imageProcessor.validateAndProcessImage(image as ImageData))
          .rejects.toThrow(MCPError);
      }
    });

    test('应该拒绝不支持的格式', async () => {
      const image: ImageData = {
        name: 'test.txt',
        data: 'data:text/plain;base64,test',
        size: 1024,
        type: 'text/plain'
      };

      await expect(imageProcessor.validateAndProcessImage(image))
        .rejects.toThrow(MCPError);
      await expect(imageProcessor.validateAndProcessImage(image))
        .rejects.toThrow('Unsupported image format');
    });

    test('应该拒绝过大的文件', async () => {
      const image: ImageData = {
        name: 'test.jpg',
        data: 'data:image/jpeg;base64,test',
        size: 10 * 1024 * 1024, // 10MB，超过5MB限制
        type: 'image/jpeg'
      };

      await expect(imageProcessor.validateAndProcessImage(image))
        .rejects.toThrow(MCPError);
      await expect(imageProcessor.validateAndProcessImage(image))
        .rejects.toThrow('exceeds limit');
    });
  });

  describe('processImages', () => {
    test('应该处理有效图片数组', async () => {
      // 创建一个简单的1x1像素PNG图片的Base64数据
      const smallPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==';
      
      const images: ImageData[] = [
        {
          name: 'test.png',
          data: smallPngBase64,
          size: 100,
          type: 'image/png'
        }
      ];

      const result = await imageProcessor.processImages(images);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'test.png',
        type: 'image/png'
      });
    });

    test('应该在图片处理失败时抛出错误', async () => {
      const images: ImageData[] = [
        {
          name: 'test.txt',
          data: 'invalid-data',
          size: 1024,
          type: 'text/plain'
        }
      ];

      await expect(imageProcessor.processImages(images))
        .rejects.toThrow(MCPError);
    });
  });

  describe('错误处理', () => {
    test('应该处理无效的Base64数据', async () => {
      const image: ImageData = {
        name: 'test.jpg',
        data: 'invalid-base64-data',
        size: 1024,
        type: 'image/jpeg'
      };

      await expect(imageProcessor.validateAndProcessImage(image))
        .rejects.toThrow(MCPError);
    });

    test('应该处理损坏的图片数据', async () => {
      const image: ImageData = {
        name: 'test.jpg',
        data: 'data:image/jpeg;base64,invalid-image-data',
        size: 1024,
        type: 'image/jpeg'
      };

      await expect(imageProcessor.validateAndProcessImage(image))
        .rejects.toThrow(MCPError);
    });
  });
});
