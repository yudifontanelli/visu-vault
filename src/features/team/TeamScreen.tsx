import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '../../design/Button';
import { Hoverable } from '../../design/Hoverable';
import { PageScroll } from '../../design/Page';
import { Leaders, Monogram, Rule } from '../../design/primitives';
import { Reveal } from '../../design/Reveal';
import { SectionHeader } from '../../design/SectionHeader';
import { T } from '../../design/Typography';
import { palette } from '../../design/tokens';
import { useResponsive } from '../../hooks/useResponsive';
import { todayISO } from '../../lib/dates';
import { dispatch, useAppState } from '../../state/store';
import { deadlineLabel, deadlineState, STATUS_LABEL } from '../editorial/model';
import { useNavigator } from '../navigation';
import { STAGE_LABEL } from '../projects/model';
import { sectionById } from '../sections';
import { AVAILABILITY_LABEL, AVAILABILITY_ORDER, Member, MEMBERS } from './model';

/** Team, set as a magazine masthead (expediente), with what each person is on now. */
export function TeamScreen() {
  const { isPhone, isDesktop } = useResponsive();
  const { params } = useNavigator();
  const def = sectionById('team');
  const team = useAppState((s) => s.team);
  const [selectedId, setSelectedId] = useState<string | null>(params.memberId ?? (isPhone ? null : MEMBERS[0].id));
  const selected = MEMBERS.find((m) => m.id === selectedId) ?? null;
  const busy = MEMBERS.filter((m) => team[m.id] === 'producao').length;

  const header = <SectionHeader number={def.number} name={def.name} title="Expediente" italic="do estúdio." meta={`${MEMBERS.length} pessoas · ${busy} em produção`} />;

  if (isPhone && selected) {
    return (
      <PageScroll>
        <Pressable onPress={() => setSelectedId(null)} accessibilityRole="button" hitSlop={10}>
          <T variant="label">‹ Expediente</T>
        </Pressable>
        <Reveal key={selected.id} axis="x" from={16}>
          <MemberDetail member={selected} />
        </Reveal>
      </PageScroll>
    );
  }

  const masthead = (
    <View>
      <Rule strong />
      {MEMBERS.map((m, i) => {
        const active = m.id === selectedId;
        return (
          <Reveal key={m.id} index={i}>
            <Hoverable onPress={() => setSelectedId(m.id)} accessibilityLabel={`${m.name}, ${m.role}`} accessibilityState={{ selected: active }}>
              {({ hovered }) => (
                <View style={[styles.mastRow, isPhone && styles.mastRowPhone, active && styles.mastActive]}>
                  <T variant="micro" tone="muted" style={[styles.role, isPhone && styles.rolePhone]}>
                    {m.role}
                  </T>
                  <View style={[styles.nameLine, (hovered || active) && styles.shift]}>
                    <T variant="heading" size={isPhone ? 22 : 26} italic={active}>
                      {m.name}
                    </T>
                    {!isPhone ? <Leaders /> : <View style={styles.flex} />}
                    <T variant="micro" tone={team[m.id] === 'disponivel' ? 'primary' : 'muted'}>
                      {AVAILABILITY_LABEL[team[m.id] ?? 'disponivel']}
                    </T>
                  </View>
                </View>
              )}
            </Hoverable>
            <Rule />
          </Reveal>
        );
      })}
      <T variant="caption" tone="muted" style={styles.note}>
        Equipe fictícia da sessão demonstrativa.
      </T>
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.flex}>
        <View style={styles.deskHead}>{header}</View>
        <View style={styles.panes}>
          <ScrollView style={styles.flex} contentContainerStyle={styles.paneContent}>
            {masthead}
          </ScrollView>
          {selected ? (
            <ScrollView style={styles.detailPane} contentContainerStyle={styles.paneContent}>
              <Reveal key={selected.id} axis="x" from={14}>
                <MemberDetail member={selected} />
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
      {masthead}
      {!isPhone && selected ? <MemberDetail member={selected} /> : null}
    </PageScroll>
  );
}

function MemberDetail({ member }: { member: Member }) {
  const { go } = useNavigator();
  const team = useAppState((s) => s.team);
  const desk = useAppState((s) => s.desk);
  const projects = useAppState((s) => s.projects);
  const today = todayISO();
  const availability = team[member.id] ?? 'disponivel';
  const stories = useMemo(
    () => desk.filter((s) => s.status !== 'publicado' && (s.authorId === member.id || s.editorId === member.id)).sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [desk, member.id],
  );
  const led = useMemo(() => projects.filter((p) => !p.archived && p.leadId === member.id), [projects, member.id]);

  return (
    <View style={styles.detail}>
      <View style={styles.who}>
        <Monogram initials={member.initials} size={64} />
        <View style={styles.flex}>
          <T variant="micro" tone="secondary">
            {member.desk}
          </T>
          <T variant="title">{member.name}</T>
          <T variant="label" tone="muted">
            {member.role}
          </T>
        </View>
      </View>
      <T variant="subtitle" tone="secondary">
        {member.focus}
      </T>
      <Rule strong />
      <T variant="micro" tone="muted">
        Disponibilidade
      </T>
      <View style={styles.avail}>
        {AVAILABILITY_ORDER.map((a) => (
          <Button
            key={a}
            label={AVAILABILITY_LABEL[a]}
            size="sm"
            variant={a === availability ? 'solid' : 'ghost'}
            onPress={() => dispatch({ type: 'team/setAvailability', memberId: member.id, availability: a })}
            accessibilityLabel={`Marcar ${AVAILABILITY_LABEL[a]}`}
          />
        ))}
      </View>
      <Rule />
      <T variant="micro" tone="muted">
        Em andamento · pautas
      </T>
      {stories.length === 0 ? (
        <T variant="caption" tone="muted">
          Nenhuma pauta aberta.
        </T>
      ) : null}
      {stories.map((s) => (
        <Hoverable key={s.id} onPress={() => go('editorial', { storyId: s.id })} accessibilityLabel={`Abrir pauta ${s.title}`}>
          {({ hovered }) => (
            <View style={[styles.item, hovered && styles.shift]}>
              <T variant="micro" tone="muted">
                {s.code} · {s.authorId === member.id ? 'Autoria' : 'Edição'} · {STATUS_LABEL[s.status]}
              </T>
              <T variant="heading" size={18}>
                {s.title} →
              </T>
              <T variant="micro" tone={deadlineState(s, today).state === 'overdue' ? 'signal' : 'secondary'}>
                {deadlineLabel(s, today)}
              </T>
            </View>
          )}
        </Hoverable>
      ))}
      <T variant="micro" tone="muted" style={styles.blockGap}>
        Em andamento · projetos
      </T>
      {led.length === 0 ? (
        <T variant="caption" tone="muted">
          Não lidera projetos agora.
        </T>
      ) : null}
      {led.map((p) => (
        <Hoverable key={p.id} onPress={() => go('projects', { projectId: p.id })} accessibilityLabel={`Abrir projeto ${p.title}`}>
          {({ hovered }) => (
            <View style={[styles.item, hovered && styles.shift]}>
              <T variant="micro" tone="muted">
                {p.code} · {p.kind} · {STAGE_LABEL[p.stage]}
              </T>
              <T variant="heading" size={18}>
                {p.title} →
              </T>
            </View>
          )}
        </Hoverable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  deskHead: { paddingHorizontal: 40, paddingTop: 36, paddingBottom: 20 },
  panes: { flex: 1, flexDirection: 'row', gap: 40, paddingHorizontal: 40 },
  paneContent: { paddingBottom: 48 },
  detailPane: { width: 400, flexGrow: 0 },
  mastRow: { flexDirection: 'row', alignItems: 'baseline', paddingVertical: 14, paddingHorizontal: 6, gap: 16 },
  mastRowPhone: { flexDirection: 'column', alignItems: 'stretch', gap: 2 },
  mastActive: { backgroundColor: palette.graphite900 },
  role: { width: 190 },
  rolePhone: { width: undefined },
  nameLine: { flex: 1, flexDirection: 'row', alignItems: 'baseline' },
  shift: { transform: [{ translateX: 4 }] },
  note: { marginTop: 14 },
  detail: { gap: 14 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avail: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  item: { gap: 2, paddingVertical: 6, borderLeftWidth: 1.5, borderLeftColor: palette.graphite600, paddingLeft: 10 },
  blockGap: { marginTop: 8 },
});
