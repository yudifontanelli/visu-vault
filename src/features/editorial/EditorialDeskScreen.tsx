import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '../../design/Button';
import { Dialog } from '../../design/Dialog';
import { Field } from '../../design/Field';
import { Hoverable } from '../../design/Hoverable';
import { PageScroll } from '../../design/Page';
import { Rule, Tag } from '../../design/primitives';
import { Reveal } from '../../design/Reveal';
import { SectionHeader } from '../../design/SectionHeader';
import { Tabs } from '../../design/Tabs';
import { useToast } from '../../design/Toast';
import { T } from '../../design/Typography';
import { color, palette } from '../../design/tokens';
import { useResponsive } from '../../hooks/useResponsive';
import { addDays, todayISO } from '../../lib/dates';
import { newId } from '../../lib/random';
import { dispatch, useAppState } from '../../state/store';
import { useNavigator } from '../navigation';
import { sectionById } from '../sections';
import { memberById, MEMBERS } from '../team/model';
import { Flatplan, STATUS_TONE } from './Flatplan';
import { deadlineLabel, deadlineState, nextStoryCode, Section, SECTIONS, STATUS_LABEL, STATUSES, Story } from './model';
import { ProofSheet } from './ProofSheet';
import { StoryPanel } from './StoryPanel';

type Tab = 'pautas' | 'espelho';

