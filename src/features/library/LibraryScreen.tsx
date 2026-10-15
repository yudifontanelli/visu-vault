import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../design/Button';
import { Field } from '../../design/Field';
import { haptic } from '../../design/haptics';
import { Hoverable } from '../../design/Hoverable';
import { PageScroll } from '../../design/Page';
import { Rule, Tag } from '../../design/primitives';
import { Reveal } from '../../design/Reveal';
import { SectionHeader } from '../../design/SectionHeader';
import { CropMarks, Sheet } from '../../design/Sheet';
import { T } from '../../design/Typography';
import { color, palette } from '../../design/tokens';
import { useResponsive } from '../../hooks/useResponsive';
import { newId } from '../../lib/random';
import { appStore, dispatch } from '../../state/store';
import { bounds, BOARD, ITEM_SIZE, snap } from '../board/model';
import { useNavigator } from '../navigation';
import { sectionById } from '../sections';
import { CATEGORIES, Category, countByCategory, filterPlates, Plate, PLATES, PlateSort } from './catalog';
import { PlateArt } from './PlateArt';

const SORTS: { key: PlateSort; label: string }[] = [
  { key: 'catalogo', label: 'Catálogo' },
  { key: 'titulo', label: 'Título' },
  { key: 'categoria', label: 'Categoria' },
];

/** Puts a plate on the Brainstorm table, below what is already there. */
export function sendPlateToBoard(plate: Plate) {
  const items = appStore.getState().board;
  const b = bounds(items);
  const { w, h } = ITEM_SIZE.plate;
  let x = 96;
  let y = b ? b.y + b.h + 48 : 96;
  if (y + h > BOARD.height) {
    y = 96;
    x = b ? Math.min(BOARD.width - w, b.x + b.w + 48) : 96;
  }
  dispatch({ type: 'board/add', item: { id: newId('b'), kind: 'plate', x: snap(x), y: snap(y), z: 0, text: plate.title, plateId: plate.id } });
}

