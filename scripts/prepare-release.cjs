#!/usr/bin/env node

/**
 * MCP Feedback Collector - 发布准备脚本
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 MCP Feedback Collector - 发布准备');
console.log('=====================================\n');

// 检查必要文件
const requiredFiles = [
  'package.json',
  'README.md',
  'dist/cli.js',
  'dist/index.js',
  'dist/static/index.html',
  'dist/static/app.js',
  'dist/static/style.css'
];

console.log('📋 检查必要文件...');
let missingFiles = [];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 缺失`);
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error('\n❌ 发现缺失文件，请先构建项目：npm run build');
  process.exit(1);
}

// 检查package.json配置
console.log('\n📦 检查package.json配置...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredFields = {
  name: 'mcp-feedback-collector',
  version: /^\d+\.\d+\.\d+$/,
  description: /.+/,
  main: 'dist/index.js',
  bin: { 'mcp-feedback-collector': 'dist/cli.js' },
  files: ['dist', 'README.md', 'LICENSE'],
  keywords: ['mcp', 'feedback', 'claude', 'ai'],
  author: /.+/,
  license: /.+/
};

let configErrors = [];

for (const [field, expected] of Object.entries(requiredFields)) {
  const value = packageJson[field];
  
  if (field === 'bin') {
    if (!value || !value['mcp-feedback-collector']) {
      configErrors.push(`${field}: 缺少bin配置`);
    } else {
      console.log(`✅ ${field}: ${JSON.stringify(value)}`);
    }
  } else if (field === 'files') {
    if (!Array.isArray(value) || !value.includes('dist')) {
      configErrors.push(`${field}: 必须包含dist目录`);
    } else {
      console.log(`✅ ${field}: ${JSON.stringify(value)}`);
    }
  } else if (field === 'keywords') {
    if (!Array.isArray(value) || value.length === 0) {
      configErrors.push(`${field}: 需要关键词`);
    } else {
      console.log(`✅ ${field}: ${JSON.stringify(value)}`);
    }
  } else if (expected instanceof RegExp) {
    if (!expected.test(value)) {
      configErrors.push(`${field}: 格式不正确 (${value})`);
    } else {
      console.log(`✅ ${field}: ${value}`);
    }
  } else {
    if (value !== expected) {
      configErrors.push(`${field}: 期望 "${expected}", 实际 "${value}"`);
    } else {
      console.log(`✅ ${field}: ${value}`);
    }
  }
}

if (configErrors.length > 0) {
  console.error('\n❌ package.json配置错误:');
  configErrors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

// 检查TypeScript编译
console.log('\n🔧 检查TypeScript编译...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ TypeScript编译成功');
} catch (error) {
  console.error('❌ TypeScript编译失败');
  console.error(error.stdout?.toString() || error.message);
  process.exit(1);
}

// 生成发布信息
console.log('\n📊 生成发布信息...');

const stats = {
  version: packageJson.version,
  files: requiredFiles.length,
  size: 0,
  dependencies: Object.keys(packageJson.dependencies || {}).length,
  devDependencies: Object.keys(packageJson.devDependencies || {}).length
};

// 计算包大小
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    const stat = fs.statSync(currentPath);
    
    if (stat.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    } else {
      totalSize += stat.size;
    }
  }
  
  if (fs.existsSync(dirPath)) {
    calculateSize(dirPath);
  }
  
  return totalSize;
}

stats.size = getDirectorySize('dist');

console.log(`📦 包信息:`);
console.log(`  版本: ${stats.version}`);
console.log(`  文件数: ${stats.files}`);
console.log(`  包大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`  依赖数: ${stats.dependencies}`);
console.log(`  开发依赖数: ${stats.devDependencies}`);

// 创建发布检查清单
const checklist = `
# 📋 发布前检查清单

## ✅ 自动检查项目
- [x] 必要文件存在
- [x] package.json配置正确
- [x] TypeScript编译成功

## 📝 手动检查项目
- [ ] 版本号已更新
- [ ] CHANGELOG.md已更新
- [ ] README.md内容准确
- [ ] 功能完整测试
- [ ] 文档链接有效

## 🚀 发布步骤
1. 确认所有检查项目完成
2. 运行: npm publish --dry-run
3. 检查发布内容
4. 运行: npm publish
5. 创建Git标签: git tag v${stats.version}
6. 推送标签: git push origin v${stats.version}

## 📊 包信息
- 版本: ${stats.version}
- 包大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB
- 依赖数: ${stats.dependencies}

## 🎯 发布后验证
1. 运行: npx mcp-feedback-collector@${stats.version} --version
2. 测试: npx mcp-feedback-collector@${stats.version} health
3. 测试: npx mcp-feedback-collector@${stats.version} test-feedback
`;

fs.writeFileSync('RELEASE_CHECKLIST.md', checklist);

console.log('\n✅ 发布准备完成！');
console.log('📋 发布检查清单已生成: RELEASE_CHECKLIST.md');
console.log('\n🚀 下一步:');
console.log('1. 检查 RELEASE_CHECKLIST.md');
console.log('2. 运行: npm publish --dry-run');
console.log('3. 运行: npm publish');
