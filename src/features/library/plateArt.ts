import { mulberry32 } from '../../lib/random.ts';
import type { Plate } from './catalog.ts';

/**
 * Generative plate drawings, as data. Everything is ink on paper (or paper on
 * ink): halftone, film, patterns, guilloché, engraving. Drawn in a 400×500
 * (4:5) box. `detail` lowers density for thumbnails.
 */

export type PlateOp =
  | { op: 'rect'; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; sw?: number; opacity?: number; rx?: number }
  | { op: 'path'; d: string; fill?: string; stroke?: string; sw?: number; opacity?: number; dash?: string; cap?: 'round' | 'butt' }
  | { op: 'circle'; cx: number; cy: number; r: number; fill?: string; stroke?: string; sw?: number; opacity?: number }
  | { op: 'text'; x: number; y: number; text: string; size: number; family: 'mono' | 'serif' | 'sans'; fill: string; anchor?: 'start' | 'middle' | 'end'; rotate?: number; opacity?: number; spacing?: number };

export interface PlateDrawing {
  background: 'paper' | 'ink';
  ops: PlateOp[];
}

export const PLATE_W = 400;
export const PLATE_H = 500;

const INK = '#0A0A0A';
const PAPER = '#F5F1E8';
const G7 = '#2A2927';
const G5 = '#57544F';
const G3 = '#A29D94';
const f = (n: number) => (Math.round(n * 10) / 10).toString();

