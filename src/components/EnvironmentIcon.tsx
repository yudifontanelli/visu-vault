import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import type { EnvironmentId } from '../data/environments';
import { colors } from '../theme';

interface Props {
  id: EnvironmentId;
  size?: number;
  color?: string;
}

/** Line-art glyphs, one per environment, drawn on a 24×24 grid. */
export function EnvironmentIcon({ id, size = 24, color = colors.offWhite }: Props) {
  const stroke = { stroke: color, strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      {id === 'brainstorm' && (
        <>
          <Path d="M9 18h6M10 21h4" {...stroke} />
          <Path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" {...stroke} />
        </>
      )}
      {id === 'editorial' && (
        <>
          <Rect x={4} y={3} width={16} height={18} rx={2} {...stroke} />
          <Line x1={8} y1={8} x2={16} y2={8} {...stroke} />
          <Line x1={8} y1={12} x2={16} y2={12} {...stroke} />
          <Line x1={8} y1={16} x2={13} y2={16} {...stroke} />
        </>
      )}
      {id === 'projects' && (
        <>
          <Rect x={3} y={4} width={7} height={7} rx={1.5} {...stroke} />
          <Rect x={14} y={4} width={7} height={7} rx={1.5} {...stroke} />
          <Rect x={3} y={14} width={7} height={7} rx={1.5} {...stroke} />
          <Rect x={14} y={14} width={7} height={7} rx={1.5} {...stroke} />
        </>
      )}
      {id === 'library' && (
        <>
          <Path d="M5 4v16M9 4v16" {...stroke} />
          <Path d="m13.5 4.6 3.9-1 3.6 15.6-3.9 1Z" {...stroke} />
        </>
      )}
      {id === 'archive' && (
        <>
          <Rect x={3} y={4} width={18} height={5} rx={1} {...stroke} />
          <Path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" {...stroke} />
          <Line x1={10} y1={13} x2={14} y2={13} {...stroke} />
        </>
      )}
      {id === 'team' && (
        <>
          <Circle cx={9} cy={8} r={3.2} {...stroke} />
          <Path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5" {...stroke} />
          <Circle cx={17} cy={9} r={2.4} {...stroke} />
          <Path d="M16.5 14.6c2.3.2 3.9 1.9 4.5 4.6" {...stroke} />
        </>
      )}
    </Svg>
  );
}
