# 动画设计规范

## 动画原则

- 流畅自然：动画要符合物理规律，感觉自然
- 突出重点：动画要引导用户注意力
- 适度使用：避免过度动画造成干扰
- 性能优先：确保动画不影响页面性能

## 页面级动画

### 1. 页面过渡

```typescript
// 页面切换动画
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
};

// 使用方式
<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={pageTransition}
>
  {children}
</motion.div>
```

### 2. 滚动动画

```typescript
// 滚动显示动画
const scrollReveal = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// 使用方式
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-100px" }}
  variants={scrollReveal}
>
  {content}
</motion.div>
```

### 3. 视差滚动

```typescript
// 视差效果
const parallaxEffect = {
  y: [0, -50],
  transition: {
    duration: 1,
    ease: "linear"
  }
};

// 使用方式
<motion.div
  style={{ y: 0 }}
  animate={parallaxEffect}
  transition={{ duration: 1, ease: "linear" }}
>
  {content}
</motion.div>
```

## 组件级动画

### 1. 悬停效果

```typescript
// 卡片悬停效果
const cardHover = {
  scale: 1.05,
  transition: { duration: 0.3 }
};

// 使用方式
<motion.div
  whileHover={cardHover}
  className="card"
>
  {content}
</motion.div>
```

### 2. 点击效果

```typescript
// 按钮点击效果
const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.1 }
};

// 使用方式
<motion.button
  whileTap={buttonTap}
  className="button"
>
  {text}
</motion.button>
```

## 动画曲线

```css
/* 常用动画曲线 */
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.68, -0.6, 0.32, 1.6);
```

## 性能优化

1. 使用 transform 和 opacity 进行动画
2. 避免动画期间触发重排
3. 使用 will-change 提示浏览器
4. 考虑使用 requestAnimationFrame

## 动画使用场景

### 首页

- 英雄区域：视差滚动 + 渐入效果
- 特性展示：滚动显示 + 交错动画
- 数据展示：数字增长动画

### 产品页

- 产品展示：3D翻转效果
- 特性列表：滚动显示
- 图片展示：视差效果

### 关于页

- 团队介绍：交错显示
- 时间线：滚动触发
- 数据统计：数字动画

### 联系页

- 表单交互：微动效
- 地图加载：渐入效果
- 联系方式：悬停效果
