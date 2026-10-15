import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VaultMark } from '../components/VaultWordmark';
import { Button } from '../design/Button';
import { Dialog } from '../design/Dialog';
import { Hoverable } from '../design/Hoverable';
import { Rule } from '../design/primitives';
import { Reveal } from '../design/Reveal';
import { useToast } from '../design/Toast';
import { T } from '../design/Typography';
import { color, layout, palette } from '../design/tokens';
import { ArchiveScreen } from '../features/archive/ArchiveScreen';
import { BrainstormScreen } from '../features/board/BrainstormScreen';
import { EditorialDeskScreen } from '../features/editorial/EditorialDeskScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { NavigationProvider } from '../features/navigation';
import { ProjectsScreen } from '../features/projects/ProjectsScreen';
import { NavParams, SectionId, SECTIONS, sectionById } from '../features/sections';
import { StudyRoomScreen } from '../features/study/StudyRoomScreen';
import { TeamScreen } from '../features/team/TeamScreen';
import { useResponsive } from '../hooks/useResponsive';
import { formatFolio, todayISO } from '../lib/dates';
import { resetWorkspace } from '../state/store';

interface Props {
  onLock: () => void;
}

/**
 * Post-unlock workspace. Desktop (Windows / macOS) gets a numbered table of
 * contents and a running folio; iPhone gets a compact bar and the cover as index.
 */
export function WorkspaceScreen({ onLock }: Props) {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const [section, setSection] = useState<SectionId>('home');
  const [params, setParams] = useState<NavParams>({});
  const [visit, setVisit] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const toast = useToast();

  const go = useCallback((next: SectionId, nextParams: NavParams = {}) => {
    setSection(next);
    setParams(nextParams);
    setVisit((v) => v + 1);
  }, []);
  const nav = useMemo(() => ({ section, params, go, requestReset: () => setConfirmReset(true) }), [section, params, go]);

  const def = sectionById(section);
  const content = (
    <Reveal key={`${section}-${visit}`} from={14} style={styles.flex}>
      <SectionBody id={section} />
    </Reveal>
  );

  const reset = async () => {
    setConfirmReset(false);
    await resetWorkspace();
    go('home');
    toast({ kicker: 'Demo', text: 'Conteúdo de demonstração restaurado.' });
  };

  const resetDialog = (
    <Dialog
      visible={confirmReset}
      onClose={() => setConfirmReset(false)}
      kicker="Sessão demonstrativa"
      title="Restaurar a demonstração?"
      footer={
        <>
          <Button label="Cancelar" variant="ghost" onPress={() => setConfirmReset(false)} />
          <Button label="Restaurar" variant="solid" onPress={reset} />
        </>
      }
    >
      <T variant="body">
        As alterações feitas nesta sessão (mesa, pautas, projetos, estudos) serão substituídas pelo conteúdo original de
        demonstração. Os dados ficam apenas neste dispositivo.
      </T>
    </Dialog>
  );

  if (isDesktop) {
    return (
      <NavigationProvider value={nav}>
        <View style={[styles.screen, styles.row]}>
          <Sidebar
            active={section}
            onNavigate={(id) => go(id)}
            onLock={onLock}
            onReset={() => setConfirmReset(true)}
            topInset={insets.top}
          />
          <View style={styles.flex}>
            <FolioBar number={def.number} name={def.name} kicker={def.kicker} topInset={insets.top} />
            {content}
          </View>
        </View>
        {resetDialog}
      </NavigationProvider>
    );
  }

  return (
    <NavigationProvider value={nav}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          {section === 'home' ? (
            <View style={styles.brand}>
              <VaultMark size={20} />
              <T variant="heading" style={styles.brandWord}>
                VAULT
              </T>
            </View>
          ) : (
            <Hoverable onPress={() => go('home')} accessibilityLabel="Voltar ao sumário" hitSlop={10}>
              {({ pressed }) => (
                <T variant="label" style={pressed && styles.pressed}>
                  ‹ Sumário
                </T>
              )}
            </Hoverable>
          )}
          {section !== 'home' ? (
            <T variant="micro" tone="muted" numberOfLines={1} style={styles.topFolio}>
              {def.number} — {def.name}
            </T>
          ) : null}
          <Button label="Bloquear" size="sm" variant="outline" onPress={onLock} accessibilityLabel="Bloquear o VAULT" style={styles.centerSelf} />
        </View>
        <Rule weight="double" />
        {content}
      </View>
      {resetDialog}
    </NavigationProvider>
  );
}

