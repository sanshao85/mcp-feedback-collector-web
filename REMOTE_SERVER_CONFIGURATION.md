# 🌐 远程服务器配置指南

本文档详细说明如何在远程服务器环境下配置和使用MCP Feedback Collector。

## 🔍 问题分析

### 常见问题
在远程服务器环境下，用户可能遇到"会话不存在或已过期"错误，主要原因包括：

1. **硬编码的localhost**: 代码中使用localhost生成URL，在远程环境下无法访问
2. **会话持久化**: 内存中的会话在服务器重启后丢失
3. **网络配置**: 端口转发和防火墙配置问题
4. **时区和超时**: 不同时区可能导致会话超时计算错误

## ⚙️ 解决方案

### 1. 环境变量配置

在远程服务器上设置以下环境变量：

```bash
# 基础配置
export MCP_API_KEY="your_api_key_here"
export MCP_API_BASE_URL="https://api.ssopen.top"
export MCP_DEFAULT_MODEL="grok-3"
export MCP_WEB_PORT="5000"

# 远程服务器配置（新增）
export MCP_SERVER_HOST="your-server-ip-or-domain"
export MCP_SERVER_BASE_URL="http://your-server-ip-or-domain:5000"

# 超时配置
export MCP_DIALOG_TIMEOUT="600"  # 增加超时时间到10分钟
```

### 2. Cursor/Claude Desktop配置

更新MCP配置文件，添加远程服务器环境变量：

```json
{
  "mcpServers": {
    "mcp-feedback-collector": {
      "command": "npx",
      "args": ["-y", "mcp-feedback-collector"],
      "env": {
        "MCP_API_KEY": "sk-your-api-key",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_WEB_PORT": "5000",
        "MCP_SERVER_HOST": "your-server-ip",
        "MCP_SERVER_BASE_URL": "http://your-server-ip:5000",
        "MCP_DIALOG_TIMEOUT": "600"
      }
    }
  }
}
```

### 3. 服务器网络配置

#### 防火墙设置
```bash
# Ubuntu/Debian
sudo ufw allow 5000/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

#### 端口转发（如果使用SSH隧道）
```bash
# 本地端口转发到远程服务器
ssh -L 5000:localhost:5000 user@remote-server

# 或者在SSH配置中添加
# ~/.ssh/config
Host remote-server
    HostName your-server-ip
    User your-username
    LocalForward 5000 localhost:5000
```

## 🛠️ 配置示例

### 示例1：直接IP访问
```bash
# 服务器IP: 192.168.1.100
export MCP_SERVER_HOST="192.168.1.100"
export MCP_SERVER_BASE_URL="http://192.168.1.100:5000"
```

### 示例2：域名访问
```bash
# 域名: myserver.example.com
export MCP_SERVER_HOST="myserver.example.com"
export MCP_SERVER_BASE_URL="http://myserver.example.com:5000"
```

### 示例3：HTTPS配置（使用反向代理）
```bash
# 使用Nginx反向代理
export MCP_SERVER_BASE_URL="https://myserver.example.com/mcp-feedback"
```

## 🔧 故障排除

### 1. 检查配置
```bash
# 运行配置检查
npx mcp-feedback-collector config

# 检查健康状态
npx mcp-feedback-collector health
```

### 2. 测试连接
```bash
# 测试反馈功能
npx mcp-feedback-collector test-feedback -m "测试消息" -t 300

# 检查端口是否开放
telnet your-server-ip 5000
```

### 3. 查看日志
```bash
# 启用调试模式
export LOG_LEVEL="debug"
npx mcp-feedback-collector --debug
```

### 4. 常见错误解决

#### "会话不存在或已过期"
- 检查服务器时间同步
- 增加超时时间
- 确认URL配置正确

#### "连接被拒绝"
- 检查防火墙设置
- 确认端口转发配置
- 验证服务器IP/域名

#### "无法访问反馈页面"
- 检查MCP_SERVER_BASE_URL配置
- 确认浏览器可以访问服务器
- 检查网络连接

## 📋 最佳实践

### 1. 安全配置
- 使用HTTPS（推荐配置反向代理）
- 限制访问IP范围
- 定期更新API密钥

### 2. 性能优化
- 增加超时时间以适应网络延迟
- 使用CDN加速静态资源
- 配置适当的会话清理间隔

### 3. 监控和维护
- 定期检查服务器状态
- 监控会话数量和内存使用
- 设置日志轮转

## 🔄 会话持久化改进

v2.0.1版本引入了新的会话存储机制：

### 特性
- **自动清理**: 定期清理过期会话
- **内存优化**: 更高效的会话管理
- **错误恢复**: 更好的错误处理和恢复机制

### 配置
```bash
# 会话清理间隔（毫秒）
export MCP_SESSION_CLEANUP_INTERVAL="60000"  # 1分钟

# 会话超时时间（秒）
export MCP_DIALOG_TIMEOUT="600"  # 10分钟
```

## 📞 技术支持

如果遇到问题，请提供以下信息：

1. 服务器操作系统和版本
2. 网络配置（IP、端口、防火墙）
3. 环境变量配置
4. 错误日志和调试信息
5. 浏览器控制台错误

## 🔗 相关文档

- [配置指南](CONFIGURATION.md)
- [故障排除](TROUBLESHOOTING.md)
- [架构文档](ARCHITECTURE.md)
- [用户指南](USER_GUIDE.md)
