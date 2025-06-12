# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.3] - 2025-06-12

### 🆕 新增功能
- **MCP标准日志功能**: 完整实现MCP协议标准的日志功能
  - 支持8个标准日志级别：emergency, alert, critical, error, warning, notice, info, debug
  - 客户端可通过`logging/setLevel`请求动态设置日志级别
  - 自动发送`notifications/message`日志通知到MCP客户端
  - 完全符合MCP协议规范，提升开发和调试体验

### 🔧 技术改进
- **异步日志处理**: 优化MCP日志通知的异步处理机制
- **错误处理增强**: 改进Promise拒绝和异常处理，避免程序崩溃
- **防重复关闭**: 添加关闭状态标志，防止重复执行关闭流程
- **专业化输出**: 移除表情符号，提供干净专业的日志输出

### 🛠️ 问题修复
- 修复未处理的Promise拒绝导致的错误循环
- 修复重复调用服务器停止方法的问题
- 优化MCP服务器启动时序，确保日志功能正常工作
- 改进信号处理机制，提升程序稳定性

### 📚 文档更新
- 完善MCP日志功能的详细说明
- 更新API文档和使用示例
- 添加日志级别和格式的完整说明

### Technical Implementation
- 实现完整的MCP logging能力声明和处理
- 添加MCPLogLevel和MCPLogMessage类型定义
- 优化logger类的MCP集成和异步处理
- 改进Web服务器的信号处理和优雅关闭机制

## [2.1.2] - 2025-06-10

### 🔧 重大改进：智能端口冲突解决方案
- **智能端口管理**: 自动检测和解决端口冲突，无需手动干预
- **渐进式进程终止**: 优雅终止 → 强制终止 → 多种备用方案
- **自进程识别**: 能准确识别和清理自己的僵尸进程
- **跨平台兼容**: Windows/macOS/Linux统一处理机制
- **智能降级**: 无法清理时自动寻找替代端口

### 🛡️ 优雅退出处理
- **完整信号处理**: 支持SIGINT、SIGTERM、SIGBREAK（Windows）
- **异常处理**: 未捕获异常和Promise拒绝自动处理
- **客户端通知**: 关闭前通知所有连接的客户端
- **资源清理**: 确保所有资源正确释放

### 🚀 用户体验提升
- **详细日志**: 清晰的进程终止和端口释放日志
- **自动处理**: 大部分端口冲突自动解决
- **智能提示**: 明确的状态提示和错误信息
- **无缝体验**: 用户无需关心底层端口管理

## [2.1.1] - 2025-01-09

### 🐛 依赖修复
**解决问题**: NPM 包运行时出现 `Cannot find module 'engine.io-parser'` 错误

**修复内容**:
- **显式添加依赖**: 在 package.json 中明确添加 `engine.io` 和 `engine.io-parser`
- **依赖传递问题**: 解决 socket.io 间接依赖在 NPM 包中缺失的问题
- **安装稳定性**: 确保 `npx mcp-feedback-collector` 能正常运行

**技术细节**:
- 添加 `engine.io@^6.6.4` 到 dependencies
- 添加 `engine.io-parser@^5.2.3` 到 dependencies
- 重新构建和发布，确保所有依赖正确打包

**影响**:
- ✅ 修复 NPM 包安装后的运行错误
- ✅ 提升用户安装和使用成功率
- ✅ 确保 `npx -y mcp-feedback-collector@latest` 正常工作

## [2.1.0] - 2025-01-09

### 🔧 重大改进：移除 Sharp 依赖
**解决问题**: Sharp 原生模块安装困难，导致用户部署失败

**核心变更**:
- **移除 Sharp**: 完全移除 Sharp 原生模块依赖
- **引入 Jimp**: 使用纯 JavaScript 的 Jimp 库替换
- **安装简化**: 无需编译环境，支持所有平台
- **功能保持**: 保持相同的图片处理 API 接口

**技术优势**:
- ✅ **零编译**: 纯 JavaScript 实现，无需 Python/Visual Studio
- ✅ **跨平台**: 完美支持 Windows/macOS/Linux/ARM64
- ✅ **部署简单**: npm install 一步到位
- ✅ **向后兼容**: 保持相同的功能和配置

**性能说明**:
- Jimp 处理速度比 Sharp 慢 2-3 倍
- 对于反馈收集场景，性能影响可忽略
- 大幅提升用户安装成功率

**迁移指南**:
- 现有配置无需修改
- 图片处理功能完全兼容
- 建议重新安装依赖: `npm install`

### Technical Implementation
- 更新 `ImageProcessor` 类使用 Jimp 替代 Sharp
- 保持相同的 API 接口，确保向后兼容
- 优化图片处理性能和错误处理
- 更新所有相关文档和示例

## [2.0.9] - 2025-06-08