function dot(cx: number, cy: number, r: number): string {
  if (r <= 0.15) return '';
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`;
}

function gauss(dx: number, dy: number, rx: number, ry: number): number {
  const q = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
  return Math.exp(-q * 1.6);
}

function halftone(p: Plate, rand: () => number, detail: number): PlateDrawing {
  const coarse = p.seed > 120;
  const step = (coarse ? 24 : 15) / Math.max(detail, 0.85);
  const hx = 200 + (rand() - 0.5) * 40;
  let d = '';
  for (let y = step / 2; y < PLATE_H; y += step) {
    for (let x = step / 2; x < PLATE_W; x += step) {
      const head = gauss(x - hx, y - 190, 88, 108);
      const shoulders = gauss(x - 200, y - 500, 210, 150);
      const shape = Math.max(head, shoulders);
      const light = 0.55 + 0.45 * (x / PLATE_W);
      const tone = Math.min(1, 0.08 + shape * 0.85 * light + (rand() - 0.5) * 0.06);
      d += dot(x, y, (step / 2) * Math.sqrt(tone) * 0.98);
    }
  }
  return { background: 'paper', ops: [{ op: 'path', d, fill: INK }] };
}

function contact(p: Plate, rand: () => number): PlateDrawing {
  const ops: PlateOp[] = [{ op: 'rect', x: 0, y: 0, w: PLATE_W, h: PLATE_H, fill: '#141413' }];
  const cols = 3;
  const rows = 4;
  const fw = 108;
  const fh = 80;
  const gx = (PLATE_W - cols * fw) / (cols + 1);
  const picked = Math.floor(rand() * 12);
  const rejected = (picked + 5) % 12;
  for (let i = 0; i < cols * rows; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = gx + c * (fw + gx);
    const y = 46 + r * (fh + 34);
    const horizon = y + fh * (0.4 + rand() * 0.35);
    ops.push({ op: 'rect', x, y, w: fw, h: fh, fill: G7 });
    ops.push({ op: 'rect', x, y: horizon, w: fw, h: y + fh - horizon, fill: '#3E3C39' });
    ops.push({ op: 'circle', cx: x + fw * (0.2 + rand() * 0.6), cy: horizon - 8 - rand() * 20, r: 6 + rand() * 9, fill: G3, opacity: 0.85 });
    ops.push({ op: 'text', x: x + 2, y: y + fh + 13, text: `${p.seed % 9}${i + 1}`.padStart(3, '0'), size: 8, family: 'mono', fill: G3 });
    if (i === picked) ops.push({ op: 'path', d: `M${x - 6} ${y + fh / 2}a${fw / 2 + 6} ${fh / 2 + 8} 0 1 0 ${fw + 12} 0a${fw / 2 + 6} ${fh / 2 + 8} 0 1 0 ${-fw - 12} 0`, stroke: PAPER, sw: 2, opacity: 0.9 });
    if (i === rejected) ops.push({ op: 'path', d: `M${x + 8} ${y + 8}L${x + fw - 8} ${y + fh - 8}M${x + fw - 8} ${y + 8}L${x + 8} ${y + fh - 8}`, stroke: PAPER, sw: 1.6, opacity: 0.8 });
  }
  ops.push({ op: 'text', x: 18, y: 26, text: 'ROLO · PROVA DE CONTATO', size: 9, family: 'mono', fill: G3, spacing: 1.5 });
  return { background: 'ink', ops };
}

function filmstrip(p: Plate, rand: () => number): PlateDrawing {
  const ops: PlateOp[] = [{ op: 'rect', x: 92, y: 0, w: 216, h: PLATE_H, fill: '#121211' }];
  let holes = '';
  for (let y = 6; y < PLATE_H; y += 20) {
    holes += `M100 ${y}h12v10h-12zM288 ${y}h12v10h-12z`;
  }
  ops.push({ op: 'path', d: holes, fill: PAPER, opacity: 0.88 });
  const night = p.seed > 140;
  for (let i = 0; i < 4; i++) {
    const y = 14 + i * 120;
    ops.push({ op: 'rect', x: 122, y, w: 156, h: 108, fill: night ? '#1B1A19' : '#4A4744' });
    const bars = 3 + Math.floor(rand() * 4);
    for (let b = 0; b < bars; b++) {
      const bx = 122 + rand() * 140;
      ops.push({ op: 'rect', x: bx, y: y + rand() * 30, w: 4 + rand() * 18, h: 50 + rand() * 58, fill: night ? '#3D3B38' : '#8A867F', opacity: 0.9 });
    }
    if (night) ops.push({ op: 'circle', cx: 140 + rand() * 120, cy: y + 30 + rand() * 40, r: 3 + rand() * 4, fill: PAPER, opacity: 0.9 });
    ops.push({ op: 'text', x: 316, y: y + 60, text: `${i + 11}`, size: 9, family: 'mono', fill: G5, rotate: 90 });
  }
  ops.push({ op: 'text', x: 60, y: 250, text: 'VV · 35 MM · SAFETY', size: 9, family: 'mono', fill: G5, rotate: -90, anchor: 'middle', spacing: 2 });
  return { background: 'paper', ops };
}

function aspect(p: Plate): PlateDrawing {
  const ratios = p.seed > 150 ? [1.33, 1.85, 2.39] : [1.37, 1.66, 1.85, 2.39];
  const ops: PlateOp[] = [];
  const w = 340;
  ratios.forEach((r, i) => {
    const h = w / r;
    const y = 250 - h / 2;
    ops.push({ op: 'rect', x: 30, y, w, h, stroke: INK, sw: i === ratios.length - 1 ? 1.6 : 0.8, fill: i === ratios.length - 1 ? INK : undefined, opacity: i === ratios.length - 1 ? 0.9 : 1 });
    ops.push({ op: 'text', x: 34, y: y - 6, text: r.toFixed(2), size: 10, family: 'mono', fill: G5 });
  });
  ops.push({ op: 'path', d: 'M200 60V440M20 250H380', stroke: G3, sw: 0.6, dash: '3 4' });
  ops.push({ op: 'circle', cx: 200, cy: 250, r: 10, stroke: PAPER, sw: 1 });
  return { background: 'paper', ops };
}

function pattern(p: Plate): PlateDrawing {
  const sleeve = p.seed > 160;
  const piece = sleeve
    ? 'M120 90 C 170 60, 250 60, 290 95 L 330 420 C 260 440, 160 440, 90 420 Z'
    : 'M110 70 L 220 60 C 240 110, 280 130, 300 132 L 320 440 L 90 440 L 100 260 C 70 220, 80 140, 110 70 Z';
  const ops: PlateOp[] = [
    { op: 'path', d: piece, stroke: INK, sw: 1.6, fill: 'none' },
    { op: 'path', d: piece, stroke: G5, sw: 0.8, dash: '6 4', fill: 'none', opacity: 0.9 },
    { op: 'path', d: 'M205 150V380M205 150l-6 12h12zM205 380l-6 -12h12z', stroke: INK, sw: 1, fill: INK },
    { op: 'text', x: 214, y: 270, text: 'FIO', size: 10, family: 'mono', fill: INK, rotate: 90, spacing: 2 },
    { op: 'text', x: 200, y: 470, text: sleeve ? 'MANGA — CORTE 2X' : 'FRENTE — CORTE 2X', size: 11, family: 'mono', fill: INK, anchor: 'middle', spacing: 2 },
    { op: 'path', d: 'M100 300l10 -5v10zM311 300l-10 -5v10z', fill: INK },
    { op: 'path', d: sleeve ? 'M150 300 L170 360 L190 300' : 'M160 440 L180 360 L200 440', stroke: INK, sw: 0.9, fill: 'none' },
  ];
  return { background: 'paper', ops };
}

function drape(p: Plate, rand: () => number): PlateDrawing {
  const silk = p.seed > 170;
  let d = '';
  const n = silk ? 34 : 24;
  for (let i = 0; i < n; i++) {
    const x0 = 30 + (i / (n - 1)) * 340;
    const sway = (rand() - 0.5) * (silk ? 120 : 70);
    const c1 = x0 + sway;
    const c2 = x0 - sway * 0.6 + (rand() - 0.5) * 40;
    const x3 = x0 + (rand() - 0.5) * 30;
    d += `M${f(x0)} 20C${f(c1)} 170 ${f(c2)} 330 ${f(x3)} 480`;
  }
  return {
    background: 'paper',
    ops: [
      { op: 'path', d, stroke: INK, sw: silk ? 0.7 : 1.2, fill: 'none', opacity: 0.9 },
      { op: 'path', d: 'M20 20H380', stroke: INK, sw: 2.4 },
    ],
  };
}

function moire(p: Plate): PlateDrawing {
  const lines = p.seed > 180;
  let a = '';
  let b = '';
  if (lines) {
    for (let i = -40; i < 80; i++) {
      a += `M${i * 8} 0L${i * 8 + 140} ${PLATE_H}`;
      b += `M${i * 8} 0L${i * 8 + 190} ${PLATE_H}`;
    }
  } else {
    for (let r = 6; r < 330; r += 7) {
      a += dotRing(170, 230, r);
      b += dotRing(232, 268, r);
    }
  }
  return {
    background: 'paper',
    ops: [
      { op: 'path', d: a, stroke: INK, sw: lines ? 2 : 2.2, fill: 'none' },
      { op: 'path', d: b, stroke: INK, sw: lines ? 2 : 2.2, fill: 'none' },
    ],
  };
}

function dotRing(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`;
}

