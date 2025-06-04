# Cursor MCP 配置指南

## 🎯 关键发现

**Cursor对MCP JSON输出要求极其严格**，任何非JSON内容（日志、颜色代码、欢迎信息等）都会导致解析失败，表现为：
- MCP服务器显示红色状态
- JSON解析错误：`Expected ',' or ']' after array element`
- 连接失败

## ✅ 正确配置

### 推荐配置（NPM包）
```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "npx",
      "args": ["mcp-feedback-collector"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.openai.com/v1",
        "MCP_DEFAULT_MODEL": "gpt-4o-mini"
      }
    }
  }
}
```

### 本地开发配置
```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "node",
      "args": ["D:/path/to/project/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.openai.com/v1",
        "MCP_DEFAULT_MODEL": "gpt-4o-mini"
      }
    }
  }
}
```

## ❌ 错误配置

### 不要添加debug参数
```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "npx",
      "args": ["mcp-feedback-collector", "--debug"], // ❌ 这会导致JSON解析失败
      "env": {
        "MCP_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 🔧 调试方法

### 命令行测试
```bash
# 测试MCP JSON输出（应该只返回纯JSON）
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npx mcp-feedback-collector

# 正确输出示例：
# {"result":{"tools":[{"name":"collect_feedback",...}]},"jsonrpc":"2.0","id":1}
```

### 调试模式（仅用于开发）
```bash
# 在命令行中查看详细日志
npx mcp-feedback-collector --debug

# 或本地开发
node dist/cli.js --debug
```

## 🔍 故障排除

### 1. JSON解析错误
**症状**: `Expected ',' or ']' after array element in JSON`
**原因**: 输出包含非JSON内容
**解决**: 移除args中的`--debug`参数

### 2. 红色状态指示器
**症状**: MCP服务器显示红色
**原因**: JSON输出被日志污染
**解决**: 确保配置中没有debug参数，重启Cursor

### 3. 连接失败
**症状**: 无法连接到MCP服务器
**原因**: 输出格式不符合MCP协议
**解决**: 使用推荐的配置格式

## 📋 验证清单

- [ ] 配置文件格式正确
- [ ] 没有在args中添加`--debug`参数
- [ ] API密钥已正确设置
- [ ] 路径指向正确的可执行文件
- [ ] 重启Cursor后状态为绿色

## 🎯 技术原理

### MCP模式检测
```typescript
// 自动检测MCP模式
const isMCPMode = !process.stdin.isTTY;
if (isMCPMode) {
  logger.disableColors();
  logger.setLevel('silent');
}
```

### 输出模式
- **MCP模式**（管道输入）: 纯JSON输出，无任何日志
- **交互模式**（直接运行）: 正常日志和欢迎信息

这确保了在Cursor中使用时输出完全干净，在命令行调试时仍有完整的日志信息。

## 🖼️ 图片显示支持

### Cursor图片显示格式
v2.0.0已支持Cursor的图片显示功能，返回格式符合MCP规范：

```typescript
// 返回格式示例
{
  content: [
    {
      type: 'text',
      text: '收到 1 条用户反馈：'
    },
    {
      type: 'text',
      text: '文字反馈: 这是用户的文字反馈'
    },
    {
      type: 'image',
      data: 'base64-encoded-image-data',
      mimeType: 'image/png'
    }
  ]
}
```

### 支持的图片格式
- PNG (image/png)
- JPEG (image/jpeg)
- GIF (image/gif)
- WebP (image/webp)

### 图片处理流程
1. 用户在Web界面上传图片
2. 图片转换为base64格式存储
3. MCP返回时包含图片的base64数据
4. Cursor自动显示图片内容

现在用户上传的图片将直接在Cursor聊天界面中显示，无需额外操作！

## 🐛 图片显示问题解决记录

### 问题描述
v2.0.0初期版本中，用户上传的图片在Cursor中只显示文字描述，不显示实际图片内容。

### 根本原因
1. **类型不兼容**: 使用了自定义的MCPContent类型，与MCP SDK标准类型不匹配
2. **返回格式错误**: 没有使用CallToolResult标准类型
3. **SDK版本差异**: MCP TypeScript SDK的类型定义更严格

### 解决过程

#### 1. 分析MCP TypeScript SDK
```typescript
// 发现SDK中的标准类型定义
export const ImageContentSchema = z.object({
  type: z.literal("image"),
  data: z.string().base64(),
  mimeType: z.string(),
}).passthrough();

export const CallToolResultSchema = ResultSchema.extend({
  content: z.array(
    z.union([
      TextContentSchema,
      ImageContentSchema,
      AudioContentSchema,
      EmbeddedResourceSchema,
    ])).default([]),
});
```

#### 2. 修复类型定义
```typescript
// 修改前（错误）
export interface CollectFeedbackResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

// 修改后（正确）
import { CallToolResult, TextContent, ImageContent } from '@modelcontextprotocol/sdk/types.js';

async function collectFeedback(): Promise<CallToolResult> {
  return {
    content: [
      { type: 'text', text: '文字内容' },
      { type: 'image', data: base64Data, mimeType: 'image/png' }
    ]
  };
}
```

#### 3. 更新实现代码
- 导入MCP SDK标准类型
- 修改返回类型为CallToolResult
- 确保图片数据格式正确

### 验证结果
✅ 图片现在可以正确显示在Cursor聊天界面中
✅ 支持PNG、JPEG、GIF、WebP等格式
✅ 文本和图片混合显示正常

### 经验教训
1. **优先使用官方SDK类型**: 避免自定义类型与标准不兼容
2. **仔细阅读SDK文档**: 了解正确的数据格式要求
3. **及时测试验证**: 确保功能按预期工作

### 最终修复
发现最关键的问题：**base64格式验证失败**

```typescript
// 问题：图片处理器返回完整Data URL
img.data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."

// 解决：提取纯净base64字符串
const base64Data = img.data.replace(/^data:image\/[^;]+;base64,/, '');
// 结果：base64Data = "iVBORw0KGgoAAAANSUhEUgAA..."
```

**错误信息解读**:
```json
{
  "error": "[{\n \"validation\": \"base64\",\n \"code\": \"invalid_string\",\n \"message\": \"Invalid base64\",\n \"path\": [\"content\", 5, \"data\"]\n}]"
}
```
- `path: ["content", 5, "data"]`: 第6个content项的data字段
- `validation: "base64"`: base64格式验证失败
- 原因：包含了`data:image/...;base64,`前缀

### 相关文件
- `src/types/index.ts`: 类型定义
- `src/server/mcp-server.ts`: MCP服务器实现
- `src/utils/image-processor.ts`: 图片处理逻辑
- `TROUBLESHOOTING.md`: 详细故障排除指南
