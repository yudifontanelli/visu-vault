import { useWindowDimensions } from 'react-native';

import { layout as tokens } from '../design/tokens';

export type LayoutClass = 'phone' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const { tablet, desktop, wide } = tokens.breakpoints;
  const layout: LayoutClass = width >= desktop ? 'desktop' : width >= tablet ? 'tablet' : 'phone';
  return {
    width,
    height,
    layout,
    isPhone: layout === 'phone',
    isTablet: layout === 'tablet',
    isDesktop: layout === 'desktop',
    /** Large desktop windows (≥1440): room for a third column. */
    isLarge: width >= wide,
    /** Side-by-side layouts only when there is room for both columns. */
    isWide: width >= 900 && width > height * 0.9,
    gutter: layout === 'desktop' ? tokens.gutter.desktop : layout === 'tablet' ? tokens.gutter.tablet : tokens.gutter.phone,
  };
}
