# 技术栈规范

## 核心框架

- Next.js 14 (App Router)
- React 18+
- TypeScript 5+

## 样式解决方案

- Tailwind CSS (主要样式方案)
- CSS Modules (组件级样式)

## 动画系统

- Framer Motion (主要动画库)
- CSS Animations (简单动画)

## 国际化

- next-intl (基础国际化)
- Google Sheets API (翻译管理)

## 性能优化

- Next.js Image (图片优化)
- Dynamic Imports (按需加载)

## 代码质量

- ESLint
- Prettier

## 项目结构

```
src/
├── app/                    # 页面路由
├── components/            # 组件
│   ├── ui/               # 基础UI组件
│   └── layout/           # 布局组件
├── lib/                  # 工具函数
├── styles/              # 样式文件
└── types/               # TypeScript类型
```

## 开发规范

### 命名规范

- 组件：PascalCase
- 函数：camelCase
- 文件：kebab-case

### 组件规范

- 使用函数组件
- 使用TypeScript类型
- 使用Props接口

### 样式规范

- 优先使用Tailwind CSS
- 复杂样式使用CSS Modules
- 使用CSS变量管理主题

### 性能优化

- 图片使用Next.js Image
- 大组件使用动态导入
- 合理使用缓存

### 可访问性

- 添加必要的ARIA标签
- 确保键盘可访问
- 提供图片替代文本

## 开发规范

### 代码组织

```
src/
├── app/                    # 页面路由
├── components/            # 组件
│   ├── ui/               # 基础UI组件
│   ├── layout/           # 布局组件
│   ├── features/         # 功能组件
│   └── animations/       # 动画组件
├── hooks/                # 自定义Hooks
├── lib/                  # 工具函数
├── styles/              # 样式文件
├── types/               # TypeScript类型
└── utils/               # 通用工具
```

### 命名规范

- 组件：PascalCase
- 函数：camelCase
- 常量：UPPER_SNAKE_CASE
- 类型：PascalCase
- 文件：kebab-case

### 组件规范

- 使用函数组件
- 使用TypeScript类型
- 使用Props接口
- 实现错误边界
- 添加单元测试

### 样式规范

- 使用CSS Modules
- 遵循BEM命名
- 使用CSS变量
- 实现响应式设计
- 支持暗色模式

### 性能规范

- 实现代码分割
- 优化图片加载
- 使用缓存策略
- 实现懒加载
- 优化首屏加载

### 可访问性规范

- 遵循WCAG 2.1
- 实现键盘导航
- 添加ARIA标签
- 支持屏幕阅读器
- 提供替代文本

### 测试规范

- 单元测试覆盖率 > 80%
- 实现集成测试
- 添加E2E测试
- 性能测试
- 可访问性测试

## 部署流程

1. 代码审查
2. 自动化测试
3. 构建优化
4. 性能监控
5. 错误追踪

## 监控系统

- Google Analytics
- Sentry (错误追踪)
- Lighthouse (性能监控)
- Web Vitals
- 用户行为分析
