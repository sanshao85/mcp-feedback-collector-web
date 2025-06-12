/**
 * 基础功能测试
 */

describe('基础功能', () => {
  test('应该能够运行测试', () => {
    expect(1 + 1).toBe(2);
  });

  test('应该能够导入类型', async () => {
    const { MCPError } = await import('../types/index');
    expect(MCPError).toBeDefined();
  });
});
