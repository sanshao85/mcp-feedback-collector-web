/**
 * MCP Feedback Collector - 图片处理工具
 * 使用 Jimp 库进行图片处理和优化
 */
import { ImageData } from '../types/index.js';
/**
 * 图片处理器类
 */
export declare class ImageProcessor {
    private maxFileSize;
    private maxWidth;
    private maxHeight;
    constructor(options?: {
        maxFileSize?: number;
        maxWidth?: number;
        maxHeight?: number;
    });
    /**
     * 验证图片格式
     */
    validateImageFormat(filename: string, mimeType: string): boolean;
    /**
     * 验证图片大小
     */
    validateImageSize(size: number): boolean;
    /**
     * 从Base64数据中提取图片信息
     */
    getImageInfoFromBase64(base64Data: string): Promise<{
        format: string;
        width: number;
        height: number;
        size: number;
        hasAlpha: boolean;
    }>;
    /**
     * 压缩图片
     */
    compressImage(base64Data: string, options?: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        format?: 'jpeg' | 'png' | 'webp';
    }): Promise<string>;
    /**
     * 验证和处理图片数据
     */
    validateAndProcessImage(imageData: ImageData): Promise<ImageData>;
    /**
     * 批量处理图片
     */
    processImages(images: ImageData[]): Promise<ImageData[]>;
    /**
     * 生成图片缩略图
     */
    generateThumbnail(base64Data: string, size?: number): Promise<string>;
    /**
     * 获取图片统计信息
     */
    getImageStats(images: ImageData[]): {
        totalCount: number;
        totalSize: number;
        averageSize: number;
        formats: Record<string, number>;
    };
}
//# sourceMappingURL=image-processor.d.ts.map