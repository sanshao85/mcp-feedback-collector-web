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
- 🌐 **跨平台**: 支持Windows、macOS、Linux
- ⚡ **高性能**: 解决了Python版本的稳定性问题

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
        "MCP_DIALOG_TIMEOUT": "60000"
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

## 🛠️ MCP工具函数

### collect_feedback

收集用户对AI工作的反馈：

```typescript
// 基本调用（使用默认超时时间）
collect_feedback("我已经完成了代码重构工作，主要改进了性能和可读性。")

// 自定义超时时间（秒）
collect_feedback("我已经完成了代码重构工作，主要改进了性能和可读性。", 600)
```

**参数说明**:
- `work_summary` (必需): AI工作汇报内容
- `timeout_seconds` (可选): 反馈收集超时时间，默认使用环境变量`MCP_DIALOG_TIMEOUT`的值

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
- **智能关闭**: 反馈提交后3秒倒计时自动关闭标签页

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
        "MCP_DIALOG_TIMEOUT": "60000"
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

- **当前版本**: v2.0.5
- **维护状态**: 积极维护
- **测试覆盖率**: 85%+
- **支持平台**: Windows, macOS, Linux
## 感谢支持
https://api.ssopen.top/ API中转站，290+AI 大模型，官方成本七分之一，支持高并发！
