import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '../../design/Button';
import { Checkbox } from '../../design/Checkbox';
import { Field } from '../../design/Field';
import { haptic } from '../../design/haptics';
import { Hoverable } from '../../design/Hoverable';
import { PageScroll } from '../../design/Page';
import { Meter, Rule } from '../../design/primitives';
import { Reveal } from '../../design/Reveal';
import { SectionHeader } from '../../design/SectionHeader';
import { Sheet } from '../../design/Sheet';
import { T } from '../../design/Typography';
import { palette } from '../../design/tokens';
import { useResponsive } from '../../hooks/useResponsive';
import { formatShort, todayISO } from '../../lib/dates';
import { newId } from '../../lib/random';
import { dispatch, useAppState } from '../../state/store';
import { useNavigator } from '../navigation';
import { sectionById } from '../sections';
import { Dossier, overallProgress, READING_KINDS, ReadingKind, studyProgress } from './model';

/** Study Room: dossiers read like an open book — readings on the left page, margin notes on the right. */
export function StudyRoomScreen() {
  const { isPhone, isDesktop } = useResponsive();
  const { params } = useNavigator();
  const def = sectionById('study');
  const dossiers = useAppState((s) => s.study);
  const [selectedId, setSelectedId] = useState<string | null>(params.dossierId ?? (isPhone ? null : (dossiers[0]?.id ?? null)));
  const selected = dossiers.find((d) => d.id === selectedId) ?? null;
  const read = Math.round(overallProgress(dossiers) * 100);

  const header = <SectionHeader number={def.number} name={def.name} title="Sala de" italic="estudos." meta={`${dossiers.length} dossiês · ${read}% lido`} />;

  if (isPhone && selected) {
    return (
      <PageScroll>
        <Pressable onPress={() => setSelectedId(null)} accessibilityRole="button" hitSlop={10}>
          <T variant="label">‹ Dossiês</T>
        </Pressable>
        <Reveal key={selected.id} axis="x" from={16} style={styles.stack}>
          <Sheet style={styles.page}>
            <ReadingsPage dossier={selected} />
          </Sheet>
          <Sheet style={styles.page}>
            <NotesPage dossier={selected} />
          </Sheet>
        </Reveal>
      </PageScroll>
    );
  }

  const catalogue = (
    <View style={styles.catalogue}>
      {dossiers.map((d, i) => {
        const p = studyProgress(d);
        const active = d.id === selectedId;
        return (
          <Reveal key={d.id} index={i}>
            <Hoverable onPress={() => setSelectedId(d.id)} accessibilityLabel={`Dossiê ${d.title}`} accessibilityState={{ selected: active }}>
              {({ hovered }) => (
                <View style={[styles.dossier, active && styles.dossierActive, (hovered || active) && styles.shift]}>
                  <View style={styles.rowBetween}>
                    <T variant="micro" tone="muted">
                      {d.code} · {d.theme}
                    </T>
                    <T variant="numeral" tone="secondary">
                      {p.done}/{p.total}
                    </T>
                  </View>
                  <T variant="heading" size={21} italic={active}>
                    {d.title}
                  </T>
                  <Meter ratio={p.ratio} />
                </View>
              )}
            </Hoverable>
          </Reveal>
        );
      })}
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.flex}>
        <View style={styles.deskHead}>{header}</View>
        <View style={styles.panes}>
          <ScrollView style={styles.cataloguePane} contentContainerStyle={styles.paneContent}>
            {catalogue}
          </ScrollView>
          <ScrollView style={styles.flex} contentContainerStyle={styles.paneContent}>
            {selected ? (
              <Reveal key={selected.id} from={12}>
                <View style={styles.spread}>
                  <Sheet style={[styles.page, styles.leftPage]}>
                    <ReadingsPage dossier={selected} folio={12} />
                  </Sheet>
                  <View style={styles.gutter} />
                  <Sheet style={[styles.page, styles.rightPage]}>
                    <NotesPage dossier={selected} folio={13} />
                  </Sheet>
                </View>
              </Reveal>
            ) : null}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <PageScroll>
      {header}
      {catalogue}
      {!isPhone && selected ? (
        <View style={styles.stack}>
          <Sheet style={styles.page}>
            <ReadingsPage dossier={selected} />
          </Sheet>
          <Sheet style={styles.page}>
            <NotesPage dossier={selected} />
          </Sheet>
        </View>
      ) : null}
    </PageScroll>
  );
}

