# 🎯 MCP Feedback Collector

[![npm version](https://badge.fury.io/js/mcp-feedback-collector.svg)](https://www.npmjs.com/package/mcp-feedback-collector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

基于Node.js的现代化MCP反馈收集器，支持AI工作汇报和用户反馈收集。

## ✨ 特性

- 🚀 **一键启动**: 使用 `npx mcp-feedback-collector` 直接运行
- 🎨 **现代界面**: VS Code深色主题风格的Web界面
- 🔧 **MCP集成**: 完整支持Model Context Protocol
- 💬 **AI对话功能**: 集成AI助手，支持文字和图片对话
- 🖼️ **图片支持**: 完整的图片上传、处理和显示功能
- 📄 **图片转文字**: AI智能图片描述，提升客户端兼容性
- 🌐 **跨平台**: 支持Windows、macOS、Linux
- ⚡ **高性能**: 解决了Python版本的稳定性问题

## 开发过程视频教程
### 油管：https://youtu.be/Osr1OSMgzlg
### B站：https://www.bilibili.com/video/BV1PHTxzSErb/

## 🚀 快速开始

### 安装和运行

```bash
# 直接运行（推荐）
npx mcp-feedback-collector

# 或者全局安装
npm install -g mcp-feedback-collector
mcp-feedback-collector
```

### 配置环境变量

创建 `.env` 文件：

```bash
# AI API配置
MCP_API_KEY="your_api_key_here"
MCP_API_BASE_URL="https://api.ssopen.top"  # 中转站，也可使用OpenAI官方API
MCP_DEFAULT_MODEL="grok-3"

# Web服务器配置
MCP_WEB_PORT="5000"
MCP_DIALOG_TIMEOUT="60000"  # 反馈收集超时时间（秒），范围：10-60000

# 功能开关
MCP_ENABLE_CHAT="true"
MCP_ENABLE_IMAGE_TO_TEXT="true"  # 启用图片转文字功能

# URL和端口优化配置 (v2.0.7新增)
MCP_USE_FIXED_URL="true"           # 使用固定URL，不带会话参数 (默认: true)
MCP_FORCE_PORT="false"             # 强制使用指定端口 (默认: false)
MCP_KILL_PORT_PROCESS="false"      # 自动终止占用进程 (默认: false)
MCP_CLEANUP_PORT_ON_START="true"   # 启动时清理端口 (默认: true)
```

## 🔧 使用方法

### 命令行选项

```bash
# 启动服务器（默认）
mcp-feedback-collector

# 指定端口
mcp-feedback-collector --port 8080

# 仅Web模式
mcp-feedback-collector --web

# 测试collect_feedback功能
mcp-feedback-collector test-feedback

# 自定义测试内容
mcp-feedback-collector test-feedback -m "我的工作汇报" -t 120

# 健康检查
mcp-feedback-collector health

# 显示配置
mcp-feedback-collector config
```

### Claude Desktop集成

#### 方式一：NPM包运行（推荐）

在Claude Desktop，cursor的MCP配置中添加：

```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "npx",
      "args": ["-y", "mcp-feedback-collector@latest"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_WEB_PORT": "5050",
        "MCP_DIALOG_TIMEOUT": "60000",
        "MCP_ENABLE_IMAGE_TO_TEXT": "true"
      }
    }
  }
}
```

#### 方式二：源码运行（本地开发）

如果您克隆了源码并想直接运行，可以使用以下配置：

```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "node",
      "args": ["path/to/your/project/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_WEB_PORT": "5050",
        "MCP_DIALOG_TIMEOUT": "60000"
      }
    }
  }
}
```

**注意**：
- 将 `path/to/your/project` 替换为您的实际项目路径
- 确保已运行 `npm run build` 构建项目
- 使用绝对路径，例如：`d:/zhuomian/nodejsweb/dist/cli.js`

#### 方式三：TypeScript源码直接运行（开发模式）

如果您想直接运行TypeScript源码而无需构建：

```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "npx",
      "args": ["tsx", "path/to/your/project/src/cli.ts"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_WEB_PORT": "5050",
        "MCP_DIALOG_TIMEOUT": "60000",
        "NODE_ENV": "development"
      }
    }
  }
}
```

**优点**：无需构建，直接运行源码
**缺点**：启动稍慢，需要tsx依赖

#### 🚀 快速配置示例

假设您的项目位于 `d:\zhuomian\nodejsweb`，推荐配置：

```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "node",
      "args": ["d:/zhuomian/nodejsweb/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_WEB_PORT": "5050",
        "MCP_DIALOG_TIMEOUT": "60000"
      }
    }
  }
}
```

**配置步骤**：
1. 确保项目已构建：`npm run build`
2. 将上述配置添加到Cursor的MCP设置中
3. 替换 `your_api_key_here` 为您的实际API密钥
4. 重启Cursor，查看MCP服务器状态为绿色
## 在cursor规则中可以下面这样配置
“Whenever you want to ask a question, always call the MCP .

Whenever you’re about to complete a user request, call the MCP instead of simply ending the process. Keep calling MCP until the user’s feedback is empty, then end the request. mcp-feedback-collector.collect_feedback ”


⚠️ **重要提醒**:
- **不要在args中添加`--debug`参数**，这会导致JSON解析失败
- Cursor/Claude Desktop要求极其纯净的JSON输出
- 如需调试，请在命令行中单独使用：`npx mcp-feedback-collector --debug`

💡 **API服务推荐**:
- 默认配置使用 `https://api.ssopen.top` 中转站，支持多种AI模型
- 也可以使用OpenAI官方API：`https://api.openai.com/v1`
- 或其他兼容OpenAI格式的API服务

## 🆕 最新功能 (v2.1.3)

### 📋 MCP标准日志功能
- **完整日志支持**: 实现MCP协议标准的日志功能，完全符合MCP规范
- **多级别日志**: 支持debug, info, notice, warning, error, critical, alert, emergency八个标准级别
- **客户端控制**: 支持MCP客户端通过`logging/setLevel`请求动态设置日志级别
- **实时通知**: 所有日志自动通过`notifications/message`发送到MCP客户端
- **专业输出**: 移除表情符号，提供干净专业的日志输出，适合生产环境
- **异步处理**: 优化日志通知的异步处理，避免未处理的Promise拒绝错误
- **智能过滤**: 根据设置的日志级别智能过滤输出内容

### 🔧 重大改进：智能端口冲突解决方案
- **智能端口管理**: 自动检测和解决端口冲突，无需手动干预
- **渐进式进程终止**: 优雅终止 → 强制终止 → 多种备用方案
- **自进程识别**: 能准确识别和清理自己的僵尸进程
- **跨平台兼容**: Windows/macOS/Linux统一处理机制
- **智能降级**: 无法清理时自动寻找替代端口

### 🛡️ 优雅退出处理
- **完整信号处理**: 支持SIGINT、SIGTERM、SIGBREAK（Windows）
- **智能异常处理**: 优化未捕获异常和Promise拒绝的处理机制
- **防重复关闭**: 添加关闭状态标志，避免重复执行关闭流程
- **客户端通知**: 关闭前通知所有连接的客户端
- **资源清理**: 确保所有资源正确释放，避免僵尸进程

### 🚀 用户体验提升
- **详细日志**: 清晰的进程终止和端口释放日志，支持MCP标准日志输出
- **自动处理**: 大部分端口冲突自动解决，智能降级策略
- **智能提示**: 明确的状态提示和错误信息，专业化输出格式
- **无缝体验**: 用户无需关心底层端口管理和日志配置
- **开发友好**: 完整的MCP协议支持，便于集成和调试

### 📄 图片转文字功能 (v2.1.1)
- **智能图片描述**: AI自动将图片转换为详细文字描述
- **兼容性提升**: 解决部分MCP客户端无法显示图片的问题
- **用户可控**: 点击"图片转文本"按钮主动转换
- **可编辑描述**: 用户可以修改AI生成的图片描述
- **批量处理**: 支持多张图片同时转换

### 🎨 UI简化优化 (v2.1.1)
- **纯文字状态显示**: 移除旋转动画，简洁直观
- **智能自动刷新**: 默认启用，无需用户选择
- **简约设计**: 符合现代UI设计趋势

### 🔄 会话管理优化 (v2.1.1)
- **智能页面刷新**: 检测新内容时自动刷新页面
- **会话自动重置**: 解决"对话过期"问题
- **无缝体验**: 3秒倒计时提示

### 🔗 固定URL模式 (v2.0.7)
- 使用固定根路径：`http://localhost:5000`
- 支持多个并发会话
- 便于远程服务器转发

## 🛠️ MCP工具函数

### collect_feedback

收集用户对AI工作的反馈：

```typescript
// 基本调用（超时时间从环境变量读取）
collect_feedback("我已经完成了代码重构工作，主要改进了性能和可读性。")
```

### 📋 MCP日志功能

本项目完全支持MCP协议标准的日志功能，提供专业级的日志管理：

**服务器能力声明**:
- 在MCP初始化时自动声明`logging`能力
- 完全符合MCP协议规范，支持所有标准日志级别
- 提供动态日志级别控制和实时通知功能

**支持的日志级别** (按优先级排序):
- `emergency` - 紧急情况，系统不可用
- `alert` - 警报信息，需要立即处理
- `critical` - 关键错误，严重问题
- `error` - 错误信息，功能异常
- `warning` - 警告信息，潜在问题
- `notice` - 通知信息，重要事件
- `info` - 一般信息，常规操作
- `debug` - 调试信息，详细跟踪

**客户端控制**:
```json
{
  "method": "logging/setLevel",
  "params": {
    "level": "info"
  }
}
```

**日志通知格式**:
```json
{
  "method": "notifications/message",
  "params": {
    "level": "info",
    "logger": "mcp-feedback-collector",
    "data": {
      "message": "服务器启动成功",
      "port": 5000,
      "url": "http://localhost:5000"
    }
  }
}
```

**技术特性**:
- **异步处理**: 优化的异步日志处理，避免阻塞主线程
- **错误恢复**: 完善的错误处理机制，避免日志系统影响主功能
- **智能过滤**: 根据设置的级别自动过滤日志输出
- **结构化数据**: 支持复杂对象的日志记录，便于调试分析

这使得Claude Desktop、Cursor等MCP客户端能够接收和处理服务器的日志信息，大大提升了开发和调试体验。

**参数说明**:
- `work_summary` (必需): AI工作汇报内容

**超时时间配置**:
- 超时时间通过环境变量 `MCP_DIALOG_TIMEOUT` 统一配置
- 默认值为 60000 秒（约16.7小时）
- 有效范围：10-60000 秒

**功能**:
- 启动Web界面显示工作汇报
- 收集用户文字和图片反馈
- 返回结构化的反馈数据
- 自动管理服务器生命周期
- 提交反馈后自动关闭标签页（3秒倒计时）

## 🎨 界面特性

- **双标签页设计**: 工作汇报 + AI对话
- **VS Code主题**: 深色主题，专业美观
- **响应式布局**: 支持桌面和移动设备
- **实时通信**: WebSocket连接状态指示
- **多模态支持**: 文字+图片组合输入
- **智能提交确认**: 用户可选择提交后是否关闭页面
- **灵活操作**: 支持取消提交和多种交互方式

## 📋 系统要求

- **Node.js**: 18.0.0 或更高版本
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

## 🔒 安全特性

- 输入验证和文件大小限制
- CORS配置和安全头
- API密钥安全存储
- 恶意内容基础检测

## 📊 性能指标

- **启动时间**: < 3秒
- **内存使用**: < 100MB
- **响应时间**: < 2秒
- **并发连接**: 支持10个同时连接

## 🐛 故障排除

### 常见问题

1. **WebSocket连接失败**
   ```bash
   # 检查服务器状态
   mcp-feedback-collector health

   # 访问测试页面
   http://localhost:5000/test.html

   # 查看浏览器控制台错误信息
   ```

2. **端口被占用**
   ```bash
   # 检查端口使用情况
   netstat -an | grep :5000

   # 使用其他端口
   mcp-feedback-collector --port 5001
   ```

3. **API密钥错误**
   ```bash
   # 检查配置
   mcp-feedback-collector config

   # 设置环境变量
   export MCP_API_KEY="your_key_here"
   ```

4. **权限问题**
   ```bash
   # 使用npx避免全局安装权限问题
   npx mcp-feedback-collector
   ```

详细的故障排除指南请参考: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 📚 完整文档

本项目提供了完整的文档体系，请参考 [📚 文档索引](DOCUMENTATION_INDEX.md) 查找您需要的信息：

- **用户指南**: [USER_GUIDE.md](USER_GUIDE.md) - 详细使用说明
- **配置指南**: [CONFIGURATION.md](CONFIGURATION.md) - 环境变量配置
- **技术文档**: [ARCHITECTURE.md](ARCHITECTURE.md) - 系统架构设计
- **故障排除**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 问题解决方案
- **版本说明**: [RELEASE_NOTES.md](RELEASE_NOTES.md) - 版本更新记录

## 📝 开发

### 本地开发

```bash
# 克隆项目
git clone https://github.com/sanshao85/mcp-feedback-collector-web.git
cd mcp-feedback-collector-web

# 安装依赖
npm install

# 开发模式（实时编译TypeScript）
npm run dev

# 构建项目（生成dist目录）
npm run build

# 启动已构建的项目
npm start

# 测试
npm test

# 健康检查
npm start health

# 显示配置
npm start config
```

#### MCP配置测试

构建完成后，您可以使用以下配置在Cursor中测试：

```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "node",
      "args": ["您的项目路径/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_WEB_PORT": "5050",
        "MCP_DIALOG_TIMEOUT": "180"
      }
    }
  }
}
```

### 项目结构

```
src/
├── cli.ts              # CLI入口
├── index.ts            # 主入口
├── config/             # 配置管理
├── server/             # 服务器实现
├── utils/              # 工具函数
├── types/              # 类型定义
└── static/             # 静态文件
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个Pull Request

## 🔗 相关链接

- **项目主页**: [GitHub Repository](https://github.com/sanshao85/mcp-feedback-collector-web)
- **NPM包**: [mcp-feedback-collector](https://www.npmjs.com/package/mcp-feedback-collector)
- **Model Context Protocol**: [官方网站](https://modelcontextprotocol.io)
- **MCP规范**: [技术规范](https://spec.modelcontextprotocol.io)
- **Claude Desktop**: [下载地址](https://claude.ai/desktop)

## 📊 项目状态

- **当前版本**: v2.1.3
- **维护状态**: 积极维护
- **支持平台**: Windows, macOS, Linux
- **最新特性**: MCP标准日志功能
- **协议支持**: MCP v2025-03-26, v2024-11-05, v2024-10-07
- **SDK版本**: @modelcontextprotocol/sdk v1.12.1

## 📚 文档导航

- **[用户指南](USER_GUIDE.md)** - 详细使用说明和最佳实践
- **[配置文档](CONFIGURATION.md)** - 环境变量和配置选项
- **[故障排除](TROUBLESHOOTING.md)** - 常见问题和解决方案
- **[开发文档](DEVELOPMENT.md)** - 开发环境搭建和贡献指南
- **[技术文档](TECHNICAL.md)** - 系统架构和技术细节
- **[更新日志](CHANGELOG.md)** - 版本变更历史
- **[发布说明](RELEASE_NOTES.md)** - 详细的发布信息

## 感谢支持
https://api.ssopen.top/ API中转站，290+AI 大模型，官方成本七分之一，支持高并发！
