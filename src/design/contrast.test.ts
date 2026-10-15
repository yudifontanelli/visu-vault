import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AA, contrastRatio, luminance } from './contrast.ts';
import { brand, color, emphasis, palette } from './tokens.ts';

test('luminance matches the WCAG reference points', () => {
  assert.equal(luminance('#000000'), 0);
  assert.equal(luminance('#ffffff'), 1);
  assert.equal(luminance('#fff'), 1);
  assert.throws(() => luminance('oxide'));
});

test('contrast ratio is symmetric and 21:1 at the extremes', () => {
  assert.equal(contrastRatio('#000', '#fff'), 21);
  assert.equal(contrastRatio('#F5F1E8', '#0A0A0A'), contrastRatio('#0A0A0A', '#F5F1E8'));
});

test('the official palette is exactly the four brand colours', () => {
  assert.deepEqual(Object.values(brand), ['#0A0A0A', '#F5F1E8', '#262626', '#A8A39A']);
  assert.equal(palette.ink, brand.black);
  assert.equal(palette.paper, brand.offWhite);
  assert.equal(palette.graphite700, brand.graphite);
  assert.equal(palette.graphite300, brand.warmGray);
  assert.ok(!('oxide' in palette), 'no alert colour outside the official palette');
});

test('every text role meets AA on its own surface', () => {
  const onInk: [string, string][] = [
    ['text', color.text],
    ['textSecondary', color.textSecondary],
    ['textMuted', color.textMuted],
    ['emphasis', emphasis.ink],
  ];
  for (const [name, fg] of onInk) {
    assert.ok(contrastRatio(fg, color.bg) >= AA.text, `${name} on ink: ${contrastRatio(fg, color.bg).toFixed(2)}`);
    assert.ok(contrastRatio(fg, color.surfaceRaised) >= AA.text, `${name} on raised ink`);
  }
  const onPaper: [string, string][] = [
    ['sheetText', color.sheetText],
    ['sheetTextSecondary', color.sheetTextSecondary],
    ['emphasis', emphasis.paper],
    ['graphite', brand.graphite],
  ];
  for (const [name, fg] of onPaper) {
    assert.ok(contrastRatio(fg, color.sheet) >= AA.text, `${name} on paper: ${contrastRatio(fg, color.sheet).toFixed(2)}`);
    assert.ok(contrastRatio(fg, color.sheetDim) >= AA.text, `${name} on dim paper`);
  }
});

test('warm grey is for lines and large type on paper, never small text', () => {
  const r = contrastRatio(brand.warmGray, brand.offWhite);
  assert.ok(r < AA.large, `warm grey on off-white is ${r.toFixed(2)}:1`);
  assert.ok(contrastRatio(brand.warmGray, brand.black) >= AA.text);
});
