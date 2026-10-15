import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { todayISO } from '../lib/dates';
import { createStore } from '../store/createStore';
import { persistStore } from '../store/persist';
import { AppAction, appReducer, AppState, isAppState, seedState, STATE_VERSION } from './app';

/**
 * The workspace store. Data lives only on this device (AsyncStorage on iPhone,
 * localStorage in the Windows / macOS web build) — nothing is sent anywhere.
 */
export const appStore = createStore<AppState, AppAction>(appReducer, seedState(todayISO()));

export const dispatch = (action: AppAction) => appStore.dispatch(action);

/**
 * Reads a slice of the store. The selector must return a value already in the
 * state (or a primitive); derive new arrays with useMemo in the component.
 */
export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.getState()),
    () => selector(appStore.getState()),
  );
}

const persistence = persistStore(appStore, {
  key: 'vault.workspace',
  version: STATE_VERSION,
  storage: AsyncStorage,
  isValid: isAppState,
  hydrateAction: (state) => ({ type: 'app/hydrate' as const, state }),
});

let hydration: Promise<boolean> | null = null;

/** Restores the saved workspace once per launch. Resolves true if there was one. */
export function hydrateWorkspace(): Promise<boolean> {
  hydration ??= persistence.hydrate();
  return hydration;
}

/** Discards local changes and reloads the demo content. */
export async function resetWorkspace() {
  appStore.dispatch({ type: 'app/reset', state: seedState(todayISO()) });
  await persistence.flush();
}
