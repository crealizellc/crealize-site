# 组件设计规范

## 1. 组件原则

- 可复用性：组件应该易于复用
- 可维护性：组件应该易于维护和更新
- 可测试性：组件应该易于测试
- 可访问性：组件应该符合可访问性标准

## 2. 组件结构

```typescript
src/components/
  ├── ui/                # 基础 UI 组件
  │   ├── Button/
  │   ├── Input/
  │   └── Card/
  ├── layout/            # 布局组件
  │   ├── Header/
  │   ├── Footer/
  │   └── Container/
  ├── animations/        # 动画组件
  │   ├── FadeIn/
  │   ├── SlideUp/
  │   └── Scale/
  └── features/          # 功能组件
      ├── Navigation/
      ├── Forms/
      └── Modals/
```

## 3. 组件命名规范

- 使用 PascalCase 命名组件
- 使用描述性名称
- 保持命名一致性
- 避免使用缩写

## 4. 组件属性规范

- 使用 TypeScript 类型定义
- 提供默认值
- 使用语义化属性名
- 保持属性命名一致性

## 5. 组件样式规范

- 使用 CSS 变量
- 遵循设计系统
- 使用响应式设计
- 保持样式隔离

## 6. 组件文档规范

- 提供使用示例
- 说明属性用途
- 提供注意事项
- 包含可访问性说明

## 7. 组件示例

### 7.1 按钮组件

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

### 7.2 卡片组件

```typescript
interface CardProps {
  title: string;
  description: string;
  image?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  image,
  onClick
}) => {
  return (
    <div className="card" onClick={onClick}>
      {image && <img src={image} alt={title} />}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};
```

## 8. 组件测试规范

- 编写单元测试
- 测试组件渲染
- 测试组件交互
- 测试组件状态

## 9. 组件性能优化

- 使用 React.memo
- 使用 useCallback
- 使用 useMemo
- 避免不必要的重渲染
