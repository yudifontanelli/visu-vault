import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '../../design/Button';
import { Checkbox } from '../../design/Checkbox';
import { Dialog } from '../../design/Dialog';
import { Field } from '../../design/Field';
import { haptic } from '../../design/haptics';
import { Hoverable } from '../../design/Hoverable';
import { PageScroll } from '../../design/Page';
import { Meter, Monogram, Rule, Tag } from '../../design/primitives';
import { Reveal } from '../../design/Reveal';
import { SectionHeader } from '../../design/SectionHeader';
import { useToast } from '../../design/Toast';
import { T } from '../../design/Typography';
import { palette } from '../../design/tokens';
import { useResponsive } from '../../hooks/useResponsive';
import { addDays, daysBetween, formatShort, relativeDays, todayISO } from '../../lib/dates';
import { newId } from '../../lib/random';
import { appStore, dispatch, useAppState } from '../../state/store';
import { useNavigator } from '../navigation';
import { sectionById } from '../sections';
import { memberById, MEMBERS } from '../team/model';
import { canArchive, nextProjectCode, Project, PROJECT_KINDS, ProjectKind, progress, STAGE_LABEL, STAGES } from './model';

/** Projects: productions in progress. Modern and functional; identity stays in the details. */
export function ProjectsScreen() {
  const { isPhone, isDesktop } = useResponsive();
  const { params } = useNavigator();
  const def = sectionById('projects');
  const all = useAppState((s) => s.projects);
  const projects = useMemo(() => all.filter((p) => !p.archived), [all]);
  const [selectedId, setSelectedId] = useState<string | null>(params.projectId ?? (isPhone ? null : (projects[0]?.id ?? null)));
  const [creating, setCreating] = useState(false);
  const today = todayISO();
  const selected = projects.find((p) => p.id === selectedId) ?? null;
  const ready = projects.filter((p) => canArchive(p).ok).length;

  const header = (
    <SectionHeader
      number={def.number}
      name={def.name}
      title="Produções"
      italic="em curso."
      meta={`${projects.length} ativos · ${ready} pronto${ready === 1 ? '' : 's'} para arquivar`}
      actions={<Button label="Novo projeto" leading="+" variant="solid" onPress={() => setCreating(true)} />}
    />
  );

  const dialog = (
    <NewProjectDialog
      visible={creating}
      onClose={() => setCreating(false)}
      onCreate={(p) => {
        dispatch({ type: 'projects/create', project: { ...p, code: nextProjectCode(appStore.getState().projects) } });
        setSelectedId(p.id);
        setCreating(false);
      }}
    />
  );

  if (isPhone && selected) {
    return (
      <PageScroll>
        <Pressable onPress={() => setSelectedId(null)} accessibilityRole="button" hitSlop={10}>
          <T variant="label">‹ Projetos</T>
        </Pressable>
        <Reveal key={selected.id} axis="x" from={16}>
          <ProjectDetail project={selected} onArchived={() => setSelectedId(null)} />
        </Reveal>
      </PageScroll>
    );
  }

  const list = (
    <View style={styles.table}>
      {!isPhone ? (
        <View style={[styles.tr, styles.th]}>
          <T variant="micro" tone="muted" style={styles.cCode}>
            Nº
          </T>
          <T variant="micro" tone="muted" style={styles.cTitle}>
            Projeto
          </T>
          <T variant="micro" tone="muted" style={styles.cStage}>
            Etapa
          </T>
          <T variant="micro" tone="muted" style={styles.cLead}>
            Resp.
          </T>
          <T variant="micro" tone="muted" style={styles.cDue}>
            Entrega
          </T>
          <T variant="micro" tone="muted" style={styles.cProg}>
            Entregas
          </T>
        </View>
      ) : null}
      <Rule strong />
      {projects.map((p, i) => {
        const prog = progress(p);
        const days = daysBetween(today, p.due);
        const active = p.id === selectedId;
        return (
          <Reveal key={p.id} index={i}>
            <Hoverable onPress={() => setSelectedId(p.id)} accessibilityLabel={`${p.code} ${p.title}`} accessibilityState={{ selected: active }}>
              {({ hovered, pressed }) => (
                <View style={[styles.tr, isPhone && styles.trPhone, (active || hovered) && styles.trActive, pressed && styles.pressed]}>
                  <T variant="numeral" tone={active ? 'primary' : 'muted'} style={styles.cCode}>
                    {p.code}
                  </T>
                  <View style={styles.cTitle}>
                    <T variant="heading" size={19} italic={active}>
                      {p.title}
                    </T>
                    <T variant="micro" tone="muted">
                      {p.kind} · {p.partner}
                    </T>
                  </View>
                  <View style={styles.cStage}>
                    <StageBar stage={STAGES.indexOf(p.stage)} />
                    <T variant="micro" tone="secondary">
                      {STAGE_LABEL[p.stage]}
                    </T>
                  </View>
                  {!isPhone ? (
                    <View style={styles.cLead}>
                      <Monogram initials={memberById(p.leadId)?.initials ?? '—'} size={28} />
                    </View>
                  ) : null}
                  <View style={styles.cDue}>
                    <T variant="numeral">{formatShort(p.due)}</T>
                    <T variant="micro" tone={days < 0 ? 'signal' : 'muted'}>
                      {relativeDays(p.due, today)}
                    </T>
                  </View>
                  <View style={styles.cProg}>
                    <T variant="numeral" tone="secondary">
                      {prog.done}/{prog.total}
                    </T>
                    <Meter ratio={prog.ratio} style={styles.meter} />
                  </View>
                </View>
              )}
            </Hoverable>
            <Rule />
          </Reveal>
        );
      })}
      {projects.length === 0 ? (
        <T variant="subtitle" tone="muted" style={styles.empty}>
          Nenhuma produção em curso. Tudo arquivado.
        </T>
      ) : null}
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.flex}>
        <View style={styles.deskHead}>{header}</View>
        <View style={styles.panes}>
          <ScrollView style={styles.flex} contentContainerStyle={styles.paneContent}>
            {list}
          </ScrollView>
          {selected ? (
            <ScrollView style={styles.detailPane} contentContainerStyle={styles.paneContent}>
              <Reveal key={selected.id} axis="x" from={14}>
                <ProjectDetail project={selected} onArchived={() => setSelectedId(projects.find((p) => p.id !== selected.id)?.id ?? null)} />
              </Reveal>
            </ScrollView>
          ) : null}
        </View>
        {dialog}
      </View>
    );
  }

  return (
    <PageScroll>
      {header}
      {list}
      {!isPhone && selected ? <ProjectDetail project={selected} onArchived={() => setSelectedId(null)} /> : null}
      {dialog}
    </PageScroll>
  );
}

