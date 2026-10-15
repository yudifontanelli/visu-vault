import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '../../design/Button';
import { Rosette } from '../../design/engravings/Engravings';
import { Field } from '../../design/Field';
import { haptic } from '../../design/haptics';
import { Hoverable } from '../../design/Hoverable';
import { PageScroll } from '../../design/Page';
import { Rule, Stamp, Tag } from '../../design/primitives';
import { Reveal } from '../../design/Reveal';
import { SectionHeader } from '../../design/SectionHeader';
import { Sheet } from '../../design/Sheet';
import { useToast } from '../../design/Toast';
import { T } from '../../design/Typography';
import { color, palette } from '../../design/tokens';
import { useResponsive } from '../../hooks/useResponsive';
import { formatLong, formatShort } from '../../lib/dates';
import { dispatch, useAppState } from '../../state/store';
import { useNavigator } from '../navigation';
import { sectionById } from '../sections';
import { ArchiveRecord, drawers, searchRecords } from './model';

/** Archive: card-catalogue drawers by year and catalogue records on paper. */
export function ArchiveScreen() {
  const { isPhone, isDesktop, isLarge } = useResponsive();
  const { params } = useNavigator();
  const def = sectionById('archive');
  const records = useAppState((s) => s.archive);
  const [year, setYear] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(params.recordId ?? (isPhone ? null : (records[0]?.id ?? null)));
  const list = useMemo(() => searchRecords(records, query, year), [records, query, year]);
  const drawerList = useMemo(() => drawers(records), [records]);
  const selected = records.find((r) => r.id === selectedId) ?? null;

  const header = (
    <SectionHeader number={def.number} name={def.name} title="Arquivo" italic="histórico." meta={`${records.length} fichas · ${drawerList.length} gavetas · acervo demonstrativo`} />
  );

  if (isPhone && selected) {
    return (
      <PageScroll>
        <Pressable onPress={() => setSelectedId(null)} accessibilityRole="button" hitSlop={10}>
          <T variant="label">‹ Fichas</T>
        </Pressable>
        <Reveal key={selected.id} axis="x" from={16}>
          <RecordCard record={selected} onRestored={() => setSelectedId(null)} />
        </Reveal>
      </PageScroll>
    );
  }

  const drawerColumn = isPhone ? (
    <ScrollView horizontal style={styles.noGrow} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {[null, ...drawerList.map((d) => d.year)].map((y) => (
        <Pressable key={y ?? 'all'} onPress={() => setYear(y)} accessibilityRole="button" accessibilityState={{ selected: y === year }}>
          <Tag filled={y === year}>{y === null ? `Todas · ${records.length}` : `${y} · ${drawerList.find((d) => d.year === y)?.count}`}</Tag>
        </Pressable>
      ))}
    </ScrollView>
  ) : (
    <View style={styles.drawers}>
      <Field label="Buscar" placeholder="Título, tombo, assunto…" value={query} onChangeText={setQuery} accessibilityLabel="Buscar no arquivo" />
      <T variant="micro" tone="muted" style={styles.drawersLabel}>
        Gavetas
      </T>
      {[{ year: null as number | null, count: records.length }, ...drawerList].map((d, i) => {
        const active = d.year === year;
        return (
          <Hoverable key={d.year ?? 'all'} onPress={() => setYear(d.year)} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={d.year ? `Gaveta ${d.year}` : 'Todas as gavetas'}>
            {({ hovered }) => (
              <View style={[styles.drawer, active && styles.drawerActive, (hovered || active) && styles.shift]}>
                <View style={[styles.labelHolder, active && styles.labelHolderActive]}>
                  <T variant="labelStrong" tone={active ? 'primary' : 'secondary'}>
                    {d.year ?? 'Todas'}
                  </T>
                </View>
                <View style={styles.pull} />
                <T variant="micro" tone="muted">
                  {d.year ? `G-${String(i).padStart(2, '0')} · ` : ''}
                  {d.count}
                </T>
              </View>
            )}
          </Hoverable>
        );
      })}
    </View>
  );

  const cards = (
    <View style={styles.cards}>
      {list.length === 0 ? (
        <T variant="subtitle" tone="muted">
          Nenhuma ficha com “{query}”.
        </T>
      ) : null}
      {list.map((r, i) => (
        <Reveal key={r.id} index={Math.min(i, 8)}>
          <Hoverable onPress={() => setSelectedId(r.id)} accessibilityLabel={`Ficha ${r.accession}, ${r.title}`}>
            {({ hovered, pressed }) => (
              <Sheet raised={hovered || r.id === selectedId} tone={r.id === selectedId ? 'paper' : 'dim'} style={[styles.indexCard, hovered && styles.cardLift, pressed && styles.pressed]}>
                <View style={styles.cardHead}>
                  <T variant="micro">{r.accession}</T>
                  <T variant="micro" tone="secondary">
                    {r.kind}
                  </T>
                </View>
                <View style={styles.cardRule} />
                <T variant="heading" size={19}>
                  {r.title}
                </T>
                <T variant="micro" tone="secondary">
                  {formatShort(r.archivedOn)} {r.year} · {r.location}
                </T>
              </Sheet>
            )}
          </Hoverable>
        </Reveal>
      ))}
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.flex}>
        <View style={styles.deskHead}>{header}</View>
        <View style={styles.panes}>
          <ScrollView style={styles.drawerPane} contentContainerStyle={styles.paneContent}>
            {drawerColumn}
          </ScrollView>
          <ScrollView style={styles.flex} contentContainerStyle={styles.paneContent}>
            {cards}
          </ScrollView>
          {selected ? (
            <ScrollView style={{ width: isLarge ? 460 : 380, flexGrow: 0 }} contentContainerStyle={styles.paneContent}>
              <Reveal key={selected.id} axis="x" from={14}>
                <RecordCard record={selected} onRestored={() => setSelectedId(null)} />
              </Reveal>
            </ScrollView>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <PageScroll>
      {header}
      {drawerColumn}
      {isPhone ? <Field placeholder="Buscar no arquivo…" value={query} onChangeText={setQuery} accessibilityLabel="Buscar no arquivo" /> : null}
      {cards}
      {!isPhone && selected ? <RecordCard record={selected} onRestored={() => setSelectedId(null)} /> : null}
    </PageScroll>
  );
}

/** The catalogue record (ficha catalográfica): typed fields, rubber stamp, guilloché seal. */
function RecordCard({ record, onRestored }: { record: ArchiveRecord; onRestored: () => void }) {
  const toast = useToast();
  const { go } = useNavigator();
  const fields: [string, string][] = [
    ['Nº de tombo', record.accession],
    ['Tipo', record.kind],
    ['Ano', String(record.year)],
    ['Arquivado em', formatLong(record.archivedOn)],
    ['Localização', record.location],
    ['Assuntos', record.tags.join(' · ')],
  ];
  return (
    <Sheet marks style={styles.record}>
      <View style={styles.frame}>
        <View style={styles.recordHead}>
          <T variant="micro">Ficha catalográfica</T>
          <T variant="micro" tone="secondary">
            Arquivo VISUVAULT
          </T>
        </View>
        <Rule weight="double" strong />
        <T variant="headline" size={34} style={styles.recordTitle}>
          {record.title}
        </T>
        {fields.map(([k, v]) => (
          <View key={k} style={styles.field}>
            <T variant="micro" tone="secondary" style={styles.fieldKey}>
              {k}
            </T>
            <T variant="labelStrong" style={styles.flex}>
              {v}
            </T>
          </View>
        ))}
        <Rule />
        <T variant="micro" tone="secondary">
          Descrição
        </T>
        <T variant="caption" size={17}>
          {record.summary}
        </T>
        <View style={styles.recordFoot}>
          <Rosette size={64} stroke={palette.ink} opacity={0.35} rings={1} />
          {record.projectId ? (
            <Button
              label="Retirar do arquivo"
              size="sm"
              onPress={() => {
                dispatch({ type: 'archive/restore', recordId: record.id });
                haptic('success');
                toast({ kicker: 'Arquivo', text: 'Projeto reaberto em Projects.', action: { label: 'Abrir', onPress: () => go('projects', { projectId: record.projectId }) } });
                onRestored();
              }}
            />
          ) : (
            <T variant="micro" tone="secondary">
              Consulta local · não sai do arquivo
            </T>
          )}
        </View>
        <Stamp rotate={-7} style={styles.stamp}>
          {`Arquivado · ${formatShort(record.archivedOn)} ${record.year}`}
        </Stamp>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  noGrow: { flexGrow: 0, flexShrink: 0 },
  deskHead: { paddingHorizontal: 40, paddingTop: 36, paddingBottom: 20 },
  panes: { flex: 1, flexDirection: 'row', gap: 32, paddingHorizontal: 40 },
  paneContent: { paddingBottom: 48, paddingTop: 4 },
  drawerPane: { width: 220, flexGrow: 0 },
  drawers: { gap: 8 },
  drawersLabel: { marginTop: 18 },
  chips: { gap: 8, paddingVertical: 4 },
  drawer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.lineStrong,
    backgroundColor: palette.graphite900,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  drawerActive: { borderColor: palette.paper, backgroundColor: palette.graphite800 },
  shift: { transform: [{ translateX: 3 }] },
  labelHolder: { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.graphite500, paddingHorizontal: 8, paddingVertical: 3, minWidth: 64, alignItems: 'center' },
  labelHolderActive: { borderColor: palette.paper },
  pull: { width: 22, height: 5, borderRadius: 3, backgroundColor: palette.graphite500 },
  cards: { gap: 14 },
  indexCard: { padding: 16, gap: 8 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between' },
  cardRule: { height: 1, backgroundColor: color.signal, opacity: 0.55 },
  cardLift: { transform: [{ translateX: 4 }] },
  pressed: { opacity: 0.85 },
  record: { padding: 14 },
  frame: { borderWidth: 1, borderColor: palette.ink, padding: 20, gap: 12 },
  recordHead: { flexDirection: 'row', justifyContent: 'space-between' },
  recordTitle: { marginVertical: 4 },
  field: { flexDirection: 'row', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.sheetLine, paddingBottom: 6 },
  fieldKey: { width: 110, marginTop: 2 },
  recordFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  stamp: { position: 'absolute', right: 22, bottom: 64 },
});
