// Classname combiner — no external deps needed since this project uses StyleSheet.create().
export function cn(...inputs: (string | false | null | undefined)[]): string {
  return inputs.filter(Boolean).join(' ');
}