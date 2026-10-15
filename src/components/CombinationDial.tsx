import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityActionEvent,
  Animated,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { useAnimatedValue } from '../hooks/useAnimatedValue';
import {
  DEGREES_PER_STEP,
  DIAL_STEPS,
  angleDelta,
  formatStep,
  pointerAngle,
  snapRotation,
  valueAtRotation,
} from '../lib/combination';
import { haptic } from '../design/haptics';
import { svgFont } from '../design/fonts';
import { palette } from '../design/tokens';

/** Dial materials: graphite metal, paper-white engraving. */
const colors = {
  graphite800: palette.graphite800,
  graphite700: palette.graphite700,
  graphite600: palette.graphite600,
  graphite500: palette.graphite500,
  graphite400: palette.graphite400,
  offWhite: palette.paper,
  offWhiteDim: palette.paperDim,
};

/** Letters printed on the inner ring, same visual size as the numbers. */
const BRAND_LETTERS = 'VISUVAULT'.split('');

// All geometry is authored in a 400×400 viewBox and scaled to `size`.
const VB = 400;
const C = VB / 2;
const R_BEZEL = 194;
const R_GROOVE = 178;
const R_FACE_EDGE = 172;
const R_FACE = 162;
const R_TICK_OUTER = 156;
const R_NUMBERS = 122;
const R_DIVIDER = 102;
const R_LETTERS = 84;
const R_INNER_RING = 66;
const R_KNOB = 54;
const R_KNOB_CAP = 44;
/** Shared by numbers and letters so both read at the same visual size. */
const SCALE_FONT_SIZE = 19;

const useNativeDriver = Platform.OS !== 'web';
const isWeb = Platform.OS === 'web';

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Point on a circle of radius `r` at `deg` (0° = 12 o'clock, clockwise), rounded to keep the SVG lean. */
function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: round2(C + r * Math.sin(rad)), y: round2(C - r * Math.cos(rad)) };
}

export interface CombinationDialProps {
  size: number;
  /** Called when the user presses the centre knob (or Enter) to register the current number. */
  onConfirm: (value: number) => void;
  onValueChange?: (value: number) => void;
  disabled?: boolean;
  /** When true, plays the unlock animation once and then calls `onUnlockAnimationEnd`. */
  unlocked?: boolean;
  onUnlockAnimationEnd?: () => void;
  /** Bumped by the parent after a wrong entry to play the error feedback. */
  errorSignal?: number;
}

