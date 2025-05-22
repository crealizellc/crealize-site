# GitHub Pages部署指南

## 部署配置

### 1. 项目配置

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "export": "next build && next export",
    "deploy": "npm run export && touch out/.nojekyll && gh-pages -d out"
  }
}
```

### 2. 依赖安装

```bash
npm install --save-dev gh-pages
```

### 3. Next.js配置

```typescript
// next.config.js
module.exports = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/your-repo-name",
  assetPrefix: "/your-repo-name/",
};
```

## 部署步骤

1. 构建项目
2. 导出静态文件
3. 部署到GitHub Pages

## 注意事项

- 确保仓库设置中启用了GitHub Pages
- 选择正确的部署分支（通常是gh-pages）
- 添加.nojekyll文件避免Jekyll处理
- 配置正确的basePath和assetPrefix

## 相关文档

- [设计系统规范](../design-system/DESIGN_SYSTEM.md)
- [动画设计规范](../design-system/ANIMATION_GUIDELINES.md)
- [组件设计规范](../design-system/COMPONENT_GUIDELINES.md)
- [页面开发计划](../development/PAGE_PLAN.md)
