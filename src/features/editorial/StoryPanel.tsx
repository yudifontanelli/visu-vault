import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../design/Button';
import { Checkbox } from '../../design/Checkbox';
import { Field } from '../../design/Field';
import { haptic } from '../../design/haptics';
import { Hoverable } from '../../design/Hoverable';
import { Rule } from '../../design/primitives';
import { T } from '../../design/Typography';
import { palette } from '../../design/tokens';
import { addDays, formatShort, todayISO } from '../../lib/dates';
import { newId } from '../../lib/random';
import { dispatch, useAppState } from '../../state/store';
import { memberById, MEMBERS } from '../team/model';
import {
  canAdvance,
  canRetreat,
  clampPages,
  deadlineLabel,
  deadlineState,
  firstFreeRun,
  flatplan,
  ISSUE_PAGES,
  STATUS_LABEL,
  STATUSES,
  Story,
} from './model';

const pad = (n: number) => String(n).padStart(2, '0');

export function pageRange(s: Pick<Story, 'pageStart' | 'pageCount'>): string {
  if (s.pageStart === null) return 'Sem páginas';
  const end = s.pageStart + s.pageCount - 1;
  return s.pageCount === 1 ? `p. ${pad(s.pageStart)}` : `pp. ${pad(s.pageStart)}–${pad(end)}`;
}

