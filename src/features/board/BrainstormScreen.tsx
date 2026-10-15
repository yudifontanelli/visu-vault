import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../design/Button';
import { Dialog } from '../../design/Dialog';
import { Field } from '../../design/Field';
import { haptic } from '../../design/haptics';
import { Hoverable } from '../../design/Hoverable';
import { Rule } from '../../design/primitives';
import { SectionHeader } from '../../design/SectionHeader';
import { useToast } from '../../design/Toast';
import { T } from '../../design/Typography';
import { color, palette } from '../../design/tokens';
import { useResponsive } from '../../hooks/useResponsive';
import { newId } from '../../lib/random';
import { dispatch, useAppState } from '../../state/store';
import { plateById, PLATES } from '../library/catalog';
import { PlateArt } from '../library/PlateArt';
import { useNavigator } from '../navigation';
import { sectionById } from '../sections';
import { Board } from './Board';
import { BOARD, BoardItem, BoardItemKind, bounds, ITEM_SIZE, KIND_LABEL, snap } from './model';
import { centreSlot, clampViewport, fitViewport, Viewport, zoomAt } from './viewport';

const NEW_TEXT: Record<Exclude<BoardItemKind, 'plate'>, string> = {
  note: 'Nova nota. Toque duas vezes para editar.',
  reference: 'Nova referência',
  heading: 'Novo título',
};

