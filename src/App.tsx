import { useFonts } from 'expo-font';
import * as NativeSplash from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fontAssets, setFontsAvailable } from './design/fonts';
import { Specimen } from './design/Specimen';
import { ToastProvider } from './design/Toast';
import { palette } from './design/tokens';
import { LockScreen } from './screens/LockScreen';
import { SplashScreen } from './screens/SplashScreen';
import { WorkspaceScreen } from './screens/WorkspaceScreen';
import { hydrateWorkspace } from './state/store';

NativeSplash.preventAutoHideAsync().catch(() => undefined);

type Phase = 'splash' | 'lock' | 'workspace';

/** Design-system specimen for review: `?sistema` on web, or a build with EXPO_PUBLIC_VAULT_SPECIMEN=1. */
const SHOW_SPECIMEN =
  process.env.EXPO_PUBLIC_VAULT_SPECIMEN === '1' ||
  (Platform.OS === 'web' && typeof window !== 'undefined' && /[?&]sistema\b/.test(window.location.search));

/**
 * Demo session: the dial opens the workspace in memory. No accounts, no
 * credentials; workspace edits are saved only on this device.
 */
export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const ready = fontsLoaded || !!fontError;
  const [phase, setPhase] = useState<Phase>('splash');
  const [lockActive, setLockActive] = useState(false);

  useEffect(() => {
    if (!ready) return;
    hydrateWorkspace().catch(() => undefined);
    NativeSplash.hideAsync().catch(() => undefined);
  }, [ready]);

  // Keep the native splash's paper colour until the typefaces are in.
  if (!ready) return <View style={[styles.root, styles.paper]} />;
  // Idempotent; must run before the first text renders.
  setFontsAvailable(fontsLoaded && !fontError);

  if (SHOW_SPECIMEN) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Specimen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <View style={styles.root}>
          <StatusBar style={phase === 'splash' && !lockActive ? 'dark' : 'light'} />
          {phase === 'workspace' ? (
            <WorkspaceScreen
              onLock={() => {
                setLockActive(true);
                setPhase('lock');
              }}
            />
          ) : (
            <LockScreen active={lockActive} onUnlocked={() => setPhase('workspace')} />
          )}
          {phase === 'splash' ? (
            <SplashScreen onReveal={() => setLockActive(true)} onDone={() => setPhase('lock')} />
          ) : null}
        </View>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  paper: {
    backgroundColor: palette.paper,
  },
});
