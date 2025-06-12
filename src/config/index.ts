/**
 * MCP Feedback Collector - 配置管理
 */

import { config as dotenvConfig } from 'dotenv';
import { Config, MCPError } from '../types/index.js';

// 加载环境变量
dotenvConfig();

/**
 * 获取环境变量值，支持默认值
 */
function getEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * 获取可选的环境变量值
 */
function getOptionalEnvVar(key: string): string | undefined {
  return process.env[key] || undefined;
}

/**
 * 获取数字类型的环境变量
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Invalid number for ${key}: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }

  return parsed;
}

/**
 * 获取布尔类型的环境变量
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;

  return value.toLowerCase() === 'true';
}

/**
 * 创建默认配置
 */
export function createDefaultConfig(): Config {
  return {
    apiKey: process.env['MCP_API_KEY'],
    apiBaseUrl: getEnvVar('MCP_API_BASE_URL', 'https://api.ssopen.top'),
    defaultModel: getEnvVar('MCP_DEFAULT_MODEL', 'gpt-4o-mini'),
    webPort: getEnvNumber('MCP_WEB_PORT', 5000),
    dialogTimeout: getEnvNumber('MCP_DIALOG_TIMEOUT', 60000),
    enableChat: getEnvBoolean('MCP_ENABLE_CHAT', true),
    corsOrigin: getEnvVar('MCP_CORS_ORIGIN', '*'),
    maxFileSize: getEnvNumber('MCP_MAX_FILE_SIZE', 10485760), // 10MB
    logLevel: getEnvVar('LOG_LEVEL', 'info'),
    // 新增：服务器主机配置
    serverHost: getOptionalEnvVar('MCP_SERVER_HOST'),
    serverBaseUrl: getOptionalEnvVar('MCP_SERVER_BASE_URL'),
    // 新增：URL和端口优化配置
    forcePort: getEnvBoolean('MCP_FORCE_PORT', false),
    killProcessOnPortConflict: getEnvBoolean('MCP_KILL_PORT_PROCESS', false),
    useFixedUrl: getEnvBoolean('MCP_USE_FIXED_URL', true),  // 默认启用固定URL
    cleanupPortOnStart: getEnvBoolean('MCP_CLEANUP_PORT_ON_START', true),  // 默认启用端口清理
    // 新增：图片转文字功能配置
    enableImageToText: getEnvBoolean('MCP_ENABLE_IMAGE_TO_TEXT', true),
    imageToTextPrompt: getEnvVar('MCP_IMAGE_TO_TEXT_PROMPT', '请详细描述这张图片的内容，包括主要元素、颜色、布局、文字等信息。')
  };
}

/**
 * 验证配置
 */
export function validateConfig(config: Config): void {
  // 验证端口范围
  if (config.webPort < 1024 || config.webPort > 65535) {
    throw new MCPError(
      `Invalid port number: ${config.webPort}. Must be between 1024 and 65535.`,
      'INVALID_PORT'
    );
  }

  // 验证超时时间 - 扩展支持到60000秒（约16.7小时）
  if (config.dialogTimeout < 10 || config.dialogTimeout > 60000) {
    throw new MCPError(
      `Invalid timeout: ${config.dialogTimeout}. Must be between 10 and 60000 seconds.`,
      'INVALID_TIMEOUT'
    );
  }

  // 验证文件大小限制
  if (config.maxFileSize < 1024 || config.maxFileSize > 104857600) { // 1KB - 100MB
    throw new MCPError(
      `Invalid max file size: ${config.maxFileSize}. Must be between 1KB and 100MB.`,
      'INVALID_FILE_SIZE'
    );
  }

  // 验证API基础URL
  try {
    new URL(config.apiBaseUrl);
  } catch {
    throw new MCPError(
      `Invalid API base URL: ${config.apiBaseUrl}`,
      'INVALID_API_URL'
    );
  }

  // 验证日志级别
  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLogLevels.includes(config.logLevel)) {
    throw new MCPError(
      `Invalid log level: ${config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`,
      'INVALID_LOG_LEVEL'
    );
  }
}

/**
 * 获取验证后的配置
 */
export function getConfig(): Config {
  const config = createDefaultConfig();
  validateConfig(config);
  return config;
}

/**
 * 显示配置信息（隐藏敏感信息）
 */
export function displayConfig(config: Config): void {
  console.log('MCP Feedback Collector Configuration:');
  console.log(`  API Base URL: ${config.apiBaseUrl}`);
  console.log(`  Default Model: ${config.defaultModel}`);
  console.log(`  Web Port: ${config.webPort}`);
  console.log(`  Dialog Timeout: ${config.dialogTimeout}s`);
  console.log(`  Enable Chat: ${config.enableChat}`);
  console.log(`  CORS Origin: ${config.corsOrigin}`);
  console.log(`  Max File Size: ${(config.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  Log Level: ${config.logLevel}`);
  console.log(`  API Key: ${config.apiKey ? '***configured***' : 'not set'}`);
  console.log(`  Server Host: ${config.serverHost || '自动检测'}`);
  console.log(`  Server Base URL: ${config.serverBaseUrl || '自动生成'}`);
  console.log(`  Force Port: ${config.forcePort ? 'enabled' : 'disabled'}`);
  console.log(`  Kill Port Process: ${config.killProcessOnPortConflict ? 'enabled' : 'disabled'}`);
  console.log(`  Use Fixed URL: ${config.useFixedUrl ? 'enabled' : 'disabled'}`);
  console.log(`  Cleanup Port On Start: ${config.cleanupPortOnStart ? 'enabled' : 'disabled'}`);
  console.log(`  Image To Text: ${config.enableImageToText ? 'enabled' : 'disabled'}`);
  console.log(`  Image To Text Prompt: ${config.imageToTextPrompt ? config.imageToTextPrompt.substring(0, 50) + '...' : 'default'}`);
}
