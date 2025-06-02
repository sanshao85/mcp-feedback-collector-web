# 🔧 MCP Feedback Collector - 故障排除指南

## 📋 常见问题

### 1. MCP配置中静态文件路径错误

**症状**: 在Claude Desktop中使用MCP配置时，浏览器显示"Internal Server Error"，错误信息为"ENOENT: no such file or directory, stat 'index.html'"。

**错误示例**:
```json
{"error":"Internal Server Error","message":"ENOENT: no such file or directory, stat 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\cursor\\dist\\static\\index.html'"}
```

**原因分析**:
- ES模块中 `__dirname` 不可用，导致静态文件路径解析错误
- 在MCP模式下，工作目录可能与项目目录不同
- 相对路径在不同执行环境下会失效

**解决方案**:
1. **使用ES模块兼容的路径解析** (已在v2.0.0中修复):
   ```typescript
   import { fileURLToPath } from 'url';
   import path from 'path';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   const staticPath = path.resolve(__dirname, '../static');
   ```

2. **验证修复**:
   ```bash
   # 重新构建项目
   npm run build

   # 测试功能
   mcp-feedback-collector test-feedback
   ```

**推荐的MCP配置**:
```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "node",
      "args": ["D:/path/to/project/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your-api-key",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3"
      }
    }
  }
}
```

### 2. 端口冲突和重复启动错误

**症状**: 启动时出现 `Error: listen EADDRINUSE: address already in use :::5000` 错误，或者看到重复的启动日志。

**错误示例**:
```
Error: listen EADDRINUSE: address already in use :::5000
    at Server.setupListenHandle [as _listen2] (node:net:1937:16)
    at listenInCluster (node:net:1994:12)
    at Server.listen (node:net:2099:7)
```

**原因分析**:
- 端口检测逻辑中的测试服务器没有正确关闭
- CLI中存在重复启动逻辑
- 端口管理器的`isPortAvailable`函数有竞态条件

**解决方案** (已在v2.0.0中修复):
1. **修复端口检测逻辑**:
   ```typescript
   async isPortAvailable(port: number): Promise<boolean> {
     return new Promise((resolve) => {
       const server = createServer();

       server.listen(port, () => {
         // 端口可用，立即关闭测试服务器
         server.close(() => {
           resolve(true);
         });
       });

       server.on('error', (err: any) => {
         // 端口不可用
         resolve(false);
       });
     });
   }
   ```

2. **移除重复启动逻辑**: 删除CLI中的默认启动代码

**验证修复**:
```bash
# 重新构建
npm run build

# 测试启动
node D:/path/to/project/dist/cli.js

# 应该看到单次启动日志：
# ✅ Web服务器启动成功: http://localhost:5000
# ✅ MCP服务器启动成功
```

### 3. MCP服务器显示红色但功能正常

**症状**: 在Claude Desktop的MCP Servers面板中，mcp-feedback-collector显示为红色状态，但工具调用功能正常工作。

**现象描述**:
- MCP服务器在Claude Desktop中显示红色指示器
- 工具函数`collect_feedback`可以正常调用并返回结果
- 服务器日志显示正常启动和运行
- 可以正常处理MCP协议消息

**可能原因**:
1. **初始化流程不完整**: MCP协议要求完整的初始化握手，包括`initialize`请求和`initialized`通知
2. **连接状态监控**: Claude Desktop可能依赖特定的心跳或状态检查机制
3. **协议版本兼容性**: 不同版本的MCP协议可能有细微差异
4. **传输层状态**: stdio传输的连接状态可能没有正确报告

**解决方案** (已在v2.0.0中修复):

**关键发现**: Cursor对MCP JSON输出要求极其严格，任何非JSON内容都会导致解析失败。

1. **实现MCP模式检测**:
   ```typescript
   // 在CLI启动时立即检测MCP模式
   const isMCPMode = !process.stdin.isTTY;
   if (isMCPMode) {
     logger.disableColors();
     logger.setLevel('silent' as any);
   }
   ```

2. **完全禁用日志输出**:
   ```typescript
   // 在logger中添加silent模式支持
   private shouldLog(level: LogLevel): boolean {
     if (this.currentLevel === 'silent') {
       return false; // 完全禁用所有日志
     }
     return LOG_LEVELS[level] <= LOG_LEVELS[this.currentLevel];
   }
   ```

3. **确保纯净JSON输出**:
   - MCP模式下：只输出JSON，无任何日志、颜色代码或欢迎信息
   - 交互模式下：正常显示日志和欢迎信息

