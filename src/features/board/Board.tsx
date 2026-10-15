import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { RegistrationMark } from '../../design/engravings/Engravings';
import { T } from '../../design/Typography';
import { color, palette } from '../../design/tokens';
import { BOARD, BoardItem } from './model';
import { BoardItemView } from './BoardItemView';
import { clampViewport, Viewport, zoomAt } from './viewport';

interface Props {
  items: BoardItem[];
  selectedId: string | null;
  snapToGrid: boolean;
  view: Viewport;
  onViewChange: (v: Viewport) => void;
  onSize: (w: number, h: number) => void;
  onSelect: (id: string | null) => void;
  onOpen: (id: string) => void;
  onLift: (id: string) => void;
  onDrop: (id: string, x: number, y: number) => void;
}

type Touch = { pageX: number; pageY: number };

/**
 * The table: a fixed-size world, panned by dragging the background and zoomed
 * with ⌘/Ctrl + wheel (trackpad pinch on macOS) or two-finger pinch on iPhone.
 */
export function Board({ items, selectedId, snapToGrid, view, onViewChange, onSize, onSelect, onOpen, onLift, onDrop }: Props) {
  const containerRef = useRef<View>(null);
  const size = useRef({ w: 0, h: 0 });
  const origin = useRef({ x: 0, y: 0 });
  const viewRef = useRef(view);
  const cbs = useRef({ onViewChange, onSelect });
  useLayoutEffect(() => {
    viewRef.current = view;
    cbs.current = { onViewChange, onSelect };
  });
  const getZoom = useCallback(() => viewRef.current.zoom, []);

  const measureOrigin = useCallback(() => {
    const node = containerRef.current as unknown as HTMLElement | null;
    if (Platform.OS === 'web' && node && typeof node.getBoundingClientRect === 'function') {
      const r = node.getBoundingClientRect();
      origin.current = { x: r.left + window.scrollX, y: r.top + window.scrollY };
      return;
    }
    containerRef.current?.measureInWindow((x, y) => {
      origin.current = { x, y };
    });
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    size.current = { w: width, h: height };
    measureOrigin();
    onSize(width, height);
  };

  const g = useRef<{ start: Viewport; moved: boolean; pinch: null | { dist: number; view: Viewport; mid: { x: number; y: number } } }>({
    start: view,
    moved: false,
    pinch: null,
  });

  // Gesture handlers read refs only while a gesture runs.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        measureOrigin();
        g.current = { start: viewRef.current, moved: false, pinch: null };
      },
      onPanResponderMove: (e, gs) => {
        const touches = (e.nativeEvent.touches ?? []) as unknown as Touch[];
        const { w, h } = size.current;
        if (touches.length >= 2) {
          const [a, b] = touches;
          const dist = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
          const mid = { x: (a.pageX + b.pageX) / 2 - origin.current.x, y: (a.pageY + b.pageY) / 2 - origin.current.y };
          if (!g.current.pinch) g.current.pinch = { dist, view: viewRef.current, mid };
          const p = g.current.pinch;
          const next = zoomAt(p.view, (p.view.zoom * dist) / p.dist, p.mid.x, p.mid.y);
          g.current.moved = true;
          cbs.current.onViewChange(clampViewport(next, w, h));
          return;
        }
        if (g.current.pinch) return;
        if (Math.hypot(gs.dx, gs.dy) > 3) g.current.moved = true;
        const s = g.current.start;
        cbs.current.onViewChange(clampViewport({ ...s, x: s.x - gs.dx / s.zoom, y: s.y - gs.dy / s.zoom }, w, h));
      },
      onPanResponderRelease: () => {
        if (!g.current.moved) cbs.current.onSelect(null);
      },
    }),
  );

  // Desktop: two-finger scroll pans; ⌘/Ctrl + wheel (and macOS pinch) zooms at the pointer.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = viewRef.current;
      const { w, h } = size.current;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      if (e.ctrlKey || e.metaKey) {
        const rect = node.getBoundingClientRect();
        const next = zoomAt(v, v.zoom * Math.exp(-e.deltaY * unit * 0.0022), e.clientX - rect.left, e.clientY - rect.top);
        cbs.current.onViewChange(clampViewport(next, w, h));
      } else {
        cbs.current.onViewChange(clampViewport({ ...v, x: v.x + (e.deltaX * unit) / v.zoom, y: v.y + (e.deltaY * unit) / v.zoom }, w, h));
      }
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  const ordered = items;
  return (
    <View ref={containerRef} onLayout={onLayout} style={[styles.viewport, webSurface]} {...responder.panHandlers}>
      <View
        style={[
          styles.world,
          {
            transform: [{ translateX: -view.x * view.zoom }, { translateY: -view.y * view.zoom }, { scale: view.zoom }],
          },
        ]}
      >
        <Table grid={snapToGrid} />
        {ordered.map((it, i) => (
          <BoardItemView
            key={it.id}
            item={it}
            index={i}
            selected={it.id === selectedId}
            snapToGrid={snapToGrid}
            getZoom={getZoom}
            onSelect={onSelect}
            onOpen={onOpen}
            onLift={onLift}
            onDrop={onDrop}
          />
        ))}
      </View>
    </View>
  );
}

/** The table surface: dot grid, edge and registration marks at the corners. */
function Table({ grid }: { grid: boolean }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={BOARD.width} height={BOARD.height}>
        <Defs>
          <Pattern id="board-dots" width={BOARD.grid} height={BOARD.grid} patternUnits="userSpaceOnUse">
            <Circle cx={BOARD.grid / 2} cy={BOARD.grid / 2} r={grid ? 1.3 : 0.9} fill={grid ? palette.graphite500 : palette.graphite700} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={BOARD.width} height={BOARD.height} fill="url(#board-dots)" />
        <Rect x={0.5} y={0.5} width={BOARD.width - 1} height={BOARD.height - 1} fill="none" stroke={color.lineStrong} strokeWidth={1} />
      </Svg>
      <View style={[styles.corner, { left: 12, top: 12 }]}>
        <RegistrationMark size={18} stroke={palette.graphite600} />
      </View>
      <View style={[styles.corner, { right: 12, bottom: 12 }]}>
        <RegistrationMark size={18} stroke={palette.graphite600} />
      </View>
      <View style={styles.tableLabel}>
        <T variant="micro" tone="muted">
          Mesa · {BOARD.width} × {BOARD.height}
        </T>
      </View>
    </View>
  );
}

const webSurface = Platform.OS === 'web' ? ({ touchAction: 'none', userSelect: 'none', cursor: 'default' } as unknown as object) : null;

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden', backgroundColor: '#0C0C0B' },
  world: { position: 'absolute', left: 0, top: 0, width: BOARD.width, height: BOARD.height, transformOrigin: 'left top' },
  corner: { position: 'absolute' },
  tableLabel: { position: 'absolute', left: 40, top: 16 },
});
