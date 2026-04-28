"use client";

import { useEffect, useRef } from 'react';

export default function GraphAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
        const width = Math.max(1, parent.clientWidth);
        const height = Math.max(1, parent.clientHeight);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const numNodes = 54;
    const nodes = Array.from({ length: numNodes }, () => ({
      x: Math.random() * Math.max(1, canvas.clientWidth),
      y: Math.random() * Math.max(1, canvas.clientHeight),
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 1.8 + 1.6,
    }));

    const maxDistance = 150;

    let animationFrameId: number;

    const draw = (t: number) => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);

      ctx.clearRect(0, 0, width, height);

      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      });

      const time = t / 1000;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            const opacity = 1 - distance / maxDistance;
            const pulse = 0.55 + 0.45 * Math.sin(time * 2 + (i + j) * 0.15);
            const a = opacity * 0.35 * pulse;
            ctx.strokeStyle = `rgba(16, 185, 129, ${a})`;
            ctx.lineWidth = 1 + opacity * 0.6;
            ctx.stroke();
          }
        }
      }

      nodes.forEach(node => {
        const pulse = 0.55 + 0.45 * Math.sin(time * 2.5 + node.x * 0.01 + node.y * 0.01);
        const outer = node.r * (2.8 + pulse * 0.8);

        ctx.beginPath();
        ctx.arc(node.x, node.y, outer, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${0.04 + 0.06 * pulse})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${0.65 + 0.25 * pulse})`;
        ctx.fill();
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
    />
  );
}
