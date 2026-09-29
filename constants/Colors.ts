/**
 * Studyo canonical color tokens — single source of truth.
 * SOURCE_OF_TRUTH.md §3.1 (canonical table wins for color values; HTML prototypes
 * win for layout only). No hardcoded hex in components — import from here.
 */

export interface ThemeColors {
  background: string;
  surface: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  tabDefault: string;
  tabSelected: string;
  success: string;
  star: string;
  danger: string;
  /** Text/foreground on an accent surface (JS-color companion to `text-white`). */
  onAccent: string;
  /** Material Design 3 primary-fixed — lavender pill behind active tab icon. */
  primaryFixed: string;
  // Navigation aliases (keep @react-navigation toggle-free):
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

const light: ThemeColors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  accent: '#7C3AED',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  tabDefault: '#9CA3AF',
  tabSelected: '#7C3AED',
  success: '#16A34A',
  star: '#F59E0B',
  danger: '#DC2626',
  onAccent: '#FFFFFF',
  primaryFixed: '#eaddff',
  tint: '#7C3AED',
  tabIconDefault: '#9CA3AF',
  tabIconSelected: '#7C3AED',
};

const dark: ThemeColors = {
  background: '#0E0E12',
  surface: '#1A1A20',
  accent: '#A78BFA',
  text: '#F5F5F5',
  textMuted: '#9CA3AF',
  border: '#2A2A33',
  tabDefault: '#6B7280',
  tabSelected: '#A78BFA',
  success: '#22C55E',
  star: '#F59E0B',
  danger: '#EF4444',
  onAccent: '#1E1B4B', // text on the light-lavender dark accent
  primaryFixed: '#2d2455',
  tint: '#A78BFA',
  tabIconDefault: '#6B7280',
  tabIconSelected: '#A78BFA',
};

export default { light, dark };