export function LibraryScreen() {
  const { isDesktop, isPhone, width } = useResponsive();
  const { params, go } = useNavigator();
  const def = sectionById('library');
  const [category, setCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<PlateSort>('catalogo');
  const [openId, setOpenId] = useState<string | null>(params.plateId ?? null);

  const results = useMemo(() => filterPlates(PLATES, { category, query, sort }), [category, query, sort]);
  const counts = useMemo(() => countByCategory(PLATES), []);

  const toBoard = useCallback((p: Plate) => {
    sendPlateToBoard(p);
    haptic('success');
  }, []);

  // Grid geometry from the space actually available.
  const contentW = isDesktop ? Math.min(width - 264 - 80, 1320) - 240 - 32 : width - 40;
  const cols = isPhone ? 2 : contentW > 1000 ? 5 : contentW > 760 ? 4 : 3;
  const gap = isPhone ? 14 : 22;
  const tileW = Math.floor((contentW - gap * (cols - 1)) / cols);

  const filters = isDesktop ? (
    <View style={styles.filters}>
      <Field label="Buscar" placeholder="Título, técnica, código…" value={query} onChangeText={setQuery} accessibilityLabel="Buscar no acervo" />
      <View style={styles.filterGroup}>
        <T variant="micro" tone="muted">
          Categorias
        </T>
        {[null, ...CATEGORIES].map((c) => {
          const active = c === category;
          return (
            <Hoverable key={c ?? 'all'} onPress={() => setCategory(c)} accessibilityRole="button" accessibilityState={{ selected: active }}>
              {({ hovered }) => (
                <View style={[styles.catRow, active && styles.catActive, (hovered || active) && styles.shift]}>
                  <T variant="heading" size={18} italic={active} tone={active || hovered ? 'primary' : 'secondary'}>
                    {c ?? 'Todas'}
                  </T>
                  <T variant="numeral" tone="muted">
                    {c ? counts[c] : PLATES.length}
                  </T>
                </View>
              )}
            </Hoverable>
          );
        })}
      </View>
      <View style={styles.filterGroup}>
        <T variant="micro" tone="muted">
          Ordem
        </T>
        <View style={styles.sortRow}>
          {SORTS.map((s) => (
            <Button key={s.key} label={s.label} size="sm" variant={sort === s.key ? 'outline' : 'ghost'} selected={sort === s.key} onPress={() => setSort(s.key)} />
          ))}
        </View>
      </View>
      <Rule />
      <T variant="caption" tone="muted">
        Acervo demonstrativo: pranchas gerativas desenhadas no próprio app, em tinta e papel.
      </T>
    </View>
  ) : (
    <View style={styles.filtersPhone}>
      <Field placeholder="Buscar no acervo…" value={query} onChangeText={setQuery} accessibilityLabel="Buscar no acervo" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[null, ...CATEGORIES].map((c) => (
          <Pressable key={c ?? 'all'} onPress={() => setCategory(c)} accessibilityRole="button" accessibilityState={{ selected: c === category }} hitSlop={4}>
            <Tag filled={c === category}>{`${c ?? 'Todas'} · ${c ? counts[c] : PLATES.length}`}</Tag>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const grid = (
    <View style={[styles.grid, { gap }]}>
      {results.length === 0 ? (
        <T variant="subtitle" tone="muted">
          Nada no acervo com “{query}”.
        </T>
      ) : null}
      {results.map((p, i) => (
        <Reveal key={p.id} index={Math.min(i, 10)} from={8}>
          <Hoverable onPress={() => setOpenId(p.id)} accessibilityLabel={`Ampliar ${p.title}`}>
            {({ hovered, pressed }) => (
              <View style={[{ width: tileW }, styles.tile, hovered && styles.lift, pressed && styles.pressed]}>
                <View style={hovered ? styles.thumbHover : styles.thumb}>
                  <PlateArt plate={p} width={tileW} detail={0.6} />
                </View>
                <View style={styles.tileMeta}>
                  <T variant="micro" tone="muted">
                    {p.code}
                  </T>
                  <T variant="micro" tone="muted">
                    {p.category}
                  </T>
                </View>
                <T variant="caption" size={isPhone ? 14 : 15} numberOfLines={2} style={hovered && styles.underline}>
                  {p.title}
                </T>
              </View>
            )}
          </Hoverable>
        </Reveal>
      ))}
    </View>
  );

  const openIndex = openId ? results.findIndex((p) => p.id === openId) : -1;
  const openPlate = openId ? (PLATES.find((p) => p.id === openId) ?? null) : null;

  return (
    <>
      <PageScroll>
        <SectionHeader number={def.number} name={def.name} title="Acervo visual" italic="curado." meta={`${results.length} de ${PLATES.length} pranchas · acervo demonstrativo`} />
        {isDesktop ? (
          <View style={styles.row}>
            {filters}
            {grid}
          </View>
        ) : (
          <>
            {filters}
            {grid}
          </>
        )}
      </PageScroll>
      <Lightbox
        plate={openPlate}
        position={openIndex}
        total={results.length}
        onClose={() => setOpenId(null)}
        onStep={(dir) => {
          if (results.length === 0) return;
          const i = openIndex < 0 ? 0 : (openIndex + dir + results.length) % results.length;
          haptic('select');
          setOpenId(results[i].id);
        }}
        onToBoard={toBoard}
        onOpenBoard={() => {
          setOpenId(null);
          go('brainstorm');
        }}
      />
    </>
  );
}

function Lightbox({
  plate,
  position,
  total,
  onClose,
  onStep,
  onToBoard,
  onOpenBoard,
}: {
  plate: Plate | null;
  position: number;
  total: number;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
  onToBoard: (p: Plate) => void;
  onOpenBoard: () => void;
}) {
  const { isDesktop, width, height } = useResponsive();
  const [sent, setSent] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const handlers = useRef({ onStep, onClose });
  useEffect(() => {
    handlers.current = { onStep, onClose };
  });

  // Desktop keyboard: ← → to browse, Esc to close.
  useEffect(() => {
    if (!plate || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handlers.current.onStep(1);
      else if (e.key === 'ArrowLeft') handlers.current.onStep(-1);
      else if (e.key === 'Escape') handlers.current.onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [plate]);

  // Phone: swipe the plate sideways to browse. Handlers read refs only at gesture time.
  // eslint-disable-next-line react-hooks/refs
  const [swipe] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_e, g) => {
        if (g.dx < -50) handlers.current.onStep(1);
        else if (g.dx > 50) handlers.current.onStep(-1);
      },
    }),
  );

  if (!plate) return null;
  const panelW = isDesktop ? 380 : width;
  const plateW = isDesktop ? Math.min(width - panelW - 160, (height - 160) * 0.8) : width - 72;
  const counter = `${String(position + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  const meta = (
    <View style={styles.meta}>
      <T variant="micro" tone="secondary">
        {plate.code} · {plate.category}
      </T>
      <T variant="headline" size={isDesktop ? 40 : 32}>
        {plate.title}
      </T>
      <T variant="subtitle" tone="secondary">
        {plate.note}
      </T>
      <Rule strong />
      {[
        ['Técnica', plate.technique],
        ['Formato', plate.format],
        ['Catalogado', String(plate.year)],
        ['Origem', 'Prancha gerada · acervo demonstrativo'],
      ].map(([k, v]) => (
        <View key={k} style={styles.metaRow}>
          <T variant="micro" tone="muted" style={styles.metaKey}>
            {k}
          </T>
          <T variant="bodySm" style={styles.flex}>
            {v}
          </T>
        </View>
      ))}
      <View style={styles.tags}>
        {plate.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </View>
      <Rule />
      <View style={styles.actions}>
        <Button label="Anterior" leading="←" size="sm" variant="ghost" onPress={() => onStep(-1)} />
        <T variant="numeral" tone="muted">
          {counter}
        </T>
        <Button label="Próxima" trailing="→" size="sm" variant="ghost" onPress={() => onStep(1)} />
      </View>
      {sent.includes(plate.id) ? (
        <View style={styles.sentRow} accessibilityLiveRegion="polite">
          <T variant="label">✓ Na mesa de Brainstorm</T>
          <Button label="Abrir mesa" trailing="→" size="sm" variant="ghost" onPress={onOpenBoard} />
        </View>
      ) : (
        <Button
          label="Levar para a mesa"
          leading="+"
          variant="solid"
          onPress={() => {
            onToBoard(plate);
            setSent((list) => [...list, plate.id]);
          }}
        />
      )}
    </View>
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.lightbox, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.lbBar}>
          <T variant="micro" tone="secondary">
            Library · Visualização ampliada
          </T>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar visualização" hitSlop={12}>
            <T variant="label">Fechar ×</T>
          </Pressable>
        </View>
        {isDesktop ? (
          <View style={styles.lbRow}>
            <View style={styles.lbStage}>
              <Reveal key={plate.id} axis="x" from={16}>
                <Sheet style={styles.mat}>
                  <PlateArt plate={plate} width={plateW} style={styles.print} />
                  <View style={styles.matCaption}>
                    <T variant="micro">{plate.code}</T>
                    <T variant="caption">{plate.title}</T>
                  </View>
                </Sheet>
              </Reveal>
            </View>
            <View style={[styles.lbPanel, { width: panelW }]}>{meta}</View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.lbPhone}>
            <View {...swipe.panHandlers}>
              <Reveal key={plate.id} axis="x" from={16}>
                <Sheet style={styles.matPhone}>
                  <PlateArt plate={plate} width={plateW} style={styles.print} />
                </Sheet>
              </Reveal>
            </View>
            <T variant="micro" tone="muted" align="center">
              Deslize para o lado para folhear
            </T>
            {meta}
          </ScrollView>
        )}
        <View pointerEvents="none" style={styles.lbMarks}>
          <CropMarks inset={-1} tint={palette.graphite600} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  filters: { width: 240, gap: 26 },
  filtersPhone: { gap: 12 },
  filterGroup: { gap: 6 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 4, paddingLeft: 8, borderLeftWidth: 1.5, borderLeftColor: 'transparent' },
  catActive: { borderLeftColor: palette.paper },
  shift: { transform: [{ translateX: 3 }] },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chips: { gap: 8, paddingVertical: 4 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start' },
  tile: { gap: 6 },
  thumb: { boxShadow: '0px 0px 0px rgba(0,0,0,0)' },
  thumbHover: { boxShadow: '0px 14px 28px rgba(0,0,0,0.55)' },
  tileMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  lift: { transform: [{ translateY: -4 }] },
  pressed: { opacity: 0.8 },
  underline: { textDecorationLine: 'underline' },
  lightbox: { flex: 1, backgroundColor: '#080808' },
  sentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 38 },
  lbBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  lbRow: { flex: 1, flexDirection: 'row' },
  lbStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mat: { padding: 28, paddingBottom: 18 },
  matCaption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, gap: 16 },
  matPhone: { padding: 16 },
  print: { borderWidth: StyleSheet.hairlineWidth, borderColor: color.sheetLine },
  lbPanel: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: color.line, padding: 32, justifyContent: 'center' },
  lbPhone: { padding: 20, gap: 18, alignItems: 'stretch' },
  meta: { gap: 14 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaKey: { width: 92, marginTop: 3 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lbMarks: { position: 'absolute', left: 14, right: 14, top: 14, bottom: 14 },
});
