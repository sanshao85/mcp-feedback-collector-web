# 📖 MCP Feedback Collector - 用户使用指南

## 🚀 快速开始

### 1. 安装和启动

```bash
# 方式1: 直接运行（推荐）
npx mcp-feedback-collector

# 方式2: 全局安装
npm install -g mcp-feedback-collector
mcp-feedback-collector
```

### 2. 测试功能

```bash
# 测试完整的反馈收集流程
npx mcp-feedback-collector test-feedback

# 自定义测试内容
npx mcp-feedback-collector test-feedback -m "我完成了代码重构工作" -t 120
```

## 🎯 使用场景

### 场景1: Claude Desktop中使用

1. **配置MCP服务器**
   
   在Claude Desktop的配置文件中添加：
   ```json
   {
     "mcpServers": {
       "mcp-feedback-collector": {
         "command": "npx",
         "args": ["mcp-feedback-collector"],
         "env": {
           "MCP_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```

2. **调用工具函数**
   
   在Claude对话中使用：
   ```
   请使用collect_feedback工具收集用户对我刚才完成的工作的反馈。
   
   工作汇报：我已经完成了网站首页的重构，主要改进了：
   1. 响应式布局优化
   2. 加载性能提升30%
   3. 用户体验改进
   ```

3. **用户反馈流程**
   - 浏览器自动打开反馈页面
   - 查看AI的工作汇报
   - 输入文字反馈
   - 上传相关图片（可选）
   - 提交反馈

### 场景2: 独立Web模式

```bash
# 启动Web服务器
npx mcp-feedback-collector --web --port 5000

# 访问 http://localhost:5000
# 在演示模式下体验界面功能
```

### 场景3: 开发和测试

```bash
# 开发模式（热重载）
git clone <repository>
cd mcp-feedback-collector
npm install
npm run dev

# 测试模式
npm run test

# 构建生产版本
npm run build
npm start
```

## 🎨 界面功能

### 工作汇报标签页

- **AI工作汇报显示**: 自动显示AI提供的工作内容
- **反馈表单**: 
  - 文字反馈输入框
  - 图片上传功能（文件选择 + 剪贴板粘贴）
  - 图片预览和删除
  - 提交和清空按钮

### AI对话标签页

- **聊天界面**: 保持现有的AI对话功能
- **多模态支持**: 文字 + 图片组合输入
- **流式响应**: 实时显示AI回复

### 连接状态

- **实时指示器**: 右上角显示连接状态
- **自动重连**: 网络中断时自动尝试重连
- **错误提示**: 清晰的错误信息和解决建议

## 🔧 配置选项

### 环境变量配置

创建 `.env` 文件：

```bash
# AI API配置
MCP_API_KEY="your_api_key_here"
MCP_API_BASE_URL="https://api.ssopen.top"
MCP_DEFAULT_MODEL="gpt-4o-mini"

# Web服务器配置
MCP_WEB_PORT="5000"
MCP_DIALOG_TIMEOUT="300"  # 反馈收集超时时间（秒），范围：10-3600

# 功能开关
MCP_ENABLE_CHAT="true"

# 安全配置
MCP_CORS_ORIGIN="*"
MCP_MAX_FILE_SIZE="10485760"  # 10MB

# 日志配置
LOG_LEVEL="info"  # error, warn, info, debug
```

### 命令行参数

```bash
# 基本选项
--port, -p <number>     指定Web服务器端口
--web, -w              仅启动Web模式
--config, -c <path>     指定配置文件路径

# 测试选项
--message, -m <text>    测试工作汇报内容
--timeout, -t <seconds> 超时时间（秒）
```

## 📱 图片功能

### 支持的格式

- **图片格式**: JPG, PNG, GIF, WebP, BMP
- **文件大小**: 最大10MB（可配置）
- **数量限制**: 建议不超过5张

### 上传方式

1. **文件选择**: 点击"📁 选择图片"按钮
2. **剪贴板粘贴**: 点击"📋 粘贴图片"按钮
3. **拖拽上传**: 直接拖拽图片到预览区域

### 图片预览

- **缩略图显示**: 60x60像素预览
- **删除功能**: 点击"×"按钮移除
- **格式信息**: 显示文件名、类型、大小

## 🔍 故障排除

### 常见问题

1. **WebSocket连接失败**
   ```bash
   # 检查服务器状态
   npx mcp-feedback-collector health
   
   # 访问测试页面
   http://localhost:5000/test.html
   ```

2. **端口被占用**
   ```bash
   # 使用其他端口
   npx mcp-feedback-collector --port 5001
   
   # 检查端口使用情况
   netstat -an | grep :5000
   ```

3. **图片上传失败**
   - 检查文件大小是否超过限制
   - 确认文件格式是否支持
   - 检查浏览器权限设置

### 调试模式

```bash
# 启用详细日志
export LOG_LEVEL=debug
npx mcp-feedback-collector

# 查看配置信息
npx mcp-feedback-collector config

# 健康检查
npx mcp-feedback-collector health
```

## 🎯 最佳实践

### 1. 工作汇报编写

**好的工作汇报示例**:
```
我已经完成了用户登录模块的开发，主要包括：

✅ 完成的工作：
1. 用户注册和登录功能
2. 密码加密和验证
3. JWT令牌管理
4. 用户权限控制

🔧 技术实现：
- 使用bcrypt进行密码加密
- JWT令牌有效期设置为7天
- 实现了角色权限管理

📊 测试结果：
- 单元测试覆盖率95%
- 性能测试通过
- 安全扫描无高危漏洞

❓ 需要反馈的问题：
1. 登录界面的用户体验是否友好？
2. 密码强度要求是否合适？
3. 是否需要添加第三方登录？
```

### 2. 反馈收集技巧

**有效的反馈包含**:
- 具体的问题点
- 改进建议
- 相关截图或示例
- 优先级评估

### 3. 性能优化

- 定期清理过期会话
- 控制并发连接数
- 优化图片大小
- 使用适当的超时时间

## 📞 获取帮助

### 文档资源

- **README.md**: 项目概述和快速开始
- **ARCHITECTURE.md**: 技术架构详解
- **TROUBLESHOOTING.md**: 详细故障排除指南
- **DEVELOPMENT_SUMMARY.md**: 开发总结和技术细节

### 社区支持

- **GitHub Issues**: 报告问题和功能请求
- **讨论区**: 技术交流和使用心得
- **更新日志**: 版本更新和新功能介绍

### 联系方式

- **项目仓库**: https://github.com/mcp-feedback-collector/nodejs
- **问题反馈**: 通过GitHub Issues提交
- **功能建议**: 欢迎提交Pull Request

## 🔄 版本更新

### 当前版本: v2.0.0

**主要特性**:
- ✅ 完整的MCP工具函数支持
- ✅ VS Code深色主题界面
- ✅ 实时WebSocket通信
- ✅ 多模态反馈收集
- ✅ 自动化测试功能

**即将推出**:
- 📋 更多MCP工具函数
- 🎨 界面主题定制
- 📊 反馈数据分析
- 🔒 增强安全特性

### 升级指南

```bash
# 检查当前版本
npx mcp-feedback-collector --version

# 升级到最新版本
npm update -g mcp-feedback-collector

# 或者重新安装
npm uninstall -g mcp-feedback-collector
npm install -g mcp-feedback-collector@latest
```
