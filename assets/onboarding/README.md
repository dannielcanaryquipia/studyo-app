# Studyo Onboarding Animation — Integration Package

Self-contained assets and code for the Studyo mobile learning app onboarding flow.

**Source:** `frames-studyo/studyo-onboarding-assets/` at `<SOURCES_DIR>` (parent repo).
Staged here per SOURCE_OF_TRUTH §3.3 / Phase A — 3 distilled SVG keyframes replace
the 94-frame PNG `SplashAnimation.tsx` (23 MB raster deferred; see
`INTEGRATION_GUIDE.md` → "Migration from Raster (PNG) Version").
Full integration is Phase C (Splash morph).

## Contents

```
assets/onboarding/
├── svgs/
│   ├── frame-01-start.svg      # Blank studio backdrop (frame 0001)
│   ├── frame-02-reveal.svg     # Logo reveal mid-animation (frame 0047)
│   └── frame-03-final.svg      # Final logo lockup (frame 0094)
├── components/
│   └── OnboardingAnimation.tsx # Reanimated-driven animation component
├── hooks/
│   └── useOnboardingAnimation.ts # Reusable animation controller hook
└── INTEGRATION_GUIDE.md        # This file
```

See the guide below for the full component API and original integration steps.