function CombinationDialComponent({
  size,
  onConfirm,
  onValueChange,
  disabled = false,
  unlocked = false,
  onUnlockAnimationEnd,
  errorSignal = 0,
}: CombinationDialProps) {
  const rotation = useAnimatedValue(0);
  const knobPress = useAnimatedValue(0);
  const boltsOut = useAnimatedValue(0);
  const glow = useAnimatedValue(0);

  const rotationRef = useRef(0);
  /** Where the dial is heading (or resting): lets rapid key presses accumulate. */
  const targetRef = useRef(0);
  const valueRef = useRef(0);
  const unlockingRef = useRef(false);
  const [value, setValue] = useState(0);

  const containerRef = useRef<View>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  // Keep the latest props reachable from the (stable) PanResponder.
  const propsRef = useRef({ onConfirm, onValueChange, onUnlockAnimationEnd, disabled, size });
  useLayoutEffect(() => {
    propsRef.current = { onConfirm, onValueChange, onUnlockAnimationEnd, disabled, size };
  });

  useEffect(() => {
    const id = rotation.addListener(({ value: deg }) => {
      rotationRef.current = deg;
      const next = valueAtRotation(deg);
      if (next !== valueRef.current) {
        valueRef.current = next;
        setValue(next);
        propsRef.current.onValueChange?.(next);
        if (!unlockingRef.current) haptic('tick');
      }
    });
    return () => rotation.removeListener(id);
  }, [rotation]);

  /**
   * Caches the dial centre in page coordinates (the space PanResponder reports in).
   * react-native-web's measureInWindow is deferred with setTimeout, so on web we read
   * the DOM rect synchronously; on native (Fabric) measureInWindow is synchronous.
   */
  const measureCenter = useCallback(() => {
    const node = containerRef.current as unknown as HTMLElement | null;
    if (isWeb && node && typeof node.getBoundingClientRect === 'function') {
      const r = node.getBoundingClientRect();
      centerRef.current = {
        x: r.left + window.scrollX + r.width / 2,
        y: r.top + window.scrollY + r.height / 2,
      };
      return;
    }
    containerRef.current?.measureInWindow((x, y, w, h) => {
      centerRef.current = { x: x + w / 2, y: y + h / 2 };
    });
  }, []);

  const settle = useCallback(
    (toValue: number) => {
      targetRef.current = toValue;
      Animated.spring(rotation, {
        toValue,
        useNativeDriver,
        speed: 28,
        bounciness: 5,
      }).start();
    },
    [rotation],
  );

  const pressKnob = useCallback(() => {
    if (propsRef.current.disabled) return;
    haptic('press');
    Animated.sequence([
      Animated.timing(knobPress, { toValue: 1, duration: 90, useNativeDriver }),
      Animated.spring(knobPress, { toValue: 0, useNativeDriver, speed: 30, bounciness: 8 }),
    ]).start();
    // Use the resting target, not the in-flight spring value, so a fast
    // "arrows then Enter" registers the number the dial is settling on.
    propsRef.current.onConfirm(valueAtRotation(targetRef.current));
  }, [knobPress]);

  /** Moves the dial by whole steps; positive `steps` increases the number under the indicator. */
  const stepBy = useCallback(
    (steps: number) => {
      if (propsRef.current.disabled) return;
      rotation.stopAnimation();
      settle(targetRef.current - steps * DEGREES_PER_STEP);
    },
    [rotation, settle],
  );

  const gesture = useRef({ lastAngle: 0, startDist: 0 });

  // Created once; handlers read live values through refs at gesture time, never
  // during render, so the compiler's ref-in-render check does not apply here.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => !propsRef.current.disabled,
      onMoveShouldSetPanResponder: () => !propsRef.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (_evt, g) => {
        rotation.stopAnimation();
        measureCenter();
        const dx = g.x0 - centerRef.current.x;
        const dy = g.y0 - centerRef.current.y;
        gesture.current = {
          lastAngle: pointerAngle(dx, dy),
          startDist: Math.hypot(dx, dy),
        };
      },
      onPanResponderMove: (_evt, g) => {
        const dx = g.moveX - centerRef.current.x;
        const dy = g.moveY - centerRef.current.y;
        // Near the axis the angle is unstable; ignore those samples.
        if (Math.hypot(dx, dy) < propsRef.current.size * 0.06) return;
        const angle = pointerAngle(dx, dy);
        const delta = angleDelta(gesture.current.lastAngle, angle);
        gesture.current.lastAngle = angle;
        rotation.setValue(rotationRef.current + delta);
      },
      onPanResponderRelease: (_evt, g) => {
        const knobRadiusPx = (R_KNOB / VB) * propsRef.current.size;
        const isTap = Math.hypot(g.dx, g.dy) < 6;
        settle(snapRotation(rotationRef.current));
        if (isTap && gesture.current.startDist <= knobRadiusPx) pressKnob();
      },
      onPanResponderTerminate: () => settle(snapRotation(rotationRef.current)),
    }),
  );

  // Keyboard control for Windows / macOS (web build).
  useEffect(() => {
    if (!isWeb || disabled || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      // Enter / Space on a focused button belong to that button, not to the dial.
      const onControl = !!target?.closest?.('button, a, [role="button"], [role="link"]');
      const fast = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        stepBy(fast);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        stepBy(-fast);
      } else if ((e.key === 'Enter' || e.key === ' ') && !onControl) {
        e.preventDefault();
        pressKnob();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [disabled, pressKnob, stepBy]);

  // Mouse wheel / trackpad scrolling turns the dial on desktop.
  useEffect(() => {
    if (!isWeb || disabled) return;
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;
    const PX_PER_STEP = 50;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Normalise line/page deltas (Firefox) to pixels.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      acc += e.deltaY * unit;
      const steps = Math.trunc(acc / PX_PER_STEP);
      if (steps !== 0) {
        acc -= steps * PX_PER_STEP;
        stepBy(-steps);
      }
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [disabled, stepBy]);

  // Error feedback: a short recoil of the dial.
  useEffect(() => {
    if (errorSignal === 0) return;
    haptic('error');
    rotation.stopAnimation();
    const base = snapRotation(rotationRef.current);
    targetRef.current = base;
    Animated.sequence([
      Animated.timing(rotation, { toValue: base + 6, duration: 70, useNativeDriver }),
      Animated.timing(rotation, { toValue: base - 6, duration: 90, useNativeDriver }),
      Animated.spring(rotation, { toValue: base, useNativeDriver, speed: 24, bounciness: 10 }),
    ]).start();
  }, [errorSignal, rotation]);

  // Unlock: the dial spins one full turn, the indicator lights up and the bolts retract.
  useEffect(() => {
    if (!unlocked) return;
    unlockingRef.current = true;
    haptic('success');
    rotation.stopAnimation();
    const base = snapRotation(rotationRef.current);
    targetRef.current = base - 360;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(glow, { toValue: 1, duration: 260, useNativeDriver }),
        Animated.timing(rotation, {
          toValue: base - 360,
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver,
        }),
      ]),
      Animated.timing(boltsOut, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver,
      }),
    ]).start(({ finished }) => {
      if (finished) propsRef.current.onUnlockAnimationEnd?.();
    });
  }, [unlocked, boltsOut, glow, rotation]);

  const onAccessibilityAction = useCallback(
    (e: AccessibilityActionEvent) => {
      if (e.nativeEvent.actionName === 'increment') stepBy(1);
      else if (e.nativeEvent.actionName === 'decrement') stepBy(-1);
      else if (e.nativeEvent.actionName === 'activate') pressKnob();
    },
    [pressKnob, stepBy],
  );

  const rotate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
    extrapolate: 'extend',
  });
  const knobScale = knobPress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] });
  const boltScale = boltsOut.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const boltOpacity = boltsOut.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 0.35, 0] });

  return (
    <View
      ref={containerRef}
      onLayout={measureCenter}
      style={[styles.container, { width: size, height: size }, isWeb && webInteractive]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Disco de combinação VAULT"
      accessibilityHint="Gire para escolher um número e pressione o centro para registrar."
      accessibilityValue={{ text: formatStep(value) }}
      accessibilityActions={[
        { name: 'increment' },
        { name: 'decrement' },
        { name: 'activate' },
      ]}
      onAccessibilityAction={onAccessibilityAction}
      {...panResponder.panHandlers}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`} style={StyleSheet.absoluteFill}>
        <StaticBase />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: boltOpacity, transform: [{ scale: boltScale }] }]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
          <Bolts />
        </Svg>
      </Animated.View>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
          <DialFace />
        </Svg>
      </Animated.View>

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
          <Lighting />
        </Svg>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ scale: knobScale }] }]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
          <KnobCap />
        </Svg>
      </Animated.View>

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
          <Indicator lit={false} />
        </Svg>
      </View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: glow }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
          <Indicator lit />
        </Svg>
      </Animated.View>
    </View>
  );
}

export const CombinationDial = memo(CombinationDialComponent);

const webInteractive = {
  cursor: 'grab',
  userSelect: 'none',
  touchAction: 'none',
} as unknown as object;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});

/* ------------------------------------------------------------------------ */
/* Static SVG layers. They never re-render after mount (no props).          */
/* ------------------------------------------------------------------------ */

const StaticBase = memo(function StaticBase() {
  return (
    <>
      <Defs>
        <RadialGradient id="dropShadow" cx="50%" cy="50%" r="50%">
          <Stop offset="0.82" stopColor="#000" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#000" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="bezel" x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor="#5E5B56" />
          <Stop offset="0.45" stopColor={colors.graphite700} />
          <Stop offset="1" stopColor="#080808" />
        </LinearGradient>
        <LinearGradient id="groove" x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor="#070706" />
          <Stop offset="1" stopColor="#3D3B38" />
        </LinearGradient>
      </Defs>
      <Circle cx={C} cy={C + 5} r={R_BEZEL + 4} fill="url(#dropShadow)" />
      <Circle cx={C} cy={C} r={R_BEZEL} fill="url(#bezel)" />
      <Circle cx={C} cy={C} r={R_BEZEL - 1} fill="none" stroke="#ffffff" strokeOpacity={0.07} />
      <Circle cx={C} cy={C} r={R_GROOVE} fill="url(#groove)" />
      <Inscription />
    </>
  );
});

/**
 * Engraved maker's inscription on the fixed bezel, read like a coin: clockwise
 * across the top half, upright along the bottom. Gaps leave room for the
 * indicator and the four bolts.
 */
const INSCRIPTION: { text: string; center: number; flip?: boolean }[] = [
  { text: 'COFRE', center: 336 },
  { text: 'Nº 01', center: 22 },
  { text: 'ARTE · MODA · CINEMA', center: 90 },
  { text: 'VISUVAULT — ARQUIVO PRIVADO', center: 180, flip: true },
  { text: 'CULTURA VISUAL', center: 270 },
];
const R_INSCRIPTION = 186;
const INSCRIPTION_SIZE = 7.2;
const INSCRIPTION_STEP = 1.95; // degrees per character

const Inscription = memo(function Inscription() {
  const glyphs = useMemo(() => {
    const out: { key: string; ch: string; angle: number; flip: boolean }[] = [];
    for (const seg of INSCRIPTION) {
      const chars = seg.text.split('');
      chars.forEach((ch, i) => {
        if (ch === ' ') return;
        const offset = (i - (chars.length - 1) / 2) * INSCRIPTION_STEP;
        out.push({ key: `${seg.center}-${i}`, ch, angle: seg.flip ? seg.center - offset : seg.center + offset, flip: !!seg.flip });
      });
    }
    return out;
  }, []);
  return (
    <>
      {glyphs.map((g) => (
        <SvgText
          key={g.key}
          x={C}
          y={(g.flip ? C + R_INSCRIPTION : C - R_INSCRIPTION) + INSCRIPTION_SIZE * 0.36}
          transform={`rotate(${round2(g.flip ? g.angle - 180 : g.angle)} ${C} ${C})`}
          fill={colors.offWhite}
          fillOpacity={0.5}
          fontSize={INSCRIPTION_SIZE}
          fontFamily={svgFont.mono}
          textAnchor="middle"
        >
          {g.ch}
        </SvgText>
      ))}
    </>
  );
});

const Bolts = memo(function Bolts() {
  // Four locking bolts seated in the bezel at the diagonals.
  return (
    <>
      <Defs>
        <LinearGradient id="bolt" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={colors.graphite500} />
          <Stop offset="0.5" stopColor={colors.offWhiteDim} />
          <Stop offset="1" stopColor={colors.graphite600} />
        </LinearGradient>
      </Defs>
      {[45, 135, 225, 315].map((deg) => (
        <G key={deg} transform={`rotate(${deg} ${C} ${C})`}>
          <Rect
            x={C - 5}
            y={C - R_BEZEL + 2}
            width={10}
            height={13}
            rx={2}
            fill="url(#bolt)"
            opacity={0.85}
          />
        </G>
      ))}
    </>
  );
});

const DialFace = memo(function DialFace() {
  const knurl = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 180; i++) {
      const deg = i * 2;
      const a = polar(R_FACE + 1, deg);
      const b = polar(R_FACE_EDGE - 1, deg);
      lines.push(
        <Line
          key={i}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={i % 2 ? '#0C0C0B' : colors.graphite500}
          strokeWidth={1.4}
        />,
      );
    }
    return lines;
  }, []);

  const ticks = useMemo(() => {
    const out = [];
    for (let i = 0; i < DIAL_STEPS; i++) {
      const major = i % 10 === 0;
      const mid = i % 5 === 0;
      const len = major ? 20 : mid ? 13 : 8;
      const deg = i * DEGREES_PER_STEP;
      const a = polar(R_TICK_OUTER, deg);
      const b = polar(R_TICK_OUTER - len, deg);
      out.push(
        <Line
          key={i}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={colors.offWhite}
          strokeOpacity={major ? 0.95 : mid ? 0.75 : 0.45}
          strokeWidth={major ? 2.4 : mid ? 1.8 : 1.1}
          strokeLinecap="round"
        />,
      );
    }
    return out;
  }, []);

  const numbers = useMemo(
    () =>
      Array.from({ length: 10 }, (_, k) => {
        const n = k * 10;
        const deg = n * DEGREES_PER_STEP;
        return (
          <SvgText
            key={n}
            x={C}
            y={C - R_NUMBERS + SCALE_FONT_SIZE * 0.36}
            transform={`rotate(${deg} ${C} ${C})`}
            fill={colors.offWhite}
            fontSize={SCALE_FONT_SIZE}
            fontWeight="600"
            fontFamily={svgFont.sans}
            textAnchor="middle"
            letterSpacing={1}
          >
            {formatStep(n)}
          </SvgText>
        );
      }),
    [],
  );

  const letters = useMemo(
    () =>
      BRAND_LETTERS.map((ch, i) => {
        const deg = (360 / BRAND_LETTERS.length) * i;
        return (
          <SvgText
            key={`${ch}${i}`}
            x={C}
            y={C - R_LETTERS + SCALE_FONT_SIZE * 0.36}
            transform={`rotate(${deg} ${C} ${C})`}
            fill={colors.offWhite}
            fontSize={SCALE_FONT_SIZE}
            fontWeight="600"
            fontFamily={svgFont.sans}
            textAnchor="middle"
          >
            {ch}
          </SvgText>
        );
      }),
    [],
  );

  const knobRidges = useMemo(() => {
    const out = [];
    for (let i = 0; i < 48; i++) {
      const deg = i * 7.5;
      const a = polar(R_KNOB_CAP + 1, deg);
      const b = polar(R_KNOB - 1, deg);
      out.push(
        <Line
          key={i}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={i % 2 ? '#0B0B0A' : colors.graphite400}
          strokeWidth={2}
        />,
      );
    }
    return out;
  }, []);

  return (
    <>
      <Defs>
        <RadialGradient id="face" cx="50%" cy="50%" r="50%" fx="38%" fy="30%">
          <Stop offset="0" stopColor="#363431" />
          <Stop offset="0.7" stopColor={colors.graphite800} />
          <Stop offset="1" stopColor="#111010" />
        </RadialGradient>
        <RadialGradient id="knobBase" cx="50%" cy="50%" r="50%">
          <Stop offset="0.75" stopColor={colors.graphite600} />
          <Stop offset="1" stopColor="#0B0B0A" />
        </RadialGradient>
      </Defs>
      <Circle cx={C} cy={C} r={R_FACE_EDGE} fill="#0F0E0E" />
      {knurl}
      <Circle cx={C} cy={C} r={R_FACE} fill="url(#face)" />
      <Circle cx={C} cy={C} r={R_FACE - 1} fill="none" stroke="#ffffff" strokeOpacity={0.06} />
      {ticks}
      {numbers}
      <Circle cx={C} cy={C} r={R_DIVIDER} fill="none" stroke={colors.offWhite} strokeOpacity={0.18} />
      {letters}
      <Circle cx={C} cy={C} r={R_INNER_RING} fill="none" stroke={colors.offWhite} strokeOpacity={0.12} />
      <Circle cx={C} cy={C} r={R_KNOB + 2} fill="#000" fillOpacity={0.45} />
      <Circle cx={C} cy={C} r={R_KNOB} fill="url(#knobBase)" />
      {knobRidges}
    </>
  );
});

/** Fixed light: highlights stay put while the dial turns underneath, selling the 2.5D depth. */
const Lighting = memo(function Lighting() {
  return (
    <>
      <Defs>
        <LinearGradient id="sheen" x1="0.15" y1="0.05" x2="0.85" y2="0.95">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.13" />
          <Stop offset="0.42" stopColor="#ffffff" stopOpacity="0.02" />
          <Stop offset="0.6" stopColor="#000000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.38" />
        </LinearGradient>
        <LinearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.5" />
        </LinearGradient>
      </Defs>
      <Circle cx={C} cy={C} r={R_FACE_EDGE} fill="url(#sheen)" />
      <Circle cx={C} cy={C} r={R_FACE_EDGE - 0.5} fill="none" stroke="url(#rim)" strokeWidth={1.2} />
    </>
  );
});

/** Raised centre knob: a solid, machined cap (no key cylinder). */
const KnobCap = memo(function KnobCap() {
  return (
    <>
      <Defs>
        <RadialGradient id="cap" cx="50%" cy="50%" r="50%" fx="36%" fy="28%">
          <Stop offset="0" stopColor="#6C6964" />
          <Stop offset="0.55" stopColor={colors.graphite700} />
          <Stop offset="1" stopColor="#141413" />
        </RadialGradient>
        <LinearGradient id="capRim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.6" />
        </LinearGradient>
      </Defs>
      <Circle cx={C} cy={C + 3} r={R_KNOB_CAP + 1} fill="#000" fillOpacity={0.5} />
      <Circle cx={C} cy={C} r={R_KNOB_CAP} fill="url(#cap)" />
      <Circle cx={C} cy={C} r={R_KNOB_CAP - 0.6} fill="none" stroke="url(#capRim)" strokeWidth={1.2} />
      {[34, 24, 14].map((r) => (
        <Circle key={r} cx={C} cy={C} r={r} fill="none" stroke="#ffffff" strokeOpacity={0.05} />
      ))}
    </>
  );
});

const Indicator = memo(function Indicator({ lit }: { lit: boolean }) {
  const top = C - R_BEZEL + 3;
  const tip = C - R_FACE_EDGE + 4;
  const fill = lit ? '#FFFFFF' : colors.offWhite;
  return (
    <>
      <Path d={`M ${C - 9} ${top} L ${C + 9} ${top} L ${C} ${tip} Z`} fill={fill} />
      {lit && (
        <Circle
          cx={C}
          cy={C}
          r={R_GROOVE - 2}
          fill="none"
          stroke={colors.offWhite}
          strokeOpacity={0.55}
          strokeWidth={1.5}
        />
      )}
    </>
  );
});
