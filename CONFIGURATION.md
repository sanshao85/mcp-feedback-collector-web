# MCP Feedback Collector 配置指南

## 📋 环境变量配置

### 必需配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `MCP_API_KEY` | AI API密钥 | `sk-xxx...` |

### 可选配置

| 变量名 | 说明 | 默认值 | 有效范围 |
|--------|------|--------|----------|
| `MCP_API_BASE_URL` | AI API基础URL | `https://api.ssopen.top` | 有效URL |
| `MCP_DEFAULT_MODEL` | 默认AI模型 | `gpt-4o-mini` | 任意字符串 |
| `MCP_WEB_PORT` | Web服务器端口 | `5000` | 1024-65535 |
| `MCP_DIALOG_TIMEOUT` | 反馈收集超时时间（秒） | `60000` | 10-60000 |
| `MCP_ENABLE_CHAT` | 启用AI对话功能 | `true` | true/false |
| `MCP_CORS_ORIGIN` | CORS允许的源 | `*` | 任意字符串 |
| `MCP_MAX_FILE_SIZE` | 最大文件大小（字节） | `10485760` | 1024-104857600 |
| `LOG_LEVEL` | 日志级别 | `info` | error/warn/info/debug |

## 🔧 MCP配置示例

### Cursor/Claude Desktop配置

```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "node",
      "args": ["D:/path/to/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "sk-zhdAJNyzSg1vAeoGhAaY5cnaMgDuvs0Q9H5LirPUuWW7hQGr",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_DIALOG_TIMEOUT": "60000"
      }
    }
  }
}
```

### NPX配置（推荐）

```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "npx",
      "args": ["mcp-feedback-collector"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_DIALOG_TIMEOUT": "60000"
      }
    }
  }
}
```

## ⏱️ 超时时间配置详解

### 环境变量方式

```bash
# 设置默认超时时间为16.7小时
export MCP_DIALOG_TIMEOUT="60000"
```

### MCP配置方式

```json
{
  "env": {
    "MCP_DIALOG_TIMEOUT": "60000"
  }
}
```

### 工具函数调用

```typescript
// 超时时间统一从环境变量读取
collect_feedback("工作汇报内容")
```

### 超时时间配置

超时时间通过环境变量 `MCP_DIALOG_TIMEOUT` 统一管理：

1. **环境变量 MCP_DIALOG_TIMEOUT** - 统一配置
2. **默认值 60000秒** - 备用默认值

### 超时时间建议

| 使用场景 | 建议时间 | 说明 |
|---------|---------|------|
| 快速测试 | 60-300秒 | 用于功能验证 |
| 日常使用 | 1800-3600秒 | 平衡用户体验 |
| 详细反馈 | 7200-14400秒 | 复杂项目评审 |
| 长期收集 | 21600-60000秒 | 持续反馈收集 |
| 演示展示 | 300-600秒 | 避免等待过久 |

## 🎯 常用配置场景

### 快速测试（短超时）

```json
{
  "env": {
    "MCP_DIALOG_TIMEOUT": "60"
  }
}
```

### 详细反馈（长超时）

```json
{
  "env": {
    "MCP_DIALOG_TIMEOUT": "1800"
  }
}
```

### 生产环境（平衡配置）

```json
{
  "env": {
    "MCP_API_KEY": "your_production_key",
    "MCP_API_BASE_URL": "https://api.ssopen.top",
    "MCP_DEFAULT_MODEL": "grok-3",
    "MCP_DIALOG_TIMEOUT": "600",
    "MCP_WEB_PORT": "5000",
    "MCP_ENABLE_CHAT": "true",
    "LOG_LEVEL": "info"
  }
}
```

## 🔍 配置验证

### 检查当前配置

```bash
npx mcp-feedback-collector config
```

### 健康检查

```bash
npx mcp-feedback-collector health
```

### 测试配置

```bash
npx mcp-feedback-collector test-feedback --timeout 120
```

## ⚠️ 注意事项

1. **超时时间范围**: 必须在10-60000秒之间
2. **端口冲突**: 确保指定的端口未被占用
3. **API密钥**: 生产环境中请妥善保管API密钥
4. **文件大小**: 图片上传受`MCP_MAX_FILE_SIZE`限制
5. **网络环境**: 确保能访问指定的API基础URL

## 🐛 故障排除

### 配置无效

```bash
# 检查配置语法
npx mcp-feedback-collector config

# 查看详细错误信息
LOG_LEVEL=debug npx mcp-feedback-collector start
```

### 超时问题

```bash
# 增加超时时间
export MCP_DIALOG_TIMEOUT="900"

# 或在MCP配置中设置
{
  "env": {
    "MCP_DIALOG_TIMEOUT": "900"
  }
}
```

### 端口冲突

```bash
# 使用不同端口
export MCP_WEB_PORT="8080"
```
