/**
 * useResponsive — single source of truth for layout decisions.
 * Wraps useWindowDimensions so every screen reacts to orientation
 * changes and tablet-size windows automatically.
 *
 * Breakpoints (React Native uses dp / logical pixels):
 *   xs  < 375   small phones (SE, older Android)
 *   sm  375–429 normal phones (iPhone 14, Pixel 7)
 *   md  430–767 large phones (14 Plus, Pro Max)
 *   lg  768 +   tablets, landscape-split windows
 */
import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg';

export interface Responsive {
  /** Raw screen dimensions */
  width: number;
  height: number;
  /** Current named breakpoint */
  bp: Breakpoint;
  /** Convenience flags */
  isTablet: boolean;    // width >= 768
  isLargePhone: boolean; // width >= 430
  isSmall: boolean;     // width < 375
  isLandscape: boolean; // width > height
  /** Horizontal padding for screen edges */
  hPad: number;
  /** Vertical gap between major sections */
  gap: number;
  /** Maximum content width — Screen centers at this on tablets */
  contentMaxWidth: number;
  /** Card padding */
  cardPad: number;
  /** Header font size */
  headingSize: number;
  /** Body font size */
  bodySize: number;
  /** Number of columns for a grid given a minimum item width in dp */
  cols: (minItemWidth: number) => number;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;
  const isLargePhone = width >= 430;
  const isSmall = width < 375;
  const isLandscape = width > height;

  let bp: Breakpoint;
  if (width >= 768) bp = 'lg';
  else if (width >= 430) bp = 'md';
  else if (width >= 375) bp = 'sm';
  else bp = 'xs';

  const hPad = isTablet ? 32 : isLargePhone ? 24 : isSmall ? 14 : 20;
  const gap = isTablet ? 20 : 16;
  const cardPad = isTablet ? 20 : 16;

  // On tablets cap content so text lines don't stretch wall-to-wall
  const contentMaxWidth = isTablet ? Math.min(width, 720) : width;

  const headingSize = isTablet ? 28 : isSmall ? 20 : 24;
  const bodySize = isTablet ? 15 : isSmall ? 13 : 14;

  const cols = (minItemWidth: number) =>
    Math.max(1, Math.floor((contentMaxWidth - hPad * 2) / minItemWidth));

  return {
    width,
    height,
    bp,
    isTablet,
    isLargePhone,
    isSmall,
    isLandscape,
    hPad,
    gap,
    cardPad,
    contentMaxWidth,
    headingSize,
    bodySize,
    cols,
  };
}
