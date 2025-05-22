import React, { useRef, useEffect } from 'react';

const AnimatedLinesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let running = true;
    const lineCount = 24;
    const color = 'rgba(0,0,0,0.18)';
    const opacity = 0.25;
    const lines = Array.from({ length: lineCount }).map((_, i) => ({
      baseY: 0.2 + (i * 0.6) / (lineCount - 1),
      amp: 24 + Math.random() * 16,
      freq: 0.7 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      speed: 1.2 + Math.random() * 0.8,
      width: 1 + Math.random() * 0.5,
    }));
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
    function draw(t: number) {
      const dpr = window.devicePixelRatio || 1;
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      lines.forEach((line, idx) => {
        ctx.save();
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8 * dpr) {
          const percent = x / w;
          const baseY = line.baseY * h;
          const y = baseY + Math.sin(percent * Math.PI * 2 * line.freq + t / (900 / line.speed) + line.phase + idx) * line.amp * dpr * 0.7;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = line.width * dpr;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      });
    }
    let start: number | null = null;
    function animate(ts: number) {
      if (!running) return;
      if (!start) start = ts;
      draw(ts - start);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return () => {
      running = false;
      window.removeEventListener('resize', resize);
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