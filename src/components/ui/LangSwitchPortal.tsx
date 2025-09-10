'use client';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import LangSwitchFloating from './LangSwitchFloating';

export default function LangSwitchPortal() {
  useEffect(() => {
    let disposed = false;
    let root: ReturnType<typeof createRoot> | null = null;
    function tryMount() {
      if (disposed) return;
      const el = document.getElementById('__lang-switch-floating__');
      if (!el) {
        // DOM 可能尚未插入，延迟重试
        setTimeout(tryMount, 50);
        return;
        }
      if (!root) {
        root = createRoot(el);
      }
      root.render(<LangSwitchFloating />);
    }
    // 等待到浏览器空闲或加载完成再挂载，更稳妥
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(tryMount);
    } else {
      setTimeout(tryMount, 0);
    }
    return () => {
      disposed = true;
      root?.unmount();
    };
  }, []);
  return null;
}


