import React, { useRef, useEffect } from 'react';

const PARTICLE_COUNT = 120;
const HEIGHT = 160; // px

/**
 * AnimatedSandParticles
 * 120粒子，远近感，风速与页面滚动速度联动。
 */
const AnimatedSandParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 用于风速缓冲
  const windRef = useRef(0);
  const lastScrollY = useRef(window.scrollY);
  const lastTimestamp = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = HEIGHT + 'px';

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = HEIGHT * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = HEIGHT + 'px';
    }
    window.addEventListener('resize', resize);

    // 粒子参数，z分层
    const particles = Array.from({ length: PARTICLE_COUNT }).map(() => {
      const z = Math.random(); // 0~1，0远1近
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * HEIGHT,
        z, // 远近
        r: 0.8 + z * 2.8, // 半径 0.8~3.6
        speed: 0.2 + z * 1.2, // 速度 0.2~1.4
        alpha: 0.08 + z * 0.18, // 透明度 0.08~0.26
        color: `hsl(40, 24%, ${80 - z * 28}%)`, // 远浅近深
      };
    });

    // 风速与滚动联动
    function onScroll() {
      const now = performance.now();
      const dy = window.scrollY - lastScrollY.current;
      const dt = now - lastTimestamp.current;
      if (dt > 0) {
        const v = dy / dt; // px/ms
        // windRef.current += v * 60; // 放大系数
        windRef.current = Math.max(Math.min(v * 120, 6), -6); // 限制最大风速
      }
      lastScrollY.current = window.scrollY;
      lastTimestamp.current = now;
    }
    window.addEventListener('scroll', onScroll);

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x * dpr, p.y * dpr, p.r * dpr, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#e6e2d3';
        ctx.shadowBlur = 4 * dpr * p.z;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    function animate() {
      // 风速缓慢衰减
      windRef.current *= 0.92;
      for (const p of particles) {
        // 受风速影响，近的受影响更大
        p.x -= p.speed + windRef.current * (0.3 + 0.7 * p.z);
        if (p.x < -10) {
          p.x = window.innerWidth + 10;
          p.y = Math.random() * HEIGHT;
        }
      }
      draw();
      requestAnimationFrame(animate);
    }
    animate();

    return () => {
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
        bottom: '20vh', // 下半部1/3
        width: '100vw',
        height: `${HEIGHT}px`,
        zIndex: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        display: 'block',
        background: 'transparent',
      }}
    />
  );
};

export default AnimatedSandParticles; 