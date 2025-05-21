# Crealize 项目文档

## 文档结构

### 核心文档
- [`.cursorrules`](../.cursorrules) - AI 开发规范与项目标准
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) - 项目贡献指南
- [`CHANGELOG.md`](./CHANGELOG.md) - 版本变更记录
- [`FAQ.md`](./FAQ.md) - 常见问题解答

### 开发文档
- [`development/ENVIRONMENT.md`](./development/ENVIRONMENT.md) - 开发环境配置
- [`development/SECURITY.md`](./development/SECURITY.md) - 安全规范指南

### 设计文档
- [`website-content.md`](./website-content.md) - 网站内容规划
- [`design-system/`](./design-system/) - 设计系统文档

### 部署文档
- [`deployment/`](./deployment/) - 部署相关文档

### 架构文档
- [`architecture/`](./architecture/) - 架构设计文档

## 文档关系

### 开发流程
1. 参考 `.cursorrules` 了解开发规范
2. 按照 `ENVIRONMENT.md` 配置开发环境
3. 遵循 `SECURITY.md` 确保代码安全
4. 参考 `website-content.md` 进行开发
5. 使用 `design-system/` 保持设计一致

### 文档更新
- 所有文档变更需在 `CHANGELOG.md` 中记录
- 重要决策需在相关文档中更新
- 保持文档间的引用关系准确

## 快速开始

1. 阅读 `.cursorrules` 了解项目规范
2. 按照 `ENVIRONMENT.md` 配置环境
3. 参考 `website-content.md` 开始开发
4. 遵循 `CONTRIBUTING.md` 提交代码

## 注意事项
1. 保持文档简洁，避免重复
2. 及时更新文档，保持同步
3. 确保文档间的引用关系正确
4. 遵循统一的文档格式和风格

## 项目概述
基于Next.js 14的现代化单页面应用（SPA）项目，使用TypeScript、Tailwind CSS和Framer Motion构建。本项目旨在打造一个高性能、易维护的企业级网站，集成Twitter内容展示。

## 网站内容
详细内容请参考 [网站内容规划](website-content.md)

## 技术栈
- 前端框架：Next.js 14
- 开发语言：TypeScript
- 样式方案：Tailwind CSS
- 动画系统：Framer Motion
- 部署平台：GitHub Pages
- 国际化：Google Apps Script + next-intl
- 表单处理：React Hook Form
- 图片优化：Next.js Image
- Twitter集成：Twitter API v2
- 自动化部署：GitHub Actions

## 开发方式
本项目采用GitHub Pages预览的开发方式：

1. 直接在GitHub上开发
   - 使用GitHub Codespaces
   - 或直接在GitHub上编辑
   - 避免本地环境配置

2. 提交控制
   - 完成完整功能后再提交
   - 确保代码质量
   - 避免频繁小改动

3. 预览流程
   - 提交后自动部署
   - 通过GitHub Pages预览
   - 确认无误后继续开发

## 项目结构
```
src/
├── app/                    # 应用入口
│   ├── [locale]/          # 国际化路由
│   │   └── page.tsx       # 单页面应用主入口
│   └── layout.tsx         # 布局组件
├── components/            # 组件目录
│   ├── sections/         # 页面各部分组件
│   │   ├── Home.tsx      # 首页部分
│   │   ├── Vision.tsx    # 使命与愿景部分
│   │   ├── Projects.tsx  # 创新项目部分
│   │   ├── Tech.tsx      # 技术理念部分
│   │   ├── Join.tsx      # 加入我们部分
│   │   └── Contact.tsx   # 联系我们部分
│   ├── layout/           # 布局组件
│   │   ├── Header.tsx    # 顶部导航
│   │   └── Footer.tsx    # 底部信息
│   └── ui/               # UI组件
├── lib/                  # 工具函数
│   ├── twitter/          # Twitter API集成
│   ├── i18n/            # 国际化配置
│   └── google/          # Google Apps Script集成
├── styles/              # 样式文件
│   ├── globals.css      # 全局样式
│   └── animations.css   # 动画样式
└── types/               # 类型定义
```

## 开发规范
- 使用TypeScript进行开发
- 遵循React最佳实践
- 使用Tailwind CSS进行样式开发
- 使用Framer Motion实现动画效果
- 使用Google Apps Script处理翻译
- 使用React Hook Form处理表单
- 使用Next.js Image优化图片
- 使用Twitter API v2获取内容

## 动画规范
- 页面切换动画：使用Framer Motion的AnimatePresence
- 滚动动画：使用Framer Motion的useScroll和useTransform
- 悬停效果：使用Tailwind CSS的transition
- 加载动画：使用Framer Motion的motion组件

## Twitter集成
- 使用Twitter API v2获取推文
- 支持推文列表展示
- 支持推文交互（点赞、转发）
- 支持推文搜索
- 支持推文缓存
- 支持定时更新

## 国际化方案
- 使用Google Apps Script处理翻译
- 支持日语和英语
- 支持动态切换语言
- 支持SEO友好的URL
- 支持翻译缓存
- 支持自动更新翻译

### Google Apps Script配置
1. 创建Google表单收集翻译内容
2. 使用Apps Script处理翻译数据
3. 部署为Web应用
4. 通过API获取翻译内容

### 翻译更新流程
1. 更新Google表单内容
2. 触发Apps Script更新
3. 自动更新网站翻译
4. 缓存最新翻译

## 表单处理
- 使用React Hook Form
- 支持表单验证
- 支持错误提示
- 支持提交状态管理

## 部署说明
- 使用GitHub Pages进行部署
- 自动部署通过GitHub Actions实现
- 部署前自动运行测试和构建
- 支持增量静态生成(ISR)
- 支持定时更新Twitter内容
- 支持定时更新翻译内容

## 自动化配置
- 使用GitHub Actions进行CI/CD
- 自动构建和部署
- 自动更新Twitter内容
- 自动更新翻译内容
- 自动运行测试
- 自动生成静态页面

## 相关文档
- [网站内容规划](website-content.md)
- [贡献指南](CONTRIBUTING.md)
- [更新日志](CHANGELOG.md) 