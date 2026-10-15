import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, View } from 'react-native';

import { haptic } from '../../design/haptics';
import { useNativeDriver } from '../../design/motion';
import { CropMarks, Grain } from '../../design/Sheet';
import { SurfaceProvider, T } from '../../design/Typography';
import { color, palette, shadow } from '../../design/tokens';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import { plateById } from '../library/catalog';
import { PlateArt } from '../library/PlateArt';
import { BoardItem, clampToBoard, ITEM_SIZE, KIND_LABEL, snap } from './model';

const DOUBLE_TAP_MS = 320;

interface Props {
  item: BoardItem;
  index: number;
  selected: boolean;
  snapToGrid: boolean;
  getZoom: () => number;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onLift: (id: string) => void;
  onDrop: (id: string, x: number, y: number) => void;
}

/**
 * One object on the table. Drag to move (snaps to the grid if enabled),
 * tap to select, double-tap to edit.
 */
export const BoardItemView = memo(function BoardItemView({ item, index, selected, snapToGrid, getZoom, onSelect, onOpen, onLift, onDrop }: Props) {
  const [pos] = useState(() => new Animated.ValueXY({ x: item.x, y: item.y }));
  const lift = useAnimatedValue(0);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const start = useRef({ x: item.x, y: item.y });
  const lastTap = useRef(0);

  const latest = useRef({ item, snapToGrid, getZoom, onSelect, onOpen, onLift, onDrop });
  useLayoutEffect(() => {
    latest.current = { item, snapToGrid, getZoom, onSelect, onOpen, onLift, onDrop };
  });

  // Follow the store when the item moves for other reasons (arrange, duplicate…).
  useEffect(() => {
    if (draggingRef.current) return;
    Animated.spring(pos, { toValue: { x: item.x, y: item.y }, useNativeDriver, speed: 22, bounciness: 4 }).start();
  }, [item.x, item.y, pos]);

  // Handlers only touch refs when a gesture happens, never during render.
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        const it = latest.current.item;
        pos.stopAnimation();
        start.current = { x: it.x, y: it.y };
      },
      onPanResponderMove: (_e, g) => {
        if (!draggingRef.current) {
          if (Math.hypot(g.dx, g.dy) < 4) return;
          draggingRef.current = true;
          setDragging(true);
          haptic('lift');
          latest.current.onLift(latest.current.item.id);
          Animated.timing(lift, { toValue: 1, duration: 120, useNativeDriver }).start();
        }
        const z = latest.current.getZoom();
        pos.setValue({ x: start.current.x + g.dx / z, y: start.current.y + g.dy / z });
      },
      onPanResponderRelease: (_e, g) => {
        const { item: it, snapToGrid: snapOn, getZoom: zoomOf } = latest.current;
        if (!draggingRef.current) {
          const now = Date.now();
          if (now - lastTap.current < DOUBLE_TAP_MS) latest.current.onOpen(it.id);
          else latest.current.onSelect(it.id);
          lastTap.current = now;
          return;
        }
        const z = zoomOf();
        let x = start.current.x + g.dx / z;
        let y = start.current.y + g.dy / z;
        if (snapOn) {
          x = snap(x);
          y = snap(y);
        }
        const c = clampToBoard(it.kind, Math.round(x), Math.round(y));
        Animated.spring(pos, { toValue: c, useNativeDriver, speed: 26, bounciness: 6 }).start();
        Animated.timing(lift, { toValue: 0, duration: 160, useNativeDriver }).start();
        draggingRef.current = false;
        setDragging(false);
        haptic('select');
        latest.current.onDrop(it.id, c.x, c.y);
        latest.current.onSelect(it.id);
      },
      onPanResponderTerminate: () => {
        draggingRef.current = false;
        setDragging(false);
        Animated.timing(lift, { toValue: 0, duration: 160, useNativeDriver }).start();
        Animated.spring(pos, { toValue: { x: latest.current.item.x, y: latest.current.item.y }, useNativeDriver }).start();
      },
    }),
  );

  const { w, h } = ITEM_SIZE[item.kind];
  const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <Animated.View
      {...responder.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${KIND_LABEL[item.kind]}: ${item.text}`}
      accessibilityHint="Arraste para mover. Toque duas vezes para editar."
      accessibilityState={{ selected }}
      style={[
        styles.item,
        { width: w, height: h, zIndex: dragging ? 100000 : item.z, transform: [...pos.getTranslateTransform(), { scale }] },
        dragging ? styles.dragging : item.kind !== 'heading' && styles.resting,
        webGrab,
      ]}
    >
      <ItemFace item={item} index={index} />
      {selected ? <CropMarks inset={-10} length={12} tint={palette.paper} /> : null}
      {selected ? <View pointerEvents="none" style={styles.selectedOutline} /> : null}
    </Animated.View>
  );
});

const ItemFace = memo(function ItemFace({ item, index }: { item: BoardItem; index: number }) {
  const label = `${KIND_LABEL[item.kind]} · ${String(index + 1).padStart(2, '0')}`;
  switch (item.kind) {
    case 'note':
      return (
        <View style={[styles.fill, styles.note]}>
          <Grain tone="dark" opacity={0.45} />
          <SurfaceProvider value="paper">
            <T variant="micro" tone="secondary">
              {label}
            </T>
            <T variant="bodySm" size={14} style={styles.noteText} numberOfLines={6}>
              {item.text}
            </T>
          </SurfaceProvider>
        </View>
      );
    case 'reference':
      return (
        <View style={[styles.fill, styles.reference]}>
          <View style={styles.refHead}>
            <T variant="micro" tone="muted">
              {label}
            </T>
            <T variant="label" tone="secondary">
              ↗
            </T>
          </View>
          <T variant="heading" size={19} numberOfLines={2}>
            {item.text}
          </T>
          <T variant="micro" tone="muted" numberOfLines={1}>
            {item.source || 'Sem fonte'}
          </T>
        </View>
      );
    case 'plate': {
      const plate = plateById(item.plateId);
      return (
        <View style={[styles.fill, styles.plate]}>
          <SurfaceProvider value="paper">
            {plate ? <PlateArt plate={plate} width={200} detail={0.6} /> : <View style={styles.missing} />}
            <View style={styles.plateCaption}>
              <T variant="micro" tone="secondary">
                {plate?.code ?? 'Imagem'}
              </T>
              <T variant="caption" size={13} numberOfLines={1} style={styles.flex}>
                {item.text}
              </T>
            </View>
          </SurfaceProvider>
        </View>
      );
    }
    case 'heading':
      return (
        <View style={[styles.fill, styles.heading]}>
          <T variant="title" size={32} numberOfLines={1}>
            {item.text}
          </T>
          <View style={styles.headingRule} />
        </View>
      );
  }
});

const webGrab = Platform.OS === 'web' ? ({ cursor: 'grab', userSelect: 'none', touchAction: 'none' } as unknown as object) : null;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  item: { position: 'absolute', left: 0, top: 0 },
  resting: { boxShadow: shadow.item },
  dragging: { boxShadow: shadow.lift },
  fill: { flex: 1, overflow: 'hidden' },
  note: { backgroundColor: palette.paper, padding: 14, gap: 8 },
  noteText: { color: palette.ink },
  reference: { backgroundColor: palette.ink2, borderWidth: StyleSheet.hairlineWidth, borderColor: color.lineStrong, padding: 14, gap: 8 },
  refHead: { flexDirection: 'row', justifyContent: 'space-between' },
  plate: { backgroundColor: palette.paper, padding: 8, gap: 8 },
  missing: { width: 200, height: 250, backgroundColor: palette.paperDim },
  plateCaption: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  heading: { justifyContent: 'flex-end', paddingBottom: 8 },
  headingRule: { height: 1.5, backgroundColor: palette.paper, marginTop: 6, width: '100%' },
  selectedOutline: { position: 'absolute', left: -4, right: -4, top: -4, bottom: -4, borderWidth: 1, borderColor: palette.paper },
});
