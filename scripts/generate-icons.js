/**
 * generate-icons.js
 * Renders the Studyo SVG logo into all PNG assets required by Expo / EAS Build.
 *
 * Outputs:
 *   assets/images/icon.png               1024×1024  purple bg + white mark
 *   assets/images/splash-icon.png        1024×1024  white bg + purple mark
 *   assets/images/android-icon-foreground.png  1024×1024  transparent bg + purple mark
 *   assets/images/android-icon-background.png  1024×1024  solid purple bg
 *   assets/images/android-icon-monochrome.png  1024×1024  black mark on white
 *   assets/images/favicon.png            48×48      purple bg + white mark
 */

const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

// ── Logo path data (viewBox 0 0 473 528) ────────────────────────────────────
// Main shape — the geometric Studyo mark
const MAIN_PATH =
  'M 404.6,125.43 c 0.23,0.27 0.45,0.55 0.67,0.83 c 3.17,3.18 4.2,6.98 5.33,11.17' +
  ' c 0.23,2.06 0.25,4.13 0.04,6.19 c -2.62,14.86 -14.38,17.81 -25.86,24.28' +
  ' c -0.47,0.42 -0.74,0.94 -0.8,1.58 c -0.09,27.79 -0.19,55.59 -0.3,83.39' +
  ' c -0.67,5.56 -3.7,9.12 -9.08,10.68 c -2.09,0.52 -4.17,0.53 -6.26,0.06' +
  ' c -5.22,-1.35 -8.2,-4.69 -8.93,-10.02 c -0.21,-22.7 -0.27,-45.41 -0.17,-68.11' +
  ' c 0.26,-1.75 -0.41,-2.43 -2.01,-2.04 c -4.95,2.76 -34.53,20.35 -37.41,20.16' +
  ' c -2.1,2.47 -5.69,3.53 -8.36,5.44 c -19.67,10.7 -39.95,22.46 -59.71,32.74' +
  ' c -2.12,0.7 -4.25,1.38 -6.38,2.05 c -2.01,0.11 -3.96,0.49 -5.86,1.14' +
  ' c -3.4,0.06 -6.79,-0.04 -10.18,-0.31 c -8.78,-0.92 -16.34,-5.78 -24.08,-9.6' +
  ' c -44.39,-24.89 -88.83,-49.68 -133.32,-74.38 c -6.92,-3.94 -11.56,-9.27 -12.51,-17.43' +
  ' c -0.19,-1.74 -0.19,-3.48 -0.01,-5.21 c 0.9,-7.6 4.72,-13.22 11.48,-16.85' +
  ' c 48.03,-26.58 96.04,-53.2 144.03,-79.85 c 13.75,-7.55 27.98,-6.76 41.59,0.6' +
  ' c 46.28,25.74 92.6,51.42 138.96,77.02 c 3.3,1.81 6.34,3.96 9.13,6.47 Z' +
  ' M 86.13,198.45 c 0.62,-0.3 1.25,-0.34 1.9,-0.11 c 3.87,3.02 21.06,10.51 22.57,14.05' +
  ' c 0.13,11.7 0.2,23.4 0.23,35.11 c -0.05,3.23 0.16,6.43 0.64,9.61' +
  ' c 1.74,9.42 6.42,17.03 14.04,22.82 c 36.48,21.66 73.7,42.68 110.66,63.5' +
  ' c 9.02,4.65 15.64,14.09 6.88,23 c -8.87,7.78 -16.82,0.37 -25.07,-3.83' +
  ' c -35.34,-20.85 -72.18,-40.68 -107.06,-62.13 c -13.66,-10.3 -21.84,-23.91 -24.53,-40.82' +
  ' c -0.39,-3.71 -0.58,-7.42 -0.57,-11.15 c -0.02,-16.68 0.09,-33.36 0.31,-50.05 Z' +
  ' M 382.59,336.4 c 0.08,0.87 0.18,1.73 0.3,2.6 c 0.76,5.47 1.07,10.97 0.96,16.5' +
  ' c 0.14,15.41 0.08,30.81 -0.19,46.21 c -1.31,21.98 -14.28,38.89 -33.24,49.21' +
  ' c -2.64,0.72 -3,0.94 -5.18,2.88 c -23.23,13.38 -46.63,26.65 -69.75,40.19' +
  ' c -6.39,3.82 -12.99,7.2 -19.82,10.13 c -0.29,0.21 -0.45,0.49 -0.46,0.85' +
  ' c -1.12,-0.39 -1.96,-0.1 -2.51,0.87 c -1.09,-0.65 -10.67,1.99 -12.82,1.76' +
  ' c -3.51,0.23 -7.02,0.24 -10.52,0.03 c -8.24,-0.92 -16.02,-3.33 -23.34,-7.23' +
  ' c -20.98,-11.95 -41.9,-24.02 -62.75,-36.2 c -0.31,-0.17 -0.62,-0.34 -0.93,-0.51' +
  ' c -25.97,-15.11 -51.76,-25.2 -56.09,-58.93 c -0.03,-1.57 -0.11,-3.14 -0.26,-4.71' +
  ' c 0.65,-0.28 0.93,-0.78 0.84,-1.52 c -0.21,-16.04 -0.25,-32.08 -0.11,-48.13' +
  ' c 0.15,-0.95 -0.09,-1.77 -0.7,-2.46 c 0.06,-0.67 0.15,-1.33 0.25,-2' +
  ' c 2.54,-12.63 22.82,-12.76 24.33,1.48 c 0.04,17.54 0.2,35.08 0.48,52.62' +
  ' c 1.38,9.88 5.71,18.41 14,24.18 c 30.19,17.53 60.35,35.09 90.48,52.7' +
  ' c 3.57,2.05 7.35,3.6 11.33,4.67 c 5.74,1.06 11.46,1.03 17.18,-0.11' +
  ' c 2.76,-0.83 5.47,-1.79 8.13,-2.88 c 27.58,-15.91 55.73,-32.49 83.36,-48.53' +
  ' c 11.64,-5.35 20.71,-13.86 23,-26.95 c 0.09,-0.72 0.2,-1.44 0.3,-2.16' +
  ' c 0.45,0.06 0.77,-0.12 0.96,-0.54 c 0.28,-18.34 0.33,-36.69 0.14,-55.04' +
  ' c 0.04,-0.85 -0.36,-1.22 -1.19,-1.12 c -0.02,-0.1 -0.05,-0.2 -0.07,-0.3' +
  ' c -1.93,-8.54 -5.91,-16.76 -13.16,-22.02 c -30,-17.42 -60.02,-34.79 -90.03,-52.1' +
  ' c -0.65,-0.62 -0.73,-1.29 -0.23,-2 c 3.89,-1.48 7.77,-3 11.64,-4.56' +
  ' c 5.19,-1.72 12.32,-9.8 17.79,-5.57 c 21.86,12.54 43.76,25.03 65.69,37.44' +
  ' c 15.78,8.73 23.58,18.94 30.84,35.14 c 0.12,2.1 0.57,4.14 1.35,6.11 Z';