function rosette(p: Plate, _rand: () => number, detail: number): PlateDrawing {
  const ops: PlateOp[] = [];
  const rings = p.seed > 190 ? [[150, 14, 36, 16], [92, 10, 22, 12]] : [[140, 18, 28, 18], [96, 9, 18, 10], [52, 6, 12, 8]];
  for (const [radius, amp, waves, count] of rings) {
    let d = '';
    const samples = Math.round(260 * detail);
    for (let c = 0; c < count; c++) {
      const phase = (c / count) * ((2 * Math.PI) / waves);
      for (let i = 0; i <= samples; i++) {
        const t = (i / samples) * Math.PI * 2;
        const rr = radius + amp * Math.sin(waves * (t + phase));
        d += `${i === 0 ? 'M' : 'L'}${f(200 + rr * Math.cos(t))} ${f(250 + rr * Math.sin(t))}`;
      }
    }
    ops.push({ op: 'path', d, stroke: INK, sw: 0.55, fill: 'none' });
  }
  ops.push({ op: 'circle', cx: 200, cy: 250, r: 178, stroke: INK, sw: 1.2 });
  ops.push({ op: 'circle', cx: 200, cy: 250, r: 172, stroke: INK, sw: 0.5 });
  return { background: 'paper', ops };
}

function specimen(p: Plate): PlateDrawing {
  const italic = p.seed > 196;
  return {
    background: 'paper',
    ops: [
      { op: 'path', d: 'M20 120H380M20 330H380M20 196H380', stroke: G3, sw: 0.7, dash: '2 3' },
      { op: 'text', x: 24, y: 114, text: 'VERSAL', size: 8, family: 'mono', fill: G5, spacing: 1.5 },
      { op: 'text', x: 24, y: 190, text: 'ALTURA-X', size: 8, family: 'mono', fill: G5, spacing: 1.5 },
      { op: 'text', x: 24, y: 344, text: 'LINHA DE BASE', size: 8, family: 'mono', fill: G5, spacing: 1.5 },
      { op: 'text', x: 200, y: 330, text: italic ? 'Ag' : 'Rg', size: 250, family: 'serif', fill: INK, anchor: 'middle' },
      { op: 'path', d: 'M20 380H380', stroke: INK, sw: 1.2 },
      { op: 'text', x: 20, y: 408, text: 'ABCDEFGHIJKLMNOPQRS', size: 15, family: 'serif', fill: INK, spacing: 1 },
      { op: 'text', x: 20, y: 432, text: 'abcdefghijklmnopqrstuvwxyz', size: 15, family: 'serif', fill: INK },
      { op: 'text', x: 20, y: 462, text: 'ESPÉCIME · CORPO 250 / 15', size: 9, family: 'mono', fill: G5, spacing: 1.5 },
    ],
  };
}

