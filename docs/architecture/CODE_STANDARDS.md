# 代码规范

## TypeScript规范

### 类型定义

```typescript
// 使用接口定义对象类型
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

// 使用类型别名定义联合类型
type Status = "loading" | "success" | "error";

// 使用枚举定义常量
enum Theme {
  Light = "light",
  Dark = "dark",
  System = "system",
}
```

### 组件类型

```typescript
// 使用Props接口
interface ButtonProps {
  variant: "primary" | "secondary";
  size: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

// 使用泛型组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}
```

## React规范

### 组件结构

```typescript
// 使用函数组件
const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // 1. Hooks
  const [state, setState] = useState();

  // 2. 计算属性
  const computed = useMemo(() => {}, []);

  // 3. 事件处理
  const handleClick = useCallback(() => {}, []);

  // 4. 副作用
  useEffect(() => {}, []);

  // 5. 渲染
  return <div>{/* JSX */}</div>;
};
```

### Hooks规范

```typescript
// 自定义Hook
const useCustomHook = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);

  const update = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return { value, update };
};
```

## 组件规范

### 基础组件结构

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ variant, children, onClick }) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

## 样式规范

### Tailwind CSS

```tsx
// 使用Tailwind类名
<div className="flex items-center justify-between p-4 bg-white shadow-md">
  <h1 className="text-2xl font-bold text-gray-800">标题</h1>
  <button className="px-4 py-2 bg-blue-500 text-white rounded-md">按钮</button>
</div>
```

### CSS Modules

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
}

.primary {
  background-color: var(--color-primary);
  color: white;
}
```

## 动画规范

### Framer Motion

```tsx
import { motion } from "framer-motion";

const AnimatedComponent = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      内容
    </motion.div>
  );
};
```

## 图片优化

### Next.js Image

```tsx
import Image from "next/image";

<Image src="/image.jpg" alt="描述" width={500} height={300} priority />;
```

## 错误处理

### 基础错误处理

```typescript
const fetchData = async () => {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("请求失败");
    return await response.json();
  } catch (error) {
    console.error("错误:", error);
    return null;
  }
};
```

## 测试规范

### 单元测试

```typescript
describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### 集成测试

```typescript
describe('UserProfile', () => {
  it('loads and displays user data', async () => {
    render(<UserProfile userId="123" />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

## 性能优化

### 代码分割

```typescript
// 动态导入
const DynamicComponent = dynamic(() => import('./Component'), {
  loading: () => <Loading />,
  ssr: false
});
```

### 错误边界

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 异步错误处理

```typescript
const fetchData = async () => {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
```
