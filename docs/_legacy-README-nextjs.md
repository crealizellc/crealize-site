# Crealize 项目开发代码

## 项目说明

这是 Crealize 项目的私有开发仓库，包含完整的开发代码和文档。

## 开发规范

- 遵循 `.cursorrules` 中的开发规范
- 保持代码风格一致
- 及时更新文档
- 定期提交代码

## 目录结构

```
src/                    # 源代码
├── app/               # 应用入口
├── components/        # 组件目录
├── lib/              # 工具函数
├── styles/           # 样式文件
└── types/            # 类型定义

docs/                  # 文档
├── development/      # 开发文档
├── architecture/     # 架构文档
└── design-system/    # 设计系统
```

## 开发流程

1. 在私有仓库进行开发
2. 完成功能后测试
3. 构建项目生成静态文件
4. 将稳定版本推送到公开仓库

## 注意事项

1. 保持代码安全性
2. 定期备份代码
3. 及时更新文档
4. 遵循提交规范

# 项目设计规范

## 项目结构

```
src/
  ├── app/                    # Next.js 应用路由
  ├── components/             # 组件
  │   ├── ui/                # 基础 UI 组件
  │   ├── layout/            # 布局组件
  │   ├── animations/        # 动画组件
  │   └── features/          # 功能组件
  ├── styles/                # 样式
  │   ├── themes/            # 主题
  │   ├── animations/        # 动画
  │   └── globals.css        # 全局样式
  ├── lib/                   # 工具函数
  ├── hooks/                 # 自定义 Hooks
  ├── types/                 # TypeScript 类型
  └── public/                # 静态资源

docs/
  └── design-system/         # 设计系统文档
      ├── DESIGN_SYSTEM.md   # 设计系统规范
      ├── ANIMATION_GUIDELINES.md  # 动画设计规范
      └── COMPONENT_GUIDELINES.md  # 组件设计规范

# 项目文档

## 文档结构
```

docs/
├── design-system/ # 设计系统文档
│ ├── DESIGN_SYSTEM.md # 设计系统规范
│ ├── ANIMATION_GUIDELINES.md # 动画设计规范
│ └── COMPONENT_GUIDELINES.md # 组件设计规范
├── development/ # 开发文档
│ └── PAGE_PLAN.md # 页面开发计划
├── architecture/ # 架构文档
│ ├── TECH_STACK.md # 技术栈说明
│ ├── CODE_STANDARDS.md # 代码规范
│ └── DOCUMENT_RELATIONS.md # 文档关系图
└── deployment/ # 部署文档
└── GITHUB_PAGES.md # GitHub Pages部署指南

```

## 设计规范文档
- [设计系统规范](./docs/design-system/DESIGN_SYSTEM.md)
- [动画设计规范](./docs/design-system/ANIMATION_GUIDELINES.md)
- [组件设计规范](./docs/design-system/COMPONENT_GUIDELINES.md)

## 开发指南
1. 请先阅读 `docs/design-system/` 下的设计系统文档
2. 参考 `docs/development/PAGE_PLAN.md` 进行页面开发
3. 遵循 `docs/architecture/CODE_STANDARDS.md` 的代码规范
4. 部署前查看 `docs/deployment/GITHUB_PAGES.md`

## 相关文档
- [设计系统规范](docs/design-system/DESIGN_SYSTEM.md)
- [动画设计规范](docs/design-system/ANIMATION_GUIDELINES.md)
- [组件设计规范](docs/design-system/COMPONENT_GUIDELINES.md)
- [页面开发计划](docs/development/PAGE_PLAN.md)
- [技术栈说明](docs/architecture/TECH_STACK.md)
- [代码规范](docs/architecture/CODE_STANDARDS.md)
- [GitHub Pages部署指南](docs/deployment/GITHUB_PAGES.md)

## 技术栈
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Framer Motion

## 开发流程
1. 遵循组件化开发原则
2. 使用 Git Flow 工作流
3. 编写单元测试
4. 进行代码审查
5. 持续集成/持续部署

## 性能优化
1. 使用 Next.js 的图片优化
2. 实现组件懒加载
3. 优化动画性能
4. 减少不必要的重渲染

## 可访问性
1. 遵循 WCAG 2.1 标准
2. 确保键盘可访问性
3. 提供适当的 ARIA 属性
4. 支持屏幕阅读器
```
