# 项目文档说明

> 本文档为 crealize 项目文档入口，包含开发、设计、部署等所有核心文档。
> 支持自动化检测与人工维护，相关任务和规范请参见 TODO.md、.cursorrules。

## 文档结构

- [开发任务清单](development/TODO.md)
- [项目规范 .cursorrules](../../.cursorrules)
- [部署指南](deployment/GITHUB_PAGES.md)
- [设计系统](design-system/DESIGN_SYSTEM.md)
- [页面内容规划](website-content.md)
- [常见问题 FAQ](FAQ.md)
- [贡献指南](CONTRIBUTING.md)
- [变更日志](CHANGELOG.md)

## 自动化支持说明

- 带有 `<!-- auto:... -->` 注释的任务和规范可由自动化脚本检测和生成。
- 需人工维护的内容已在注释中标明 `auto:manual`，请根据提示手动补充。

## 人工维护提示

- 文档内容、交互体验、代码风格等需人工评估和优化。
- 如遇自动化失败，请参考 [AUTO_DEV_ISSUES.md](development/AUTO_DEV_ISSUES.md) 记录并持续优化。

---

> 相关文档互链：
>
> - [开发任务清单](development/TODO.md)
> - [项目规范 .cursorrules](../../.cursorrules)
> - [部署指南](deployment/GITHUB_PAGES.md)
> - [自动化开发问题记录](development/AUTO_DEV_ISSUES.md)

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

## 设计与体验优化

- 动画、品牌色、排版、logo、交互等均对标一线品牌（如 CLYR 官网 https://www.clyr.co.jp/ ）。
- 全局采用 CSS 变量统一主色、灰色、品牌色、圆角、阴影、动画时长。
- logo 优先 SVG，保证品牌感和加载速度。
- 动画风格淡雅、克制，线条颜色柔和，避免喧宾夺主。
- 内容区左右留白充足，max-width 1024px。
- Hero 标题更大更有品牌感，分区内容分点清晰，emoji 适度点缀。
- 结构极简现代，动画和内容有机结合。

## 首页品牌动画分割线实现说明

- 首页动画分割线采用 `components/AnimatedLinesBackground.tsx` 组件实现，基于 canvas 绘制 24 根极简流动线条。
- 动画组件采用 `position: fixed; top: 50%; left: 0; transform: translateY(-50%)`，始终固定在屏幕中间，内容滚动时动画不动，品牌感极强。
- 内容区外层需加 `relative z-10`，并设置 `padding-top` 和 `padding-bottom` 均为 180px，确保内容不会被动画遮挡。
- 动画线条颜色、数量、透明度可在组件内灵活调整，默认风格参考 CLYR 官网。
- 动画组件用 `dynamic + ssr: false`，确保 Next.js 静态导出无误。
- 代码结构极简、易维护，符合团队自动化开发和极简品牌设计规范。

### 品牌字规范（免费字体方案）

- 所有"Crealize"品牌字统一使用 Montserrat SemiBold 600（Google Fonts 免费），风格现代、宽体、品牌感强。
- 通过全局CSS类 `.font-brand` 控制字体、字重、字间距等，**只允许字号在页面/组件中单独定义**。
- 字体通过 Google Fonts 在线引入，无需本地上传。
- 如需更宽体效果，可用 `font-stretch: expanded` 或 `font-variation-settings` 微调。
- 用法示例：`<span className="font-brand text-4xl">Crealize</span>`。
