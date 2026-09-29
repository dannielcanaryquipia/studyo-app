/**
 * Studyo typography roles — SOURCE_OF_TRUTH.md §3.1.
 * Space Mono ships 400/700 only (use 700 for headings); Inter carries the body.
 * Loaded in app/_layout.tsx from the vendored TTFs in assets/fonts.
 */

export const fonts = {
  display: 'SpaceMono_700Bold',
  title: 'SpaceMono_700Bold',
  body: 'Inter_400Regular',
  medium: 'Inter_600SemiBold',
  semibold: 'Inter_600SemiBold',
} as const;

export const typography = {
  display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title: { fontFamily: fonts.title, fontSize: 22, lineHeight: 28, fontWeight: '600' },
  subtitle: { fontFamily: fonts.medium, fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, fontWeight: '400' },
  caption: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
} as const;