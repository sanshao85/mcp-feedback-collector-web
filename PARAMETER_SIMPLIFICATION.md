# collect_feedback 参数简化说明

## 📋 修改概述

根据用户需求，我们移除了 `collect_feedback` 工具函数的 `timeout_seconds` 可选参数，简化了参数结构，确保超时时间统一通过环境变量管理。

## 🔄 修改前后对比

### 修改前
```typescript
// 工具函数定义
collect_feedback(work_summary: string, timeout_seconds?: number)

// 调用示例
collect_feedback("工作汇报内容")                    // 使用默认超时
collect_feedback("工作汇报内容", 600)               // 自定义超时
```

### 修改后
```typescript
// 工具函数定义
collect_feedback(work_summary: string)

// 调用示例
collect_feedback("工作汇报内容")                    // 超时时间从环境变量读取
```

## 📝 具体修改内容

### 1. 类型定义修改 (`src/types/index.ts`)
```typescript
// 修改前
export interface CollectFeedbackParams {
  work_summary: string;
  timeout_seconds?: number | undefined;
}

// 修改后
export interface CollectFeedbackParams {
  work_summary: string;
}
```

### 2. MCP工具注册修改 (`src/server/mcp-server.ts`)
```typescript
// 修改前
this.mcpServer.tool(
  'collect_feedback',
  {
    work_summary: z.string().describe('AI工作汇报内容'),
    timeout_seconds: z.number().optional().describe('反馈收集超时时间（秒），默认300秒')
  },
  async (args: { work_summary: string; timeout_seconds?: number | undefined })

// 修改后
this.mcpServer.tool(
  'collect_feedback',
  {
    work_summary: z.string().describe('AI工作汇报内容')
  },
  async (args: { work_summary: string })
```

### 3. 功能实现修改
```typescript
// 修改前
private async collectFeedback(params: CollectFeedbackParams): Promise<CallToolResult> {
  const { work_summary, timeout_seconds = this.config.dialogTimeout } = params;

// 修改后
private async collectFeedback(params: CollectFeedbackParams): Promise<CallToolResult> {
  const { work_summary } = params;
  const timeout_seconds = this.config.dialogTimeout;
```

### 4. CLI测试命令修改 (`src/cli.ts`)
- 移除了 `--timeout` 选项
- 测试参数不再包含 `timeout_seconds`
- 日志信息改为从配置读取超时时间

### 5. 文档更新
- **README.md**: 更新了参数说明和调用示例
- **CONFIGURATION.md**: 简化了超时时间配置说明
- 移除了工具函数参数优先级的说明

## 🎯 修改优势

### 1. **简化参数结构**
- AI调用时只需提供工作汇报内容
- 减少了参数复杂性和出错可能

### 2. **统一配置管理**
- 超时时间通过环境变量 `MCP_DIALOG_TIMEOUT` 统一管理
- 避免了不同调用使用不同超时时间的混乱

### 3. **更好的一致性**
- 所有反馈收集会话使用相同的超时配置
- 便于系统管理和监控

### 4. **降低使用门槛**
- AI不需要考虑超时时间设置
- 减少了错误配置的可能性

## 📊 当前参数结构

### 必需参数
| 参数名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| `work_summary` | `string` | AI工作汇报内容 | `"我已经完成了代码重构工作，主要改进了性能和可读性。"` |

### 超时时间配置
- **配置方式**: 环境变量 `MCP_DIALOG_TIMEOUT`
- **默认值**: 60000 秒（约16.7小时）
- **有效范围**: 10-60000 秒
- **配置位置**: MCP配置文件的 `env` 部分

## 🔧 使用示例

### MCP配置
```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "node",
      "args": ["path/to/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_DIALOG_TIMEOUT": "1800"
      }
    }
  }
}
```

### AI调用
```typescript
// 简单调用
collect_feedback("我已经完成了网站首页的重构，主要改进了响应式布局和加载性能。")
```

## ✅ 验证结果

通过 `echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/cli.js` 验证：

```json
{
  "result": {
    "tools": [
      {
        "name": "collect_feedback",
        "inputSchema": {
          "type": "object",
          "properties": {
            "work_summary": {
              "type": "string",
              "description": "AI工作汇报内容"
            }
          },
          "required": ["work_summary"],
          "additionalProperties": false
        }
      }
    ]
  }
}
```

确认工具函数现在只有一个必需参数 `work_summary`。

## 📅 修改日期

2025年6月3日 - 根据用户需求完成参数简化
