/**
 * MCP Feedback Collector - 类型定义
 */

// 基础配置类型
export interface Config {
  apiKey?: string | undefined;
  apiBaseUrl: string;
  defaultModel: string;
  webPort: number;
  dialogTimeout: number;
  enableChat: boolean;
  corsOrigin: string;
  maxFileSize: number;
  logLevel: string;
  // 新增：服务器主机配置
  serverHost?: string | undefined;
  serverBaseUrl?: string | undefined;
}

// 反馈数据类型
export interface FeedbackData {
  text?: string;
  images?: ImageData[];
  timestamp: number;
  sessionId: string;
}

// 图片数据类型
export interface ImageData {
  name: string;
  data: string; // Base64编码
  size: number;
  type: string;
}

// 工作汇报类型
export interface WorkSummary {
  content: string;
  timestamp: number;
  sessionId: string;
}

// MCP工具函数参数类型
export interface CollectFeedbackParams {
  work_summary: string;
  timeout_seconds?: number | undefined;
}

// MCP内容类型 - 符合MCP协议标准
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  data: string; // base64编码的图片数据
  mimeType: string; // 图片MIME类型
}

export interface AudioContent {
  type: 'audio';
  data: string; // base64编码的音频数据
  mimeType: string; // 音频MIME类型
}

// MCP内容联合类型
export type MCPContent = TextContent | ImageContent | AudioContent;

// MCP工具函数返回类型 - 符合MCP协议要求
export interface CollectFeedbackResult {
  [x: string]: unknown;
  content: MCPContent[];
  isError?: boolean;
}

// WebSocket事件类型
export interface SocketEvents {
  // 连接管理
  connect: () => void;
  disconnect: () => void;
  
  // 反馈收集
  start_feedback_session: (data: { sessionId: string; workSummary: string }) => void;
  get_work_summary: (data: { feedback_session_id: string }) => void;
  submit_feedback: (data: FeedbackData) => void;
  feedback_submitted: (data: { success: boolean; message?: string }) => void;
  feedback_error: (data: { error: string }) => void;
  work_summary_data: (data: { work_summary: string }) => void;
}

// 服务器状态类型
export interface ServerStatus {
  running: boolean;
  port: number;
  startTime: number;
  activeSessions: number;
}

// 会话管理类型
export interface Session {
  id: string;
  workSummary?: string;
  feedback?: FeedbackData[];
  startTime: number;
  timeout: number;
  status: 'active' | 'completed' | 'timeout' | 'error';
}

// 错误类型
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// 端口管理类型
export interface PortInfo {
  port: number;
  available: boolean;
  pid?: number | undefined;
}

// 日志级别类型
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'silent';

// API配置类型
export interface APIConfig {
  apiKey?: string;
  apiBaseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}
