import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EnvironmentIcon } from '../components/EnvironmentIcon';
import { VaultMark, VaultWordmark } from '../components/VaultWordmark';
import { ENVIRONMENTS, Environment, EnvironmentId } from '../data/environments';
import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { useResponsive } from '../hooks/useResponsive';
import { colors, fonts } from '../theme';

const useNativeDriver = Platform.OS !== 'web';

type Route = 'home' | EnvironmentId;

interface Props {
  onLock: () => void;
}

/**
 * Post-unlock workspace. Desktop (Windows / macOS) gets a persistent sidebar;
 * iPhone and narrow windows get a compact top bar with back navigation.
 */
export function WorkspaceScreen({ onLock }: Props) {
  const insets = useSafeAreaInsets();
  const { isWide, width } = useResponsive();
  const [route, setRoute] = useState<Route>('home');

  const enter = useAnimatedValue(0);
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver,
    }).start();
  }, [enter]);

  const env = route === 'home' ? undefined : ENVIRONMENTS.find((e) => e.id === route);

  const content = env ? (
    <EnvironmentView env={env} />
  ) : (
    <HomeView onOpen={setRoute} columns={width >= 1180 ? 3 : width >= 560 ? 2 : 1} />
  );

  const animatedStyle = {
    opacity: enter,
    transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }],
  };

  if (isWide) {
    return (
      <Animated.View style={[styles.screen, styles.row, animatedStyle]}>
        <Sidebar route={route} onNavigate={setRoute} onLock={onLock} topInset={insets.top} />
        <ScrollView style={styles.flex} contentContainerStyle={styles.wideContent}>
          {content}
        </ScrollView>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.screen, { paddingTop: insets.top }, animatedStyle]}>
      <View style={styles.topBar}>
        {env ? (
          <Pressable
            onPress={() => setRoute('home')}
            accessibilityRole="button"
            accessibilityLabel="Voltar para Home"
            hitSlop={10}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>‹  Home</Text>
          </Pressable>
        ) : (
          <VaultWordmark size="sm" showTagline={false} />
        )}
        <LockButton onPress={onLock} />
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.narrowContent, { paddingBottom: insets.bottom + 32 }]}
      >
        {content}
      </ScrollView>
    </Animated.View>
  );
}

function LockButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Bloquear o VAULT"
      hitSlop={8}
      style={({ pressed }) => [styles.lockButton, pressed && styles.pressed]}
    >
      <Text style={styles.lockText}>Bloquear</Text>
    </Pressable>
  );
}

function Sidebar({
  route,
  onNavigate,
  onLock,
  topInset,
}: {
  route: Route;
  onNavigate: (r: Route) => void;
  onLock: () => void;
  topInset: number;
}) {
  return (
    <View style={[styles.sidebar, { paddingTop: topInset + 28 }]}>
      <VaultWordmark size="sm" />
      <View style={styles.nav}>
        <NavItem label="Home" active={route === 'home'} onPress={() => onNavigate('home')} icon={<VaultMark size={18} />} />
        <Text style={styles.navSection}>AMBIENTES</Text>
        {ENVIRONMENTS.map((e) => (
          <NavItem
            key={e.id}
            label={e.name}
            active={route === e.id}
            onPress={() => onNavigate(e.id)}
            icon={<EnvironmentIcon id={e.id} size={18} color={route === e.id ? colors.offWhite : colors.graphite300} />}
          />
        ))}
      </View>
      <View style={styles.sidebarFooter}>
        <Text style={styles.demoBadge}>SESSÃO DEMONSTRATIVA</Text>
        <LockButton onPress={onLock} />
      </View>
    </View>
  );
}

function NavItem({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.navItem, (active || hovered) && styles.navItemActive]}
    >
      {icon}
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function HomeView({ onOpen, columns }: { onOpen: (id: EnvironmentId) => void; columns: number }) {
  return (
    <View style={styles.page}>
      <Text style={styles.eyebrow}>HOME</Text>
      <Text style={styles.h1}>Bem-vindo ao VAULT.</Text>
      <Text style={styles.lead}>
        Seu workspace criativo privado. Esta é uma sessão demonstrativa: nenhum dado privado é carregado.
      </Text>
      <View style={styles.grid}>
        {ENVIRONMENTS.map((env) => (
          <View key={env.id} style={[styles.cell, { width: `${100 / columns}%` }]}>
            <EnvironmentCard env={env} onPress={() => onOpen(env.id)} tall={columns > 1} />
          </View>
        ))}
      </View>
    </View>
  );
}

