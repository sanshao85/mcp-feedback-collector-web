# 🔧 技术文档

## 🏗️ 系统架构

### 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLI Interface │    │   Web Browser   │    │  MCP Client     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Feedback Collector                      │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   CLI Module    │   Web Server    │      MCP Server             │
│   - 启动管理     │   - HTTP API    │      - Tool Registration    │
│   - 参数解析     │   - WebSocket   │      - Session Management   │
│   - 进程控制     │   - 静态文件     │      - Protocol Handling    │
└─────────────────┴─────────────────┴─────────────────────────────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Port Manager  │    │ Session Storage │    │ Image Processor │
│   - 端口检测     │    │ - 会话管理       │    │ - 图片处理       │
│   - 进程清理     │    │ - 数据存储       │    │ - 格式转换       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 核心模块

#### 1. CLI模块 (`src/cli.ts`)
- **功能**: 命令行界面，程序入口点
- **职责**: 参数解析、模式选择、进程管理
- **关键特性**: 
  - 支持多种启动模式
  - 环境变量配置
  - 优雅的错误处理

#### 2. MCP服务器 (`src/server/mcp-server.ts`)
- **功能**: MCP协议实现
- **职责**: 工具注册、会话管理、协议处理
- **关键特性**:
  - `collect_feedback` 工具实现
  - 标准MCP协议兼容
  - 会话生命周期管理

#### 3. Web服务器 (`src/server/web-server.ts`)
- **功能**: HTTP/WebSocket服务
- **职责**: Web界面、API端点、实时通信
- **关键特性**:
  - Express.js框架
  - Socket.IO实时通信
  - 静态文件服务

## 🔄 数据流

### 反馈收集流程
```
1. AI调用collect_feedback工具
   ↓
2. MCP服务器创建会话
   ↓
3. Web服务器生成反馈页面
   ↓
4. 用户在浏览器中提交反馈
   ↓
5. WebSocket传输反馈数据
   ↓
6. MCP服务器处理并响应
   ↓
7. 会话清理和资源释放
```

### 会话管理
- **会话ID**: 唯一标识符，格式: `feedback_{timestamp}_{random}`
- **生命周期**: 创建 → 活跃 → 超时/完成 → 清理
- **存储**: 内存存储，支持持久化扩展
- **清理**: 定时清理过期会话

## 🌐 网络通信

### HTTP API端点
```
GET  /                    # 主页面
GET  /api/version         # 版本信息
POST /api/test-session    # 创建测试会话
GET  /api/session/:id     # 获取会话信息
POST /api/feedback        # 提交反馈
```

### WebSocket事件
```
# 客户端 → 服务器
connect                   # 连接建立
request_session          # 请求会话分配
submit_feedback          # 提交反馈
request_latest_summary   # 请求最新汇报

# 服务器 → 客户端
session_assigned         # 会话分配完成
feedback_submitted       # 反馈提交成功
latest_summary_response  # 最新汇报响应
error                    # 错误信息
```

## 🔧 配置系统

### 环境变量
```bash
# 基础配置
MCP_WEB_PORT=5000                    # Web服务端口
MCP_LOG_LEVEL=info                   # 日志级别
MCP_SESSION_TIMEOUT=3600             # 会话超时(秒)

# 高级配置
MCP_USE_FIXED_URL=true               # 固定URL模式
MCP_FORCE_PORT=false                 # 强制端口模式
MCP_KILL_PORT_PROCESS=false          # 自动终止占用进程
MCP_STARTUP_PORT_CLEANUP=true        # 启动时端口清理

# 文件上传
MCP_MAX_FILE_SIZE=10485760           # 最大文件大小(10MB)
MCP_ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp  # 允许的文件类型

# 安全配置
MCP_CORS_ORIGIN=*                    # CORS允许的源
MCP_RATE_LIMIT_WINDOW=900000         # 速率限制窗口(15分钟)
MCP_RATE_LIMIT_MAX=100               # 速率限制最大请求数
```

### 配置优先级
1. 命令行参数
2. 环境变量
3. 配置文件
4. 默认值

## 🖼️ 图片处理

### 支持格式
- **输入**: JPEG, PNG, GIF, WebP, BMP
- **输出**: JPEG, PNG, WebP
- **最大尺寸**: 2048x2048像素
- **最大文件**: 10MB

### 处理流程
```
1. 文件上传验证
   ↓
2. 格式检测和转换
   ↓
3. 尺寸调整和优化
   ↓
4. Base64编码
   ↓
5. 存储和传输
```

## 🔒 安全机制

### 输入验证
- **文件类型检查**: MIME类型和文件扩展名双重验证
- **文件大小限制**: 防止大文件攻击
- **内容过滤**: 恶意内容检测和过滤

### 会话安全
- **随机ID生成**: 使用加密安全的随机数生成器
- **会话隔离**: 不同会话间数据完全隔离
- **自动过期**: 防止会话泄露和资源占用

### 网络安全
- **CORS配置**: 适当的跨域资源共享设置
- **速率限制**: 防止API滥用和DDoS攻击
- **输入清理**: 防止XSS和注入攻击

## 📊 性能优化

### 内存管理
- **会话清理**: 定时清理过期会话
- **图片缓存**: 智能图片缓存策略
- **连接池**: WebSocket连接复用

### 响应优化
- **静态文件缓存**: 浏览器缓存策略
- **压缩传输**: Gzip压缩
- **异步处理**: 非阻塞I/O操作

### 并发处理
- **事件驱动**: Node.js事件循环
- **连接限制**: 合理的并发连接数限制
- **负载均衡**: 支持多实例部署

## 🔍 监控和日志

### 日志系统
- **分级日志**: ERROR, WARN, INFO, DEBUG
- **结构化日志**: JSON格式，便于分析
- **日志轮转**: 防止日志文件过大

### 性能监控
- **响应时间**: API响应时间监控
- **内存使用**: 实时内存使用情况
- **连接状态**: WebSocket连接状态
- **错误率**: 错误发生频率和类型

### 健康检查
```bash
# 服务状态检查
curl http://localhost:5000/api/version

# 内存使用检查
curl http://localhost:5000/api/health

# 连接状态检查
curl http://localhost:5000/api/status
```

## 🚀 扩展性设计

### 插件系统
- **工具扩展**: 支持自定义MCP工具
- **中间件**: Express中间件扩展
- **事件钩子**: 生命周期事件钩子

### 数据存储扩展
- **内存存储**: 默认实现
- **Redis存储**: 分布式会话存储
- **数据库存储**: 持久化存储支持

### 部署扩展
- **单机部署**: 简单直接
- **集群部署**: 多实例负载均衡
- **容器化**: Docker支持
- **云原生**: Kubernetes部署

---

## 📚 技术参考

- [MCP协议规范](https://modelcontextprotocol.io/)
- [Node.js文档](https://nodejs.org/docs/)
- [Socket.IO文档](https://socket.io/docs/)
- [Express.js文档](https://expressjs.com/)
- [Sharp图片处理](https://sharp.pixelplumbing.com/)
