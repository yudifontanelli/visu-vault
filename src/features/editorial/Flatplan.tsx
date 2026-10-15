import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptic } from '../../design/haptics';
import { Rule, Tag } from '../../design/primitives';
import { T } from '../../design/Typography';
import { color, palette } from '../../design/tokens';
import { useResponsive } from '../../hooks/useResponsive';
import { dispatch, useAppState } from '../../state/store';
import { clampPages, flatplan, ISSUE_PAGES, STATUS_LABEL, STATUSES, Story, StoryStatus } from './model';
import { pageRange } from './StoryPanel';

/** Ink "dries" as a story advances: darker graphite early, paper when closed. */
export const STATUS_TONE: Record<StoryStatus, { bg: string; fg: string }> = {
  pauta: { bg: palette.graphite800, fg: palette.graphite300 },
  apuracao: { bg: palette.graphite700, fg: palette.graphite200 },
  redacao: { bg: palette.graphite600, fg: palette.paperDim },
  revisao: { bg: palette.graphite500, fg: palette.paper },
  fechamento: { bg: palette.graphite300, fg: palette.ink },
  publicado: { bg: palette.paperDim, fg: palette.ink },
};

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The issue's flatplan (espelho): every spread at a glance. Tap a story to
 * select it; tap a free page to move the selected story there.
 */
