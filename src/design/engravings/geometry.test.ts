/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { guillochePath, hatchPath, keyholePath } from './geometry.ts';

describe('engraving geometry', () => {
  it('draws a closed keyhole inside its documented bounds', () => {
    const d = keyholePath(100, 100, 20);
    assert.match(d, /^M .* A 20 20 0 1 1 .* Z$/);
    const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    // Endpoint coordinates only (skip arc radii/flags): every x within [80,120], y within [80,146].
    const points = [nums[0], nums[1], nums[7], nums[8], nums[9], nums[10], nums[11], nums[12]];
    for (let i = 0; i < points.length; i += 2) {
      assert.ok(points[i] >= 80 && points[i] <= 120, `x ${points[i]}`);
      assert.ok(points[i + 1] >= 80 && points[i + 1] <= 146, `y ${points[i + 1]}`);
    }
  });

  it('produces one closed subpath per guilloché strand', () => {
    const d = guillochePath({ cx: 0, cy: 0, radius: 50, amplitude: 5, waves: 12, count: 4, samples: 60 });
    assert.equal(d.match(/M/g)?.length, 4);
    assert.equal(d.match(/Z/g)?.length, 4);
  });

  it('covers a box with parallel hatch lines', () => {
    const d = hatchPath(0, 0, 100, 40, 5, 0);
    assert.ok((d.match(/M/g)?.length ?? 0) >= 10);
  });
});