/** Editorial Desk: print workflow with real production tools. */
export function EditorialDeskScreen() {
  const { isPhone, isDesktop, isLarge, width } = useResponsive();
  const { params } = useNavigator();
  const toast = useToast();
  const def = sectionById('editorial');
  const desk = useAppState((s) => s.desk);
  const [tab, setTab] = useState<Tab>('pautas');
  const [selectedId, setSelectedId] = useState<string | null>(params.storyId ?? (isPhone ? null : (desk[0]?.id ?? null)));
  const [creating, setCreating] = useState(false);
  const today = todayISO();

  const selected = desk.find((s) => s.id === selectedId) ?? null;
  const open = desk.filter((s) => s.status !== 'publicado').length;
  const inReview = desk.filter((s) => s.status === 'revisao').length;

  const header = (
    <SectionHeader
      number={def.number}
      name={def.name}
      title="Pautas, provas"
      italic="e espelho."
      meta={`${open} abertas · ${inReview} em revisão`}
      actions={<Button label="Nova pauta" leading="+" variant="solid" onPress={() => setCreating(true)} />}
    />
  );

  const tabs = (
    <Tabs<Tab>
      items={[
        { key: 'pautas', label: 'Pautas', count: desk.length },
        { key: 'espelho', label: 'Espelho' },
      ]}
      value={tab}
      onChange={setTab}
    />
  );

  const galley = (
    <View style={styles.galley}>
      {STATUSES.map((status, i) => {
        const stories = desk.filter((s) => s.status === status).sort((a, b) => a.deadline.localeCompare(b.deadline));
        return (
          <View key={status} style={styles.group}>
            <View style={styles.groupHead}>
              <View style={[styles.swatch, { backgroundColor: STATUS_TONE[status].bg }]} />
              <T variant="micro" tone="secondary">
                {String(i + 1).padStart(2, '0')} · {STATUS_LABEL[status]}
              </T>
              <T variant="micro" tone="muted">
                ({stories.length})
              </T>
            </View>
            <Rule />
            {stories.length === 0 ? (
              <T variant="caption" tone="muted" style={styles.emptyGroup}>
                —
              </T>
            ) : null}
            {stories.map((s) => (
              <StoryRow key={s.id} story={s} today={today} active={s.id === selectedId} onPress={() => setSelectedId(s.id)} />
            ))}
          </View>
        );
      })}
    </View>
  );

  const createDialog = (
    <NewStoryDialog
      visible={creating}
      onClose={() => setCreating(false)}
      onCreate={(story) => {
        dispatch({ type: 'desk/create', story: { ...story, code: nextStoryCode(desk) } });
        setSelectedId(story.id);
        setTab('pautas');
        setCreating(false);
        toast({ kicker: 'Pauta', text: `“${story.title}” entrou na pauta.` });
      }}
    />
  );

  // iPhone: list first, then the story on its own page.
  if (isPhone) {
    if (selected && tab === 'pautas') {
      return (
        <PageScroll>
          <Pressable onPress={() => setSelectedId(null)} accessibilityRole="button" hitSlop={10}>
            <T variant="label">‹ Pautas</T>
          </Pressable>
          <Reveal key={selected.id} axis="x" from={16} style={styles.stack}>
            <ProofSheet story={selected} width={width - 40} />
            <StoryPanel key={selected.id} story={selected} />
          </Reveal>
          {createDialog}
        </PageScroll>
      );
    }
    return (
      <PageScroll>
        {header}
        {tabs}
        {tab === 'pautas' ? galley : <Flatplan selectedId={selectedId} onSelect={setSelectedId} onOpen={(id) => { setSelectedId(id); setTab('pautas'); }} />}
        {createDialog}
      </PageScroll>
    );
  }

  if (tab === 'espelho') {
    return (
      <PageScroll>
        {header}
        {tabs}
        <Flatplan selectedId={selectedId} onSelect={setSelectedId} onOpen={(id) => { setSelectedId(id); setTab('pautas'); }} />
        {createDialog}
      </PageScroll>
    );
  }

  // Desktop: galley | proof | production panel (the panel drops under the proof below 1440 px).
  const contentW = isDesktop ? Math.min(width - 264 - 80, 1320) : width - 56;
  const galleyW = isDesktop ? 290 : 250;
  const panelW = isLarge ? 320 : 0;
  const sheetW = contentW - galleyW - panelW - (isLarge ? 64 : 32);
  return (
    <View style={styles.flex}>
      <View style={[styles.deskHead, { paddingHorizontal: isDesktop ? 40 : 28 }]}>
        {header}
        {tabs}
      </View>
      <View style={[styles.panes, { paddingHorizontal: isDesktop ? 40 : 28 }]}>
        <ScrollView style={{ width: galleyW, flexGrow: 0 }} contentContainerStyle={styles.paneContent}>
          {galley}
        </ScrollView>
        <ScrollView style={styles.flex} contentContainerStyle={styles.paneContent}>
          {selected ? (
            <Reveal key={selected.id} axis="x" from={14} style={styles.stack}>
              <ProofSheet story={selected} width={sheetW} />
              {!isLarge ? <StoryPanel key={selected.id} story={selected} /> : null}
            </Reveal>
          ) : (
            <T variant="subtitle" tone="muted">
              Selecione uma pauta na galé.
            </T>
          )}
        </ScrollView>
        {isLarge && selected ? (
          <ScrollView style={{ width: panelW, flexGrow: 0 }} contentContainerStyle={styles.paneContent}>
            <StoryPanel key={selected.id} story={selected} />
          </ScrollView>
        ) : null}
      </View>
      {createDialog}
    </View>
  );
}

function StoryRow({ story, today, active, onPress }: { story: Story; today: string; active: boolean; onPress: () => void }) {
  const dl = deadlineState(story, today);
  return (
    <Hoverable onPress={onPress} accessibilityLabel={`${story.code} ${story.title}`} accessibilityState={{ selected: active }}>
      {({ hovered, pressed }) => (
        <View style={[styles.row, active && styles.rowActive, (hovered || active) && styles.shift, pressed && styles.pressed]}>
          <View style={styles.rowHead}>
            <T variant="micro" tone="muted">
              {story.code} · {story.section}
            </T>
            <T variant="micro" tone={dl.state === 'overdue' ? 'signal' : dl.state === 'today' || dl.state === 'soon' ? 'secondary' : 'muted'}>
              {deadlineLabel(story, today)}
            </T>
          </View>
          <T variant="heading" size={18} italic={active}>
            {story.title}
          </T>
          <T variant="micro" tone="muted">
            {memberById(story.authorId)?.name}
          </T>
        </View>
      )}
    </Hoverable>
  );
}

