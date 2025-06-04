/**
 * MCP Feedback Collector - 类型定义
 */
// 错误类型
export class MCPError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'MCPError';
    }
}
//# sourceMappingURL=index.js.map