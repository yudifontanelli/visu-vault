import { memo, useMemo } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg';

import { palette } from '../tokens';
import { guillochePath, hatchPath, keyholePath } from './geometry';

/* All ornaments are line engravings: one ink, hairline strokes, no fills beyond solids. */

const PLATE =
  'M 0 -122 C 30 -100, 72 -80, 70 -40 C 68 -10, 48 5, 48 20 C 48 35, 68 50, 70 80 ' +
  'C 72 120, 30 140, 0 162 C -30 140, -72 120, -70 80 C -68 50, -48 35, -48 20 ' +
  'C -48 5, -68 -10, -70 -40 C -72 -80, -30 -100, 0 -122 Z';
const PLATE_CENTER_Y = 20;
const BASE_R = 18;

/**
 * Engraved keyhole escutcheon, drawn around a keyhole whose circle is centred at
 * (cx, cy) with radius r. Returns an SVG group to embed in a larger drawing (the
 * keyhole itself is usually a real cut-out in the layer above).
 */
export const EscutcheonGroup = memo(function EscutcheonGroup({
  cx,
  cy,
  r,
  stroke = palette.ink,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  r: number;
  stroke?: string;
  opacity?: number;
}) {
  const s = r / BASE_R;
  const radial = useMemo(() => {
    let d = '';
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      // Skip the sector occupied by the keyhole's stem (straight down).
      const fromDown = Math.abs(((a - Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (fromDown < 0.62) continue;
      const r1 = BASE_R * 1.32;
      const r2 = BASE_R * (i % 2 ? 1.58 : 1.7);
      d += `M${(Math.cos(a) * r1).toFixed(2)} ${(Math.sin(a) * r1).toFixed(2)} L${(Math.cos(a) * r2).toFixed(2)} ${(Math.sin(a) * r2).toFixed(2)} `;
    }
    return d;
  }, []);
  const contours = [0.92, 0.84, 0.76, 0.68, 0.6, 0.52];
  return (
    <G transform={`translate(${cx} ${cy}) scale(${s})`} opacity={opacity}>
      <Path d={PLATE} stroke={stroke} strokeWidth={1.5} fill="none" />
      {contours.map((k, i) => (
        <Path
          key={k}
          d={PLATE}
          stroke={stroke}
          strokeWidth={0.5}
          strokeOpacity={i % 2 ? 0.45 : 0.75}
          fill="none"
          transform={`translate(0 ${PLATE_CENTER_Y}) scale(${k}) translate(0 ${-PLATE_CENTER_Y})`}
        />
      ))}
      <Path d={radial} stroke={stroke} strokeWidth={0.6} strokeOpacity={0.7} />
      {/* Rim around the cut-out; shifted so the margin is even top and bottom. */}
      <Path d={keyholePath(0, 0, BASE_R * 1.16)} transform="translate(0 -1.9)" stroke={stroke} strokeWidth={1.2} fill="none" />
      <Screw x={0} y={-95} angle={35} stroke={stroke} />
      <Screw x={0} y={135} angle={-20} stroke={stroke} />
    </G>
  );
});

function Screw({ x, y, angle, stroke }: { x: number; y: number; angle: number; stroke: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Circle r={6.5} stroke={stroke} strokeWidth={1} fill="none" />
      <Circle r={4.6} stroke={stroke} strokeWidth={0.4} strokeOpacity={0.6} fill="none" />
      <Line x1={-6} y1={0} x2={6} y2={0} stroke={stroke} strokeWidth={1.4} />
    </G>
  );
}

/** Standalone guilloché rosette (watermarks, seals). */
export const Rosette = memo(function Rosette({
  size = 160,
  stroke = palette.ink,
  opacity = 1,
  rings = 2,
}: {
  size?: number;
  stroke?: string;
  opacity?: number;
  rings?: number;
}) {
  const d = useMemo(() => {
    const parts = [
      guillochePath({ cx: 100, cy: 100, radius: 78, amplitude: 9, waves: 24, count: 10 }),
      guillochePath({ cx: 100, cy: 100, radius: 52, amplitude: 7, waves: 16, count: 8 }),
      guillochePath({ cx: 100, cy: 100, radius: 30, amplitude: 5, waves: 10, count: 6, samples: 160 }),
    ];
    return parts.slice(0, Math.max(1, Math.min(3, rings + 1))).join(' ');
  }, [rings]);
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" opacity={opacity} accessibilityElementsHidden>
      <Circle cx={100} cy={100} r={95} stroke={stroke} strokeWidth={0.8} fill="none" />
      <Circle cx={100} cy={100} r={91} stroke={stroke} strokeWidth={0.4} fill="none" />
      <Path d={d} stroke={stroke} strokeWidth={0.45} fill="none" />
    </Svg>
  );
});

/** Printer's registration mark. */
export function RegistrationMark({ size = 18, stroke = palette.graphite500 }: { size?: number; stroke?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" accessibilityElementsHidden>
      <Circle cx={10} cy={10} r={5.2} stroke={stroke} strokeWidth={0.8} fill="none" />
      <Line x1={10} y1={0.5} x2={10} y2={19.5} stroke={stroke} strokeWidth={0.8} />
      <Line x1={0.5} y1={10} x2={19.5} y2={10} stroke={stroke} strokeWidth={0.8} />
      <Circle cx={10} cy={10} r={1.6} fill={stroke} />
    </Svg>
  );
}

/** Engraved antique key, pointing right. Line art with clipped hatching for shade. */
export const VintageKey = memo(function VintageKey({
  width = 220,
  stroke = palette.ink,
  opacity = 1,
}: {
  width?: number;
  stroke?: string;
  opacity?: number;
}) {
  const knurl = useMemo(() => {
    let d = '';
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      d += `M${(55 + Math.cos(a) * 36.5).toFixed(2)} ${(55 + Math.sin(a) * 36.5).toFixed(2)} L${(55 + Math.cos(a) * 41.5).toFixed(2)} ${(55 + Math.sin(a) * 41.5).toFixed(2)} `;
    }
    return d;
  }, []);
  const shaftHatch = useMemo(() => hatchPath(110, 55, 150, 6, 3.2, 90), []);
  const bitHatch = useMemo(() => hatchPath(226, 60, 40, 40, 3.4, -35), []);
  const bit = 'M228 61 L262 61 L262 98 L252 98 L252 86 L244 86 L244 98 L236 98 L236 78 L228 78 Z';
  return (
    <Svg width={width} height={(width * 110) / 300} viewBox="0 0 300 110" opacity={opacity} accessibilityElementsHidden>
      <Defs>
        <ClipPath id="vk-shaft">
          <Rect x={110} y={55} width={150} height={6} />
        </ClipPath>
        <ClipPath id="vk-bit">
          <Path d={bit} />
        </ClipPath>
      </Defs>
      {/* Bow */}
      <Circle cx={55} cy={55} r={42} stroke={stroke} strokeWidth={1.6} fill="none" />
      <Circle cx={55} cy={55} r={36} stroke={stroke} strokeWidth={0.7} fill="none" />
      <Path d={knurl} stroke={stroke} strokeWidth={0.6} />
      {[
        [55 - 14, 55],
        [55 + 14, 55],
        [55, 55 - 14],
        [55, 55 + 14],
      ].map(([x, y]) => (
        <Circle key={`${x}-${y}`} cx={x} cy={y} r={11} stroke={stroke} strokeWidth={1} fill="none" />
      ))}
      <Circle cx={55} cy={55} r={4} stroke={stroke} strokeWidth={1} fill="none" />
      {/* Collar */}
      <Rect x={97} y={44} width={7} height={22} stroke={stroke} strokeWidth={1.2} fill="none" />
      <Rect x={104} y={46} width={6} height={18} stroke={stroke} strokeWidth={1} fill="none" />
      {/* Shaft */}
      <Line x1={110} y1={49} x2={272} y2={49} stroke={stroke} strokeWidth={1.2} />
      <Line x1={110} y1={61} x2={228} y2={61} stroke={stroke} strokeWidth={1.2} />
      <Line x1={262} y1={61} x2={272} y2={61} stroke={stroke} strokeWidth={1.2} />
      <Path d="M272 49 A6 6 0 0 1 272 61" stroke={stroke} strokeWidth={1.2} fill="none" />
      <G clipPath="url(#vk-shaft)">
        <Path d={shaftHatch} stroke={stroke} strokeWidth={0.5} strokeOpacity={0.8} />
      </G>
      <Rect x={196} y={46} width={6} height={18} stroke={stroke} strokeWidth={1} fill="none" />
      {/* Bit */}
      <Path d={bit} stroke={stroke} strokeWidth={1.3} fill="none" />
      <G clipPath="url(#vk-bit)">
        <Path d={bitHatch} stroke={stroke} strokeWidth={0.5} strokeOpacity={0.75} />
      </G>
    </Svg>
  );
});