**验证步骤**:
```bash
# 测试MCP协议通信（应该只返回纯JSON）
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/cli.js

# 正确输出示例：
# {"result":{"tools":[{"name":"collect_feedback",...}]},"jsonrpc":"2.0","id":1}
```

**重要提醒**:
- ⚠️ **不要在Cursor配置中使用`--debug`参数**，这会导致日志输出污染JSON
- ✅ **Cursor要求极其纯净的JSON输出**，任何额外内容都会导致解析失败
- 🔧 **调试时使用**: `node dist/cli.js --debug` 在命令行中查看详细日志

**推荐的Cursor配置**:
```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "node",
      "args": ["D:/path/to/project/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your-api-key",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3"
      }
    }
  }
}
```

**注意事项**:
- 修复后MCP服务器应该显示绿色状态
- 如果仍显示红色，重启Cursor刷新连接状态
- 功能完全正常，可以安全使用collect_feedback工具

### 4. Cursor图片显示问题

**症状**: 用户上传的图片在Cursor聊天界面中不显示，只显示文字描述

**原因分析**:
1. **类型定义不兼容**: 自定义的MCPContent类型与MCP SDK标准类型不匹配
2. **返回格式错误**: 没有使用MCP SDK提供的标准CallToolResult类型
3. **图片格式不符合规范**: 图片数据格式不符合MCP协议要求

**解决方案** (已在v2.0.0中修复):

1. **使用MCP SDK标准类型**:
   ```typescript
   // 导入MCP SDK标准类型
   import { CallToolResult, TextContent, ImageContent } from '@modelcontextprotocol/sdk/types.js';

   // 使用标准返回类型
   async function collectFeedback(): Promise<CallToolResult> {
     return {
       content: [
         { type: 'text', text: '文字内容' },
         {
           type: 'image',
           data: 'base64-encoded-data',
           mimeType: 'image/png'
         }
       ]
     };
   }
   ```

2. **正确的图片格式**:
   ```typescript
   // 符合MCP规范的图片内容
   const imageContent: ImageContent = {
     type: 'image',
     data: img.data, // base64编码的图片数据
     mimeType: img.type // 正确的MIME类型
   };
   ```

3. **混合内容数组**:
   ```typescript
   // 支持文本和图片混合的内容数组
   const content: (TextContent | ImageContent)[] = [
     { type: 'text', text: '反馈内容：' },
     { type: 'image', data: base64Data, mimeType: 'image/png' },
     { type: 'text', text: '提交时间：2025-06-02' }
   ];
   ```

**验证步骤**:
```bash
# 测试图片显示功能
node dist/cli.js test-feedback --message "测试图片显示" --timeout 120

# 在浏览器中上传图片，然后在Cursor中查看结果
# 图片应该直接显示在聊天界面中
```

**技术细节**:
- **支持格式**: PNG, JPEG, GIF, WebP
- **数据编码**: base64字符串
- **MIME类型**: 必须正确设置（如image/png, image/jpeg）
- **显示位置**: 图片会在相应的文本描述后直接显示

**关键修复** (v2.0.0):
发现图片处理器返回的是完整的Data URL格式（`data:image/png;base64,xxx`），但MCP协议要求纯净的base64字符串。

```typescript
// 修复前（错误）- 包含Data URL前缀
data: img.data // "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."

// 修复后（正确）- 纯净base64字符串
const base64Data = img.data.replace(/^data:image\/[^;]+;base64,/, '');
data: base64Data // "iVBORw0KGgoAAAANSUhEUgAA..."
```

**注意事项**:
- 图片数据必须是纯净的base64编码（不包含Data URL前缀）
- MIME类型必须与实际图片格式匹配
- 大图片可能影响传输性能，建议适当压缩
- Cursor严格验证base64格式，任何无效字符都会导致解析失败

### 5. WebSocket连接失败

**症状**: 界面显示"连接失败"或"连接断开"

**可能原因**:
- 静态文件路径配置错误
- Socket.IO库未正确加载
- 端口被占用或防火墙阻止

**解决方案**:
```bash
# 1. 检查服务器是否正常启动
npm start health

# 2. 检查端口是否被占用
netstat -an | grep :5000

# 3. 尝试使用其他端口
npm start -- --port 5001

# 4. 检查防火墙设置
# Windows: 允许Node.js通过防火墙
# macOS/Linux: 检查iptables规则
```

**调试步骤**:
1. 打开浏览器开发者工具 (F12)
2. 查看Console标签页的错误信息
3. 查看Network标签页的请求状态
4. 访问测试页面: `http://localhost:端口/test.html`

### 2. 端口被占用

