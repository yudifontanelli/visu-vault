import { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VaultMark, VaultWordmark } from '../components/VaultWordmark';
import { useResponsive } from '../hooks/useResponsive';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { AA, contrastRatio } from './contrast';
import { Field } from './Field';
import { Hoverable } from './Hoverable';
import { brandFace } from './fonts';
import { Icon, ICONS, IconName } from './Icon';
import { Rule, Tag } from './primitives';
import { Tabs } from './Tabs';
import { SurfaceProvider, T, Variant } from './Typography';
import { brand, color, palette } from './tokens';

const SWATCHES: { key: keyof typeof brand; name: string; role: string }[] = [
  { key: 'black', name: 'Preto', role: 'Superfície escura, texto sobre off-white' },
  { key: 'offWhite', name: 'Off-white', role: 'Superfície principal, texto sobre preto' },
  { key: 'graphite', name: 'Grafite', role: 'Fios e superfícies elevadas no escuro; texto forte no claro' },
  { key: 'warmGray', name: 'Cinza quente', role: 'Texto secundário no escuro; só fios e detalhes no claro' },
];

const TYPE: { variant: Variant; sample: string; note: string }[] = [
  { variant: 'display', sample: 'O que vamos criar hoje?', note: 'Instrument Serif · títulos editoriais' },
  { variant: 'headline', sample: 'Quem está entrando?', note: 'Instrument Serif' },
  { variant: 'title', sample: 'Mesa Criativa', note: 'Instrument Serif' },
  { variant: 'subtitle', sample: 'Selecione seu perfil para continuar.', note: 'Instrument Serif itálico' },
  { variant: 'lead', sample: 'Ideias, pautas e referências dos fundadores em um só lugar.', note: 'Instrument Sans 400' },
  { variant: 'body', sample: 'Legenda, conceito e responsáveis ficam juntos na pauta.', note: 'Instrument Sans 400' },
  { variant: 'ui', sample: 'Nova ideia', note: 'Instrument Sans 500 · controles' },
  { variant: 'label', sample: 'Próximas publicações', note: 'Instrument Sans 500 · rótulos +0,08em' },
  { variant: 'micro', sample: 'Em produção · Reel', note: 'Instrument Sans 500 · +0,10em' },
  { variant: 'numeral', sample: '01  02  09  04', note: 'Instrument Sans · algarismos tabulares' },
];

const ENVIRONMENTS: { icon: IconName; label: string }[] = [
  { icon: 'inicio', label: 'Início' },
  { icon: 'mesa', label: 'Mesa' },
  { icon: 'editorial', label: 'Editorial' },
  { icon: 'acervo', label: 'Acervo' },
];

/**
 * Living specimen of the 2.0 design system, for review. Opens instead of the
 * app on web with `?sistema`, or in a build made with EXPO_PUBLIC_VAULT_SPECIMEN=1.
 * Shows no workspace data.
 */