### Added
- 🎯 **智能提交确认对话框**: 用户点击"提交反馈"时弹出确认对话框
  - 🚪 **提交并关闭页面**: 适合一次性反馈，提交后3秒倒计时自动关闭标签页
  - 📝 **提交但保持页面打开**: 适合多次反馈或继续使用AI对话功能
  - ❌ **取消提交**: 支持取消操作和背景点击关闭
- 🎨 **VS Code风格对话框**: 与整体界面风格保持一致的深色主题对话框

### Changed
- 📋 **用户体验优化**: 提供更灵活的反馈提交选项
- 🔧 **类型安全**: 添加 `shouldCloseAfterSubmit` 字段到 `FeedbackData` 类型
- 📚 **文档完善**: 更新用户指南和README，详细说明新功能使用方法

### Technical Implementation
- 前端：修改 `app.js` 添加确认对话框逻辑和事件处理
- 后端：更新 `web-server.ts` 支持关闭标志传递
- 样式：在 `index.html` 中添加对话框CSS样式
- 类型：扩展 `FeedbackData` 接口支持新字段

## [2.0.8] - 2025-06-04

### Added
- 智能页面刷新机制，检测到新工作汇报内容时自动刷新页面
- 会话自动重置功能，解决会话过期问题
- 表单自动清空功能，提交反馈后自动清空输入框和图片附件
- 3秒倒计时提示，提升用户体验

### Changed
- UI简化优化：移除所有旋转动画，改为纯文字状态显示
- 自动刷新默认启用，移除用户勾选框，简化界面
- 统一所有状态显示为纯文字，符合VS Code简约风格
- 优化刷新按钮状态变化逻辑

### Fixed
- 修复提交反馈后会话失效导致的"对话过期"问题
- 修复提交按钮和刷新按钮的旋转特效
- 修复表单提交后输入框未清空的问题
- 修复版本号显示不一致的问题

### Removed
- 移除所有CSS旋转动画和视觉特效
- 移除自动刷新勾选框和相关UI元素
- 移除复杂的状态指示器

## [2.0.7] - 2025-06-03

### Added
- 固定URL模式，使用固定根路径访问
- 强制端口配置，支持指定端口不fallback
- 自动进程终止功能，解决端口占用问题
- 跨平台进程管理支持

### Changed
- 优化用户体验，提交反馈后窗口保持打开
- 改进动态刷新工作汇报功能
- 增强实时更新和状态指示

### Fixed
- 修复远程服务器环境下的URL生成问题
- 修复端口冲突和重复启动问题

## [2.0.6] - 2025-06-02

### Added
- 版本信息显示功能
- GitHub链接和源代码访问
- 动态版本获取API

### Changed
- 改进界面版本信息展示
- 优化版本管理机制

## [2.0.5] - 2025-06-02

### Changed
- 大幅扩展超时时间：从300秒扩展到60000秒（约16.7小时）
- 优化长期反馈收集场景支持
- 改进配置验证逻辑

### Added
- 灵活的超时时间配置选项
- 更好的跨时区支持

## [2.0.4] - 2025-06-02

### Added
- 快捷语功能，自动附加MCP反馈收集提示词
- 精美的勾选框设计
- 智能提示和使用说明

### Changed
- 改进反馈表单用户体验
- 优化AI响应质量

## [2.0.3] - 2025-06-02

### Added
- Web界面版本信息显示
- GitHub仓库链接
- 动态版本获取功能

### Changed
- 改进界面美观度
- 优化版本管理

## [2.0.2] - 2025-06-02

### Added
- 远程服务器环境配置支持
- 动态URL生成功能
- SessionStorage类，改进会话管理
- 自动会话清理机制

### Changed
- 增强配置系统
- 改进错误处理逻辑

### Fixed
- 修复远程环境兼容性问题
- 解决硬编码localhost问题
- 改进会话超时处理

## [2.0.0] - 2025-06-02

### Added
- 完整的collect_feedback工具实现
- 图片处理和显示功能
- AI对话集成
- 双标签页设计（工作汇报 + AI对话）
- VS Code深色主题界面
- 响应式设计支持
- 实时WebSocket连接
- 环境变量配置系统
- 完整的文档体系

### Changed
- 重构整个项目架构
- 优化MCP协议兼容性
- 改进构建和部署流程

### Fixed
- 修复MCP JSON输出格式问题
- 解决图片base64格式问题
- 修复端口冲突问题
- 解决静态文件路径问题

## [1.0.0] - 2025-01-02

### Added
- 初始版本发布
- 基础架构搭建
- Web界面实现
- MCP协议集成

---

## 版本说明

- **Major版本**: 包含破坏性变更
- **Minor版本**: 新增功能，向后兼容
- **Patch版本**: 问题修复，向后兼容

## 链接

- [项目主页](https://github.com/sanshao85/mcp-feedback-collector-web)
- [NPM包](https://www.npmjs.com/package/mcp-feedback-collector)
- [问题反馈](https://github.com/sanshao85/mcp-feedback-collector-web/issues)
- [发布说明](RELEASE_NOTES.md)