/** Production panel: workflow, deadline, team, pages, checklist and review notes. */
export function StoryPanel({ story }: { story: Story }) {
  const desk = useAppState((s) => s.desk);
  const today = todayISO();
  const [blocked, setBlocked] = useState<string | null>(null);
  const [newCheck, setNewCheck] = useState('');
  const [newNote, setNewNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const advance = canAdvance(story);
  const idx = STATUSES.indexOf(story.status);
  const next = STATUSES[idx + 1];
  const dl = deadlineState(story, today);

  const conflicts = useMemo(() => {
    if (story.pageStart === null) return [];
    const { conflicts: pages } = flatplan(desk);
    return pages.filter((p) => p >= story.pageStart! && p < story.pageStart! + story.pageCount);
  }, [desk, story.pageCount, story.pageStart]);

  const setPages = (pageStart: number | null, pageCount: number) => dispatch({ type: 'desk/setPages', id: story.id, ...clampPages(pageStart, pageCount) });
  const cycle = (current: string) => {
    const i = MEMBERS.findIndex((m) => m.id === current);
    return MEMBERS[(i + 1) % MEMBERS.length].id;
  };

  return (
    <View style={styles.panel}>
      <Section label="Fluxo">
        <View style={styles.steps}>
          {STATUSES.map((s, i) => {
            const state = i < idx ? 'done' : i === idx ? 'current' : 'todo';
            return (
              <View key={s} style={styles.step}>
                <T variant="numeral" tone={state === 'todo' ? 'muted' : 'primary'} style={styles.stepMark}>
                  {state === 'done' ? '✓' : state === 'current' ? '●' : '○'}
                </T>
                <T variant={state === 'current' ? 'labelStrong' : 'label'} tone={state === 'todo' ? 'muted' : state === 'current' ? 'primary' : 'secondary'}>
                  {pad(i + 1)} {STATUS_LABEL[s]}
                </T>
              </View>
            );
          })}
        </View>
        <View style={styles.row}>
          <Button
            label="Voltar"
            leading="←"
            size="sm"
            variant="ghost"
            disabled={!canRetreat(story)}
            onPress={() => {
              setBlocked(null);
              dispatch({ type: 'desk/retreat', id: story.id });
            }}
          />
          {next ? (
            <Button
              label={`Avançar: ${STATUS_LABEL[next]}`}
              trailing="→"
              size="sm"
              variant="solid"
              onPress={() => {
                if (!advance.ok) {
                  haptic('warning');
                  setBlocked(advance.reason);
                  return;
                }
                setBlocked(null);
                haptic('success');
                dispatch({ type: 'desk/advance', id: story.id });
              }}
            />
          ) : null}
        </View>
        {blocked ? (
          <T variant="caption" tone="signal" accessibilityLiveRegion="polite">
            {blocked}
          </T>
        ) : null}
      </Section>

      <Section label="Prazo">
        <View style={styles.rowBetween}>
          <View>
            <T variant="heading">{formatShort(story.deadline)}</T>
            <T variant="micro" tone={dl.state === 'overdue' ? 'signal' : 'muted'}>
              {deadlineLabel(story, today)}
            </T>
          </View>
          <View style={styles.row}>
            <Button label="−1 dia" size="sm" variant="ghost" onPress={() => dispatch({ type: 'desk/update', id: story.id, patch: { deadline: addDays(story.deadline, -1) } })} />
            <Button label="+1 dia" size="sm" variant="ghost" onPress={() => dispatch({ type: 'desk/update', id: story.id, patch: { deadline: addDays(story.deadline, 1) } })} />
          </View>
        </View>
      </Section>

      <Section label="Equipe">
        {(
          [
            ['Autoria', 'authorId'],
            ['Edição', 'editorId'],
          ] as const
        ).map(([label, key]) => (
          <Hoverable
            key={key}
            onPress={() => dispatch({ type: 'desk/update', id: story.id, patch: { [key]: cycle(story[key]) } })}
            accessibilityLabel={`${label}: ${memberById(story[key])?.name}. Toque para trocar.`}
          >
            {({ hovered }) => (
              <View style={styles.rowBetween}>
                <T variant="micro" tone="muted">
                  {label}
                </T>
                <T variant="body" style={hovered && styles.underline}>
                  {memberById(story[key])?.name ?? '—'} ↻
                </T>
              </View>
            )}
          </Hoverable>
        ))}
      </Section>

      <Section label="Páginas · espelho">
        <View style={styles.rowBetween}>
          <T variant="heading">{pageRange(story)}</T>
          {story.pageStart === null ? (
            <Button
              label="Encaixar"
              size="sm"
              onPress={() => {
                const start = firstFreeRun(desk, story.pageCount, story.id);
                if (start !== null) setPages(start, story.pageCount);
                else setBlocked(`Não há ${story.pageCount} páginas livres seguidas na edição.`);
              }}
            />
          ) : (
            <Button label="Retirar" size="sm" variant="ghost" onPress={() => setPages(null, story.pageCount)} />
          )}
        </View>
        <View style={styles.row}>
          <T variant="micro" tone="muted" style={styles.stepperLabel}>
            Início
          </T>
          <Button label="−" size="sm" variant="ghost" disabled={story.pageStart === null} onPress={() => setPages((story.pageStart ?? 2) - 1, story.pageCount)} accessibilityLabel="Página inicial anterior" />
          <Button label="+" size="sm" variant="ghost" disabled={story.pageStart === null} onPress={() => setPages((story.pageStart ?? 2) + 1, story.pageCount)} accessibilityLabel="Próxima página inicial" />
          <T variant="micro" tone="muted" style={styles.stepperLabel}>
            Extensão {story.pageCount}
          </T>
          <Button label="−" size="sm" variant="ghost" disabled={story.pageCount <= 1} onPress={() => setPages(story.pageStart, story.pageCount - 1)} accessibilityLabel="Menos páginas" />
          <Button label="+" size="sm" variant="ghost" disabled={story.pageCount >= ISSUE_PAGES - 2} onPress={() => setPages(story.pageStart, story.pageCount + 1)} accessibilityLabel="Mais páginas" />
        </View>
        {conflicts.length > 0 ? (
          <T variant="caption" tone="signal">
            Conflito no espelho: {conflicts.length === 1 ? 'página' : 'páginas'} {conflicts.map(pad).join(', ')} {conflicts.length === 1 ? 'já ocupada' : 'já ocupadas'}.
          </T>
        ) : null}
      </Section>

      <Section label={`Checklist · ${story.checklist.filter((c) => c.done).length}/${story.checklist.length}`}>
        {story.checklist.map((c) => (
          <Checkbox key={c.id} checked={c.done} label={c.label} onChange={() => dispatch({ type: 'desk/toggleCheck', id: story.id, itemId: c.id })} />
        ))}
        <Field
          placeholder="Adicionar item…"
          value={newCheck}
          onChangeText={setNewCheck}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (!newCheck.trim()) return;
            dispatch({ type: 'desk/addCheck', id: story.id, item: { id: newId('c'), label: newCheck.trim(), done: false } });
            setNewCheck('');
          }}
          accessibilityLabel="Novo item do checklist"
        />
      </Section>

      <Section label={`Revisão · ${story.notes.filter((n) => !n.resolved).length} em aberto`}>
        {story.notes.length === 0 ? (
          <T variant="caption" tone="muted">
            Nenhuma nota de revisão.
          </T>
        ) : null}
        {story.notes.map((n, i) => (
          <View key={n.id} style={[styles.note, n.resolved && styles.noteResolved]}>
            <View style={styles.rowBetween}>
              <T variant="micro" tone="muted">
                {pad(i + 1)} · {memberById(n.authorId)?.initials ?? '—'} · {formatShort(n.at)}
              </T>
              <Button
                label={n.resolved ? 'Reabrir' : 'Resolver'}
                size="sm"
                variant="ghost"
                onPress={() => dispatch({ type: 'desk/resolveNote', id: story.id, noteId: n.id })}
              />
            </View>
            <T variant="caption" size={15} tone={n.resolved ? 'muted' : 'primary'} style={n.resolved && styles.struck}>
              {n.text}
            </T>
          </View>
        ))}
        <Field
          placeholder="Nova nota de revisão…"
          value={newNote}
          onChangeText={setNewNote}
          returnKeyType="send"
          onSubmitEditing={() => {
            if (!newNote.trim()) return;
            dispatch({ type: 'desk/addNote', id: story.id, note: { id: newId('n'), authorId: story.editorId, text: newNote.trim(), at: today, resolved: false } });
            setNewNote('');
          }}
          accessibilityLabel="Nova nota de revisão"
        />
      </Section>

      <Rule />
      <Button
        label={confirmDelete ? 'Confirmar exclusão' : 'Excluir pauta'}
        size="sm"
        variant="danger"
        onPress={() => {
          if (!confirmDelete) {
            setConfirmDelete(true);
            return;
          }
          dispatch({ type: 'desk/remove', id: story.id });
        }}
      />
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <T variant="micro" tone="secondary">
          {label}
        </T>
      </View>
      <Rule />
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 22 },
  section: { gap: 8 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionBody: { gap: 10 },
  steps: { gap: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepMark: { width: 14 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  stepperLabel: { marginLeft: 2 },
  underline: { textDecorationLine: 'underline' },
  note: { gap: 2, borderLeftWidth: 1.5, borderLeftColor: palette.paper, paddingLeft: 10 },
  noteResolved: { borderLeftColor: palette.graphite600 },
  struck: { textDecorationLine: 'line-through' },
});
