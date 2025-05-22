# 开发环境配置指南

## 环境要求

### 基础环境

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git >= 2.30.0
- VS Code 最新版本

### 推荐 VS Code 插件

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin
- GitLens
- Error Lens

## 开发环境设置

### 1. 克隆项目

```bash
git clone [项目地址]
cd crealize
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 环境变量配置

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TWITTER_API_KEY=your_twitter_api_key
NEXT_PUBLIC_GOOGLE_SCRIPT_ID=your_google_script_id
```

### 4. 开发服务器

```bash
pnpm dev
```

## 开发工具配置

### ESLint 配置

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "react/no-unescaped-entities": "off"
  }
}
```

### Prettier 配置

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

### Git 配置

```bash
git config --local core.autocrlf input
git config --local core.safecrlf true
```

## 开发流程

### 1. 分支管理

- main: 主分支
- develop: 开发分支
- feature/\*: 功能分支
- bugfix/\*: 修复分支

### 2. 提交规范

```bash
feat: 新功能
fix: 修复
docs: 文档
style: 格式
refactor: 重构
test: 测试
chore: 构建
```

### 3. 代码审查

- 使用 GitHub Pull Request
- 确保 CI 通过
- 代码审查通过
- 合并到 develop 分支

## 调试工具

### 浏览器开发工具

- React Developer Tools
- Redux DevTools
- Network 面板
- Performance 面板

### 性能分析

- Lighthouse
- Web Vitals
- Performance Monitor

## 常见问题

### 1. 依赖安装失败

```bash
pnpm store prune
pnpm install
```

### 2. 构建错误

```bash
pnpm clean
pnpm install
pnpm build
```

### 3. 开发服务器问题

```bash
pnpm dev --turbo
```

## 注意事项

1. 保持开发环境更新
2. 定期清理缓存
3. 及时提交代码
4. 保持文档同步
