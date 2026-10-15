import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { VaultWordmark } from '../components/VaultWordmark';
import { EscutcheonGroup, RegistrationMark } from '../design/engravings/Engravings';
import { KEYHOLE_CENTER_OFFSET, keyholePath } from '../design/engravings/geometry';
import { ease, useNativeDriver, useReducedMotion } from '../design/motion';
import { Rule } from '../design/primitives';
import { Grain } from '../design/Sheet';
import { SurfaceProvider, T } from '../design/Typography';
import { palette } from '../design/tokens';
import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { useResponsive } from '../hooks/useResponsive';
import { roman } from '../lib/dates';

const INTRO_MS = 1100;
const HOLD_MS = 800;
const FADE_MS = 220;
const ZOOM_MS = 950;

/**
 * Brand splash: a printed title page. The keyhole in the engraved escutcheon is
 * a real opening — at the end it widens and the lock screen appears through it.
 * Tap or click to skip. Reduced motion: a plain cross-fade.
 */
export function SplashScreen({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const { width: W, height: H, isPhone } = useResponsive();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const intro = useAnimatedValue(0);
  const fade = useAnimatedValue(0);
  const overlay = useAnimatedValue(1);
  const [zoom, setZoom] = useState(1);
  const phase = useRef<'intro' | 'reveal' | 'done'>('intro');

  const r = Math.round(Math.min(26, Math.max(15, Math.min(W, H) * 0.034)));
  const kx = W / 2;
  const ky = Math.round(H * (isPhone ? 0.4 : 0.42)) - r * KEYHOLE_CENTER_OFFSET;
  const maxZoom = (Math.hypot(Math.max(kx, W - kx), Math.max(ky, H - ky)) / r) * 1.08;

  const callbacks = useRef({ onReveal, onDone });
  useEffect(() => {
    callbacks.current = { onReveal, onDone };
  });

  const reveal = useCallback(() => {
    if (phase.current !== 'intro') return;
    phase.current = 'reveal';
    intro.stopAnimation();
    callbacks.current.onReveal();
    if (reduced) {
      Animated.timing(overlay, { toValue: 0, duration: 320, easing: ease.standard, useNativeDriver }).start(() => {
        phase.current = 'done';
        callbacks.current.onDone();
      });
      return;
    }
    Animated.timing(fade, { toValue: 1, duration: FADE_MS, easing: ease.exit, useNativeDriver }).start();
    // The hole grows on a logarithmic scale so the zoom feels uniform, then the layer goes.
    const progress = new Animated.Value(0);
    const id = progress.addListener(({ value }) => setZoom(Math.pow(maxZoom, value)));
    Animated.timing(progress, {
      toValue: 1,
      duration: ZOOM_MS,
      delay: FADE_MS * 0.6,
      easing: Easing.bezier(0.55, 0, 0.75, 0.2),
      useNativeDriver: false,
    }).start(() => {
      progress.removeListener(id);
      phase.current = 'done';
      callbacks.current.onDone();
    });
  }, [fade, intro, maxZoom, overlay, reduced]);

  useEffect(() => {
    const anim = Animated.timing(intro, { toValue: 1, duration: INTRO_MS, easing: ease.enter, useNativeDriver });
    anim.start();
    const t = setTimeout(reveal, INTRO_MS + HOLD_MS);
    return () => {
      clearTimeout(t);
      anim.stop();
    };
  }, [intro, reveal]);

  const at = (from: number, to: number) => intro.interpolate({ inputRange: [from, to], outputRange: [0, 1], extrapolate: 'clamp' });
  const contentOpacity = fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const rise = (from: number) => ({
    opacity: at(from, from + 0.45),
    transform: [{ translateY: at(from, from + 0.45).interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });

  const hole = keyholePath(kx, ky, r * zoom);
  const paper = `M0 0 H${W} V${H} H0 Z ${hole}`;
  const margin = isPhone ? 20 : 40;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlay }]} pointerEvents="box-none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path d={paper} fill={palette.paper} fillRule="evenodd" />
      </Svg>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: contentOpacity }]} pointerEvents="none">
        <Grain tone="dark" opacity={0.6} />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: at(0.15, 0.7) }]}>
          <Svg width={W} height={H}>
            <EscutcheonGroup cx={kx} cy={ky} r={r} stroke={palette.ink} />
          </Svg>
        </Animated.View>

        <SurfaceProvider value="paper">
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.page,
              { paddingTop: insets.top + (isPhone ? 14 : 28), paddingBottom: insets.bottom + (isPhone ? 14 : 28), paddingHorizontal: margin },
            ]}
          >
            <Animated.View style={rise(0)}>
              <View style={styles.bar}>
                <T variant="micro">VISUVAULT — Arquivo privado</T>
                <T variant="micro">Nº 01 · {roman(new Date().getFullYear())}</T>
              </View>
              <Rule weight="double" strong style={styles.rule} />
            </Animated.View>

            <Animated.View style={rise(0.6)}>
              <Rule strong />
              <View style={[styles.bar, styles.footerBar]}>
                <T variant="micro">{isPhone ? 'Sistema editorial' : 'Sistema editorial proprietário'}</T>
                <T variant="micro">{Platform.OS === 'web' && !isPhone ? 'Clique para entrar' : 'Toque para entrar'}</T>
              </View>
            </Animated.View>
          </View>

          {/* Title block sits just under the escutcheon (plate bottom = 9r below the keyhole centre). */}
          <View style={[styles.center, { top: ky + 9 * r + 26 }]}>
            <Animated.View style={rise(0.35)}>
              <VaultWordmark size={isPhone ? 44 : 64} align="center" publisher={false} />
            </Animated.View>
            <Animated.View style={rise(0.5)}>
              <T variant="subtitle" align="center" tone="secondary" style={styles.tagline}>
                {'Arquivo privado de arte, moda, cinema e cultura\u00a0visual.'}
              </T>
            </Animated.View>
          </View>
        </SurfaceProvider>

        {!isPhone ? (
          <>
            <View style={[styles.mark, { left: 12, top: insets.top + 12 }]}>
              <RegistrationMark />
            </View>
            <View style={[styles.mark, { right: 12, top: insets.top + 12 }]}>
              <RegistrationMark />
            </View>
            <View style={[styles.mark, { left: 12, bottom: insets.bottom + 12 }]}>
              <RegistrationMark />
            </View>
            <View style={[styles.mark, { right: 12, bottom: insets.bottom + 12 }]}>
              <RegistrationMark />
            </View>
          </>
        ) : null}
      </Animated.View>

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={reveal}
        accessibilityRole="button"
        accessibilityLabel="VAULT, arquivo privado da VISUVAULT. Toque para entrar."
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rule: { marginTop: 10 },
  center: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  tagline: { maxWidth: 440, marginTop: 6 },
  page: { justifyContent: 'space-between' },
  footerBar: { marginTop: 10 },
  mark: { position: 'absolute' },
});
