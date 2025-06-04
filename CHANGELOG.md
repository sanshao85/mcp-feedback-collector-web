# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
