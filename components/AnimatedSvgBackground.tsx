import React from 'react';
import styles from './AnimatedSvgBackground.module.css';

/**
 * SVG 流动线条动画背景，仿 CLYR 官网风格
 * 只在内容区内渲染，响应式自适应
 */
export default function AnimatedSvgBackground() {
  return (
    <svg className={styles.animatedBg} viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path className={styles.wave1} d="M0 100 Q 300 200 600 100 T 1200 100" stroke="#b5c9d6" strokeWidth="2" fill="none"/>
      <path className={styles.wave2} d="M0 200 Q 300 100 600 200 T 1200 200" stroke="#b7cbbf" strokeWidth="2" fill="none"/>
      <path className={styles.wave3} d="M0 300 Q 300 400 600 300 T 1200 300" stroke="#e0e4e8" strokeWidth="2" fill="none"/>
      <path className={styles.wave4} d="M0 400 Q 300 300 600 400 T 1200 400" stroke="#e6e6e6" strokeWidth="2" fill="none"/>
    </svg>
  );
} 