function StageBar({ stage }: { stage: number }) {
  return (
    <View style={styles.stageBar} accessibilityLabel={`Etapa ${stage + 1} de ${STAGES.length}`}>
      {STAGES.map((s, i) => (
        <View key={s} style={[styles.stageSeg, i < stage && styles.segDone, i === stage && styles.segNow]} />
      ))}
    </View>
  );
}

function ProjectDetail({ project, onArchived }: { project: Project; onArchived: () => void }) {
  const { go } = useNavigator();
  const toast = useToast();
  const [newItem, setNewItem] = useState('');
  const check = canArchive(project);
  const prog = progress(project);
  const today = todayISO();
  const lead = memberById(project.leadId);

  const archive = () => {
    if (!check.ok) return;
    const recordId = newId('ar');
    dispatch({ type: 'projects/archive', id: project.id, recordId, on: today });
    haptic('success');
    const record = appStore.getState().archive.find((r) => r.id === recordId);
    toast({
      kicker: 'Arquivo',
      text: `Arquivado como ${record?.accession ?? 'nova ficha'}.`,
      action: { label: 'Ver ficha', onPress: () => go('archive', { recordId }) },
    });
    onArchived();
  };

  return (
    <View style={styles.detail}>
      <T variant="micro" tone="secondary">
        {project.code} · {project.kind} · {project.partner}
      </T>
      <T variant="title">{project.title}</T>
      <T variant="body" tone="secondary">
        {project.summary}
      </T>
      <Rule strong />
      <T variant="micro" tone="muted">
        Etapa
      </T>
      <View style={styles.stages}>
        {STAGES.map((s, i) => {
          const at = STAGES.indexOf(project.stage);
          const state = i < at ? 'done' : i === at ? 'now' : 'todo';
          return (
            <Pressable
              key={s}
              onPress={() => {
                haptic('select');
                dispatch({ type: 'projects/setStage', id: project.id, stage: s });
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: state === 'now' }}
              accessibilityLabel={`Etapa ${STAGE_LABEL[s]}`}
              style={({ pressed }) => [styles.stageBtn, state === 'now' && styles.stageNow, pressed && styles.pressed]}
            >
              <T variant="micro" tone={state === 'todo' ? 'muted' : state === 'now' ? 'inverse' : 'secondary'}>
                {state === 'done' ? '✓ ' : ''}
                {STAGE_LABEL[s]}
              </T>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.facts}>
        {[
          ['Início', formatShort(project.start)],
          ['Entrega', `${formatShort(project.due)} · ${relativeDays(project.due, today)}`],
          ['Responsável', lead?.name ?? '—'],
        ].map(([k, v]) => (
          <View key={k} style={styles.fact}>
            <T variant="micro" tone="muted">
              {k}
            </T>
            <T variant="bodySm">{v}</T>
          </View>
        ))}
      </View>
      <View style={styles.rowBetween}>
        <T variant="micro" tone="muted">
          Entregas · {prog.done}/{prog.total}
        </T>
        <Meter ratio={prog.ratio} style={styles.meterWide} />
      </View>
      <View>
        {project.deliverables.map((d) => (
          <Checkbox key={d.id} checked={d.done} label={d.label} onChange={() => dispatch({ type: 'projects/toggleDeliverable', id: project.id, itemId: d.id })} />
        ))}
      </View>
      <Field
        placeholder="Adicionar entrega…"
        value={newItem}
        onChangeText={setNewItem}
        returnKeyType="done"
        onSubmitEditing={() => {
          if (!newItem.trim()) return;
          dispatch({ type: 'projects/addDeliverable', id: project.id, item: { id: newId('d'), label: newItem.trim(), done: false } });
          setNewItem('');
        }}
        accessibilityLabel="Nova entrega"
      />
      <Rule />
      <Button label="Arquivar projeto" trailing="→" variant={check.ok ? 'solid' : 'outline'} disabled={!check.ok} onPress={archive} />
      {!check.ok ? (
        <T variant="caption" tone="muted">
          Para arquivar: {check.reason.charAt(0).toLowerCase() + check.reason.slice(1)}
        </T>
      ) : (
        <T variant="caption" tone="secondary">
          Pronto para o Archive: vira uma ficha catalográfica com número de tombo.
        </T>
      )}
    </View>
  );
}

function NewProjectDialog({ visible, onClose, onCreate }: { visible: boolean; onClose: () => void; onCreate: (p: Project) => void }) {
  const [title, setTitle] = useState('');
  const [partner, setPartner] = useState('');
  const [kind, setKind] = useState<ProjectKind>('Campanha');
  const [leadId, setLeadId] = useState('cm');
  const [weeks, setWeeks] = useState(6);
  const valid = title.trim().length > 2;
  const today = todayISO();
  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      kicker="Projects"
      title="Novo projeto"
      footer={
        <>
          <Button label="Cancelar" variant="ghost" onPress={onClose} />
          <Button
            label="Criar projeto"
            variant="solid"
            disabled={!valid}
            onPress={() => {
              onCreate({
                id: newId('pr'),
                code: 'PR-00',
                title: title.trim(),
                kind,
                partner: partner.trim() || 'VISUVAULT',
                leadId,
                start: today,
                due: addDays(today, weeks * 7),
                stage: 'briefing',
                summary: 'Novo projeto. Descreva o objetivo no briefing.',
                deliverables: [{ id: newId('d'), label: 'Briefing aprovado', done: false }],
                archived: false,
              });
              setTitle('');
              setPartner('');
            }}
          />
        </>
      }
    >
      <Field label="Título" type="serif" size={24} value={title} onChangeText={setTitle} placeholder="Nome do projeto" autoFocus />
      <Field label="Parceiro" value={partner} onChangeText={setPartner} placeholder="Cliente, instituição ou coletivo" />
      <View style={styles.choice}>
        <T variant="micro" tone="muted">
          Tipo
        </T>
        <View style={styles.tags}>
          {PROJECT_KINDS.map((k) => (
            <Pressable key={k} onPress={() => setKind(k)} accessibilityRole="button" accessibilityState={{ selected: k === kind }}>
              <Tag filled={k === kind}>{k}</Tag>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.choice}>
        <T variant="micro" tone="muted">
          Responsável
        </T>
        <View style={styles.tags}>
          {MEMBERS.map((m) => (
            <Pressable key={m.id} onPress={() => setLeadId(m.id)} accessibilityRole="button" accessibilityState={{ selected: m.id === leadId }}>
              <Tag filled={m.id === leadId}>{m.name}</Tag>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.choice}>
        <T variant="micro" tone="muted">
          Prazo
        </T>
        <View style={styles.stepper}>
          <Button label="−" size="sm" variant="ghost" onPress={() => setWeeks((w) => Math.max(1, w - 1))} accessibilityLabel="Menos uma semana" />
          <T variant="heading">{weeks} semanas</T>
          <Button label="+" size="sm" variant="ghost" onPress={() => setWeeks((w) => w + 1)} accessibilityLabel="Mais uma semana" />
        </View>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  deskHead: { paddingHorizontal: 40, paddingTop: 36, paddingBottom: 20 },
  panes: { flex: 1, flexDirection: 'row', gap: 36, paddingHorizontal: 40 },
  paneContent: { paddingBottom: 48 },
  detailPane: { width: 360, flexGrow: 0 },
  table: {},
  tr: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 8 },
  trPhone: { flexWrap: 'wrap', rowGap: 10 },
  th: { paddingVertical: 8 },
  trActive: { backgroundColor: palette.graphite900 },
  pressed: { opacity: 0.75 },
  cCode: { width: 60 },
  cTitle: { flex: 1, minWidth: 180, gap: 2 },
  cStage: { width: 116, gap: 6 },
  cLead: { width: 44 },
  cDue: { width: 92, gap: 2 },
  cProg: { width: 76, gap: 6 },
  meter: { width: 64 },
  meterWide: { width: 140 },
  stageBar: { flexDirection: 'row', gap: 3 },
  stageSeg: { flex: 1, height: 4, backgroundColor: palette.graphite700 },
  segDone: { backgroundColor: palette.graphite400 },
  segNow: { backgroundColor: palette.paper },
  empty: { paddingVertical: 24 },
  detail: { gap: 14 },
  stages: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stageBtn: { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.graphite500, paddingHorizontal: 8, paddingVertical: 6 },
  stageNow: { backgroundColor: palette.paper, borderColor: palette.paper },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  fact: { gap: 2, minWidth: 90 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  choice: { gap: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
