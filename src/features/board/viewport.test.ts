/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BOARD } from './model.ts';
import { centreSlot, clampViewport, clampZoom, fitViewport, screenToWorld, zoomAt, ZOOM_MAX, ZOOM_MIN } from './viewport.ts';

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`);

describe('board viewport', () => {
  it('clamps zoom', () => {
    assert.equal(clampZoom(10), ZOOM_MAX);
    assert.equal(clampZoom(0.01), ZOOM_MIN);
  });

  it('zooms around the cursor', () => {
    const v = { x: 100, y: 50, zoom: 1 };
    const before = screenToWorld(v, 300, 200);
    const next = zoomAt(v, 2, 300, 200);
    const after = screenToWorld(next, 300, 200);
    close(before.x, after.x);
    close(before.y, after.y);
    assert.equal(next.zoom, 2);
  });

  it('fits a rectangle centred with a margin', () => {
    const v = fitViewport({ x: 100, y: 100, w: 1000, h: 500 }, 1100, 700, 50);
    assert.equal(v.zoom, 1);
    const centre = screenToWorld(v, 550, 350);
    close(centre.x, 600);
    close(centre.y, 350);
    const small = fitViewport({ x: 0, y: 0, w: 1000, h: 500 }, 400, 800, 20);
    close(small.zoom, 0.36);
    const top = fitViewport({ x: 0, y: 100, w: 1000, h: 200 }, 1100, 700, 50, 1, 'top');
    close(screenToWorld(top, 0, 50).y, 100);
  });

  it('never lets the table leave the screen', () => {
    const lost = clampViewport({ x: 99999, y: -99999, zoom: 1 }, 800, 600);
    assert.ok(lost.x <= BOARD.width - 200);
    assert.ok(lost.y >= -450);
    const fine = { x: 10, y: 10, zoom: 1 };
    assert.equal(clampViewport(fine, 800, 600), fine);
  });

  it('places new items in the middle of the view', () => {
    const slot = centreSlot({ x: 0, y: 0, zoom: 0.5 }, 800, 600, 200, 100);
    assert.deepEqual(slot, { x: 700, y: 550 });
  });
});
