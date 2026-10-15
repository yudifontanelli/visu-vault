/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  INITIAL_COMBO_STATE,
  UNLOCK_SEQUENCE,
  angleDelta,
  enterValue,
  formatStep,
  normalizeStep,
  pointerAngle,
  snapRotation,
  valueAtRotation,
} from './combination.ts';

describe('dial geometry', () => {
  it('wraps steps into 0–99', () => {
    assert.equal(normalizeStep(0), 0);
    assert.equal(normalizeStep(100), 0);
    assert.equal(normalizeStep(-1), 99);
    assert.equal(normalizeStep(-101), 99);
    assert.equal(normalizeStep(254), 54);
  });

  it('reads the value under the indicator (clockwise turn counts down)', () => {
    assert.equal(valueAtRotation(0), 0);
    assert.equal(valueAtRotation(3.6), 99);
    assert.equal(valueAtRotation(-3.6), 1);
    assert.equal(valueAtRotation(-12 * 3.6), 12);
    assert.equal(valueAtRotation(6 * 3.6), 94);
    assert.equal(valueAtRotation(-720 - 12 * 3.6), 12);
  });

  it('snaps to the nearest step without jumping a full turn', () => {
    assert.equal(snapRotation(1.7), 0);
    assert.equal(snapRotation(1.9), 3.6);
    assert.ok(Math.abs(snapRotation(-725) - -723.6) < 1e-9);
    assert.ok(!Object.is(snapRotation(-0.1), -0));
  });

  it('computes the shortest angular delta across 0°/360°', () => {
    assert.equal(angleDelta(350, 10), 20);
    assert.equal(angleDelta(10, 350), -20);
    assert.equal(angleDelta(0, 180), 180);
    assert.equal(angleDelta(90, 90), 0);
  });

  it('measures pointer angle from 12 o’clock, clockwise', () => {
    assert.equal(pointerAngle(0, -1), 0);
    assert.equal(pointerAngle(1, 0), 90);
    assert.equal(pointerAngle(0, 1), 180);
    assert.equal(pointerAngle(-1, 0), 270);
  });

  it('formats two-digit values', () => {
    assert.equal(formatStep(4), '04');
    assert.equal(formatStep(94), '94');
    assert.equal(formatStep(-1), '99');
  });
});

describe('symbolic sequence', () => {
  it('is 12 → 94 (1294)', () => {
    assert.deepEqual([...UNLOCK_SEQUENCE], [12, 94]);
  });

  it('unlocks with the right sequence', () => {
    const first = enterValue(INITIAL_COMBO_STATE, 12);
    assert.equal(first.status, 'progress');
    const second = enterValue(first, 94);
    assert.equal(second.status, 'unlocked');
  });

  it('fails on a wrong number at any position', () => {
    assert.equal(enterValue(INITIAL_COMBO_STATE, 94).status, 'error');
    const first = enterValue(INITIAL_COMBO_STATE, 12);
    assert.equal(enterValue(first, 12).status, 'error');
  });

  it('ignores input once settled', () => {
    const err = enterValue(INITIAL_COMBO_STATE, 1);
    assert.equal(enterValue(err, 12), err);
    const done = enterValue(enterValue(INITIAL_COMBO_STATE, 12), 94);
    assert.equal(enterValue(done, 3), done);
  });

  it('accepts a custom sequence', () => {
    const s = enterValue(INITIAL_COMBO_STATE, 7, [7]);
    assert.equal(s.status, 'unlocked');
  });
});
