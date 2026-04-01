import { component, html, onMount } from '@nisli/core';

interface Node { x: number; y: number; r: number; hub?: boolean; ci: number; vx: number; vy: number }

const CLUSTERS = [
  { cx: 0.22, cy: 0.5, type: 'star', count: 12 },
  { cx: 0.5, cy: 0.5, type: 'multi', count: 18 },
  { cx: 0.78, cy: 0.5, type: 'mesh', count: 14 },
] as const;

const COLORS_FALLBACK = ['rgba(232,200,122,', 'rgba(91,143,168,', 'rgba(192,90,46,'];

function getThemeColors(): string[] {
  const s = getComputedStyle(document.documentElement);
  const vars = ['--color-accent-warm', '--color-accent-blue', '--color-accent-rust'];
  return vars.map((v, i) => {
    const hex = s.getPropertyValue(v).trim();
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? `rgba(${parseInt(m[1]!, 16)},${parseInt(m[2]!, 16)},${parseInt(m[3]!, 16)},` : COLORS_FALLBACK[i]!;
  });
}

function buildNodes(W: number, H: number): Node[] {
  const nodes: Node[] = [];
  for (const [ci, cl] of CLUSTERS.entries()) {
    const R = Math.min(W, H) * 0.12;
    if (cl.type === 'star') {
      nodes.push({ x: cl.cx * W, y: cl.cy * H, r: 5, hub: true, ci, vx: 0, vy: 0 });
      for (let i = 0; i < cl.count; i++) {
        const a = (i / cl.count) * Math.PI * 2;
        nodes.push({ x: cl.cx * W + Math.cos(a) * R * (0.7 + Math.random() * 0.3), y: cl.cy * H + Math.sin(a) * R * (0.7 + Math.random() * 0.3), r: 2.5, ci, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2 });
      }
    } else if (cl.type === 'multi') {
      const subs = [{ sx: cl.cx * W - R * 0.6, sy: cl.cy * H - R * 0.4 }, { sx: cl.cx * W + R * 0.6, sy: cl.cy * H - R * 0.4 }, { sx: cl.cx * W, sy: cl.cy * H + R * 0.5 }];
      for (const sh of subs) {
        nodes.push({ x: sh.sx, y: sh.sy, r: 4, hub: true, ci, vx: 0, vy: 0 });
        for (let i = 0; i < 4; i++) {
          const a = Math.random() * Math.PI * 2;
          nodes.push({ x: sh.sx + Math.cos(a) * R * 0.35, y: sh.sy + Math.sin(a) * R * 0.35, r: 2, ci, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15 });
        }
      }
    } else {
      for (let i = 0; i < cl.count; i++) {
        const a = Math.random() * Math.PI * 2, rr = Math.random() * R;
        nodes.push({ x: cl.cx * W + Math.cos(a) * rr, y: cl.cy * H + Math.sin(a) * rr, r: 2 + Math.random() * 2, ci, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 });
      }
    }
  }
  return nodes;
}

function animate(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let W = 0, H = 0, t = 0;
  let nodes: Node[] = [];
  const COLORS = getThemeColors();

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    nodes = buildNodes(W, H);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t++;
    for (const n of nodes) {
      if (!n.hub) {
        n.x += n.vx; n.y += n.vy;
        const cl = CLUSTERS[n.ci]!;
        const dx = n.x - cl.cx * W, dy = n.y - cl.cy * H;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > Math.min(W, H) * 0.15) { n.vx -= dx / dist * 0.05; n.vy -= dy / dist * 0.05; }
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!, b = nodes[j]!;
        if (a.ci !== b.ci) continue;
        const dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx * dx + dy * dy);
        const cl = CLUSTERS[a.ci]!;
        const maxDist = cl.type === 'star' ? (a.hub || b.hub ? 200 : 0) : cl.type === 'multi' ? (a.hub || b.hub ? 90 : 0) : 85;
        if (dist < maxDist) {
          ctx.strokeStyle = COLORS[a.ci] + String((1 - dist / maxDist) * 0.4) + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + (n.hub ? Math.sin(t * 0.04) * 0.5 : 0), 0, Math.PI * 2);
      ctx.fillStyle = COLORS[n.ci] + (n.hub ? '1' : '0.7') + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
  return () => window.removeEventListener('resize', resize);
}

component('nisli-topo-hero', (_props, host) => {
  onMount(() => {
    const hero = host.closest('.topo-hero') ?? host.parentElement;
    const canvas = hero?.querySelector('canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    return animate(canvas, ctx);
  });

  return html``;
});
