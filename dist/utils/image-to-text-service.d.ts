/**
 * 图片转文字服务
 */
import { Config } from '../types/index.js';
export declare class ImageToTextService {
    private config;
    constructor(config: Config);
    /**
     * 将图片转换为文字描述
     */
    convertImageToText(imageData: string, mimeType: string): Promise<string>;
    /**
     * 批量转换图片为文字
     */
    convertMultipleImages(images: Array<{
        name: string;
        type: string;
        data: string;
    }>): Promise<string[]>;
    /**
     * 检查是否支持图片转文字功能
     */
    isEnabled(): boolean;
    /**
     * 获取配置信息
     */
    getConfig(): {
        enabled: boolean;
        model: string;
        prompt: string;
    };
}
//# sourceMappingURL=image-to-text-service.d.ts.map