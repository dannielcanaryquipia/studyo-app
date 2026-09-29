# Studyo Onboarding Animation — Integration Package

Self-contained assets and code for the Studyo mobile learning app onboarding flow. Drop into any React Native (Expo) project.

## Quick Start

```bash
# 1. Copy the folder into your project
cp -r studyo-onboarding-assets/ your-app/src/assets/onboarding/

# 2. Install peer deps (if not already present)
npx expo install react-native-reanimated react-native-svg

# 3. Add Reanimated babel plugin (if not already in babel.config.js)
# babel.config.js
module.exports = {
  plugins: [
    ['react-native-reanimated/plugin', { globals: ['__TEST__'] }],
  ],
};
```

> **Studyo note:** this install uses NativeWind v5 (no babel.config.js). Reanimated 4
> (SDK 57, tracks via `react-native-worklets`) works without the babel plugin in this
> project — see root DECISIONS.md.

```tsx
// 4. Use in your onboarding screen
import { OnboardingAnimation } from '@/assets/onboarding/components/OnboardingAnimation';

export function OnboardingScreen() {
  const handleComplete = () => {
    navigation.replace('Home'); // or your post-onboarding route
  };

  return (
    <OnboardingAnimation
      onComplete={handleComplete}
      loop={false}
      brandColor="#5B21B6" // Studyo purple
    />
  );
}
```

---

## Package Contents

```
studyo-onboarding-assets/
├── svgs/
│   ├── frame-01-start.svg      # Blank studio backdrop (frame 0001)
│   ├── frame-02-reveal.svg     # Logo reveal mid-animation (frame 0047)
│   ├── frame-03-final.svg      # Final logo lockup (frame 0094)
├── components/
│   └── OnboardingAnimation.tsx # Reanimated-driven animation component
├── hooks/
│   └── useOnboardingAnimation.ts # Reusable animation controller hook
└── INTEGRATION_GUIDE.md        # This file
```

---

## Component API

### `OnboardingAnimation` (components/OnboardingAnimation.tsx)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `frameDuration` | `number` | `33` | Ms per frame (~30fps) |
| `loop` | `boolean` | `false` | Restart after final frame |
| `onComplete` | `() => void` | — | Fires once on final frame (non-looping) |
| `resizeMode` | `ImageResizeMode` | `'contain'` | SVG container sizing |
| `style` | `StyleProp<ViewStyle>` | — | Container style override |
| `brandColor` | `string` | `'#5B21B6'` | Fill color for logo paths |

**Returns:** React component rendering a centered, full-screen SVG animation driven by `react-native-reanimated` on the UI thread.

### `useOnboardingAnimation` (hooks/useOnboardingAnimation.ts)

Headless hook for custom rendering (e.g., multiple SVGs, custom interpolation).

```tsx
import { useOnboardingAnimation } from '@/assets/onboarding/hooks/useOnboardingAnimation';
import { Animated, View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export function CustomOnboarding() {
  const { frameIndex, play, pause, reset, goToFrame } = useOnboardingAnimation({
    frameDuration: 33,
    loop: false,
    onComplete: () => console.log('done'),
    totalFrames: 3,
  });

  const frame0Style = useAnimatedStyle(() => ({
    opacity: frameIndex.value === 0 ? 1 : 0,
  }));
  const frame1Style = useAnimatedStyle(() => ({
    opacity: frameIndex.value === 1 ? 1 : 0,
  }));
  const frame2Style = useAnimatedStyle(() => ({
    opacity: frameIndex.value === 2 ? 1 : 0,
  }));

  return (
    <View style={styles.container}>
      <Svg viewBox="0 0 720 1280" style={styles.svg}>
        <Path d={FRAME_0_PATH} fill="#5B21B6" style={frame0Style} />
        <Path d={FRAME_1_PATH} fill="#5B21B6" style={frame1Style} />
        <Path d={FRAME_2_PATH} fill="#5B21B6" style={frame2Style} />
      </Svg>
    </View>
  );
}
```

