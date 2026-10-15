import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useSurface } from './Typography';
import { palette } from './tokens';

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;

/**
 * Minimal line icons on a 24 grid, one stroke weight. Geometric and monochrome,
 * legible at 16 px. Names are the pt-BR terms used in the interface.
 */
export const ICONS = {
  // The four environments (bottom bar on iPhone, sidebar on desktop).
  inicio: ['M4 10.5 12 4l8 6.5V20H4z', 'M10 20v-5.5h4V20'],
  mesa: ['M4 4h7v9H4z', 'M13 4h7v5h-7z', 'M13 11h7v9h-7z', 'M4 15h7v5H4z'],
  editorial: ['M5.5 3.5h13v17h-13z', 'M8.5 8h7', 'M8.5 11.5h7', 'M8.5 15h4'],
  acervo: ['M3.5 4.5h17v4.5h-17z', 'M5 9v10.5h14V9', 'M10 13h4'],
  // Actions.
  mais: ['M12 5v14', 'M5 12h14'],
  fechar: ['M6 6l12 12', 'M18 6 6 18'],
  buscar: [circle(10.5, 10.5, 6), 'M15 15l5 5'],
  voltar: ['M14.5 5.5 8 12l6.5 6.5'],
  avancar: ['M9.5 5.5 16 12l-6.5 6.5'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  perfil: [circle(12, 8.5, 3.75), 'M4.5 20c.8-3.8 3.7-5.75 7.5-5.75s6.7 1.95 7.5 5.75'],
  ajustes: ['M4 7h9', 'M17 7h3', 'M4 17h3', 'M11 17h9', circle(15, 7, 2), circle(9, 17, 2)],
  confirmar: ['M5 12.5 10 17.5 19 6.5'],
  copiar: ['M8.5 8.5h11v11h-11z', 'M15.5 8.5v-4h-11v11h4'],
  link: ['M10 14l4-4', 'M8.5 11.5 6.8 13.2a3.25 3.25 0 0 0 4.6 4.6l1.7-1.7', 'M15.5 12.5l1.7-1.7a3.25 3.25 0 0 0-4.6-4.6l-1.7 1.7'],
  imagem: ['M3.5 5.5h17v13h-17z', 'M3.5 15.5l5-4.5 4 3.5 3-2.5 5 4', circle(15.5, 9, 1.25)],
  nota: ['M5.5 4.5h13v10l-5 5h-8z', 'M18.5 14.5h-5v5'],
  comentario: ['M4.5 5.5h15v10.5h-8.5l-4 3.5V16h-2.5z'],
  calendario: ['M4.5 6h15v14h-15z', 'M4.5 10h15', 'M8.5 3.5V8', 'M15.5 3.5V8'],
  lista: ['M9 7h11', 'M9 12h11', 'M9 17h11', 'M4.5 7h1', 'M4.5 12h1', 'M4.5 17h1'],
  grade: ['M4.5 4.5h6v6h-6z', 'M13.5 4.5h6v6h-6z', 'M4.5 13.5h6v6h-6z', 'M13.5 13.5h6v6h-6z'],
  excluir: ['M4.5 7h15', 'M9.5 7V4.5h5V7', 'M6.5 7l1 12.5h9l1-12.5'],
  cadeado: ['M6 10.5h12v9.5H6z', 'M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5'],
  arrastar: ['M9 6h.01', 'M15 6h.01', 'M9 12h.01', 'M15 12h.01', 'M9 18h.01', 'M15 18h.01'],
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 22,
  color: raw,
  strokeWidth = 1.5,
  label,
  style,
}: {
  name: IconName;
  size?: number;
  /** Raw colour; defaults to the primary text colour of the surface. */
  color?: string;
  strokeWidth?: number;
  /** Accessible name. Without it the icon is decorative and hidden from assistive tech. */
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const surface = useSurface();
  const c = raw ?? (surface === 'paper' ? palette.ink : palette.paper);
  // Dots (the drag handle) need a heavier round cap to read at small sizes.
  const dots = name === 'arrastar';
  return (
    <View
      style={[{ width: size, height: size }, style]}
      {...(label
        ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label }
        : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const, 'aria-hidden': true })}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {ICONS[name].map((d, i) => (
          <Path
            key={i}
            d={d}
            fill="none"
            stroke={c}
            strokeWidth={dots ? strokeWidth * 2.2 : strokeWidth}
            strokeLinecap={dots ? 'round' : 'square'}
            strokeLinejoin="miter"
          />
        ))}
      </Svg>
    </View>
  );
}
