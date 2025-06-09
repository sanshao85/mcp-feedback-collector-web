/**
 * 图片转文字服务
 */

import fetch from 'node-fetch';
import { Config } from '../types/index.js';
import { logger } from './logger.js';

export class ImageToTextService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * 将图片转换为文字描述
   */
  async convertImageToText(imageData: string, mimeType: string): Promise<string> {
    if (!this.config.enableImageToText) {
      throw new Error('图片转文字功能未启用');
    }

    if (!this.config.apiKey) {
      throw new Error('API密钥未配置');
    }

    try {
      logger.debug('开始转换图片为文字', { mimeType });

      // 清理base64数据，移除data URL前缀
      const cleanBase64 = imageData.replace(/^data:image\/[^;]+;base64,/, '');

      const response = await fetch(`${this.config.apiBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.defaultModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: this.config.imageToTextPrompt || '请详细描述这张图片的内容，包括主要元素、颜色、布局、文字等信息。'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${cleanBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('API调用失败', { status: response.status, error: errorText });
        throw new Error(`API调用失败: ${response.status} ${errorText}`);
      }

      const result = await response.json() as any;
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        logger.error('API响应格式错误', { result });
        throw new Error('API响应格式错误');
      }

      const description = result.choices[0].message.content;
      
      if (!description || typeof description !== 'string') {
        throw new Error('未能获取有效的图片描述');
      }

      logger.debug('图片转文字成功', { descriptionLength: description.length });
      return description.trim();

    } catch (error) {
      logger.error('图片转文字失败:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('图片转文字处理失败');
    }
  }

  /**
   * 批量转换图片为文字
   */
  async convertMultipleImages(images: Array<{ name: string; type: string; data: string }>): Promise<string[]> {
    const descriptions: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (!image) {
        descriptions.push('转换失败: 图片数据无效');
        continue;
      }

      try {
        logger.info(`正在转换第 ${i + 1}/${images.length} 张图片: ${image.name}`);
        const description = await this.convertImageToText(image.data, image.type);
        descriptions.push(description);
      } catch (error) {
        logger.error(`转换图片 ${image.name} 失败:`, error);
        descriptions.push(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return descriptions;
  }

  /**
   * 检查是否支持图片转文字功能
   */
  isEnabled(): boolean {
    return Boolean(this.config.enableImageToText && this.config.apiKey);
  }

  /**
   * 获取配置信息
   */
  getConfig(): { enabled: boolean; model: string; prompt: string } {
    return {
      enabled: this.isEnabled(),
      model: this.config.defaultModel,
      prompt: this.config.imageToTextPrompt || '请详细描述这张图片的内容，包括主要元素、颜色、布局、文字等信息。'
    };
  }
}
