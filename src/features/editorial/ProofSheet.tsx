import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../design/Button';
import { Field } from '../../design/Field';
import { Rule } from '../../design/primitives';
import { Sheet } from '../../design/Sheet';
import { T } from '../../design/Typography';
import { palette } from '../../design/tokens';
import { useResponsive } from '../../hooks/useResponsive';
import { dispatch } from '../../state/store';
import { memberById } from '../team/model';
import { STATUS_LABEL, Story, wordCount } from './model';

/** The story as a printed proof: kicker, headline, standfirst, byline, body in columns. */
export function ProofSheet({ story, width }: { story: Story; width: number }) {
  const { isPhone } = useResponsive();
  const [editing, setEditing] = useState(false);
  const words = wordCount(story.body);
  const ratio = Math.min(1, words / Math.max(1, story.wordsTarget));
  const paragraphs = story.body.split(/\n\s*\n/).filter(Boolean);
  const twoCols = width >= 560 && !editing && paragraphs.length > 1;
  const half = Math.ceil(paragraphs.length / 2);
  const update = (patch: Partial<Pick<Story, 'title' | 'dek' | 'body'>>) => dispatch({ type: 'desk/update', id: story.id, patch });

  return (
    <Sheet marks={!isPhone} style={[styles.sheet, { padding: isPhone ? 20 : 36 }]}>
      <View style={styles.head}>
        <T variant="micro">Prova · {story.code}</T>
        <T variant="micro" tone="secondary">
          {STATUS_LABEL[story.status]}
        </T>
      </View>
      <Rule weight="double" strong />
      <T variant="label" tone="secondary" style={styles.kicker}>
        {story.section}
      </T>
      {editing ? (
        <>
          <Field type="serif" size={isPhone ? 30 : 40} value={story.title} onChangeText={(title) => update({ title })} accessibilityLabel="Título" />
          <Field type="serifItalic" size={19} value={story.dek} onChangeText={(dek) => update({ dek })} accessibilityLabel="Linha fina" multiline />
        </>
      ) : (
        <>
          <T variant="headline" size={isPhone ? 32 : 44}>
            {story.title}
          </T>
          <T variant="subtitle" tone="secondary">
            {story.dek}
          </T>
        </>
      )}
      <T variant="micro" tone="secondary" style={styles.byline}>
        Por {memberById(story.authorId)?.name ?? '—'} · Edição {memberById(story.editorId)?.name ?? '—'}
      </T>
      <Rule />
      {editing ? (
        <Field
          multiline
          value={story.body}
          onChangeText={(body) => update({ body })}
          placeholder="Comece o texto da matéria…"
          inputStyle={styles.bodyInput}
          accessibilityLabel="Texto da matéria"
        />
      ) : paragraphs.length === 0 ? (
        <T variant="caption" tone="secondary" style={styles.empty}>
          Ainda sem texto. Em pauta: apuração e entrevistas antes da redação.
        </T>
      ) : twoCols ? (
        <View style={styles.columns}>
          <View style={styles.col}>{paragraphs.slice(0, half).map((p, i) => <Para key={i} text={p} first={i === 0} />)}</View>
          <View style={styles.colRule} />
          <View style={styles.col}>{paragraphs.slice(half).map((p, i) => <Para key={i} text={p} />)}</View>
        </View>
      ) : (
        <View style={styles.col}>{paragraphs.map((p, i) => <Para key={i} text={p} first={i === 0} />)}</View>
      )}
      <View style={styles.footer}>
        <View style={styles.flex}>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${ratio * 100}%` }]} />
          </View>
          <T variant="micro" tone="secondary" style={styles.meterLabel}>
            {words.toLocaleString('pt-BR')} / {story.wordsTarget.toLocaleString('pt-BR')} palavras
          </T>
        </View>
        <Button label={editing ? 'Concluir' : 'Editar texto'} size="sm" variant={editing ? 'solid' : 'outline'} onPress={() => setEditing((e) => !e)} />
      </View>
    </Sheet>
  );
}

function Para({ text, first }: { text: string; first?: boolean }) {
  if (!first) {
    return (
      <T variant="body" size={15} style={styles.para}>
        {text}
      </T>
    );
  }
  // Drop cap on the opening paragraph, as in print.
  return (
    <T variant="body" size={15} style={styles.para}>
      <T variant="title" size={34} style={styles.dropCap}>
        {text.charAt(0)}
      </T>
      {text.slice(1)}
    </T>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: { gap: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { marginTop: 4 },
  byline: { marginTop: 2 },
  columns: { flexDirection: 'row', gap: 20 },
  col: { flex: 1, gap: 12 },
  colRule: { width: StyleSheet.hairlineWidth, backgroundColor: palette.graphite400 },
  para: { lineHeight: 24, color: palette.ink },
  dropCap: { lineHeight: 34 },
  empty: { paddingVertical: 12 },
  bodyInput: { minHeight: 260, lineHeight: 24 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: 8 },
  meterTrack: { height: 2, backgroundColor: palette.paperDim },
  meterFill: { height: 2, backgroundColor: palette.ink },
  meterLabel: { marginTop: 6 },
});
