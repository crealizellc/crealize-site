# 贡献指南

## 开发流程

1. 在GitHub上直接开发

   - 使用GitHub Codespaces或直接在GitHub上编辑
   - 避免本地开发环境配置
   - 实时预览GitHub Pages效果

2. 提交控制

   - 完成一个完整功能后再提交
   - 提交前进行充分测试
   - 确保代码质量
   - 避免频繁小改动

3. 提交规范

   - 使用清晰的提交信息
   - 每个提交专注于一个完整功能
   - 遵循语义化版本
   - 确保提交前代码可运行

4. 预览流程
   - 提交后自动触发GitHub Actions
   - 自动构建和部署到GitHub Pages
   - 通过GitHub Pages预览效果
   - 确认无误后再进行下一步开发

## 代码规范

- 使用TypeScript
- 遵循React最佳实践
- 使用Tailwind CSS
- 使用Framer Motion

## 分支管理

- main: 主分支，用于生产环境
- develop: 开发分支，用于GitHub Pages预览
- feature/\*: 特性分支，用于功能开发

## 审查流程

1. 代码审查
2. 文档审查
3. 测试审查

## 发布流程

1. 完成功能开发
2. 更新版本号
3. 更新CHANGELOG
4. 创建发布标签
5. 部署到GitHub Pages
