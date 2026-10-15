import { useFonts } from 'expo-font';
import * as NativeSplash from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fontAssets, setFontsAvailable } from './design/fonts';
import { ToastProvider } from './design/Toast';
import { palette } from './design/tokens';
import { LockScreen } from './screens/LockScreen';
import { SplashScreen } from './screens/SplashScreen';
import { WorkspaceScreen } from './screens/WorkspaceScreen';
import { hydrateWorkspace } from './state/store';

NativeSplash.preventAutoHideAsync().catch(() => undefined);

type Phase = 'loading' | 'splash' | 'lock' | 'workspace';

/**
 * Demo session: the dial opens the workspace in memory. No accounts, no
 * credentials; workspace edits are saved only on this device.
 */
export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [phase, setPhase] = useState<Phase>('loading');
  const [lockActive, setLockActive] = useState(false);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    setFontsAvailable(fontsLoaded && !fontError);
    hydrateWorkspace().catch(() => undefined);
    setPhase('splash');
    NativeSplash.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);

  if (phase === 'loading') return <View style={[styles.root, styles.paper]} />;

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