export function Specimen() {
  const insets = useSafeAreaInsets();
  const { isPhone, gutter } = useResponsive();
  const [view, setView] = useState<'lista' | 'calendario'>('lista');
  const [done, setDone] = useState(true);
  const [env, setEnv] = useState<IconName>('inicio');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top }]}>
      {/* Paper: the main 2.0 surface. */}
      <SurfaceProvider value="paper">
        <View style={[styles.paper, { paddingHorizontal: gutter }]}>
          <View style={styles.column}>
            <View style={[styles.head, isPhone && styles.headPhone]}>
              <VaultWordmark size={isPhone ? 'lg' : 'xl'} asHeader />
              <View style={styles.headMeta}>
                <T variant="micro" tone="secondary">
                  Sistema visual · VAULT 2.0
                </T>
                <T variant="micro" tone="secondary">
                  Etapa 2 · Editorial + Mesa Criativa
                </T>
              </View>
            </View>

            <View style={styles.notice}>
              <T variant="labelStrong">Logotipo</T>
              <T variant="bodySm">
                {brandFace.provisional
                  ? 'VAULT está em Georgia, provisoriamente. A Canela Regular 400 será usada quando a licença e os arquivos da fonte estiverem no projeto; a troca é feita em um único lugar.'
                  : `VAULT está em ${brandFace.name}.`}
              </T>
            </View>

            <Section title="Paleta" note="Quatro cores oficiais. Sem gradientes, neon ou cor de alerta.">
              <View style={[styles.swatches, isPhone && styles.stack]}>
                {SWATCHES.map((s) => {
                  const hex = brand[s.key];
                  return (
                    <View key={s.key} style={[styles.swatch, !isPhone && styles.swatchWide]}>
                      <View style={[styles.chip, { backgroundColor: hex }]} />
                      <T variant="labelStrong">{s.name}</T>
                      <T variant="numeral" tone="secondary">
                        {hex}
                      </T>
                      <T variant="bodySm" tone="secondary">
                        {s.role}
                      </T>
                      <T variant="bodySm" tone="secondary">
                        {`Sobre preto ${ratio(hex, brand.black)}\nSobre off-white ${ratio(hex, brand.offWhite)}`}
                      </T>
                    </View>
                  );
                })}
              </View>
            </Section>

            <Section title="Logotipo" note="VISUVAULT® sobre VAULT, caixa-alta, espacejamento +0,12em. A marca nunca contém números.">
              <View style={[styles.marks, isPhone && styles.stack]}>
                <VaultWordmark size="lg" />
                <VaultWordmark size="md" />
                <VaultWordmark size="sm" />
                <View style={styles.markRow}>
                  <VaultMark size={28} />
                  <T variant="micro" tone="secondary" style={styles.markNote}>
                    Marca atual (anel do disco), mantida até a entrega da logo aprovada
                  </T>
                </View>
              </View>
            </Section>

            <Section title="Tipografia" note="Instrument Sans para todo texto funcional; Instrument Serif para a voz editorial.">
              <View style={styles.typeList}>
                {TYPE.map((t) => (
                  <View key={t.variant} style={[styles.typeRow, isPhone && styles.typeRowPhone]}>
                    <T variant="micro" tone="secondary" style={!isPhone && styles.typeLabel}>
                      {`${t.variant} · ${t.note}`}
                    </T>
                    <T variant={t.variant} style={styles.flex}>
                      {t.sample}
                    </T>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Ícones" note="Traço único de 1,5 px numa grade de 24. Legíveis a partir de 16 px.">
              <View style={styles.icons}>
                {(Object.keys(ICONS) as IconName[]).map((name) => (
                  <View key={name} style={styles.iconCell}>
                    <Icon name={name} size={24} />
                    <T variant="bodySm" tone="secondary">
                      {name}
                    </T>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Componentes" note="Botões, abas, campos e marcações.">
              <View style={styles.row}>
                <Button label="Nova ideia" variant="solid" leading="+" />
                <Button label="Ver pautas" trailing="→" />
                <Button label="Cancelar" variant="ghost" />
                <Button label="Excluir" variant="danger" />
              </View>
              <Tabs
                items={[
                  { key: 'lista', label: 'Lista', count: 0 },
                  { key: 'calendario', label: 'Calendário' },
                ]}
                value={view}
                onChange={setView}
              />
              <View style={[styles.row, styles.tags]}>
                <Tag>Post</Tag>
                <Tag>Carrossel</Tag>
                <Tag>Reel</Tag>
                <Tag filled>Story</Tag>
              </View>
              <Field label="Título da pauta" placeholder="Ex.: Bastidores do ensaio" style={styles.field} />
              <Checkbox checked={done} onChange={setDone} label="Legenda revisada" detail="Marcação de checklist" />
            </Section>

            <Section title="Estado vazio" note="Sem dados inventados: quando não há nada, o app convida a começar.">
              <View style={styles.empty}>
                <Icon name="mesa" size={28} color={palette.graphite500} />
                <T variant="title" align="center">
                  Ainda não há ideias por aqui.
                </T>
                <T variant="body" tone="secondary" align="center">
                  Vamos começar?
                </T>
                <Button label="Nova ideia" variant="solid" leading="+" style={styles.centerSelf} />
              </View>
            </Section>
          </View>
        </View>
      </SurfaceProvider>

      {/* Ink: login, overlays and the bottom bar. */}
      <View style={[styles.ink, { paddingHorizontal: gutter, paddingBottom: insets.bottom + 56 }]}>
        <View style={styles.column}>
          <Section title="No escuro" note="Mesmo sistema sobre preto: login, sobreposições e a barra inferior do iPhone.">
            <VaultWordmark size="lg" />
            <T variant="headline">Acesso autorizado.</T>
            <T variant="body" tone="secondary">
              Texto secundário em cinza quente sobre preto.
            </T>
            <T variant="bodySm" tone="muted">
              Texto mínimo permitido no escuro.
            </T>
            <View style={styles.row}>
              <Button label="Entrar" variant="solid" />
              <Button label="Trocar perfil" />
            </View>
            <View style={styles.tabIcons} accessibilityRole="tablist">
              {ENVIRONMENTS.map((e) => {
                const active = env === e.icon;
                return (
                  <Hoverable
                    key={e.icon}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={e.label}
                    onPress={() => setEnv(e.icon)}
                    style={styles.tabIconCell}
                  >
                    {({ hovered, pressed }) => {
                      const c = active || hovered ? palette.paper : color.textMuted;
                      return (
                        <View style={[styles.tabIconInner, pressed && styles.pressed]}>
                          <Icon name={e.icon} size={24} color={c} />
                          <T variant="micro" color={c}>
                            {e.label}
                          </T>
                        </View>
                      );
                    }}
                  </Hoverable>
                );
              })}
            </View>
          </Section>
        </View>
      </View>
    </ScrollView>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Rule />
      <View style={styles.sectionHead}>
        <T variant="labelStrong">{title}</T>
        <T variant="bodySm" tone="secondary" style={styles.flex}>
          {note}
        </T>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ratio(a: string, b: string) {
  const r = contrastRatio(a, b);
  const grade = r >= AA.text ? 'AA' : r >= AA.large ? 'AA grande' : 'decorativo';
  return `${r.toFixed(1).replace('.', ',')}:1 ${grade}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  content: { flexGrow: 1 },
  paper: { backgroundColor: palette.paper, paddingTop: 40, paddingBottom: 56 },
  ink: { flexGrow: 1, backgroundColor: palette.ink, paddingTop: 16 },
  column: { width: '100%', maxWidth: 1080, alignSelf: 'center' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 28 },
  headPhone: { flexDirection: 'column', alignItems: 'flex-start' },
  headMeta: { gap: 4 },
  notice: { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.ink, padding: 16, gap: 6, marginBottom: 12 },
  section: { gap: 16, paddingTop: 28 },
  sectionHead: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'baseline' },
  sectionBody: { gap: 20 },
  flex: { flex: 1, minWidth: 200 },
  stack: { flexDirection: 'column', alignItems: 'stretch' },
  swatches: { flexDirection: 'row', gap: 16 },
  swatch: { gap: 6 },
  swatchWide: { flex: 1 },
  chip: { height: 88, borderWidth: StyleSheet.hairlineWidth, borderColor: color.sheetLine },
  marks: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 40 },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: 260 },
  markNote: { flex: 1 },
  typeList: { gap: 18 },
  typeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 24 },
  typeRowPhone: { flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
  typeLabel: { width: 240 },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  iconCell: { width: 96, alignItems: 'center', gap: 8, paddingVertical: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  tags: { gap: 8 },
  field: { maxWidth: 420 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40, borderWidth: StyleSheet.hairlineWidth, borderColor: color.sheetLine },
  centerSelf: { alignSelf: 'center', marginTop: 8 },
  tabIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
    paddingTop: 10,
    maxWidth: 420,
  },
  tabIconCell: { minWidth: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  tabIconInner: { alignItems: 'center', gap: 4 },
  pressed: { opacity: 0.6 },
});
