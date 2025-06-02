# 🏗️ MCP Feedback Collector - 技术架构文档

## 📋 架构概览

MCP Feedback Collector 采用现代化的 Node.js 架构，基于 TypeScript 开发，提供 MCP 协议集成和 Web 界面。

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Desktop                           │
│                   (MCP Client)                              │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP Protocol (stdio)
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                MCP Server                                   │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │   CLI Entry     │   MCP Tools     │   Web Server    │    │
│  │   (cli.ts)      │ (mcp-server.ts) │ (web-server.ts) │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP + WebSocket
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Web Browser                                 │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │   HTML UI       │   JavaScript    │   Socket.IO     │    │
│  │ (index.html)    │   (app.js)      │   Client        │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 核心组件

### 1. CLI 入口 (`src/cli.ts`)

**职责**: 命令行接口和应用启动

**功能**:
- 命令行参数解析 (Commander.js)
- 配置加载和验证
- 服务器生命周期管理
- 优雅关闭处理

**关键特性**:
```typescript
// 多种启动模式
npm start              // 完整MCP模式
npm start --web        // 仅Web模式
npm start health       // 健康检查
npm start config       // 显示配置
```

### 2. MCP 服务器 (`src/server/mcp-server.ts`)

**职责**: MCP协议实现和工具函数注册

**核心工具函数**:
- `collect_feedback(work_summary, timeout_seconds?)`: 收集用户反馈

**MCP协议集成**:
```typescript
// 工具函数注册
this.mcpServer.tool('collect_feedback', schema, handler);

// 传输层连接
const transport = new StdioServerTransport();
await this.mcpServer.connect(transport);
```

### 3. Web 服务器 (`src/server/web-server.ts`)

**职责**: HTTP服务和WebSocket通信

**技术栈**:
- Express.js: HTTP服务器
- Socket.IO: WebSocket通信
- 静态文件服务
- 会话管理

**关键功能**:
```typescript
// WebSocket事件处理
socket.on('get_work_summary', handler);
socket.on('submit_feedback', handler);

// 会话生命周期管理
this.activeSessions.set(sessionId, session);
```

### 4. 前端界面 (`src/static/`)

**技术栈**:
- 原生 HTML5 + CSS3
- 原生 JavaScript (ES6+)
- Socket.IO 客户端
- VS Code 深色主题

**核心功能**:
- 双标签页设计 (工作汇报 + AI对话)
- 实时WebSocket通信
- 图片上传和预览
- 响应式布局

## 📊 数据流

### 1. MCP工具函数调用流程

```
Claude Desktop
    │ collect_feedback("工作汇报内容")
    ▼
MCP Server (stdio)
    │ 解析参数，创建会话
    ▼
Web Server
    │ 启动HTTP服务器
    │ 打开浏览器页面
    ▼
Browser
    │ WebSocket连接
    │ 显示工作汇报
    │ 用户输入反馈
    ▼
Web Server
    │ 接收反馈数据
    │ 返回给MCP Server
    ▼
Claude Desktop
    │ 收到格式化的反馈结果
```

### 2. WebSocket通信协议

**客户端 → 服务器**:
```javascript
// 获取工作汇报
socket.emit('get_work_summary', { feedback_session_id: 'xxx' });

// 提交反馈
socket.emit('submit_feedback', {
    text: '反馈内容',
    images: [{ name, data, size, type }],
    timestamp: Date.now(),
    sessionId: 'xxx'
});
```

**服务器 → 客户端**:
```javascript
// 工作汇报数据
socket.emit('work_summary_data', { work_summary: 'xxx' });

// 反馈提交结果
socket.emit('feedback_submitted', { success: true });

// 错误信息
socket.emit('feedback_error', { error: 'xxx' });
```

## 🔒 安全设计

### 1. 输入验证

```typescript
// 参数验证
const schema = z.object({
    work_summary: z.string().min(1).max(10000),
    timeout_seconds: z.number().min(10).max(3600).optional()
});

// 文件大小限制
maxFileSize: 10485760  // 10MB
```

### 2. 会话管理

