import React, { useRef, useEffect } from 'react';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const AnimatedLinesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 风速联动
  const windRef = useRef(0);
  const shrinkRef = useRef(1);
  const lastScrollY = useRef(0);
  const lastTimestamp = useRef(0);

  useEffect(() => {
    // 只在客户端初始化
    lastScrollY.current = window.scrollY;
    lastTimestamp.current = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let running = true;
    const lineCount = 24;
    // 线条参数，z分层
    const lines = Array.from({ length: lineCount }).map((_, i) => {
      const z = 0.3 + 0.7 * (i / (lineCount - 1)); // 0.3~1，0远1近
      return {
        baseY: 0.2 + (i * 0.6) / (lineCount - 1),
        amp: 14 + z * 26, // 近的振幅更大
        freq: 0.7 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.7 + z * 1.1, // 近的更快
        width: 0.5 + z * 0.5, // 最细0.5px，最粗1px
        z,
        color: `rgba(60,60,60,${0.10 + z * 0.18})`, // 近的更深
      };
    });

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = 160 * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = '160px';
    }
    resize();
    window.addEventListener('resize', resize);

    // 风速与滚动联动
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

    function draw(t: number) {
      const dpr = window.devicePixelRatio || 1;
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      // 计算收缩系数，风速大时收缩，丝滑过渡
      const wind = windRef.current;
      const targetShrink = 1 - Math.min(Math.abs(wind) / 6, 0.5); // 最大收缩0.5
      shrinkRef.current = lerp(shrinkRef.current, targetShrink, 0.12);
      lines.forEach((line, idx) => {
        ctx.save();
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8 * dpr) {
          const percent = x / w;
          // 收缩时baseY向中心靠拢，amp变小
          const shrink = shrinkRef.current;
          const baseY = (line.baseY - 0.5) * shrink + 0.5;
          const amp = line.amp * shrink;
          const windPhase = wind * 0.7 * line.z;
          const y = baseY * h + Math.sin(percent * Math.PI * 2 * line.freq + t / (900 / line.speed) + line.phase + idx + windPhase) * amp * dpr * 0.7;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = line.color;
        ctx.globalAlpha = 1;
        ctx.lineWidth = line.width * dpr;
        ctx.stroke();
        ctx.restore();
      });
    }
    let start: number | null = null;
    function animate(ts: number) {
      if (!running) return;
      if (!start) start = ts;
      // 风速缓慢衰减
      windRef.current *= 0.92;
      draw(ts - start);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return () => {
      running = false;
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
        top: '20vh',
        width: '100vw',
        height: '160px',
        zIndex: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        display: 'block',
        background: 'transparent',
      }}
    />
  );
};

export default AnimatedLinesBackground; 