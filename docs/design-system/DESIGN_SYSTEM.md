---
title: 设计系统规范
description: 定义项目的设计系统，包括色彩、字体、间距等规范
version: 1.0.0
lastUpdated: 2024-03-21
author: 设计团队
relatedDocs:
  - path: ../architecture/SYSTEM_ARCHITECTURE.md
    description: 系统架构
  - path: ./ANIMATION_GUIDELINES.md
    description: 动画设计规范
  - path: ./COMPONENT_GUIDELINES.md
    description: 组件设计规范
---

# 设计系统规范

## 更新历史

| 版本  | 日期       | 更新内容 | 更新人   |
| ----- | ---------- | -------- | -------- |
| 1.0.0 | 2024-03-21 | 初始版本 | 设计团队 |

## 1. 设计原则

- 简洁性：保持界面简洁清晰，避免视觉干扰
- 一致性：保持设计语言统一，确保用户体验连贯
- 响应式：完美适配各种设备尺寸
- 可访问性：确保所有用户都能无障碍使用

## 2. 色彩系统

### 2.1 主色调

```css
--color-primary: #12c2e9;
--color-primary-light: #c471ed;
--color-primary-dark: #f64f59;
```

### 2.2 中性色

```css
--color-neutral-100: #ffffff;
--color-neutral-200: #f5f5f5;
--color-neutral-300: #e5e5e5;
--color-neutral-400: #d4d4d4;
--color-neutral-500: #737373;
--color-neutral-600: #525252;
--color-neutral-700: #404040;
--color-neutral-800: #262626;
--color-neutral-900: #171717;
```

### 2.3 功能色

```css
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #3b82f6;
```

## 3. 字体系统

### 3.1 字体家族

```css
--font-primary: "Noto Sans JP", sans-serif;
--font-secondary: "Noto Serif JP", serif;
```

### 3.2 字号规范

```css
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
```

### 3.3 字重规范

```css
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## 4. 间距系统

### 4.1 基础间距

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
```

### 4.2 响应式间距

```css
--container-padding-sm: 1rem;
--container-padding-md: 2rem;
--container-padding-lg: 4rem;
--container-padding-xl: 5rem;
```

## 5. 响应式断点

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## 6. 圆角规范

```css
--radius-sm: 0.125rem; /* 2px */
--radius-md: 0.25rem; /* 4px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 1rem; /* 16px */
--radius-full: 9999px;
```

## 7. 阴影规范

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```
