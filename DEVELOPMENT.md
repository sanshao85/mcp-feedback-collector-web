# 🛠️ 开发文档

## 📋 项目架构

### 核心组件
- **CLI入口**: `src/cli.ts` - 命令行界面和启动逻辑
- **MCP服务器**: `src/server/mcp-server.ts` - MCP协议实现
- **Web服务器**: `src/server/web-server.ts` - HTTP/WebSocket服务
- **配置管理**: `src/config/index.ts` - 环境变量和配置
- **工具函数**: `src/utils/` - 日志、端口管理、图片处理等

### 技术栈
- **后端**: Node.js + TypeScript + Express
- **前端**: HTML5 + CSS3 + JavaScript + Socket.IO
- **协议**: MCP (Model Context Protocol)
- **图片处理**: Sharp
- **构建工具**: TypeScript Compiler

## 🧪 测试策略

### 测试类型
1. **单元测试** - Jest框架，覆盖核心功能
2. **集成测试** - MCP协议集成测试
3. **端到端测试** - 完整用户流程测试
4. **性能测试** - 并发连接和响应时间

### 测试命令
```bash
npm test              # 运行所有测试
npm run test:unit     # 单元测试
npm run test:integration # 集成测试
npm run test:coverage # 测试覆盖率
```

## 🔧 开发环境

### 环境要求
- Node.js >= 18.0.0
- TypeScript >= 5.0.0
- 支持平台: Windows, macOS, Linux

### 开发命令
```bash
npm run dev           # 开发模式
npm run build         # 构建项目
npm run clean         # 清理构建文件
npm run lint          # 代码检查
```

## 🏗️ 构建流程

### 构建步骤
1. **TypeScript编译** - 将TS文件编译为JS
2. **静态文件复制** - 复制HTML/CSS/JS到dist目录
3. **依赖打包** - 处理第三方依赖
4. **文件优化** - 压缩和优化输出文件

### 发布流程
1. **版本更新** - 更新package.json版本号
2. **构建验证** - 确保构建成功
3. **测试验证** - 运行完整测试套件
4. **NPM发布** - 发布到NPM注册表
5. **GitHub发布** - 创建GitHub Release

## 🐛 调试指南

### MCP通信调试
```bash
# 启用详细日志
DEBUG=mcp:* npm start

# 测试MCP连接
npm run test:mcp
```

### Web服务调试
```bash
# 启用Web调试
DEBUG=web:* npm start

# 测试WebSocket连接
npm run test:websocket
```

## 📊 性能监控

### 关键指标
- **响应时间** - API响应时间 < 100ms
- **并发连接** - 支持100+并发WebSocket连接
- **内存使用** - 运行时内存 < 100MB
- **CPU使用** - 正常负载下CPU < 10%

### 监控工具
- 内置性能监控器
- 实时日志记录
- 错误追踪和报告

## 🔒 安全考虑

### 安全措施
1. **输入验证** - 严格验证所有用户输入
2. **文件上传限制** - 限制文件类型和大小
3. **会话管理** - 安全的会话ID生成和验证
4. **CORS配置** - 适当的跨域资源共享设置

### 敏感信息保护
- 环境变量存储敏感配置
- .gitignore忽略敏感文件
- 不在代码中硬编码密钥

## 🚀 部署指南

### 本地部署
```bash
npm install -g mcp-feedback-collector
mcp-feedback-collector
```

### 服务器部署
```bash
# 使用PM2管理进程
pm2 start npm --name "mcp-feedback" -- start

# 使用Docker
docker build -t mcp-feedback-collector .
docker run -p 5000:5000 mcp-feedback-collector
```

### 环境变量配置
```bash
MCP_WEB_PORT=5000           # Web服务端口
MCP_LOG_LEVEL=info          # 日志级别
MCP_SESSION_TIMEOUT=3600    # 会话超时时间
MCP_MAX_FILE_SIZE=10485760  # 最大文件大小
```

## 📈 版本发布

### 版本号规则
- **Major**: 破坏性变更 (x.0.0)
- **Minor**: 新功能，向后兼容 (0.x.0)
- **Patch**: 问题修复，向后兼容 (0.0.x)

### 发布检查清单
- [ ] 版本号更新
- [ ] 构建成功
- [ ] 测试通过
- [ ] 文档更新
- [ ] CHANGELOG更新
- [ ] NPM发布
- [ ] GitHub Release

## 🤝 贡献指南

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint配置
- 编写单元测试
- 更新相关文档

### 提交规范
```
类型(范围): 简短描述

详细描述（可选）

相关Issue: #123
```

类型: feat, fix, docs, style, refactor, test, chore

---

## 📞 技术支持

如有技术问题，请：
1. 查看故障排除文档
2. 搜索已知问题
3. 创建GitHub Issue
4. 联系维护团队
