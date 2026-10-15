import { forwardRef, useState } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';

import { font } from './fonts';
import { T, useSurface } from './Typography';
import { color, palette } from './tokens';

export interface FieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Text style family: sans for forms, serif for editorial copy. */
  type?: 'sans' | 'serif' | 'serifItalic' | 'mono';
  size?: number;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  /** No underline; for inline editing inside a printed sheet. */
  bare?: boolean;
}

/** Underlined input, like a field on an index card. */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, type = 'sans', size = 15, style, inputStyle, bare, multiline, onFocus, onBlur, ...rest },
  ref,
) {
  const surface = useSurface();
  const [focused, setFocused] = useState(false);
  const onPaper = surface === 'paper';
  const fg = onPaper ? palette.ink : palette.paper;
  const underline = focused ? fg : onPaper ? color.sheetLine : color.lineStrong;
  return (
    <View style={style}>
      {label ? (
        <T variant="micro" tone="muted" style={styles.label}>
          {label}
        </T>
      ) : null}
      <TextInput
        ref={ref}
        {...rest}
        multiline={multiline}
        placeholderTextColor={onPaper ? palette.graphite500 : palette.graphite400}
        selectionColor={onPaper ? palette.graphite500 : palette.graphite300}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          font(type === 'serifItalic' ? 'serifItalic' : type),
          styles.input,
          {
            color: fg,
            fontSize: size,
            lineHeight: Math.round(size * (type === 'serif' || type === 'serifItalic' ? 1.18 : 1.5)),
            borderBottomColor: bare ? 'transparent' : underline,
          },
          multiline && styles.multiline,
          webReset,
          inputStyle,
        ]}
      />
    </View>
  );
});

const webReset = { outlineStyle: 'none' } as unknown as TextStyle;

const styles = StyleSheet.create({
  label: { marginBottom: 4 },
  input: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  multiline: {
    textAlignVertical: 'top',
  },
});
