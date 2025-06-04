/**
 * MCP Feedback Collector - 配置管理
 */
import { Config } from '../types/index.js';
/**
 * 创建默认配置
 */
export declare function createDefaultConfig(): Config;
/**
 * 验证配置
 */
export declare function validateConfig(config: Config): void;
/**
 * 获取验证后的配置
 */
export declare function getConfig(): Config;
/**
 * 显示配置信息（隐藏敏感信息）
 */
export declare function displayConfig(config: Config): void;
//# sourceMappingURL=index.d.ts.map