function NewStoryDialog({ visible, onClose, onCreate }: { visible: boolean; onClose: () => void; onCreate: (s: Story) => void }) {
  const [title, setTitle] = useState('');
  const [dek, setDek] = useState('');
  const [section, setSection] = useState<Section>('Ensaio');
  const [authorId, setAuthorId] = useState('hd');
  const [days, setDays] = useState(14);
  const [pages, setPages] = useState(4);
  const today = todayISO();
  const valid = title.trim().length > 2;
  const authors = useMemo(() => MEMBERS, []);

  const submit = () => {
    if (!valid) return;
    const id = newId('s');
    onCreate({
      id,
      code: 'P-00',
      title: title.trim(),
      dek: dek.trim(),
      section,
      authorId,
      editorId: authorId === 'hd' ? 'nv' : 'hd',
      deadline: addDays(today, days),
      status: 'pauta',
      body: '',
      wordsTarget: 1200,
      pageStart: null,
      pageCount: pages,
      checklist: [{ id: newId('c'), label: 'Apuração inicial', done: false }],
      notes: [],
    });
    setTitle('');
    setDek('');
  };

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      kicker="Editorial Desk"
      title="Nova pauta"
      footer={
        <>
          <Button label="Cancelar" variant="ghost" onPress={onClose} />
          <Button label="Criar pauta" variant="solid" disabled={!valid} onPress={submit} />
        </>
      }
    >
      <Field label="Título" type="serif" size={24} value={title} onChangeText={setTitle} placeholder="Título de trabalho" autoFocus />
      <Field label="Linha fina" type="serifItalic" size={17} value={dek} onChangeText={setDek} placeholder="Uma frase sobre a matéria" />
      <View style={styles.choice}>
        <T variant="micro" tone="muted">
          Seção
        </T>
        <View style={styles.tags}>
          {SECTIONS.map((s) => (
            <Pressable key={s} onPress={() => setSection(s)} accessibilityRole="button" accessibilityState={{ selected: s === section }}>
              <Tag filled={s === section}>{s}</Tag>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.choice}>
        <T variant="micro" tone="muted">
          Autoria
        </T>
        <View style={styles.tags}>
          {authors.map((m) => (
            <Pressable key={m.id} onPress={() => setAuthorId(m.id)} accessibilityRole="button" accessibilityState={{ selected: m.id === authorId }}>
              <Tag filled={m.id === authorId}>{m.name}</Tag>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.steppers}>
        <View style={styles.choice}>
          <T variant="micro" tone="muted">
            Prazo
          </T>
          <View style={styles.stepper}>
            <Button label="−" size="sm" variant="ghost" onPress={() => setDays((d) => Math.max(1, d - 1))} accessibilityLabel="Menos um dia" />
            <T variant="heading">{days} dias</T>
            <Button label="+" size="sm" variant="ghost" onPress={() => setDays((d) => d + 1)} accessibilityLabel="Mais um dia" />
          </View>
        </View>
        <View style={styles.choice}>
          <T variant="micro" tone="muted">
            Páginas
          </T>
          <View style={styles.stepper}>
            <Button label="−" size="sm" variant="ghost" onPress={() => setPages((p) => Math.max(1, p - 1))} accessibilityLabel="Menos uma página" />
            <T variant="heading">{pages}</T>
            <Button label="+" size="sm" variant="ghost" onPress={() => setPages((p) => Math.min(24, p + 1))} accessibilityLabel="Mais uma página" />
          </View>
        </View>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stack: { gap: 24 },
  deskHead: { paddingTop: 36, gap: 18 },
  panes: { flex: 1, flexDirection: 'row', gap: 32, paddingTop: 20 },
  paneContent: { paddingBottom: 48 },
  galley: { gap: 18 },
  group: { gap: 4 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 10, height: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: color.lineStrong },
  emptyGroup: { paddingVertical: 4 },
  row: { paddingVertical: 10, paddingLeft: 10, gap: 3, borderLeftWidth: 1.5, borderLeftColor: 'transparent' },
  rowActive: { borderLeftColor: palette.paper, backgroundColor: palette.graphite900 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  shift: { transform: [{ translateX: 3 }] },
  pressed: { opacity: 0.75 },
  choice: { gap: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  steppers: { flexDirection: 'row', gap: 32, flexWrap: 'wrap' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
