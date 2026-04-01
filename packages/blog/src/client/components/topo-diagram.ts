import { component, html, onMount } from '@nisli/core';

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return m ? { r: parseInt(m[1]!, 16), g: parseInt(m[2]!, 16), b: parseInt(m[3]!, 16) } : { r: 200, g: 160, b: 80 };
}

component('nisli-topo-diagram', (_props, host) => {
  onMount(() => {
    const mode = host.getAttribute('mode') ?? 'centralized';
    host.textContent = '';
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = 140 * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const W = canvas.offsetWidth, H = 140;

    const s = getComputedStyle(document.documentElement);
    const warm = s.getPropertyValue('--color-accent-warm');
    const rust = s.getPropertyValue('--color-accent-rust');
    const wRgb = hexToRgb(warm);
    const rRgb = hexToRgb(rust);

    const G = warm.trim();
    const DG = `rgba(${wRgb.r},${wRgb.g},${wRgb.b},0.25)`;
    const N = `rgba(${wRgb.r},${wRgb.g},${wRgb.b},0.85)`;
    const DG2 = `rgba(${wRgb.r},${wRgb.g},${wRgb.b},0.12)`;

    if (mode === 'centralized') {
      const hub = { x: W / 2, y: H / 2 + 5 };
      const spokes = 11, R = 42;
      const leaves = Array.from({ length: spokes }, (_, i) => ({ x: hub.x + Math.cos(i * Math.PI * 2 / spokes) * R, y: hub.y + Math.sin(i * Math.PI * 2 / spokes) * R }));
      for (const l of leaves) { ctx.strokeStyle = DG; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hub.x, hub.y); ctx.lineTo(l.x, l.y); ctx.stroke(); }
      for (const l of leaves) { ctx.beginPath(); ctx.arc(l.x, l.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = N; ctx.fill(); }
      ctx.beginPath(); ctx.arc(hub.x, hub.y, 6, 0, Math.PI * 2); ctx.fillStyle = G; ctx.fill();
    } else if (mode === 'decentralized') {
      const hubs = [{ x: W * 0.28, y: H * 0.38 }, { x: W * 0.68, y: H * 0.35 }, { x: W * 0.48, y: H * 0.72 }];
      for (const h of hubs) {
        const leaves = Array.from({ length: 5 }, (_, i) => ({ x: h.x + Math.cos(i * Math.PI * 2 / 5) * 28, y: h.y + Math.sin(i * Math.PI * 2 / 5) * 28 }));
        for (const l of leaves) { ctx.strokeStyle = DG; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(l.x, l.y); ctx.stroke(); ctx.beginPath(); ctx.arc(l.x, l.y, 2, 0, Math.PI * 2); ctx.fillStyle = N; ctx.fill(); }
        ctx.beginPath(); ctx.arc(h.x, h.y, 5, 0, Math.PI * 2); ctx.fillStyle = G; ctx.fill();
      }
      ctx.strokeStyle = DG2; ctx.lineWidth = 0.8; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(hubs[0]!.x, hubs[0]!.y); ctx.lineTo(hubs[1]!.x, hubs[1]!.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hubs[1]!.x, hubs[1]!.y); ctx.lineTo(hubs[2]!.x, hubs[2]!.y); ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const pts = Array.from({ length: 20 }, () => ({ x: 18 + Math.random() * (W - 36), y: 14 + Math.random() * (H - 28) }));
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i]!.x - pts[j]!.x, dy = pts[i]!.y - pts[j]!.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 62) { ctx.strokeStyle = `rgba(${rRgb.r},${rRgb.g},${rRgb.b},${(1 - d / 62) * 0.35})`; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(pts[i]!.x, pts[i]!.y); ctx.lineTo(pts[j]!.x, pts[j]!.y); ctx.stroke(); }
        }
      }
      for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(${rRgb.r},${rRgb.g},${rRgb.b},0.8)`; ctx.fill(); }
    }
  });

  return html``;
});
