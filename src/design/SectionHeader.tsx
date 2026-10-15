import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useResponsive } from '../hooks/useResponsive';
import { Rule } from './primitives';
import { Reveal } from './Reveal';
import { T } from './Typography';

/**
 * Section opener, in the manner of a magazine department page:
 *   02 — EDITORIAL DESK ════════════════════════ 6 PAUTAS
 *   Pautas, provas *e espelho*.                 [actions]
 */
export function SectionHeader({
  number,
  name,
  title,
  italic,
  meta,
  actions,
  compact,
}: {
  number: string;
  name: string;
  title?: string;
  /** Second half of the title, set in italic. */
  italic?: string;
  meta?: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  const { isPhone } = useResponsive();
  return (
    <View style={styles.wrap}>
      <View style={styles.folio}>
        <T variant="labelStrong">{number}</T>
        <T variant="label" tone="secondary" style={styles.name}>
          {name}
        </T>
        <Rule weight="double" style={styles.rule} />
        {meta && !isPhone ? (
          <T variant="micro" tone="muted" style={styles.meta}>
            {meta}
          </T>
        ) : null}
      </View>
      {title ? (
        <View style={[styles.titleRow, (isPhone || compact) && styles.titleRowStack]}>
          <Reveal style={styles.titleWrap}>
            <T variant={compact ? 'title' : 'headline'} accessibilityRole="header">
              {title}
              {italic ? (
                <T variant={compact ? 'title' : 'headline'} italic tone="secondary">
                  {' '}
                  {italic}
                </T>
              ) : null}
            </T>
            {meta && isPhone ? (
              <T variant="micro" tone="muted" style={styles.metaPhone}>
                {meta}
              </T>
            ) : null}
          </Reveal>
          {actions ? <View style={[styles.actions, isPhone && styles.actionsPhone]}>{actions}</View> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  folio: { flexDirection: 'row', alignItems: 'center' },
  name: { marginLeft: 10, marginRight: 12 },
  rule: { flex: 1 },
  meta: { marginLeft: 12 },
  metaPhone: { marginTop: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 },
  titleRowStack: { flexDirection: 'column', alignItems: 'stretch', gap: 14 },
  titleWrap: { flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  actionsPhone: { justifyContent: 'flex-start' },
});