function grid(p: Plate, rand: () => number): PlateDrawing {
  const ops: PlateOp[] = [];
  let lines = '';
  for (let c = 0; c <= 12; c++) lines += `M${20 + c * 30} 20V480`;
  ops.push({ op: 'path', d: lines, stroke: G3, sw: 0.4, opacity: 0.7 });
  const blocks = p.seed > 205 ? 5 : 4;
  for (let i = 0; i < blocks; i++) {
    const col = Math.floor(rand() * 8);
    const span = 2 + Math.floor(rand() * 4);
    const y = 40 + Math.floor(rand() * 10) * 40;
    ops.push({ op: 'rect', x: 20 + col * 30, y, w: Math.min(span, 12 - col) * 30, h: 20 + Math.floor(rand() * 3) * 20, fill: INK });
  }
  ops.push({ op: 'circle', cx: 290 + rand() * 50, cy: 120 + rand() * 60, r: 46, fill: 'none', stroke: INK, sw: 3 });
  for (let i = 0; i < 6; i++) ops.push({ op: 'rect', x: 20, y: 420 + i * 9, w: 150 - (i % 3) * 30, h: 3, fill: INK, opacity: 0.85 });
  return { background: 'paper', ops };
}

function hatch(p: Plate, rand: () => number, detail: number): PlateDrawing {
  const cross = p.seed > 220;
  const n = Math.round(48 * detail);
  const hx = 120 + rand() * 160;
  const hy = 200 + rand() * 120;
  let d = '';
  for (let i = 0; i < n; i++) {
    const base = 20 + (i / (n - 1)) * 460;
    for (let s = 0; s <= 40; s++) {
      const x = 20 + (s / 40) * 360;
      const bump = 60 * gauss(x - hx, base - hy, 120, 140);
      const y = base - bump + 6 * Math.sin(x * 0.03 + i * 0.35);
      d += `${s === 0 ? 'M' : 'L'}${f(x)} ${f(y)}`;
    }
  }
  const ops: PlateOp[] = [{ op: 'path', d, stroke: INK, sw: 0.9, fill: 'none' }];
  if (cross) {
    let c = '';
    for (let i = 0; i < 26; i++) c += `M${f(hx - 140 + i * 11)} ${f(hy - 120)}l${-120} 260`;
    ops.push({ op: 'path', d: c, stroke: INK, sw: 0.5, opacity: 0.6 });
  }
  return { background: 'paper', ops };
}

function stipple(p: Plate, rand: () => number, detail: number): PlateDrawing {
  const eclipse = p.seed > 225;
  let d = '';
  const tries = Math.round(5200 * detail);
  for (let i = 0; i < tries; i++) {
    const x = rand() * PLATE_W;
    const y = rand() * PLATE_H;
    const dx = (x - 200) / 140;
    const dy = (y - 250) / 140;
    const r2 = dx * dx + dy * dy;
    let tone: number;
    if (r2 > 1) tone = eclipse ? 0.02 : 0.05 * (1 - Math.min(1, (y - 250) / 250));
    else {
      const z = Math.sqrt(1 - r2);
      const lambert = Math.max(0, -dx * 0.5 - dy * 0.6 + z * 0.62);
      tone = eclipse ? 0.95 - 0.5 * Math.pow(1 - z, 3) : 0.9 - lambert * 0.85;
    }
    if (rand() < tone) d += dot(x, y, 1.15);
  }
  return { background: 'paper', ops: [{ op: 'path', d, fill: INK }] };
}

const RENDERERS = { halftone, contact, filmstrip, aspect, pattern, drape, moire, rosette, specimen, grid, hatch, stipple } as const;

const cache = new Map<string, PlateDrawing>();

/** Deterministic drawing for a plate; `detail` 1 = full, 0.6 ≈ thumbnail. */
export function drawPlate(plate: Plate, detail = 1): PlateDrawing {
  const key = `${plate.id}@${detail}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const render = RENDERERS[plate.style] as (p: Plate, rand: () => number, detail: number) => PlateDrawing;
  const drawing = render(plate, mulberry32(plate.seed), detail);
  cache.set(key, drawing);
  return drawing;
}
