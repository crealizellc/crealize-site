"use client";
import React, { useRef, useEffect } from 'react';

/**
 * 18条流动线条canvas动画，分布均匀，始终与内容区同高，动画为背景涂层，支持鼠标跟随和整体画面轻微转动互动感。
 * 线条颜色、透明度、速度更淡雅，支持全局 CSS 变量。
 */
export default function AnimatedCanvasLines({ lineCount = 18 }: { lineCount?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // 鼠标位置和整体旋转
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  // 鼠标跟随和整体旋转
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    function onMove(e: MouseEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.current.x = (e.clientX - rect.left) / rect.width;
      mouse.current.y = (e.clientY - rect.top) / rect.height;
    }
    function onLeave() {
      mouse.current.x = 0.5;
      mouse.current.y = 0.5;
    }
    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    return () => {
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let running = true;
    const dpr = window.devicePixelRatio || 1;
    // 线条参数更淡雅，支持 CSS 变量
    const baseColors = [
      getComputedStyle(document.documentElement).getPropertyValue('--brand-accent') || '#b5c9d6',
      getComputedStyle(document.documentElement).getPropertyValue('--brand-gray') || '#e6e6e6',
      '#b7cbbf', '#e0e4e8', '#b5c9d6', '#e6e6e6',
    ];
    const lines = Array.from({ length: lineCount }).map((_, i) => ({
      baseY: 0.08 + (i * 0.84) / (lineCount - 1),
      amp: 14 + Math.random() * 12,
      freq: 0.7 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      color: baseColors[i % baseColors.length],
      opacity: 0.08 + Math.random() * 0.07,
      width: 1 + Math.random() * 0.7,
      speed: 0.7 + Math.random() * 0.5,
    }));

    function draw(t: number) {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      // 画布整体轻微旋转
      const rot = ((mouse.current.x - 0.5) * 0.08 + (mouse.current.y - 0.5) * -0.08);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rot);
      ctx.translate(-w / 2, -h / 2);
      lines.forEach((line, idx) => {
        ctx.save();
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8 * dpr) {
          const percent = x / w;
          // 鼠标影响振幅和相位
          const amp = line.amp * (1 + (mouse.current.y - 0.5) * 0.5);
          const phase = line.phase + (mouse.current.x - 0.5) * Math.PI;
          const baseY = line.baseY * h;
          const y =
            baseY +
            Math.sin(percent * Math.PI * 2 * line.freq + t / (1100 / line.speed) + phase + idx) *
              amp * dpr;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = line.color;
        ctx.globalAlpha = line.opacity;
        ctx.lineWidth = line.width * dpr;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      });
      ctx.restore();
    }

    let start: number | null = null;
    let rafId = 0;
    function animate(ts: number) {
      if (!running) return;
      if (!start) start = ts;
      draw(ts - start);
      rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [lineCount]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none select-none motion-okay"
      style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100%', height: '100%' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
} 