"use client";
import React, { useRef, useEffect } from 'react';

const PARTICLE_COUNT = 120;
const HEIGHT = 160; // px
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * AnimatedSandParticles
 * 120粒子，远近感，风速与页面滚动速度联动，风速大时活动范围收缩，沙粒从左到右。
 */
const AnimatedSandParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const windRef = useRef(0);
  const shrinkRef = useRef(1);
  const lastScrollY = useRef(0);
  const lastTimestamp = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    lastTimestamp.current = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(HEIGHT * dpr));
    canvas.style.width = width + 'px';
    canvas.style.height = HEIGHT + 'px';

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(HEIGHT * dpr));
      canvas.style.width = width + 'px';
      canvas.style.height = HEIGHT + 'px';
    }
    window.addEventListener('resize', resize);

    // 粒子参数，z分层
    const particles = Array.from({ length: PARTICLE_COUNT }).map(() => {
      const z = Math.random();
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * HEIGHT,
        z,
        r: 0.8 + z * 2.8,
        speed: 0.2 + z * 1.2,
        alpha: 0.08 + z * 0.18,
        color: `hsl(40, 24%, ${80 - z * 28}%)`,
      };
    });

    function onScroll() {
      const now = performance.now();
      const dy = window.scrollY - lastScrollY.current;
      const dt = now - lastTimestamp.current;
      if (dt > 0) {
        const v = dy / dt;
        windRef.current = Math.max(Math.min(v * 120, 6), -6);
      }
      lastScrollY.current = window.scrollY;
      lastTimestamp.current = now;
    }
    window.addEventListener('scroll', onScroll);

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 计算收缩系数，风速大时收缩，丝滑过渡
      const wind = windRef.current;
      const targetShrink = 1 - Math.min(Math.abs(wind) / 6, 0.5);
      shrinkRef.current = lerp(shrinkRef.current, targetShrink, 0.12);
      for (const p of particles) {
        ctx.save();
        ctx.beginPath();
        // y分布收缩到中间
        const shrink = shrinkRef.current;
        const y = (p.y - HEIGHT / 2) * shrink + HEIGHT / 2;
        ctx.arc(p.x * dpr, y * dpr, p.r * dpr, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#e6e2d3';
        ctx.shadowBlur = 4 * dpr * p.z;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    let running = true;
    let rafId = 0;
    function animate() {
      if (!running) return;
      windRef.current *= 0.92;
      for (const p of particles) {
        // 方向改为从左到右
        p.x += p.speed + windRef.current * (0.3 + 0.7 * p.z);
        if (p.x > window.innerWidth + 10) {
          p.x = -10;
          p.y = Math.random() * HEIGHT;
        }
      }
      draw();
      rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        left: 0,
        bottom: 'calc(33vh - 80px)',
        width: '100%',
        right: 0,
        overflowX: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        margin: 0,
        padding: 0,
        display: 'block',
        background: 'transparent',
      }}
    />
  );
};

export default AnimatedSandParticles; 