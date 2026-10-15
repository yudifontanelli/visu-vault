/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { BoardItem } from './model.ts';
import { arrange, BOARD, boardReducer, bounds, clampToBoard, ITEM_SIZE, maxZ, snap } from './model.ts';

const note = (id: string, x: number, y: number, z = 1): BoardItem => ({ id, kind: 'note', x, y, z, text: id });

describe('board geometry', () => {
  it('snaps to the 24-unit grid', () => {
    assert.equal(snap(0), 0);
    assert.equal(snap(13), 24);
    assert.equal(snap(11), 0);
    assert.equal(snap(-13), -24);
  });

  it('keeps items on the table', () => {
    assert.deepEqual(clampToBoard('note', -50, -10), { x: 0, y: 0 });
    const { w, h } = ITEM_SIZE.heading;
    assert.deepEqual(clampToBoard('heading', 99999, 99999), { x: BOARD.width - w, y: BOARD.height - h });
  });

  it('measures the bounds of all items', () => {
    assert.equal(bounds([]), null);
    const b = bounds([note('a', 100, 100), note('b', 400, 300)]);
    assert.deepEqual(b, { x: 100, y: 100, w: 300 + ITEM_SIZE.note.w, h: 200 + ITEM_SIZE.note.h });
  });
});

describe('board reducer', () => {
  it('adds on top of the stack', () => {
    const items = [note('a', 0, 0, 3)];
    const next = boardReducer(items, { type: 'board/add', item: note('b', 10, 10, 0) });
    assert.equal(next.length, 2);
    assert.equal(next[1].z, 4);
  });

  it('moves, clamps and keeps identity when nothing changes', () => {
    const items = [note('a', 48, 48)];
    const moved = boardReducer(items, { type: 'board/move', id: 'a', x: -20, y: 96 });
    assert.deepEqual([moved[0].x, moved[0].y], [0, 96]);
    const same = boardReducer(items, { type: 'board/move', id: 'a', x: 48, y: 48 });
    assert.equal(same[0], items[0]);
  });

  it('brings an item to the front and duplicates with an offset', () => {
    const items = [note('a', 0, 0, 1), note('b', 0, 0, 2)];
    const front = boardReducer(items, { type: 'board/front', id: 'a' });
    assert.equal(front.find((i) => i.id === 'a')?.z, 3);
    assert.equal(boardReducer(front, { type: 'board/front', id: 'a' }), front);
    const dup = boardReducer(items, { type: 'board/duplicate', id: 'b', newId: 'c' });
    const c = dup.find((i) => i.id === 'c');
    assert.ok(c);
    assert.deepEqual([c.x, c.y, c.z], [BOARD.grid, BOARD.grid, 3]);
    assert.equal(maxZ(dup), 3);
  });

  it('edits and removes', () => {
    const items = [note('a', 0, 0)];
    assert.equal(boardReducer(items, { type: 'board/update', id: 'a', patch: { text: 'novo' } })[0].text, 'novo');
    assert.equal(boardReducer(items, { type: 'board/remove', id: 'a' }).length, 0);
  });
});

describe('arrange', () => {
  it('puts headings first, groups kinds in rows and never overlaps', () => {
    const items: BoardItem[] = [
      note('n1', 900, 900),
      { id: 'h', kind: 'heading', x: 500, y: 500, z: 1, text: 'Título' },
      { id: 'p1', kind: 'plate', x: 10, y: 10, z: 1, text: '', plateId: 'pl-001' },
      { id: 'p2', kind: 'plate', x: 20, y: 10, z: 1, text: '', plateId: 'pl-002' },
      note('n2', 700, 900),
      { id: 'r', kind: 'reference', x: 0, y: 0, z: 1, text: 'Ref', source: 'x' },
    ];
    const out = arrange(items);
    const byId = Object.fromEntries(out.map((i) => [i.id, i]));
    assert.equal(byId.h.y, 96);
    assert.ok(byId.p1.y > byId.h.y && byId.p1.y === byId.p2.y);
    assert.ok(byId.n1.y > byId.p1.y);
    assert.ok(byId.r.y > byId.n1.y);
    for (const it of out) {
      assert.equal(it.x % BOARD.grid, 0);
      assert.equal(it.y % BOARD.grid, 0);
    }
    // No two items overlap.
    for (const a of out) {
      for (const b of out) {
        if (a.id >= b.id) continue;
        const A = ITEM_SIZE[a.kind];
        const B = ITEM_SIZE[b.kind];
        const overlap = a.x < b.x + B.w && b.x < a.x + A.w && a.y < b.y + B.h && b.y < a.y + A.h;
        assert.equal(overlap, false, `${a.id} overlaps ${b.id}`);
      }
    }
  });
});
