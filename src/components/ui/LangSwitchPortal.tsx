'use client';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import LangSwitchFloating from './LangSwitchFloating';

export default function LangSwitchPortal() {
  useEffect(() => {
    const el = document.getElementById('__lang-switch-floating__');
    if (!el) return;
    const root = createRoot(el);
    root.render(<LangSwitchFloating />);
    return () => root.unmount();
  }, []);
  return null;
}