function SectionBody({ id }: { id: SectionId }) {
  switch (id) {
    case 'home':
      return <HomeScreen />;
    case 'brainstorm':
      return <BrainstormScreen />;
    case 'editorial':
      return <EditorialDeskScreen />;
    case 'projects':
      return <ProjectsScreen />;
    case 'library':
      return <LibraryScreen />;
    case 'archive':
      return <ArchiveScreen />;
    case 'study':
      return <StudyRoomScreen />;
    case 'team':
      return <TeamScreen />;
  }
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function FolioBar({ number, name, kicker, topInset }: { number: string; name: string; kicker: string; topInset: number }) {
  const now = useClock();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return (
    <View style={[styles.folioBar, { paddingTop: topInset }]}>
      <View style={styles.folioLeft}>
        <T variant="labelStrong">{number}</T>
        <T variant="label" tone="secondary">
          {name}
        </T>
        <T variant="micro" tone="muted">
          — {kicker}
        </T>
      </View>
      <T variant="micro" tone="muted">
        {formatFolio(todayISO())} · {time}
      </T>
    </View>
  );
}

function Sidebar({
  active,
  onNavigate,
  onLock,
  onReset,
  topInset,
}: {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
  onLock: () => void;
  onReset: () => void;
  topInset: number;
}) {
  return (
    <View style={[styles.sidebar, { paddingTop: topInset + 26 }]}>
      <View style={styles.brand}>
        <VaultMark size={26} />
        <View>
          <T variant="title" style={styles.brandWord}>
            VAULT
          </T>
          <T variant="micro" tone="muted">
            by VISUVAULT
          </T>
        </View>
      </View>
      <Rule weight="double" style={styles.sideRule} />
      <T variant="micro" tone="muted" style={styles.sideLabel}>
        Sumário
      </T>
      <ScrollView style={styles.flex} contentContainerStyle={styles.nav} accessibilityRole="menu">
        {SECTIONS.map((s) => {
          const isActive = s.id === active;
          return (
            <Hoverable
              key={s.id}
              onPress={() => onNavigate(s.id)}
              accessibilityRole="menuitem"
              accessibilityLabel={`${s.number} ${s.name}`}
              accessibilityState={{ selected: isActive }}
              haptic={isActive ? null : 'select'}
            >
              {({ hovered, pressed }) => (
                <View
                  style={[
                    styles.navItem,
                    (hovered || isActive) && styles.navItemShift,
                    isActive && styles.navItemActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <T variant="numeral" tone={isActive ? 'primary' : 'muted'} style={styles.navNumber}>
                    {s.number}
                  </T>
                  <View style={styles.flex}>
                    <T variant="heading" size={19} tone={isActive || hovered ? 'primary' : 'secondary'} italic={isActive}>
                      {s.name}
                    </T>
                    {isActive ? (
                      <T variant="micro" tone="muted">
                        {s.kicker}
                      </T>
                    ) : null}
                  </View>
                </View>
              )}
            </Hoverable>
          );
        })}
      </ScrollView>
      <View style={styles.sideFooter}>
        <Rule />
        <T variant="micro" tone="secondary">
          Sessão demonstrativa
        </T>
        <T variant="micro" tone="muted">
          Dados salvos só neste dispositivo
        </T>
        <View style={styles.sideButtons}>
          <Button label="Bloquear" size="sm" onPress={onLock} accessibilityLabel="Bloquear o VAULT" />
          <Button label="Restaurar demo" size="sm" variant="ghost" onPress={onReset} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
  screen: { flex: 1, backgroundColor: palette.ink },
  pressed: { opacity: 0.6 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandWord: { letterSpacing: 6 },
  topBar: {
    height: layout.headerHeight,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topFolio: { flex: 1, textAlign: 'center' },
  centerSelf: { alignSelf: 'center' },
  folioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
  },
  folioLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sidebar: {
    width: layout.sidebar,
    paddingHorizontal: 22,
    paddingBottom: 22,
    backgroundColor: '#0D0D0C',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: color.line,
  },
  sideRule: { marginTop: 22 },
  sideLabel: { marginTop: 20, marginBottom: 8 },
  nav: { gap: 2, paddingBottom: 12 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 9,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  navItemShift: { transform: [{ translateX: 4 }] },
  navItemActive: { borderLeftColor: palette.paper },
  navNumber: { marginTop: 5, width: 20 },
  sideFooter: { gap: 6 },
  sideButtons: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
});