```typescript
// 会话超时机制
setTimeout(() => {
    this.activeSessions.delete(sessionId);
    reject(new MCPError('Timeout', 'FEEDBACK_TIMEOUT'));
}, timeoutSeconds * 1000);

// 会话隔离
const sessionId = `feedback_${Date.now()}_${Math.random().toString(36)}`;
```

### 3. 错误处理

```typescript
// 统一错误类型
export class MCPError extends Error {
    constructor(message: string, code: string, details?: unknown) {
        super(message);
        this.name = 'MCPError';
    }
}

// 错误边界
try {
    // 业务逻辑
} catch (error) {
    logger.error('操作失败:', error);
    throw new MCPError('Operation failed', 'OPERATION_ERROR', error);
}
```

## ⚡ 性能优化

### 1. 端口管理

```typescript
// 智能端口发现
async findAvailablePort(preferredPort?: number): Promise<number> {
    // 1. 尝试首选端口
    // 2. 扫描端口范围 (5000-5019)
    // 3. 随机端口回退
}
```

### 2. 资源管理

```typescript
// 会话清理
for (const [sessionId, session] of this.activeSessions) {
    if (session.reject) {
        session.reject(new MCPError('Server shutdown', 'SHUTDOWN'));
    }
}
this.activeSessions.clear();
```

### 3. 静态文件优化

```typescript
// 压缩中间件
this.app.use(compression());

// 静态文件缓存
this.app.use(express.static('dist/static', {
    maxAge: '1d',
    etag: true
}));
```

## 🔧 配置系统

### 1. 环境变量

```bash
# API配置
MCP_API_KEY="your_api_key"
MCP_API_BASE_URL="https://api.ssopen.top"
MCP_DEFAULT_MODEL="gpt-4o-mini"

# 服务器配置
MCP_WEB_PORT="5000"
MCP_DIALOG_TIMEOUT="300"

# 功能开关
MCP_ENABLE_CHAT="true"

# 安全配置
MCP_CORS_ORIGIN="*"
MCP_MAX_FILE_SIZE="10485760"
```

### 2. 配置验证

```typescript
export function validateConfig(config: Config): void {
    // 端口范围验证
    if (config.webPort < 1024 || config.webPort > 65535) {
        throw new MCPError('Invalid port', 'INVALID_PORT');
    }
    
    // URL格式验证
    try {
        new URL(config.apiBaseUrl);
    } catch {
        throw new MCPError('Invalid API URL', 'INVALID_API_URL');
    }
}
```

## 📝 日志系统

### 1. 日志级别

```typescript
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// 彩色输出
const LOG_COLORS: Record<LogLevel, string> = {
    error: '\x1b[31m',  // 红色
    warn: '\x1b[33m',   // 黄色
    info: '\x1b[36m',   // 青色
    debug: '\x1b[37m'   // 白色
};
```

### 2. 结构化日志

```typescript
// HTTP请求日志
logger.request('GET', '/api/config', 200, 45);

// WebSocket事件日志
logger.socket('connect', socketId, data);

// MCP工具调用日志
logger.mcp('collect_feedback', params, result);
```

## 🧪 测试策略

### 1. 单元测试

```typescript
describe('PortManager', () => {
    test('should find available port', async () => {
        const port = await portManager.findAvailablePort(5000);
        expect(port).toBeGreaterThan(0);
    });
});
```

### 2. 集成测试

```typescript
describe('WebSocket Communication', () => {
    test('should handle feedback submission', async () => {
        const client = io('http://localhost:5000');
        client.emit('submit_feedback', feedbackData);
        // 验证响应
    });
});
```

## 🚀 部署架构

### 1. 开发环境

```bash
npm run dev     # 热重载开发
npm run build   # 构建生产版本
npm test        # 运行测试
```

### 2. 生产环境

```bash
npm install -g mcp-feedback-collector
mcp-feedback-collector --port 5000
```

### 3. Docker部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/cli.js"]
```

## 📈 监控指标

### 1. 性能指标

- **启动时间**: < 3秒
- **内存使用**: < 100MB
- **响应时间**: < 2秒
- **并发连接**: 支持10个

### 2. 健康检查

```typescript
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        active_sessions: this.activeSessions.size
    });
});
```
