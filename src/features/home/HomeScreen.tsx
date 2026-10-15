import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Rosette } from '../../design/engravings/Engravings';
import { Button } from '../../design/Button';
import { Hoverable } from '../../design/Hoverable';
import { PageScroll } from '../../design/Page';
import { Leaders, Rule, VRule } from '../../design/primitives';
import { Reveal } from '../../design/Reveal';
import { T } from '../../design/Typography';
import { palette } from '../../design/tokens';
import { useResponsive } from '../../hooks/useResponsive';
import { formatLong, roman, todayISO } from '../../lib/dates';
import { useAppState } from '../../state/store';
import { deadlineLabel, deadlineState, STATUS_LABEL } from '../editorial/model';
import { PLATES } from '../library/catalog';
import { PlateArt } from '../library/PlateArt';
import { useNavigator } from '../navigation';
import { SectionId, SECTIONS } from '../sections';
import { overallProgress } from '../study/model';
import { memberById, MEMBERS } from '../team/model';

/** The cover: masthead, contents, the story on the desk and the latest plates. */
export function HomeScreen() {
  const { isDesktop, isPhone, width } = useResponsive();
  const { go, requestReset } = useNavigator();
  const board = useAppState((s) => s.board);
  const desk = useAppState((s) => s.desk);
  const projects = useAppState((s) => s.projects);
  const archive = useAppState((s) => s.archive);
  const study = useAppState((s) => s.study);
  const today = todayISO();

  const open = useMemo(() => desk.filter((s) => s.status !== 'publicado'), [desk]);
  const lead = useMemo(
    () => [...open].sort((a, b) => a.deadline.localeCompare(b.deadline))[0],
    [open],
  );
  const active = projects.filter((p) => !p.archived).length;
  const studied = Math.round(overallProgress(study) * 100);

  const counts: Record<Exclude<SectionId, 'home'>, string> = {
    brainstorm: `${board.length} itens`,
    editorial: `${open.length} pautas`,
    projects: `${active} ativos`,
    library: `${PLATES.length} pranchas`,
    archive: `${archive.length} fichas`,
    study: `${study.length} dossiês`,
    team: `${MEMBERS.length} pessoas`,
  };

  const year = Number(today.slice(0, 4));
  const mastheadSize = isPhone ? 84 : Math.min(176, Math.max(110, width * 0.1));

  const masthead = (
    <Reveal>
      <View style={[styles.mastRow, isPhone && styles.mastRowPhone]}>
        <T variant="masthead" size={mastheadSize} style={styles.masthead} accessibilityRole="header">
          VAULT
        </T>
        <View style={[styles.issue, isPhone && styles.issuePhone]}>
          <T variant="micro">Edição de estúdio · Nº 01</T>
          <T variant="micro" tone="secondary">
            {formatLong(today)}
          </T>
          <T variant="micro" tone="muted">
            Arte · Moda · Cinema · Cultura visual
          </T>
          <T variant="micro" tone="muted">
            Ano {roman(year)} · Sessão demonstrativa
          </T>
        </View>
      </View>
      <Rule weight="double" strong />
    </Reveal>
  );

  const leadBlock = lead ? (
    <Reveal index={1} style={styles.lead}>
      <T variant="micro" tone={deadlineState(lead, today).state === 'overdue' ? 'signal' : 'secondary'}>
        Em pauta — {STATUS_LABEL[lead.status]} · {deadlineLabel(lead, today)}
      </T>
      <Hoverable onPress={() => go('editorial', { storyId: lead.id })} accessibilityLabel={`Abrir pauta ${lead.title}`}>
        {({ hovered }) => (
          <T variant="headline" style={hovered && styles.underline}>
            {lead.title}
          </T>
        )}
      </Hoverable>
      <T variant="subtitle" tone="secondary">
        {lead.dek}
      </T>
      <T variant="micro" tone="muted">
        Por {memberById(lead.authorId)?.name} · Edição {memberById(lead.editorId)?.name} · {lead.section}
      </T>
      <Button label="Abrir no Editorial Desk" trailing="→" size="sm" onPress={() => go('editorial', { storyId: lead.id })} style={styles.leadButton} />
    </Reveal>
  ) : null;

  const figures = (
    <Reveal index={2}>
      <View style={styles.figures}>
        {[
          { n: board.length, label: 'Itens na mesa', to: 'brainstorm' as const },
          { n: open.length, label: 'Pautas abertas', to: 'editorial' as const },
          { n: active, label: 'Projetos ativos', to: 'projects' as const },
          { n: `${studied}%`, label: 'Leituras feitas', to: 'study' as const },
        ].map((f) => (
          <Hoverable key={f.label} onPress={() => go(f.to)} style={[styles.figure, isPhone && styles.figurePhone]} accessibilityLabel={`${f.label}: ${f.n}`}>
            {({ hovered }) => (
              <>
                <T variant="display" size={isPhone ? 44 : 56} tone={hovered ? 'primary' : 'primary'}>
                  {f.n}
                </T>
                <T variant="micro" tone={hovered ? 'primary' : 'muted'}>
                  {f.label}
                </T>
              </>
            )}
          </Hoverable>
        ))}
      </View>
    </Reveal>
  );

  const contents = (
    <Reveal index={isDesktop ? 1 : 1} style={styles.contents}>
      <View style={styles.contentsHead}>
        <T variant="micro" tone="secondary">
          Sumário
        </T>
        <T variant="micro" tone="muted">
          {SECTIONS.length - 1} seções
        </T>
      </View>
      <Rule strong />
      {SECTIONS.filter((s) => s.id !== 'home').map((s) => (
        <Hoverable key={s.id} onPress={() => go(s.id)} accessibilityLabel={`Abrir ${s.name}`} accessibilityHint={s.kicker}>
          {({ hovered, pressed }) => (
            <View style={[styles.tocRow, pressed && styles.pressed]}>
              <View style={[styles.tocLine, hovered && styles.shift]}>
                <T variant="numeral" tone="muted" style={styles.tocNumber}>
                  {s.number}
                </T>
                <T variant="heading" size={isPhone ? 21 : 23} italic={hovered}>
                  {s.name}
                </T>
                <Leaders />
                <T variant="numeral" tone="secondary">
                  {counts[s.id as Exclude<SectionId, 'home'>]}
                </T>
              </View>
              <T variant="bodySm" tone="muted" style={styles.tocDek}>
                {s.kicker} — {s.dek}
              </T>
              <Rule />
            </View>
          )}
        </Hoverable>
      ))}
    </Reveal>
  );

  // Desktop: three plates fill the left column of the spread; elsewhere a strip.
  const contentW = isDesktop ? Math.min(width - 264 - 80, 1320) : width - 40;
  const latest = PLATES.slice(0, isDesktop ? 3 : 6);
  const plateW = isPhone ? 132 : isDesktop ? Math.floor(((contentW - 37) * 7) / 12 / 3 - 14) : Math.floor((contentW - 5 * 20) / 6);
  const plates = (
    <Reveal index={3} style={styles.platesBlock}>
      <View style={styles.contentsHead}>
        <T variant="micro" tone="secondary">
          Recém-catalogado · Library
        </T>
        <Button label="Ver acervo" trailing="→" variant="ghost" size="sm" onPress={() => go('library')} />
      </View>
      <ScrollView horizontal={isPhone} scrollEnabled={isPhone} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plates}>
        {latest.map((p, i) => (
          <Hoverable key={p.id} onPress={() => go('library', { plateId: p.id })} accessibilityLabel={`Abrir ${p.title}`}>
            {({ hovered }) => (
              <View style={[styles.plate, { width: plateW }, hovered && styles.lift]}>
                <PlateArt plate={p} width={plateW} detail={0.6} />
                <T variant="micro" tone="muted" style={styles.plateCode}>
                  Fig. {String(i + 1).padStart(2, '0')} · {p.code}
                </T>
                <T variant="caption" numberOfLines={1}>
                  {p.title}
                </T>
              </View>
            )}
          </Hoverable>
        ))}
      </ScrollView>
    </Reveal>
  );

  const colophon = (
    <View style={styles.colophon}>
      <Rule />
      <View style={[styles.colophonRow, isPhone && styles.colophonPhone]}>
        <Rosette size={34} stroke={palette.graphite500} rings={1} />
        <View style={styles.flex}>
          <T variant="micro" tone="muted">
            VISUVAULT — VAULT 0.2 · Sistema editorial proprietário
          </T>
          <T variant="micro" tone="muted">
            Dados salvos apenas neste dispositivo · nenhum dado privado é carregado
          </T>
        </View>
        {!isDesktop ? <Button label="Restaurar demo" size="sm" variant="ghost" onPress={requestReset} /> : null}
      </View>
    </View>
  );

  if (isDesktop) {
    return (
      <PageScroll>
        {masthead}
        <View style={styles.spread}>
          <View style={styles.leftCol}>
            {leadBlock}
            <Rule />
            {figures}
            <Rule />
            {plates}
          </View>
          <VRule />
          <View style={styles.rightCol}>{contents}</View>
        </View>
        {colophon}
      </PageScroll>
    );
  }

  return (
    <PageScroll>
      {masthead}
      {contents}
      {leadBlock}
      <Rule />
      {figures}
      {plates}
      {colophon}
    </PageScroll>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.65 },
  underline: { textDecorationLine: 'underline' },
  mastRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 12 },
  mastRowPhone: { flexDirection: 'column', alignItems: 'flex-start', gap: 6 },
  masthead: { marginBottom: -10 },
  issue: { gap: 4, alignItems: 'flex-end', paddingBottom: 6 },
  issuePhone: { alignItems: 'flex-start' },
  spread: { flexDirection: 'row', gap: 36 },
  leftCol: { flex: 7, gap: 26 },
  rightCol: { flex: 5 },
  lead: { gap: 10 },
  leadButton: { marginTop: 8 },
  figures: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 },
  figure: { flex: 1, minWidth: 120, gap: 2 },
  figurePhone: { flexBasis: '50%', flexGrow: 0 },
  contents: { gap: 0 },
  contentsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tocRow: { paddingTop: 10, gap: 2 },
  tocLine: { flexDirection: 'row', alignItems: 'baseline' },
  shift: { transform: [{ translateX: 4 }] },
  tocNumber: { width: 30 },
  tocDek: { marginLeft: 30, marginBottom: 10 },
  platesBlock: { gap: 6 },
  plates: { flexDirection: 'row', gap: 20 },
  plate: { gap: 6 },
  lift: { transform: [{ translateY: -3 }] },
  plateCode: { marginTop: 4 },
  colophon: { gap: 12, marginTop: 8 },
  colophonRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  colophonPhone: { alignItems: 'flex-start' },
});