**Returns:** `{ frameIndex, animatedStyle, play, pause, reset, goToFrame }`

---

## SVG Assets

| File | Purpose | ViewBox | Notes |
|------|---------|---------|-------|
| `frame-01-start.svg` | Blank backdrop (720×1280) | `0 0 720 1280` | Light gray studio background only |
| `frame-02-reveal.svg` | Mid-animation logo reveal | `0 0 720 1280` | S-hexagon emerging |
| `frame-03-final.svg` | Final lockup | `0 0 720 1280` | Full logo + wordmark + graduation-cap motif |

All SVGs are **vector**, scale infinitely, and use a single brand color (`#5B21B6`) applied at render time via the `brandColor` prop.

---

## Requirements

| Dependency | Version | Purpose |
|------------|---------|---------|
| `react-native-reanimated` | ≥ 3.0 | UI-thread animation driver |
| `react-native-svg` | ≥ 14.0 | SVG rendering |
| `react-native` | ≥ 0.72 | Core RN APIs |

**Expo:** Works out of the box with Expo SDK 50+ (reanimated 3.x included). For bare workflow, follow [Reanimated installation](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation/).

---

## Integration Checklist

- [ ] `react-native-reanimated` and `react-native-svg` installed
- [ ] Reanimated Babel plugin added to `babel.config.js` *(not needed on SDK 57 / NativeWind v5 — see DECISIONS.md)*
- [ ] Assets folder copied to your project (e.g., `assets/onboarding/`)
- [ ] Import paths updated to match your project structure
- [ ] Test on device/simulator (UI-thread animation requires native build; Expo Go works for managed workflow)

---

## Customization

### Change Animation Speed
```tsx
<OnboardingAnimation frameDuration={50} /> // slower (20fps)
<OnboardingAnimation frameDuration={16} /> // faster (60fps)
```

### Looping Intro
```tsx
<OnboardingAnimation loop={true} /> // e.g., for a loading state
```

### Custom Brand Color
```tsx
<OnboardingAnimation brandColor="#0066FF" /> // your app's primary color
```

### Preload / Splash Integration
```tsx
// In App.tsx or root layout
import { SplashScreen } from 'expo-splash-screen';
import { OnboardingAnimation } from '@/assets/onboarding/components/OnboardingAnimation';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
      SplashScreen.hideAsync();
    }, 3200); // 3 frames × 33ms × small buffer

    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <OnboardingAnimation onComplete={() => {}} />;
  }

  return <NavigationContainer>...</NavigationContainer>;
}
```

---

## Migration from Raster (PNG) Version

If you previously used the PNG-based `SplashAnimation.tsx`:

| Old (PNG) | New (SVG + Reanimated) |
|-----------|------------------------|
| 94 PNG frames (~30 MB) | 3 SVG frames (~12 KB total) |
| `requestAnimationFrame` on JS thread | `react-native-reanimated` on UI thread |
| `Image` source swapping | `Path` opacity interpolation |
| Fixed 3.13s duration | Configurable `frameDuration` |
| No loop support | `loop` prop |
| Bundled bitmap assets | Vector, resolution-independent |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Animation doesn't play | Reanimated plugin missing | Add to `babel.config.js`, rebuild |
| SVG not visible | `react-native-svg` not linked | `npx expo install react-native-svg` + rebuild |
| Stutter on low-end devices | Too many re-renders | Ensure component is memoized; avoid inline styles |
| Color wrong | `brandColor` prop not passed | Pass `brandColor="#5B21B6"` explicitly |
| TypeScript errors | Missing `@types/react-native-svg` | Usually included; check `tsconfig.json` `compilerOptions.types` |

---

## License & Attribution

Generated from Studyo brand assets. Internal use only — do not redistribute outside the Studyo organization.

---

## Support

For integration questions, contact the mobile team or reference the original project in `frames-studyo/` (contains full source, generator scripts, and graphify knowledge graph).