function EnvironmentCard({ env, onPress, tall }: { env: Environment; onPress: () => void; tall: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${env.name}`}
      accessibilityHint={env.summary}
      style={({ pressed }) => [
        styles.card,
        tall && styles.cardTall,
        hovered && styles.cardHover,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardIcon}>
        <EnvironmentIcon id={env.id} size={22} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{env.name}</Text>
        <Text style={styles.cardSummary}>{env.summary}</Text>
        <Text style={styles.cardMeta}>{env.modules.length} MÓDULOS · EM BREVE</Text>
      </View>
      <Text style={[styles.cardArrow, hovered && styles.cardArrowHover]}>→</Text>
    </Pressable>
  );
}

function EnvironmentView({ env }: { env: Environment }) {
  return (
    <View style={styles.page}>
      <View style={styles.envHeader}>
        <View style={[styles.cardIcon, styles.envIcon]}>
          <EnvironmentIcon id={env.id} size={28} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>AMBIENTE</Text>
          <Text style={styles.h1}>{env.name}</Text>
        </View>
      </View>
      <Text style={styles.lead}>{env.description}</Text>

      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Ambiente vazio</Text>
        <Text style={styles.emptyText}>
          Sessão demonstrativa: o conteúdo de {env.name} será conectado nas próximas etapas.
        </Text>
      </View>

      <Text style={[styles.eyebrow, styles.sectionGap]}>MÓDULOS PREVISTOS</Text>
      <View style={styles.modules}>
        {env.modules.map((m) => (
          <View key={m} style={styles.module}>
            <Text style={styles.moduleText}>{m}</Text>
            <Text style={styles.moduleTag}>EM BREVE</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  row: {
    flexDirection: 'row',
  },
  pressed: {
    opacity: 0.6,
  },
  /* Narrow (iPhone) chrome */
  topBar: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.graphite700,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    color: colors.offWhite,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  narrowContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  /* Wide (Windows / macOS) chrome */
  sidebar: {
    width: 248,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: colors.ink,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.graphite700,
  },
  nav: {
    marginTop: 36,
    gap: 2,
    flex: 1,
  },
  navSection: {
    color: colors.graphite500,
    fontFamily: fonts.sans,
    fontSize: 10,
    letterSpacing: 3,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: colors.graphite800,
  },
  navLabel: {
    color: colors.graphite300,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  navLabelActive: {
    color: colors.offWhite,
  },
  sidebarFooter: {
    gap: 12,
    alignItems: 'flex-start',
  },
  demoBadge: {
    color: colors.graphite500,
    fontFamily: fonts.sans,
    fontSize: 9,
    letterSpacing: 2.5,
  },
  wideContent: {
    paddingHorizontal: 56,
    paddingVertical: 56,
  },
  lockButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.graphite600,
  },
  lockText: {
    color: colors.offWhiteDim,
    fontFamily: fonts.sans,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  /* Content */
  page: {
    width: '100%',
    maxWidth: 1120,
  },
  eyebrow: {
    color: colors.graphite400,
    fontFamily: fonts.sans,
    fontSize: 10,
    letterSpacing: 4,
  },
  h1: {
    color: colors.offWhite,
    fontFamily: fonts.sans,
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 0.3,
    marginTop: 8,
  },
  lead: {
    color: colors.graphite300,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 560,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 28,
    marginHorizontal: -6,
  },
  cell: {
    padding: 6,
  },
  card: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.graphite900,
    borderWidth: 1,
    borderColor: colors.graphite700,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  cardTall: {
    minHeight: 140,
  },
  cardHover: {
    borderColor: colors.graphite500,
    backgroundColor: colors.graphite800,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.graphite700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    alignSelf: 'stretch',
    gap: 6,
  },
  cardMeta: {
    color: colors.graphite500,
    fontFamily: fonts.sans,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 'auto',
    paddingTop: 10,
  },
  cardTitle: {
    color: colors.offWhite,
    fontFamily: fonts.sans,
    fontSize: 18,
    fontWeight: '500',
  },
  cardSummary: {
    color: colors.graphite300,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  cardArrow: {
    color: colors.graphite500,
    fontSize: 18,
  },
  cardArrowHover: {
    color: colors.offWhite,
  },
  envHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  envIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  empty: {
    marginTop: 28,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.graphite600,
    gap: 6,
  },
  emptyTitle: {
    color: colors.offWhite,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  emptyText: {
    color: colors.graphite300,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionGap: {
    marginTop: 32,
  },
  modules: {
    marginTop: 12,
    gap: 8,
  },
  module: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.graphite900,
  },
  moduleText: {
    color: colors.offWhiteDim,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  moduleTag: {
    color: colors.graphite500,
    fontFamily: fonts.sans,
    fontSize: 9,
    letterSpacing: 2,
  },
});
