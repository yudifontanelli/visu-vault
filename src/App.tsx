import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LockScreen } from './screens/LockScreen';
import { WorkspaceScreen } from './screens/WorkspaceScreen';
import { colors } from './theme';

/**
 * Demo session only: unlocking the dial opens the workspace in memory.
 * No credentials are stored and no private data is fetched.
 */
export default function App() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        {unlocked ? (
          <WorkspaceScreen onLock={() => setUnlocked(false)} />
        ) : (
          <LockScreen onUnlocked={() => setUnlocked(true)} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
});
