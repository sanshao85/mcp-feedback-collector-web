/**
 * MCP Feedback Collector - 图片处理工具
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import { MCPError, ImageData } from '../types/index.js';
import { logger } from './logger.js';

/**
 * 支持的图片格式
 */
const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff'];

/**
 * 图片处理器类
 */
export class ImageProcessor {
  private maxFileSize: number;
  private maxWidth: number;
  private maxHeight: number;

  constructor(options: {
    maxFileSize?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}) {
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxWidth = options.maxWidth || 2048;
    this.maxHeight = options.maxHeight || 2048;
  }

  /**
   * 验证图片格式
   */
  validateImageFormat(filename: string, mimeType: string): boolean {
    // 检查文件扩展名
    const ext = filename.toLowerCase().split('.').pop();
    if (!ext || !SUPPORTED_FORMATS.includes(ext)) {
      return false;
    }

    // 检查MIME类型
    const validMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];

    return validMimeTypes.includes(mimeType.toLowerCase());
  }

  /**
   * 验证图片大小
   */
  validateImageSize(size: number): boolean {
    return size > 0 && size <= this.maxFileSize;
  }

  /**
   * 从Base64数据中提取图片信息
   */
  async getImageInfoFromBase64(base64Data: string): Promise<{
    format: string;
    width: number;
    height: number;
    size: number;
    hasAlpha: boolean;
  }> {
    try {
      // 移除Base64前缀
      const base64Content = base64Data.replace(/^data:image\/[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');

      const metadata = await sharp(buffer).metadata();

      return {
        format: metadata.format || 'unknown',
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: buffer.length,
        hasAlpha: metadata.hasAlpha || false
      };
    } catch (error) {
      logger.error('获取图片信息失败:', error);
      throw new MCPError(
        'Failed to get image information',
        'IMAGE_INFO_ERROR',
        error
      );
    }
  }

  /**
   * 压缩图片
   */
  async compressImage(base64Data: string, options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}): Promise<string> {
    try {
      const base64Content = base64Data.replace(/^data:image\/[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');

      const {
        maxWidth = this.maxWidth,
        maxHeight = this.maxHeight,
        quality = 85,
        format = 'jpeg'
      } = options;

      let processor = sharp(buffer);

      // 调整尺寸
      const metadata = await processor.metadata();
      if (metadata.width && metadata.height) {
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          processor = processor.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
      }

      // 转换格式和压缩
      let outputBuffer: Buffer;
      switch (format) {
        case 'jpeg':
          outputBuffer = await processor.jpeg({ quality }).toBuffer();
          break;
        case 'png':
          outputBuffer = await processor.png({ compressionLevel: 9 }).toBuffer();
          break;
        case 'webp':
          outputBuffer = await processor.webp({ quality }).toBuffer();
          break;
        default:
          outputBuffer = await processor.jpeg({ quality }).toBuffer();
      }

      // 转换回Base64
      const compressedBase64 = `data:image/${format};base64,${outputBuffer.toString('base64')}`;
      
      logger.debug(`图片压缩完成: ${buffer.length} -> ${outputBuffer.length} bytes`);
      
      return compressedBase64;
    } catch (error) {
      logger.error('图片压缩失败:', error);
      throw new MCPError(
        'Failed to compress image',
        'IMAGE_COMPRESSION_ERROR',
        error
      );
    }
  }

  /**
   * 验证和处理图片数据
   */
  async validateAndProcessImage(imageData: ImageData): Promise<ImageData> {
    try {
      // 验证基本信息
      if (!imageData.name || !imageData.data || !imageData.type) {
        throw new MCPError(
          'Invalid image data: missing required fields',
          'INVALID_IMAGE_DATA'
        );
      }

      // 验证格式
      if (!this.validateImageFormat(imageData.name, imageData.type)) {
        throw new MCPError(
          `Unsupported image format: ${imageData.type}`,
          'UNSUPPORTED_FORMAT'
        );
      }

      // 验证大小
      if (!this.validateImageSize(imageData.size)) {
        throw new MCPError(
          `Image size ${imageData.size} exceeds limit ${this.maxFileSize}`,
          'IMAGE_TOO_LARGE'
        );
      }

      // 获取图片详细信息
      const info = await this.getImageInfoFromBase64(imageData.data);
      
      // 检查图片尺寸
      if (info.width > this.maxWidth || info.height > this.maxHeight) {
        logger.info(`图片尺寸过大 (${info.width}x${info.height})，正在压缩...`);
        
        const compressedData = await this.compressImage(imageData.data, {
          maxWidth: this.maxWidth,
          maxHeight: this.maxHeight,
          quality: 85
        });

        const compressedInfo = await this.getImageInfoFromBase64(compressedData);
        
        return {
          ...imageData,
          data: compressedData,
          size: compressedInfo.size,
          type: `image/${compressedInfo.format}`
        };
      }

      return imageData;
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }
      
      logger.error('图片验证和处理失败:', error);
      throw new MCPError(
        'Failed to validate and process image',
        'IMAGE_PROCESSING_ERROR',
        error
      );
    }
  }

  /**
   * 批量处理图片
   */
  async processImages(images: ImageData[]): Promise<ImageData[]> {
    const results: ImageData[] = [];
    
    for (let i = 0; i < images.length; i++) {
      try {
        logger.debug(`处理图片 ${i + 1}/${images.length}: ${images[i]?.name}`);
        const processedImage = await this.validateAndProcessImage(images[i]!);
        results.push(processedImage);
      } catch (error) {
        logger.error(`处理图片 ${images[i]?.name} 失败:`, error);
        // 继续处理其他图片，但记录错误
        throw error;
      }
    }
    
    logger.info(`成功处理 ${results.length}/${images.length} 张图片`);
    return results;
  }

  /**
   * 生成图片缩略图
   */
  async generateThumbnail(base64Data: string, size: number = 150): Promise<string> {
    try {
      const base64Content = base64Data.replace(/^data:image\/[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');

      const thumbnailBuffer = await sharp(buffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;
    } catch (error) {
      logger.error('生成缩略图失败:', error);
      throw new MCPError(
        'Failed to generate thumbnail',
        'THUMBNAIL_ERROR',
        error
      );
    }
  }

  /**
   * 获取图片统计信息
   */
  getImageStats(images: ImageData[]): {
    totalCount: number;
    totalSize: number;
    averageSize: number;
    formats: Record<string, number>;
  } {
    const stats = {
      totalCount: images.length,
      totalSize: 0,
      averageSize: 0,
      formats: {} as Record<string, number>
    };

    for (const image of images) {
      stats.totalSize += image.size;
      
      const format = image.type.split('/')[1] || 'unknown';
      stats.formats[format] = (stats.formats[format] || 0) + 1;
    }

    stats.averageSize = stats.totalCount > 0 ? stats.totalSize / stats.totalCount : 0;

    return stats;
  }
}
