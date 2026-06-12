import React, { useEffect, useRef } from 'react';
import './MoleculeBackground.css';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Subtle molecular network animation for the home hero.
 * - Nodes (atoms) drift slowly and bounce off edges
 * - Lines (bonds) connect nodes that are close together
 * - Freezes when the user prefers reduced motion
 * Renders behind hero content at low opacity via CSS.
 */
const MoleculeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let frameId = 0;

    const NODE_COUNT = 42;
    const LINK_DISTANCE = 130;
    const CYAN = '0, 212, 255'; // --color-cyan as rgb for alpha control

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initNodes = () => {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // bonds
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            const alpha = (1 - dist / LINK_DISTANCE) * 0.18;
            ctx.strokeStyle = `rgba(${CYAN}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // atoms
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${CYAN}, 0.55)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }
      draw();
      frameId = requestAnimationFrame(step);
    };

    resize();
    initNodes();

    if (prefersReducedMotion) {
      draw(); // one static frame, no animation loop
    } else {
      step();
    }

    const handleResize = () => {
      resize();
      initNodes();
      if (prefersReducedMotion) draw();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="molecule-bg" aria-hidden="true" />;
};

export default MoleculeBackground;