function ReadingsPage({ dossier, folio }: { dossier: Dossier; folio?: number }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [kind, setKind] = useState<ReadingKind>('Livro');
  const p = studyProgress(dossier);
  const add = () => {
    if (!title.trim()) return;
    dispatch({ type: 'study/addReading', dossierId: dossier.id, reading: { id: newId('r'), kind, title: title.trim(), author: author.trim() || 'Autoria a confirmar', year: null, done: false } });
    haptic('select');
    setTitle('');
    setAuthor('');
  };
  return (
    <View style={styles.pageBody}>
      <View style={styles.rowBetween}>
        <T variant="micro">{dossier.code}</T>
        <T variant="micro" tone="secondary">
          {dossier.theme}
        </T>
      </View>
      <Rule weight="double" strong />
      <T variant="headline" size={36}>
        {dossier.title}
      </T>
      <T variant="subtitle" tone="secondary">
        {dossier.description}
      </T>
      <Rule />
      <View style={styles.rowBetween}>
        <T variant="micro" tone="secondary">
          Leituras
        </T>
        <T variant="micro" tone="secondary">
          {p.done} de {p.total} concluídas
        </T>
      </View>
      <Meter ratio={p.ratio} />
      <View>
        {dossier.readings.map((r) => (
          <Checkbox
            key={r.id}
            checked={r.done}
            onChange={() => dispatch({ type: 'study/toggleReading', dossierId: dossier.id, readingId: r.id })}
            label={
              <View style={styles.reading}>
                <T variant="heading" size={18} tone={r.done ? 'secondary' : 'primary'}>
                  {r.title}
                </T>
                <T variant="micro" tone="secondary">
                  {r.author}
                  {r.year ? ` · ${r.year}` : ''} · {r.kind}
                </T>
              </View>
            }
          />
        ))}
      </View>
      <View style={styles.addBox}>
        <T variant="micro" tone="secondary">
          Acrescentar à bibliografia
        </T>
        <Field placeholder="Título" type="serif" size={18} value={title} onChangeText={setTitle} accessibilityLabel="Título da leitura" />
        <Field placeholder="Autoria" value={author} onChangeText={setAuthor} onSubmitEditing={add} accessibilityLabel="Autoria da leitura" />
        <View style={styles.rowBetween}>
          <View style={styles.kinds}>
            {READING_KINDS.map((k) => (
              <Pressable key={k} onPress={() => setKind(k)} accessibilityRole="button" accessibilityState={{ selected: k === kind }} hitSlop={4}>
                <T variant="micro" tone={k === kind ? 'primary' : 'secondary'} style={k === kind && styles.kindActive}>
                  {k}
                </T>
              </Pressable>
            ))}
          </View>
          <Button label="Adicionar" size="sm" disabled={!title.trim()} onPress={add} />
        </View>
      </View>
      {folio ? (
        <T variant="numeral" tone="secondary" style={styles.folioLeft}>
          {folio}
        </T>
      ) : null}
    </View>
  );
}

function NotesPage({ dossier, folio }: { dossier: Dossier; folio?: number }) {
  const [text, setText] = useState('');
  const today = todayISO();
  const notes = useMemo(() => dossier.notes, [dossier.notes]);
  const add = () => {
    if (!text.trim()) return;
    dispatch({ type: 'study/addNote', dossierId: dossier.id, note: { id: newId('sn'), text: text.trim(), at: today } });
    haptic('select');
    setText('');
  };
  return (
    <View style={styles.pageBody}>
      <View style={styles.rowBetween}>
        <T variant="micro" tone="secondary">
          Notas de leitura
        </T>
        <T variant="micro" tone="secondary">
          Marginália
        </T>
      </View>
      <Rule weight="double" strong />
      <Field multiline placeholder="Anote uma ideia, uma citação, uma ligação com uma pauta…" type="serifItalic" size={18} value={text} onChangeText={setText} inputStyle={styles.noteInput} accessibilityLabel="Nova nota" />
      <View style={styles.rowEnd}>
        <Button label="Anotar" size="sm" variant="solid" disabled={!text.trim()} onPress={add} />
      </View>
      {notes.length === 0 ? (
        <T variant="caption" tone="secondary">
          Nenhuma nota ainda. A margem espera.
        </T>
      ) : null}
      {notes.map((n, i) => (
        <View key={n.id} style={styles.note}>
          <View style={styles.rowBetween}>
            <T variant="micro" tone="secondary">
              ¶ {String(notes.length - i).padStart(2, '0')} · {formatShort(n.at)}
            </T>
            <Pressable onPress={() => dispatch({ type: 'study/removeNote', dossierId: dossier.id, noteId: n.id })} accessibilityRole="button" accessibilityLabel="Apagar nota" hitSlop={8}>
              <T variant="micro" tone="secondary">
                Apagar ×
              </T>
            </Pressable>
          </View>
          <T variant="caption" size={17}>
            {n.text}
          </T>
        </View>
      ))}
      {folio ? (
        <T variant="numeral" tone="secondary" style={styles.folioRight}>
          {folio}
        </T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stack: { gap: 16 },
  deskHead: { paddingHorizontal: 40, paddingTop: 36, paddingBottom: 20 },
  panes: { flex: 1, flexDirection: 'row', gap: 32, paddingHorizontal: 40 },
  paneContent: { paddingBottom: 48 },
  cataloguePane: { width: 260, flexGrow: 0 },
  catalogue: { gap: 10 },
  dossier: { gap: 8, padding: 12, borderLeftWidth: 1.5, borderLeftColor: 'transparent', backgroundColor: palette.graphite900 },
  dossierActive: { borderLeftColor: palette.paper, backgroundColor: palette.graphite800 },
  shift: { transform: [{ translateX: 3 }] },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  rowEnd: { flexDirection: 'row', justifyContent: 'flex-end' },
  spread: { flexDirection: 'row', alignItems: 'stretch' },
  page: { flex: 1, padding: 28 },
  leftPage: { borderTopRightRadius: 0 },
  rightPage: {},
  gutter: { width: 2, backgroundColor: palette.graphite500, boxShadow: '0px 0px 18px rgba(0,0,0,0.6)', zIndex: 2 },
  pageBody: { gap: 14, minHeight: 520 },
  reading: { gap: 2 },
  addBox: { gap: 8, marginTop: 6, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.graphite400, borderStyle: 'dashed' },
  kinds: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', flex: 1 },
  kindActive: { textDecorationLine: 'underline' },
  noteInput: { minHeight: 90 },
  note: { gap: 4, borderLeftWidth: 1, borderLeftColor: palette.ink, paddingLeft: 12 },
  folioLeft: { marginTop: 'auto', paddingTop: 12 },
  folioRight: { marginTop: 'auto', paddingTop: 12, alignSelf: 'flex-end' },
});
