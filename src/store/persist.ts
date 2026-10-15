import type { Store } from './createStore.ts';

/** The subset of AsyncStorage / localStorage the persistence layer needs. */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

interface Envelope<S> {
  v: number;
  savedAt: string;
  state: S;
}

export function serialize<S>(state: S, version: number, now = new Date()): string {
  const envelope: Envelope<S> = { v: version, savedAt: now.toISOString(), state };
  return JSON.stringify(envelope);
}

/** Returns the stored state, or null when missing, corrupt, from another version or invalid. */
export function deserialize<S>(raw: string | null, version: number, isValid: (s: unknown) => s is S): S | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Envelope<unknown>>;
    if (!parsed || parsed.v !== version) return null;
    return isValid(parsed.state) ? parsed.state : null;
  } catch {
    return null;
  }
}

export interface PersistOptions<S, A> {
  key: string;
  version: number;
  storage: KeyValueStorage;
  isValid: (s: unknown) => s is S;
  /** Builds the action that replaces the store state with the stored one. */
  hydrateAction: (state: S) => A;
  debounceMs?: number;
}

/**
 * Loads the saved state once, then writes every change (debounced). Writes are
 * skipped until hydration finishes, so the seed never overwrites saved work.
 */
export function persistStore<S, A>(store: Store<S, A>, options: PersistOptions<S, A>) {
  const { key, version, storage, isValid, hydrateAction, debounceMs = 400 } = options;
  let hydrated = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending = false;

  const write = async () => {
    timer = null;
    pending = false;
    try {
      await storage.setItem(key, serialize(store.getState(), version));
    } catch {
      // Storage full or unavailable (private browsing): keep working in memory.
    }
  };

  const unsubscribe = store.subscribe(() => {
    if (!hydrated) return;
    pending = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(write, debounceMs);
  });

  return {
    async hydrate(): Promise<boolean> {
      let restored = false;
      try {
        const saved = deserialize(await storage.getItem(key), version, isValid);
        if (saved) {
          store.dispatch(hydrateAction(saved));
          restored = true;
        }
      } catch {
        restored = false;
      }
      hydrated = true;
      return restored;
    },
    async flush() {
      if (timer) clearTimeout(timer);
      if (pending || hydrated) await write();
    },
    async clear() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = false;
      await storage.removeItem(key).catch(() => undefined);
    },
    dispose() {
      if (timer) clearTimeout(timer);
      unsubscribe();
    },
  };
}