/** Brainstorm: a creative-direction table where everything can be moved freely. */
export function BrainstormScreen() {
  const { isDesktop, isPhone } = useResponsive();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { go } = useNavigator();
  const def = sectionById('brainstorm');
  const items = useAppState((s) => s.board);

  const [view, setView] = useState<Viewport>({ x: 0, y: 0, zoom: 0.8 });
  const [screen, setScreen] = useState({ w: 0, h: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const fitted = useRef(false);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const editing = items.find((i) => i.id === editingId) ?? null;

  const fit = useCallback(
    (list: BoardItem[] = items, w = screen.w, h = screen.h) => {
      const b = bounds(list) ?? { x: 0, y: 0, w: BOARD.width, h: BOARD.height };
      if (w > 0 && h > 0) setView(fitViewport(b, w, h, isPhone ? 20 : 48, 1.1, 'top'));
    },
    [isPhone, items, screen.h, screen.w],
  );

  const onSize = useCallback(
    (w: number, h: number) => {
      setScreen({ w, h });
      if (!fitted.current && w > 0 && h > 0) {
        fitted.current = true;
        fit(items, w, h);
      }
    },
    [fit, items],
  );

  const add = (kind: BoardItemKind, plateId?: string) => {
    const { w, h } = ITEM_SIZE[kind];
    const slot = centreSlot(view, screen.w, screen.h, w, h);
    const id = newId('b');
    const plate = plateById(plateId);
    dispatch({
      type: 'board/add',
      item: {
        id,
        kind,
        x: snap(slot.x),
        y: snap(slot.y),
        z: 0,
        text: kind === 'plate' ? (plate?.title ?? 'Imagem') : NEW_TEXT[kind],
        source: kind === 'reference' ? '' : undefined,
        plateId,
      },
    });
    haptic('press');
    setSelectedId(id);
    if (kind !== 'plate') setEditingId(isDesktop ? null : id);
  };

  const remove = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      dispatch({ type: 'board/remove', id });
      setSelectedId(null);
      setEditingId(null);
      haptic('warning');
      toast({
        kicker: 'Mesa',
        text: `${KIND_LABEL[item.kind]} removida da mesa.`,
        action: { label: 'Desfazer', onPress: () => dispatch({ type: 'board/add', item }) },
      });
    },
    [items, toast],
  );

  const duplicate = (id: string) => {
    const newIdValue = newId('b');
    dispatch({ type: 'board/duplicate', id, newId: newIdValue });
    setSelectedId(newIdValue);
  };

  const arrangeAll = () => {
    dispatch({ type: 'board/arrange' });
    haptic('success');
    // Frame the new layout once the store has it.
    setTimeout(() => fit(), 30);
  };

  const zoomBy = (factor: number) => setView((v) => clampViewport(zoomAt(v, v.zoom * factor, screen.w / 2, screen.h / 2), screen.w, screen.h));

  const focusItem = (it: BoardItem) => {
    setSelectedId(it.id);
    const { w, h } = ITEM_SIZE[it.kind];
    setView((v) => clampViewport({ ...v, x: it.x + w / 2 - screen.w / (2 * v.zoom), y: it.y + h / 2 - screen.h / (2 * v.zoom) }, screen.w, screen.h));
  };

  // Desktop keyboard: Delete removes, arrows nudge (Shift = 4 cells), Esc deselects.
  const keyState = useRef({ selected, remove });
  useEffect(() => {
    keyState.current = { selected, remove };
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      const sel = keyState.current.selected;
      if (e.key === 'Escape') setSelectedId(null);
      if (!sel) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        keyState.current.remove(sel.id);
        return;
      }
      const step = BOARD.grid * (e.shiftKey ? 4 : 1);
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const m = moves[e.key];
      if (m) {
        e.preventDefault();
        dispatch({ type: 'board/move', id: sel.id, x: sel.x + m[0], y: sel.y + m[1] });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const counts = useMemo(() => {
    const c = { note: 0, reference: 0, plate: 0, heading: 0 } as Record<BoardItemKind, number>;
    for (const it of items) c[it.kind] += 1;
    return c;
  }, [items]);

  const toolbar = (
    <ScrollView horizontal style={styles.noGrow} showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.toolbar, isPhone && styles.toolbarPhone]} keyboardShouldPersistTaps="handled">
      <Button label="Nota" leading="+" size="sm" onPress={() => add('note')} />
      <Button label="Referência" leading="+" size="sm" onPress={() => add('reference')} />
      <Button label="Imagem" leading="+" size="sm" onPress={() => setPicking(true)} />
      <Button label="Título" leading="+" size="sm" onPress={() => add('heading')} />
      <View style={styles.toolSep} />
      <Button label="Grade" size="sm" variant={snapToGrid ? 'outline' : 'ghost'} selected={snapToGrid} onPress={() => setSnapToGrid((s) => !s)} accessibilityLabel={snapToGrid ? 'Desligar encaixe na grade' : 'Ligar encaixe na grade'} />
      <Button label="Organizar" size="sm" variant="ghost" onPress={arrangeAll} />
      <View style={styles.toolSep} />
      <Button label="−" size="sm" variant="ghost" onPress={() => zoomBy(1 / 1.2)} accessibilityLabel="Afastar" />
      <T variant="numeral" tone="secondary" style={styles.zoom}>
        {Math.round(view.zoom * 100)}%
      </T>
      <Button label="+" size="sm" variant="ghost" onPress={() => zoomBy(1.2)} accessibilityLabel="Aproximar" />
      <Button label="Ajustar" size="sm" variant="ghost" onPress={() => fit()} />
    </ScrollView>
  );

  const board = (
    <View style={styles.boardFrame}>
      <Board
        items={items}
        selectedId={selectedId}
        snapToGrid={snapToGrid}
        view={view}
        onViewChange={setView}
        onSize={onSize}
        onSelect={setSelectedId}
        onOpen={(id) => {
          setSelectedId(id);
          setEditingId(id);
        }}
        onLift={(id) => dispatch({ type: 'board/front', id })}
        onDrop={(id, x, y) => dispatch({ type: 'board/move', id, x, y })}
      />
    </View>
  );

  const editor = (it: BoardItem) => (
    <View style={styles.editor}>
      {it.kind === 'plate' ? (
        <>
          <Field label="Legenda" value={it.text} onChangeText={(text) => dispatch({ type: 'board/update', id: it.id, patch: { text } })} />
          <Button label="Ver na Library" trailing="→" size="sm" variant="ghost" onPress={() => go('library', { plateId: it.plateId })} />
        </>
      ) : it.kind === 'reference' ? (
        <>
          <Field label="Título" type="serif" size={20} value={it.text} onChangeText={(text) => dispatch({ type: 'board/update', id: it.id, patch: { text } })} />
          <Field label="Fonte (link ou citação)" value={it.source ?? ''} onChangeText={(source) => dispatch({ type: 'board/update', id: it.id, patch: { source } })} autoCapitalize="none" />
        </>
      ) : (
        <Field
          label={it.kind === 'heading' ? 'Título' : 'Nota'}
          type={it.kind === 'heading' ? 'serif' : 'sans'}
          size={it.kind === 'heading' ? 24 : 15}
          multiline={it.kind === 'note'}
          value={it.text}
          onChangeText={(text) => dispatch({ type: 'board/update', id: it.id, patch: { text } })}
          inputStyle={it.kind === 'note' ? styles.noteInput : undefined}
        />
      )}
    </View>
  );

  const actions = (it: BoardItem, compact = false) => (
    <View style={[styles.actions, compact && styles.actionsCompact]}>
      {compact ? <Button label="Editar" size="sm" onPress={() => setEditingId(it.id)} /> : null}
      <Button label="Frente" size="sm" variant="ghost" onPress={() => dispatch({ type: 'board/front', id: it.id })} accessibilityLabel="Trazer à frente" />
      <Button label="Duplicar" size="sm" variant="ghost" onPress={() => duplicate(it.id)} />
      <Button label="Excluir" size="sm" variant="danger" onPress={() => remove(it.id)} />
    </View>
  );

  const inspector = (
    <View style={styles.inspector}>
      <View style={styles.inspectorHead}>
        <T variant="micro" tone="secondary">
          Inspector
        </T>
        <T variant="micro" tone="muted">
          {items.length} itens
        </T>
      </View>
      <Rule strong />
      {selected ? (
        <View style={styles.inspectorBody}>
          <T variant="micro" tone="muted">
            {KIND_LABEL[selected.kind]} · x {selected.x} · y {selected.y}
          </T>
          {editor(selected)}
          {actions(selected)}
        </View>
      ) : (
        <View style={styles.inspectorBody}>
          <T variant="caption" tone="secondary">
            Arraste os itens livremente. Arraste o fundo para mover a mesa; use ⌘/Ctrl + roda (ou pinça no trackpad) para aproximar.
          </T>
          <T variant="micro" tone="muted">
            Teclado: setas movem · Shift acelera · Delete exclui · Esc solta
          </T>
        </View>
      )}
      <Rule />
      <T variant="micro" tone="secondary" style={styles.layersHead}>
        Camadas · {counts.plate} imagens · {counts.note} notas · {counts.reference} refs
      </T>
      <ScrollView style={styles.flex} contentContainerStyle={styles.layers}>
        {[...items]
          .sort((a, b) => b.z - a.z)
          .map((it) => (
            <Hoverable key={it.id} onPress={() => focusItem(it)} accessibilityLabel={`Selecionar ${KIND_LABEL[it.kind]} ${it.text}`}>
              {({ hovered }) => (
                <View style={[styles.layer, (hovered || it.id === selectedId) && styles.layerActive]}>
                  <T variant="micro" tone="muted" style={styles.layerKind}>
                    {KIND_LABEL[it.kind]}
                  </T>
                  <T variant="bodySm" numberOfLines={1} style={styles.flex} tone={it.id === selectedId ? 'primary' : 'secondary'}>
                    {it.text}
                  </T>
                </View>
              )}
            </Hoverable>
          ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.screen, isDesktop ? styles.screenDesktop : styles.screenPhone]}>
      {isDesktop ? (
        <SectionHeader number={def.number} name={def.name} title="Mesa de direção" italic="criativa." meta={`${items.length} itens · salvo neste dispositivo`} compact />
      ) : null}
      {toolbar}
      {isDesktop ? (
        <View style={styles.body}>
          {board}
          {inspector}
        </View>
      ) : (
        <>
          {board}
          {selected ? (
            <View style={[styles.selectionBar, { paddingBottom: insets.bottom + 8 }]}>
              <T variant="micro" tone="secondary" numberOfLines={1}>
                {KIND_LABEL[selected.kind]} · {selected.text}
              </T>
              {actions(selected, true)}
            </View>
          ) : (
            <T variant="micro" tone="muted" align="center" style={[styles.phoneHint, { marginBottom: insets.bottom + 6 }]}>
              Arraste itens · arraste o fundo para mover · pinça para zoom
            </T>
          )}
        </>
      )}

      <Dialog
        visible={!!editing}
        onClose={() => setEditingId(null)}
        kicker={editing ? `Mesa · ${KIND_LABEL[editing.kind]}` : 'Mesa'}
        title="Editar item"
        footer={<Button label="Pronto" variant="solid" onPress={() => setEditingId(null)} />}
      >
        {editing ? editor(editing) : null}
      </Dialog>

      <Dialog visible={picking} onClose={() => setPicking(false)} kicker="Library → Mesa" title="Escolher imagem" width={720}>
        <View style={styles.picker}>
          {PLATES.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => {
                setPicking(false);
                add('plate', p.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Adicionar ${p.title}`}
              style={({ pressed }) => [styles.pick, pressed && styles.pressed]}
            >
              <PlateArt plate={p} width={isPhone ? 92 : 104} detail={0.6} />
              <T variant="micro" tone="secondary" numberOfLines={1} style={{ width: isPhone ? 92 : 104 }}>
                {p.code}
              </T>
            </Pressable>
          ))}
        </View>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  noGrow: { flexGrow: 0, flexShrink: 0 },
  screen: { flex: 1, gap: 14 },
  screenDesktop: { paddingHorizontal: 40, paddingTop: 28, paddingBottom: 24 },
  screenPhone: { paddingTop: 10, gap: 10 },
  toolbar: { gap: 6, alignItems: 'center' },
  toolbarPhone: { paddingHorizontal: 16 },
  toolSep: { width: StyleSheet.hairlineWidth, height: 22, backgroundColor: color.lineStrong, marginHorizontal: 6 },
  zoom: { minWidth: 42, textAlign: 'center' },
  body: { flex: 1, flexDirection: 'row', gap: 20 },
  boardFrame: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: color.line, overflow: 'hidden' },
  inspector: { width: 300, gap: 12 },
  inspectorHead: { flexDirection: 'row', justifyContent: 'space-between' },
  inspectorBody: { gap: 14 },
  editor: { gap: 14 },
  noteInput: { minHeight: 120 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionsCompact: { flexWrap: 'nowrap' },
  layersHead: { marginTop: 2 },
  layers: { gap: 2, paddingBottom: 8 },
  layer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, paddingHorizontal: 6, borderLeftWidth: 1.5, borderLeftColor: 'transparent' },
  layerActive: { borderLeftColor: palette.paper, backgroundColor: palette.graphite900 },
  layerKind: { width: 76 },
  selectionBar: { gap: 8, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line, backgroundColor: palette.ink2 },
  phoneHint: { paddingHorizontal: 16 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pick: { gap: 4 },
  pressed: { opacity: 0.7 },
});
