import { BOARD } from './model.ts';

/** What part of the table is on screen: world coordinates at the top-left, and zoom. */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export const ZOOM_MIN = 0.3;
export const ZOOM_MAX = 2;

export function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

export function screenToWorld(v: Viewport, sx: number, sy: number): { x: number; y: number } {
  return { x: v.x + sx / v.zoom, y: v.y + sy / v.zoom };
}

/** Zooms keeping the world point under the screen point (sx, sy) fixed — cursor or pinch centre. */
export function zoomAt(v: Viewport, nextZoom: number, sx: number, sy: number): Viewport {
  const zoom = clampZoom(nextZoom);
  const w = screenToWorld(v, sx, sy);
  return { x: w.x - sx / zoom, y: w.y - sy / zoom, zoom };
}

/** Keeps at least a quarter of the screen over the table, so it can never be lost. */
export function clampViewport(v: Viewport, screenW: number, screenH: number): Viewport {
  const vw = screenW / v.zoom;
  const vh = screenH / v.zoom;
  const x = Math.min(BOARD.width - vw * 0.25, Math.max(-vw * 0.75, v.x));
  const y = Math.min(BOARD.height - vh * 0.25, Math.max(-vh * 0.75, v.y));
  return x === v.x && y === v.y ? v : { ...v, x, y };
}

/** Frames a world rectangle in the screen with a margin. */
export function fitViewport(
  rect: { x: number; y: number; w: number; h: number },
  screenW: number,
  screenH: number,
  margin = 40,
  maxZoom = 1.1,
  align: 'center' | 'top' = 'center',
): Viewport {
  const zoom = clampZoom(Math.min(maxZoom, (screenW - margin * 2) / rect.w, (screenH - margin * 2) / rect.h));
  return {
    zoom,
    x: rect.x - (screenW / zoom - rect.w) / 2,
    y: align === 'top' ? rect.y - margin / zoom : rect.y - (screenH / zoom - rect.h) / 2,
  };
}

/** Top-left for a new item of size (w, h) centred in the current view. */
export function centreSlot(v: Viewport, screenW: number, screenH: number, w: number, h: number): { x: number; y: number } {
  const c = screenToWorld(v, screenW / 2, screenH / 2);
  return { x: c.x - w / 2, y: c.y - h / 2 };
}
