import { memo, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { svgFont } from '../../design/fonts';
import { palette } from '../../design/tokens';
import { Plate } from './catalog';
import { drawPlate, PLATE_H, PLATE_W } from './plateArt';

/** Renders a generative plate at any width, keeping the 4:5 format. */
export const PlateArt = memo(function PlateArt({
  plate,
  width,
  detail = 1,
  style,
}: {
  plate: Plate;
  width: number;
  detail?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const drawing = useMemo(() => drawPlate(plate, detail), [plate, detail]);
  const height = (width * PLATE_H) / PLATE_W;
  return (
    <View
      style={[{ width, height, backgroundColor: drawing.background === 'ink' ? palette.ink : palette.paper, overflow: 'hidden' }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${plate.title}, ${plate.technique}`}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${PLATE_W} ${PLATE_H}`}>
        {drawing.ops.map((o, i) => {
          switch (o.op) {
            case 'rect':
              return (
                <Rect key={i} x={o.x} y={o.y} width={o.w} height={o.h} rx={o.rx} fill={o.fill ?? 'none'} stroke={o.stroke} strokeWidth={o.sw} opacity={o.opacity} />
              );
            case 'circle':
              return <Circle key={i} cx={o.cx} cy={o.cy} r={o.r} fill={o.fill ?? 'none'} stroke={o.stroke} strokeWidth={o.sw} opacity={o.opacity} />;
            case 'path':
              return (
                <Path
                  key={i}
                  d={o.d}
                  fill={o.fill ?? 'none'}
                  stroke={o.stroke}
                  strokeWidth={o.sw}
                  opacity={o.opacity}
                  strokeDasharray={o.dash}
                  strokeLinecap={o.cap}
                />
              );
            case 'text':
              return (
                <SvgText
                  key={i}
                  x={o.x}
                  y={o.y}
                  fill={o.fill}
                  fontSize={o.size}
                  fontFamily={svgFont[o.family]}
                  textAnchor={o.anchor ?? 'start'}
                  letterSpacing={o.spacing}
                  opacity={o.opacity}
                  transform={o.rotate ? `rotate(${o.rotate} ${o.x} ${o.y})` : undefined}
                >
                  {o.text}
                </SvgText>
              );
          }
          return null;
        })}
      </Svg>
    </View>
  );
});
