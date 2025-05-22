import React, { useRef, useEffect } from 'react';

const PARTICLE_COUNT = 48;
const HEIGHT = 160; // px

/**
 * AnimatedSandParticles
 * 轻量沙尘粒子动画，固定在页面下半部1/3，粒子从右向左飘，底层不影响内容。
 */
const AnimatedSandParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // 粒子参数
    const particles = Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * HEIGHT,
      r: 1.2 + Math.random() * 2.2,
      speed: 0.3 + Math.random() * 0.7,
      alpha: 0.12 + Math.random() * 0.18,
    }));

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x * dpr, p.y * dpr, p.r * dpr, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#b5b09c'; // 沙色，可调整
        ctx.shadowColor = '#e6e2d3';
        ctx.shadowBlur = 4 * dpr;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    function animate() {
      for (const p of particles) {
        p.x -= p.speed;
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