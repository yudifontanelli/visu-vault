/**
 * Pure path generators for the engraved ornaments (no React), unit-testable.
 */

const f = (n: number) => (Math.round(n * 100) / 100).toString();

/**
 * Classic keyhole: a circle of radius `r` centred at (cx, cy) with a tapered
 * stem below it. Bounding box: x ∈ [cx−r, cx+r], y ∈ [cy−r, cy+2.3r].
 */
export function keyholePath(cx: number, cy: number, r: number): string {
  const sx = 0.42 * r;
  const sy = Math.sqrt(r * r - sx * sx);
  const bx = 0.72 * r;
  const by = 2.3 * r;
  return (
    `M ${f(cx - sx)} ${f(cy + sy)} ` +
    `A ${f(r)} ${f(r)} 0 1 1 ${f(cx + sx)} ${f(cy + sy)} ` +
    `L ${f(cx + bx)} ${f(cy + by)} L ${f(cx - bx)} ${f(cy + by)} Z`
  );
}

/** Vertical offset from the keyhole's circle centre to its visual centre. */
export const KEYHOLE_CENTER_OFFSET = 0.65;

/**
 * Guilloché band: `count` sine-modulated circles, phase-shifted so they weave,
 * as on banknotes and certificates.
 */
export function guillochePath({
  cx,
  cy,
  radius,
  amplitude,
  waves,
  count,
  samples = 240,
}: {
  cx: number;
  cy: number;
  radius: number;
  amplitude: number;
  waves: number;
  count: number;
  samples?: number;
}): string {
  let d = '';
  for (let c = 0; c < count; c++) {
    const phase = (c / count) * ((2 * Math.PI) / waves);
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * Math.PI * 2;
      const rr = radius + amplitude * Math.sin(waves * (t + phase));
      const x = cx + rr * Math.cos(t);
      const y = cy + rr * Math.sin(t);
      d += `${i === 0 ? 'M' : 'L'}${f(x)} ${f(y)} `;
    }
    d += 'Z ';
  }
  return d.trim();
}

/** Parallel hatch lines across a box at `angle` degrees, `gap` apart (to be clipped). */
export function hatchPath(x: number, y: number, w: number, h: number, gap: number, angle = 0): string {
  const rad = (angle * Math.PI) / 180;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const reach = Math.hypot(w, h) / 2 + gap;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  let d = '';
  for (let o = -reach; o <= reach; o += gap) {
    // Line perpendicular offset `o` from the centre, running along the angle.
    const px = cx - o * sin;
    const py = cy + o * cos;
    d += `M${f(px - reach * cos)} ${f(py - reach * sin)} L${f(px + reach * cos)} ${f(py + reach * sin)} `;
  }
  return d.trim();
}
