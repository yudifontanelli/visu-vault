import { useWindowDimensions } from 'react-native';

import { breakpoints } from '../theme';

export type LayoutClass = 'phone' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const layout: LayoutClass =
    width >= breakpoints.desktop ? 'desktop' : width >= breakpoints.tablet ? 'tablet' : 'phone';
  return {
    width,
    height,
    layout,
    isPhone: layout === 'phone',
    isDesktop: layout === 'desktop',
    /** Side-by-side layouts only when there is room for both columns. */
    isWide: width >= 900 && width > height * 0.9,
  };
}
