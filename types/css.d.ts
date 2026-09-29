// Ambient module for CSS imports processed by react-native-css (NativeWind v5).
// Side-effect import (`import '@/src/global.css'`) is the norm; a default export
// is declared too so future components could import token maps if needed.
declare module '*.css' {
  const styles: { readonly [key: string]: string };
  export default styles;
}

// .md files are bundled as plain string modules via metro.md-transformer.js.
declare module '*.md' {
  const content: string;
  export default content;
}