export function Flatplan({ selectedId, onSelect, onOpen }: { selectedId: string | null; onSelect: (id: string | null) => void; onOpen: (id: string) => void }) {
  const { isPhone, isDesktop, width } = useResponsive();
  const desk = useAppState((s) => s.desk);
  const plan = useMemo(() => flatplan(desk), [desk]);
  const byId = useMemo(() => new Map(desk.map((s) => [s.id, s])), [desk]);
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const unplaced = desk.filter((s) => s.pageStart === null);

  const contentW = isDesktop ? Math.min(width - 264 - 80, 1320) : width - 40;
  const perRow = isPhone ? 3 : contentW > 1100 ? 6 : contentW > 760 ? 5 : 4;
  const spreadGap = isPhone ? 10 : 16;
  const pageW = Math.floor((contentW - spreadGap * (perRow - 1)) / perRow / 2);
  const pageH = Math.round(pageW * 1.36);

  const onPage = (page: number, storyIds: string[], reserved?: string) => {
    if (reserved) return;
    if (storyIds.length > 0) {
      haptic('select');
      onSelect(storyIds[0] === selectedId && storyIds[1] ? storyIds[1] : storyIds[0]);
      return;
    }
    if (selected) {
      haptic('press');
      dispatch({ type: 'desk/setPages', id: selected.id, ...clampPages(page, selected.pageCount) });
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.summary}>
        <T variant="micro" tone="secondary">
          Edição nº 01 · {ISSUE_PAGES} páginas · {plan.free} livres
        </T>
        {plan.conflicts.length > 0 ? (
          <T variant="micro" tone="signal">
            Conflito {plan.conflicts.length === 1 ? 'na página' : 'nas páginas'} {plan.conflicts.map(pad).join(', ')}
          </T>
        ) : (
          <T variant="micro" tone="muted">
            Sem conflitos
          </T>
        )}
      </View>
      <View style={styles.legend}>
        {STATUSES.map((s) => (
          <View key={s} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: STATUS_TONE[s].bg }]} />
            <T variant="micro" tone="muted">
              {STATUS_LABEL[s]}
            </T>
          </View>
        ))}
      </View>
      <Rule strong />
      <View style={[styles.spreads, { gap: spreadGap }]}>
        {plan.spreads.map((spread) => (
          <View key={spread.join('-')} style={styles.spread}>
            <View style={[styles.spreadPages, spread.length === 1 && spread[0] === 1 && { marginLeft: pageW }]}>
              {spread.map((page) => {
                const info = plan.pages[page - 1];
                const story = info.storyIds[0] ? byId.get(info.storyIds[0]) : undefined;
                const conflict = plan.conflicts.includes(page);
                const isSel = !!story && info.storyIds.includes(selectedId ?? '');
                const opening = story && story.pageStart === page;
                const tone = story ? STATUS_TONE[story.status] : null;
                return (
                  <Pressable
                    key={page}
                    onPress={() => onPage(page, info.storyIds, info.reserved)}
                    onLongPress={() => story && onOpen(story.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Página ${page}${info.reserved ? `, ${info.reserved}` : story ? `, ${story.title}` : ', livre'}${conflict ? ', em conflito' : ''}`}
                    style={({ pressed }) => [
                      styles.page,
                      { width: pageW, height: pageH },
                      info.reserved && styles.reserved,
                      tone && { backgroundColor: tone.bg },
                      isSel && styles.selectedPage,
                      conflict && styles.conflict,
                      pressed && styles.pressed,
                    ]}
                  >
                    <T variant="micro" size={8} color={tone ? tone.fg : info.reserved ? palette.ink : palette.graphite500}>
                      {pad(page)}
                    </T>
                    {info.reserved ? (
                      <T variant="micro" size={7.5} color={palette.ink} style={styles.pageLabel}>
                        {info.reserved}
                      </T>
                    ) : opening && story ? (
                      <T variant="caption" size={isPhone ? 10 : 12} color={tone!.fg} numberOfLines={4} style={styles.pageLabel}>
                        {story.title}
                      </T>
                    ) : null}
                    {conflict ? (
                      <T variant="micro" size={7} color={tone ? tone.fg : info.reserved ? palette.ink : palette.paper} style={styles.conflictLabel}>
                        conflito
                      </T>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
      <Rule />
      {selected ? (
        <View style={styles.selectedBar}>
          <View style={styles.flex}>
            <T variant="micro" tone="secondary">
              Selecionada · {selected.code} · {pageRange(selected)}
            </T>
            <T variant="heading">{selected.title}</T>
            <T variant="caption" tone="muted">
              Toque numa página livre para mover a pauta para lá. Toque longo numa página abre a prova.
            </T>
          </View>
          <Pressable onPress={() => onOpen(selected.id)} accessibilityRole="button" hitSlop={8}>
            <T variant="labelStrong">Abrir prova →</T>
          </Pressable>
        </View>
      ) : (
        <T variant="caption" tone="muted">
          Selecione uma pauta no espelho (ou na lista abaixo) e toque numa página livre para posicioná-la.
        </T>
      )}
      {unplaced.length > 0 ? (
        <View style={styles.unplaced}>
          <T variant="micro" tone="secondary">
            Sem páginas · {unplaced.length}
          </T>
          <View style={styles.tags}>
            {unplaced.map((s: Story) => (
              <Pressable key={s.id} onPress={() => onSelect(s.id)} accessibilityRole="button" accessibilityLabel={`Selecionar ${s.title}`}>
                <Tag filled={s.id === selectedId}>{`${s.code} · ${s.title} · ${s.pageCount} pp.`}</Tag>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { gap: 14 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: color.lineStrong },
  spreads: { flexDirection: 'row', flexWrap: 'wrap' },
  spread: {},
  spreadPages: { flexDirection: 'row', boxShadow: '0px 8px 18px rgba(0,0,0,0.35)' },
  page: {
    backgroundColor: palette.ink2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.lineStrong,
    padding: 5,
    justifyContent: 'space-between',
  },
  reserved: { backgroundColor: palette.paper },
  selectedPage: { borderColor: palette.paper, borderWidth: 1.5 },
  conflict: { borderColor: palette.paper, borderWidth: 1.5, borderStyle: 'dashed' },
  pageLabel: { marginTop: 'auto' },
  conflictLabel: { position: 'absolute', right: 4, top: 4 },
  pressed: { opacity: 0.75 },
  selectedBar: { flexDirection: 'row', gap: 16, alignItems: 'flex-end' },
  unplaced: { gap: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
