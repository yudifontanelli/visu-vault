/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Story } from './model.ts';
import {
  canAdvance,
  clampPages,
  deadlineLabel,
  deadlineState,
  deskReducer,
  firstFreeRun,
  flatplan,
  ISSUE_PAGES,
  nextStoryCode,
  wordCount,
} from './model.ts';

const story = (over: Partial<Story> = {}): Story => ({
  id: 's',
  code: 'P-01',
  title: 'T',
  dek: '',
  section: 'Arte',
  authorId: 'hd',
  editorId: 'nv',
  deadline: '2026-10-20',
  status: 'redacao',
  body: 'um texto curto',
  wordsTarget: 100,
  pageStart: null,
  pageCount: 2,
  checklist: [],
  notes: [],
  ...over,
});

describe('editorial workflow', () => {
  it('counts words', () => {
    assert.equal(wordCount('  O arquivo   como\nmétodo '), 4);
    assert.equal(wordCount(''), 0);
  });

  it('needs text before review', () => {
    assert.equal(canAdvance(story({ status: 'redacao', body: '' })).ok, false);
    assert.equal(canAdvance(story({ status: 'redacao' })).ok, true);
  });

  it('blocks closing while checklist items or review notes are open', () => {
    const open = story({ status: 'revisao', checklist: [{ id: 'c', label: 'x', done: false }] });
    const check = canAdvance(open);
    assert.equal(check.ok, false);
    assert.match(check.ok ? '' : check.reason, /1 item pendente/);
    const notes = story({ status: 'revisao', notes: [{ id: 'n', authorId: 'nv', text: 'x', at: '2026-10-01', resolved: false }] });
    assert.equal(canAdvance(notes).ok, false);
    assert.equal(canAdvance(story({ status: 'revisao' })).ok, true);
  });

  it('needs pages before publishing and stops at published', () => {
    assert.equal(canAdvance(story({ status: 'fechamento' })).ok, false);
    assert.equal(canAdvance(story({ status: 'fechamento', pageStart: 4 })).ok, true);
    assert.equal(canAdvance(story({ status: 'publicado', pageStart: 4 })).ok, false);
  });

  it('reducer advances only when allowed and retreats one step', () => {
    const blocked = [story({ status: 'revisao', checklist: [{ id: 'c', label: 'x', done: false }] })];
    assert.equal(deskReducer(blocked, { type: 'desk/advance', id: 's' }), blocked);
    const ticked = deskReducer(blocked, { type: 'desk/toggleCheck', id: 's', itemId: 'c' });
    assert.equal(deskReducer(ticked, { type: 'desk/advance', id: 's' })[0].status, 'fechamento');
    assert.equal(deskReducer(ticked, { type: 'desk/retreat', id: 's' })[0].status, 'redacao');
    const first = [story({ status: 'pauta' })];
    assert.equal(deskReducer(first, { type: 'desk/retreat', id: 's' }), first);
  });

  it('labels deadlines relative to today', () => {
    assert.equal(deadlineState(story({ deadline: '2026-10-14' }), '2026-10-15').state, 'overdue');
    assert.equal(deadlineLabel(story({ deadline: '2026-10-14' }), '2026-10-15'), 'Atrasada 1 dia');
    assert.equal(deadlineLabel(story({ deadline: '2026-10-15' }), '2026-10-15'), 'Fecha hoje');
    assert.equal(deadlineState(story({ deadline: '2026-10-17' }), '2026-10-15').state, 'soon');
    assert.equal(deadlineLabel(story({ deadline: '2026-10-25' }), '2026-10-15'), 'Prazo em 10 dias');
    assert.equal(deadlineState(story({ status: 'publicado', deadline: '2026-01-01' }), '2026-10-15').state, 'done');
  });

  it('numbers new pautas after the highest code', () => {
    assert.equal(nextStoryCode([story({ code: 'P-07' }), story({ code: 'P-03' })]), 'P-08');
    assert.equal(nextStoryCode([]), 'P-01');
  });
});

describe('flatplan', () => {
  it('keeps covers out and clamps ranges', () => {
    assert.deepEqual(clampPages(1, 4), { pageStart: 2, pageCount: 4 });
    assert.deepEqual(clampPages(31, 4), { pageStart: ISSUE_PAGES - 4, pageCount: 4 });
    assert.deepEqual(clampPages(null, 0), { pageStart: null, pageCount: 1 });
  });

  it('builds spreads and detects pages claimed twice', () => {
    const plan = flatplan([story({ id: 'a', pageStart: 4, pageCount: 4 }), story({ id: 'b', pageStart: 6, pageCount: 2 })]);
    assert.deepEqual(plan.conflicts, [6, 7]);
    assert.deepEqual(plan.spreads[0], [1]);
    assert.deepEqual(plan.spreads[1], [2, 3]);
    assert.deepEqual(plan.spreads[plan.spreads.length - 1], [ISSUE_PAGES]);
    assert.equal(plan.pages[3].storyIds[0], 'a');
    assert.equal(plan.free, ISSUE_PAGES - 2 - 4);
  });

  it('finds the first free run of pages', () => {
    const stories = [story({ id: 'a', pageStart: 2, pageCount: 4 })];
    assert.equal(firstFreeRun(stories, 3), 6);
    assert.equal(firstFreeRun(stories, 3, 'a'), 2);
    assert.equal(firstFreeRun([story({ id: 'a', pageStart: 2, pageCount: 30 })], 1), null);
  });
});