**症状**: 启动时报错 `EADDRINUSE: address already in use`

**解决方案**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <进程ID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9

# 或者使用其他端口
npm start -- --port 5001
```

### 3. 构建失败

**症状**: `npm run build` 报错

**常见错误**:
- TypeScript编译错误
- 依赖包缺失
- 文件权限问题

**解决方案**:
```bash
# 1. 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 2. 检查TypeScript配置
npx tsc --noEmit

# 3. 检查ESLint
npm run lint

# 4. 清理构建目录
npm run clean
npm run build
```

### 4. 图片上传失败

**症状**: 图片选择或粘贴后无法显示

**可能原因**:
- 文件大小超过限制
- 文件格式不支持
- 浏览器权限问题

**解决方案**:
1. 检查文件大小 (默认限制10MB)
2. 确保文件格式为常见图片格式 (jpg, png, gif, webp)
3. 检查浏览器剪贴板权限
4. 尝试使用文件选择而非粘贴

### 5. MCP工具函数调用失败

**症状**: Claude Desktop中调用collect_feedback失败

**检查清单**:
```bash
# 1. 验证MCP配置
cat ~/.config/claude-desktop/claude_desktop_config.json

# 2. 检查服务器状态
npm start health

# 3. 查看服务器日志
npm start -- --debug

# 4. 测试工具函数
npm start test-mcp
```

**MCP配置示例**:
```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "npx",
      "args": ["mcp-feedback-collector"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## 🐛 调试技巧

### 1. 启用调试日志

```bash
# 设置调试级别
export LOG_LEVEL=debug
npm start

# 或者在.env文件中设置
echo "LOG_LEVEL=debug" >> .env
```

### 2. 检查系统状态

```bash
# 健康检查
npm start health

# 显示配置
npm start config

# 检查端口状态
npm start -- --check-ports
```

### 3. 浏览器调试

1. **开发者工具**: F12 → Console/Network
2. **WebSocket连接**: 查看WS连接状态
3. **错误信息**: 查看具体错误堆栈
4. **网络请求**: 检查API调用状态

### 4. 服务器日志分析

**日志级别**:
- `ERROR`: 严重错误，需要立即处理
- `WARN`: 警告信息，可能影响功能
- `INFO`: 一般信息，正常运行状态
- `DEBUG`: 详细调试信息

**关键日志标识**:
- `✅`: 成功操作
- `❌`: 失败操作
- `🚧`: 进行中操作
- `⚠️`: 警告信息

## 🔍 性能问题

### 1. 内存使用过高

**检查方法**:
```bash
# 查看内存使用
npm start health

# 使用Node.js内置工具
node --inspect dist/cli.js
```

**优化建议**:
- 检查是否有内存泄漏
- 限制并发连接数
- 定期清理过期会话

### 2. 响应时间过长

**可能原因**:
- 网络延迟
- 服务器负载过高
- 数据库查询慢

**优化方案**:
- 启用压缩中间件
- 优化静态文件缓存
- 减少不必要的日志输出

## 📞 获取帮助

### 1. 日志收集

在报告问题时，请提供以下信息：

```bash
# 系统信息
node --version
npm --version
uname -a  # Linux/macOS
systeminfo  # Windows

# 应用信息
npm start config
npm start health

# 错误日志
npm start -- --debug > debug.log 2>&1
```

### 2. 问题报告模板

```markdown
**环境信息**:
- 操作系统: 
- Node.js版本: 
- NPM版本: 
- 应用版本: 

**问题描述**:
- 具体症状: 
- 复现步骤: 
- 预期行为: 
- 实际行为: 

**错误信息**:
```
[粘贴错误日志]
```

**已尝试的解决方案**:
- [ ] 重启服务器
- [ ] 清理缓存
- [ ] 检查配置
- [ ] 查看日志
```

### 3. 联系方式

- **GitHub Issues**: [项目仓库](https://github.com/mcp-feedback-collector/nodejs/issues)
- **文档**: [README.md](README.md)
- **更新日志**: [CHANGELOG.md](CHANGELOG.md)

## 🔄 定期维护

### 1. 日志清理

```bash
# 清理旧日志文件
find logs/ -name "*.log" -mtime +7 -delete

# 限制日志文件大小
logrotate /etc/logrotate.d/mcp-feedback-collector
```

### 2. 依赖更新

```bash
# 检查过时依赖
npm outdated

# 更新依赖
npm update

# 安全审计
npm audit
npm audit fix
```

### 3. 性能监控

```bash
# 监控内存使用
watch -n 5 'npm start health'

# 监控端口状态
netstat -tulpn | grep :5000
```
