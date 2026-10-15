/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addDays, daysBetween, formatFolio, formatLong, formatShort, relativeDays, roman } from './dates.ts';
import { mulberry32 } from './random.ts';

describe('dates', () => {
  it('adds days across months and years', () => {
    assert.equal(addDays('2026-10-15', 20), '2026-11-04');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  });

  it('counts whole days regardless of daylight saving', () => {
    assert.equal(daysBetween('2026-10-15', '2026-10-18'), 3);
    assert.equal(daysBetween('2026-10-18', '2026-10-15'), -3);
    assert.equal(daysBetween('2026-10-01', '2026-11-05'), 35);
  });

  it('formats editorial dates in Portuguese', () => {
    assert.equal(formatShort('2026-10-05'), '05 OUT');
    assert.equal(formatLong('2026-10-15'), '15 de outubro de 2026');
    assert.equal(formatFolio('2026-10-15'), 'QUI · 15 OUT 2026');
    assert.equal(relativeDays('2026-10-18', '2026-10-15'), 'em 3 dias');
    assert.equal(relativeDays('2026-10-14', '2026-10-15'), 'ontem');
  });

  it('writes Roman numerals for issue years', () => {
    assert.equal(roman(2026), 'MMXXVI');
    assert.equal(roman(1999), 'MCMXCIX');
    assert.equal(roman(4), 'IV');
  });
});

describe('random', () => {
  it('is deterministic per seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    assert.deepEqual(seqA, [b(), b(), b()]);
    assert.ok(seqA.every((v) => v >= 0 && v < 1));
    assert.notDeepEqual(seqA, [mulberry32(43)(), 0, 0]);
  });
});