// ── SVG builder ──────────────────────────────────────────────────────────────
// Logo natural size: 473 × 528.  We pad to 15 % each side.
const LOGO_W = 473;
const LOGO_H = 528;

function buildSVG(canvasSize, bgColor, markColor) {
  const pad = canvasSize * 0.15;
  const avail = canvasSize - pad * 2;
  const scale = Math.min(avail / LOGO_W, avail / LOGO_H);
  const scaledW = LOGO_W * scale;
  const scaledH = LOGO_H * scale;
  const tx = (canvasSize - scaledW) / 2;
  const ty = (canvasSize - scaledH) / 2;

  const bg = bgColor
    ? `<rect width="${canvasSize}" height="${canvasSize}" fill="${bgColor}"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg"
    width="${canvasSize}" height="${canvasSize}"
    viewBox="0 0 ${canvasSize} ${canvasSize}">
    ${bg}
    <g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${scale.toFixed(6)})">
      <path fill="${markColor}" fill-rule="evenodd" stroke="${markColor}" stroke-width="0.5"
        d="${MAIN_PATH}"/>
    </g>
  </svg>`;
}

function render(svgStr, outPath) {
  const resvg = new Resvg(svgStr, { fitTo: { mode: 'original' } });
  const png = resvg.render().asPng();
  fs.writeFileSync(outPath, png);
  console.log(`  ✓ ${path.relative(process.cwd(), outPath)}  (${png.length} bytes)`);
}

const OUT = path.join(__dirname, '..', 'assets', 'images');

console.log('\nGenerating Studyo icons…\n');

// icon.png — purple bg, white mark (home screen icon)
render(buildSVG(1024, '#7C3AED', '#ffffff'), path.join(OUT, 'icon.png'));

// splash-icon.png — white bg, purple mark
render(buildSVG(1024, '#ffffff', '#7C3AED'), path.join(OUT, 'splash-icon.png'));

// android adaptive foreground — transparent bg, purple mark
render(buildSVG(1024, null, '#7C3AED'), path.join(OUT, 'android-icon-foreground.png'));

// android adaptive background — solid purple (EAS composites with foreground)
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <rect width="1024" height="1024" fill="#7C3AED"/>
  </svg>`,
  path.join(OUT, 'android-icon-background.png'),
);

// android monochrome — black mark on white (used by Android 13 themed icons)
render(buildSVG(1024, '#ffffff', '#000000'), path.join(OUT, 'android-icon-monochrome.png'));

// favicon — 48 px, purple bg, white mark
render(buildSVG(48, '#7C3AED', '#ffffff'), path.join(OUT, 'favicon.png'));

console.log('\nDone. All icon assets updated.\n');
