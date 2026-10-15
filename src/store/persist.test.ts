/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createStore } from './createStore.ts';
import type { KeyValueStorage } from './persist.ts';
import { deserialize, persistStore, serialize } from './persist.ts';

type S = { n: number };
type A = { type: 'inc' } | { type: 'set'; state: S };
const reducer = (s: S, a: A): S => (a.type === 'inc' ? { n: s.n + 1 } : a.state);
const isS = (v: unknown): v is S => !!v && typeof (v as S).n === 'number';

function memory(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: async (k) => data[k] ?? null,
    setItem: async (k, v) => {
      data[k] = v;
    },
    removeItem: async (k) => {
      delete data[k];
    },
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('store', () => {
  it('notifies only on real changes', () => {
    const store = createStore<S, A>((s, a) => (a.type === 'inc' ? { n: s.n + 1 } : s), { n: 0 });
    let calls = 0;
    const off = store.subscribe(() => calls++);
    store.dispatch({ type: 'inc' });
    store.dispatch({ type: 'set', state: { n: 9 } });
    off();
    store.dispatch({ type: 'inc' });
    assert.equal(calls, 1);
    assert.equal(store.getState().n, 2);
  });
});

describe('persistence', () => {
  it('rejects other versions and corrupt data', () => {
    assert.equal(deserialize(serialize({ n: 1 }, 2), 1, isS), null);
    assert.equal(deserialize('{not json', 1, isS), null);
    assert.equal(deserialize(serialize({ x: 1 }, 1), 1, isS), null);
    assert.deepEqual(deserialize(serialize({ n: 3 }, 1), 1, isS), { n: 3 });
  });

  it('hydrates saved state and writes changes after hydration only', async () => {
    const storage = memory({ k: serialize({ n: 5 }, 1) });
    const store = createStore<S, A>(reducer, { n: 0 });
    const p = persistStore(store, { key: 'k', version: 1, storage, isValid: isS, hydrateAction: (state): A => ({ type: 'set', state }), debounceMs: 5 });
    assert.equal(await p.hydrate(), true);
    assert.equal(store.getState().n, 5);
    store.dispatch({ type: 'inc' });
    await wait(20);
    assert.deepEqual(deserialize(storage.data.k, 1, isS), { n: 6 });
    p.dispose();
  });

  it('keeps the seed when nothing is saved and does not overwrite before hydration', async () => {
    const storage = memory();
    const store = createStore<S, A>(reducer, { n: 1 });
    const p = persistStore(store, { key: 'k', version: 1, storage, isValid: isS, hydrateAction: (state): A => ({ type: 'set', state }), debounceMs: 5 });
    store.dispatch({ type: 'inc' });
    await wait(20);
    assert.equal(storage.data.k, undefined);
    assert.equal(await p.hydrate(), false);
    assert.equal(store.getState().n, 2);
    await p.clear();
    p.dispose();
  });
});
