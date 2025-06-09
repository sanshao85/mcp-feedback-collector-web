# 🎯 MCP Feedback Collector

[![npm version](https://badge.fury.io/js/mcp-feedback-collector.svg)](https://www.npmjs.com/package/mcp-feedback-collector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

基于Node.js的MCP反馈收集器，用于充分利用Cursor额度。

## ✨ 特性

- 🎨 **现代界面**: VS Code主题风格的Web界面
- 🔧 **MCP集成**: 完整支持Model Context Protocol
- 💬 **AI对话功能**: 支持第三方AI助手，支持文字和图片对话
- 🖼️ **图片支持**: 完整的图片上传、处理和显示功能
- 🌐 **跨平台**: 支持Windows、macOS、Linux
  
## 📝 本地安装

### 源代码下载

```bash
# 克隆项目
git clone https://github.com/Mriris/mcp-feedback-collector-web.git
cd mcp-feedback-collector-web
# 安装依赖
npm install
```

复制`.env.example`为 `.env` 文件并按需修改

### Cursor规则

在Cursor规则中添加以下配置：

```text
Whenever you want to ask a question, always call the MCP .
Whenever you're about to complete a user request, call the MCP instead of simply ending the process. Keep calling MCP until the user's feedback is empty, then end the request. mcp-feedback-collector.collect_feedback
```

### MCP Tools

```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "node",
      "args": ["你的项目路径/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "api-key(可选)",
        "MCP_API_BASE_URL": "第三方api网址(可选)",
        "MCP_DEFAULT_MODEL": "模型名称(可选)",
        "MCP_WEB_PORT": "5080",
        "MCP_DIALOG_TIMEOUT": "60000"
      }
    }
  }
}
```

### 项目架构

```text
src/
├── cli.ts              # CLI入口
├── index.ts            # 主入口
├── config/             # 配置管理
├── server/             # 服务器实现
├── utils/              # 工具函数
├── types/              # 类型定义
└── static/             # 静态文件
```

### 系统要求

- **Node.js**: 18.0.0 或更高版本
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

## ⚠️ 注意事项

- 超时时间必须在10-60000秒之间
- 端口范围必须在1024-65535之间
- API密钥在生产环境中应妥善保管
- 图片上传受`MCP_MAX_FILE_SIZE`限制，10MB