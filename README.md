# Studyo — Mobile Learning App

> A polished, offline-first mobile learning app for **Filipino orthography** (Ortograpiyang Pambansa) and **Bikol–Sorsoganon** spelling, built with Expo SDK 57 + React Native 0.86 on the New Architecture. Bilingual content, time-paced lesson gating, per-lesson quizzes, streaks, daily goals, achievements, and a single-accent design system with automatic light/dark theming.

This document is the complete engineering reference for the app: architecture, design system, routing, data pipeline, every hook/lib/constant/type, the reusable component catalog, screen inventory, and the build/QA workflow.

---

## Table of Contents

1. [What Studyo Is](#1-what-studyo-is)
2. [Tech Stack](#2-tech-stack)
3. [Dependencies](#3-dependencies)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Architecture & Import Layers](#5-architecture--import-layers)
6. [Design System](#6-design-system)
   - [Color Tokens](#61-color-tokens-light--dark)
   - [Typography & Fonts](#62-typography--fonts)
   - [Logo & Iconography](#63-logo--iconography)
   - [Layout, Spacing & Responsiveness](#64-layout-spacing--responsiveness)
7. [Theme Context & Provider Tree](#7-theme-context--provider-tree)
8. [Routing (Expo Router)](#8-routing-expo-router)
9. [Stack Screens & Launch Logic](#9-stack-screens--launch-logic)
10. [Screens & Subpages Catalog](#10-screens--subpages-catalog)
11. [Reusable Components](#11-reusable-components)
12. [Hooks](#12-hooks)
13. [Constants](#13-constants)
14. [Types](#14-types)
15. [Library / Pure Logic (`lib/`)](#15-library--pure-logic-lib)
16. [Content Pipeline & Data Layer](#16-content-pipeline--data-layer)
17. [Core Feature Logic](#17-core-feature-logic)
18. [Persistence (AsyncStorage)](#18-persistence-asyncstorage)
19. [Diagnostics & Crash Harness (temporary)](#19-diagnostics--crash-harness-temporary)
20. [Commands & Developer Workflow](#20-commands--developer-workflow)
21. [Build & Release (EAS)](#21-build--release-eas)
22. [Testing](#22-testing)
23. [Known Limitations & Stubs](#23-known-limitations--stubs)

---

## 1. What Studyo Is

Studyo is a self-contained, **offline-first** mobile course app. All lesson content ships inside the binary as Markdown; nothing is fetched at runtime. The learner:

- Onboards (welcome → interests → daily goal), which personalizes the experience and sets a study-minutes-per-day target.
- Studies courses lesson-by-lesson. Lessons are gated: the next one unlocks **60 minutes** after the previous is completed (time-paced sequential learning).
- Takes a short multiple-choice **quiz per lesson**, sees a scored results screen with per-question review.
- Tracks **progress** (overall %, per-course %), a **daily goal** ring, a **daily streak**, quiz averages, and unlockable **achievements**.
- Can toggle bilingual courses between **Tagalog (`tl`)** and **Bikol/Sorsoganon (`bcl`)**.
- Personalizes a profile (name, tagline, avatar), switches **theme** (light/dark/system), and manages notification preferences.

### Content domain

Two real courses ship, authored from the KWF (Komisyon sa Wikang Filipino) references:

| Course ID | Title | Lang | Lessons | Source |
|---|---|---|---|---|
| `ortograpiyang-pambansa` | Ortograpiyang Pambansa | Tagalog only | 15 | KWF 2013 |
| `ortograpiyang-sorsoganon` | Ortograpiyang Sorsoganon | Tagalog + Bikol | 10 (×2 variants) | Bicol University / KWF 2024 |

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| **Runtime** | Expo SDK **57** (`~57.0.26`), React Native **0.86.3**, React **19.2.3** |
| **Architecture** | New Architecture (Fabric + TurboModules), Hermes engine |
| **Language** | TypeScript `~6.0.3` (strict mode), `.tsx`/`.ts` |
| **Navigation** | Expo Router `~57.0.24` (file-based, typed routes) |
| **Animation** | React Native Reanimated `4.5.1` + `react-native-worklets` `0.10.1` |
| **Gestures** | react-native-gesture-handler `~2.32.0` |
| **SVG** | react-native-svg `15.15.4` (logo, progress rings, splash frames) |
| **Markdown** | react-native-markdown-display `^7.0.2` (lesson body rendering) |
| **Storage** | @react-native-async-storage/async-storage `2.2.0` |
| **Icons** | @expo/vector-icons `^15.0.2` (Material Icons) |
| **Safe area** | react-native-safe-area-context `~5.7.0` |
| **Screens** | react-native-screens `~4.26.0` |
| **Styling** | **`StyleSheet.create()` only** — no NativeWind/Tailwind at runtime; colors via a JS token table |
| **Web** | react-native-web `~0.21.0`, Metro static export |
| **Testing** | Jest `^29` + `jest-expo` `~57`, @testing-library/react-native `^14` |
| **Lint** | ESLint `^9` (flat config) + `eslint-config-expo` |
| **Build/Deploy** | EAS Build & Submit (Android APK/AAB), EAS Update (OTA) |

> **Note on styling:** despite an early plan to use NativeWind, the shipped app uses plain `StyleSheet.create()` for all components, with colors drawn from a central JS token table (`constants/Colors.ts`) resolved by `useThemeColor()`. There is **no `babel.config.js`** and no Tailwind runtime.

---

## 3. Dependencies

### Runtime (`dependencies`)

```jsonc
"@expo/vector-icons": "^15.0.2",                       // Material Icons
"@react-native-async-storage/async-storage": "2.2.0",  // persistence
"expo": "~57.0.26",
"expo-constants": "~57.0.19",
"expo-font": "~57.0.4",                                // custom font loading
"expo-image-picker": "~57.0.20",                       // profile avatar
"expo-linking": "~57.0.11",
"expo-router": "~57.0.24",                             // file-based routing
"expo-splash-screen": "~57.0.9",                       // native splash control
"expo-status-bar": "~57.0.1",
"expo-web-browser": "~57.0.3",
"react": "19.2.3",
"react-dom": "19.2.3",
"react-native": "0.86.3",
"react-native-exit-app": "^2.0.0",                     // Log Out cold-restart (Android)
"react-native-gesture-handler": "~2.32.0",
"react-native-markdown-display": "^7.0.2",             // lesson markdown
"react-native-reanimated": "4.5.1",                    // animations
"react-native-safe-area-context": "~5.7.0",
"react-native-screens": "~4.26.0",
"react-native-svg": "15.15.4",                         // logo, rings, splash
"react-native-web": "~0.21.0",
"react-native-worklets": "0.10.1"                      // Reanimated worklets
```

### Dev (`devDependencies`)

```jsonc
"@testing-library/react-native": "^14.0.1",
"@types/jest": "^29.5.14",
"@types/react": "~19.2.2",
"eslint": "^9.0.0",
"eslint-config-expo": "~57.0.2",
"jest": "^29.0.0",
"jest-expo": "~57.0.0",
"typescript": "~6.0.3"
```

> Always install SDK-aligned versions with `npx expo install <pkg>` — never `npm add`. `react-native-exit-app` is intentionally excluded from `expo-doctor`'s directory check (`package.json → expo.doctor`).

---

## 4. Project Folder Structure

```
studyo-mobile/                       ← repo root (reference material: prototypes, PDFs, planning docs)
└── studyo-app/                       ← Expo app root (build target — run all commands here)
    ├── app/                          ← Expo Router file-based routes (every file = a screen)
    │   ├── _layout.tsx               ← Root stack; providers; native-splash handoff; initialRoute = splash
    │   ├── +html.tsx                 ← Web-only static HTML shell
    │   ├── +not-found.tsx            ← 404 route
    │   ├── modal.tsx                 ← Example modal-presentation route
    │   ├── splash.tsx                ← Animated splash → resolves launch destination
    │   ├── about.tsx                 ← About Studyo
    │   ├── achievements.tsx          ← Full achievements grid (filterable)
    │   ├── notifications.tsx         ← Notification center (SectionList, filters)
    │   ├── onboarding/
    │   │   ├── _layout.tsx           ← Headerless stack
    │   │   ├── welcome.tsx           ← Step 1/3: hero + Get Started / Skip
    │   │   ├── interests.tsx         ← Step 2/3: pick ≥3 topics
    │   │   └── goal.tsx              ← Step 3/3: casual/regular/intensive
    │   ├── (tabs)/                   ← Bottom-tab group (custom TabBar)
    │   │   ├── _layout.tsx           ← Tabs navigator wiring
    │   │   ├── index.tsx             ← Home (greeting, streak, daily goal, continue/recommended)
    │   │   ├── courses.tsx           ← Catalog (search + category filter + grid/list)
    │   │   ├── progress.tsx          ← Progress (overall ring, streak, quiz avg, breakdown, achievements)
    │   │   └── profile.tsx           ← Profile (avatar/name edit, settings rows, Log Out)
    │   ├── course/[id].tsx           ← Course detail (overview/curriculum tabs, language toggle, gating)
    │   ├── lesson/[id].tsx           ← Stepped lesson reader (sectioned markdown) + timed lock notice
    │   ├── quiz/
    │   │   ├── [courseId].tsx        ← Quiz runner (one question at a time, explanations)
    │   │   └── results.tsx           ← Scored results + per-question review + CTAs
    │   └── settings/
    │       ├── _layout.tsx           ← Headerless stack
    │       ├── theme.tsx             ← Light/Dark/System picker
    │       └── notifications.tsx     ← Push/email/quiet-hours toggles
    ├── src/
    │   ├── components/
    │   │   ├── primitives.tsx        ← Layer-1: Icon, Screen, Card, Button, ProgressBar, ProgressRing,
    │   │   │                            Badge, Avatar, Skeleton, Toggle, PageIndicator, useThemeColor, Themed
    │   │   ├── composites.tsx        ← Layer-2: CategoryChips, SectionHeader, EmptyState, CourseCard,
    │   │   │                            LessonListItem, StreakCard, LessonBody, StatCard, AchievementBadge,
    │   │   │                            QuizOption, NotificationItem, SettingsRow
    │   │   ├── tab-bar.tsx           ← Layer-3: animated custom bottom TabBar
    │   │   ├── StudyoLogo.tsx        ← Brand logo (inline SVG paths)
    │   │   ├── notification-bell.tsx ← Header bell with unread badge
    │   │   └── CrashOverlay.tsx      ← TEMP release-crash diagnostics overlay
    │   ├── repositories/
    │   │   └── content-registry.ts   ← hydrateCourse / validateRegistry / buildRegistry / groupQuizByLesson
    │   └── data/
    │       ├── courses.ts            ← App content entry point (imports .md + json → buildRegistry)
    │       ├── categories.ts         ← Interest topics derived from lessons
    │       ├── achievements.ts       ← computeAchievements (pure, derived)
    │       └── notifications.ts      ← SEED_NOTIFICATIONS
    ├── hooks/
    │   ├── useTheme.tsx              ← ThemeProvider + useTheme (light/dark/system)
    │   ├── useProgressStore.tsx      ← ProgressProvider + derivations (completions, gating, streak, goal)
    │   ├── useContentLang.tsx        ← ContentLangProvider + courseText/lessonText/courseOutcomes
    │   ├── useProfile.tsx            ← ProfileProvider + initials/firstName
    │   ├── useNotifications.tsx      ← NotificationsProvider + read state + prefs
    │   ├── useResponsive.ts          ← Breakpoints, paddings, columns, font sizes
    │   ├── useStorage.ts             ← Typed AsyncStorage wrapper (getItem/setItem/removeItem)
    │   ├── useProgressStore.test.tsx ← Unit tests (derivations)
    │   └── useTheme.test.tsx         ← Unit tests
    ├── lib/
    │   ├── frontmatter.ts            ← Minimal YAML frontmatter parser
    │   ├── quiz-scoring.ts           ← gradeQuiz / recordBestScore / averageScore
    │   ├── onboarding.ts             ← canContinueInterests / GOAL_MINUTES / goalToMinutes
    │   ├── onboarding-state.ts       ← read/resolve/reset launch destination
    │   ├── lesson-sections.ts        ← Split markdown into stepped sections
    │   ├── search.ts                 ← Course/lesson search (AND-matched)
    │   ├── splash-gate.ts            ← Native↔animated splash handoff gate
    │   ├── diagnostics.ts            ← TEMP launch flight recorder
    │   ├── crash-capture.ts          ← TEMP fatal JS error persistence
    │   ├── close-app.ts              ← Android process kill for Log Out (safe TurboModule lookup)
    │   ├── cn.ts                     ← classname combiner (unused-runtime helper)
    │   └── *.test.ts                 ← Unit tests
    ├── constants/
    │   ├── Colors.ts                 ← Canonical color tokens (light + dark)
    │   ├── Typography.ts             ← Font roles + typographic scale
    │   └── storage-keys.ts           ← AsyncStorage key registry
    ├── types/
    │   ├── course.ts  quiz.ts  user.ts  achievement.ts  notification.ts  css.d.ts
    ├── content/                       ← Bundled lesson content (Markdown + JSON)
    │   ├── topics.json                ← Course-topic manifest
    │   ├── ortograpiyang-pambansa/{course.json, quiz.json, lessons/*.md}
    │   └── ortograpiyang-sorsoganon/{course.json, quiz.json, lessons/*.md, lessons-bcl/*.md}
    ├── assets/
    │   ├── fonts/                     ← Inter (400/600), Space Mono (400/700)
    │   ├── images/                    ← app icon, adaptive icon, splash, favicon, logo
    │   └── onboarding/                ← 94-frame SVG splash animation + components
    │       ├── components/SplashLogoAnimation.tsx
    │       ├── components/OnboardingAnimation.tsx
    │       ├── frames/unique_frame_*.svg (94 frames)
    │       └── frame-paths.ts, hooks/useOnboardingAnimation.ts
    ├── entry.js                       ← App entry: arms crash diagnostics, then expo-router/entry
    ├── metro.config.js                ← Registers .md source ext + md transformer
    ├── metro.md-transformer.js        ← .md → JS string module
    ├── jest.setup.js                  ← AsyncStorage jest mock
    ├── app.json                       ← Expo config (icons, plugins, typed routes)
    ├── eas.json                       ← EAS build profiles
    ├── tsconfig.json                  ← extends expo/tsconfig.base, strict, @/* paths
    └── eslint.config.js               ← ESLint flat config
```

---

## 5. Architecture & Import Layers

### Import direction (no upward imports, no cycles)

```
app/ (screens)
  → src/components (primitives → composites → tab-bar)
    → hooks (contexts + derivations)
      → src/repositories / src/data (content)
        → foundation (lib/ + constants/ + types/)
```

**Rules enforced by convention:**

- **Screens receive data as props / via route params.** No screen imports `content/` directly; data flows through `src/data/courses.ts` (built once at import) + `useProgressStore`.
- **No hardcoded hex in components** — always `useThemeColor('token')` for `className`-free styling, or `Colors.ts` for programmatic (SVG strokes, ActivityIndicator).
- **Pure logic lives in `lib/`** and is unit-tested in isolation (no storage/UI/threading).
- **Contexts are the app's state layer.** Five providers wrap the tree (see §7).

### Data flow at a glance

```
content/*.md + *.json
      │  (import as JS string modules via metro.md-transformer)
      ▼
lib/frontmatter.parseFrontmatter          → { meta, body }
      ▼
src/repositories/content-registry
  hydrateCourse / groupQuizByLesson / buildRegistry
      ▼
src/data/courses.ts   → export { courses, quizzes, lessonQuizzes }
      ▼
screens  ← useProgressStore (completions/gating/streak/goal)
         ← useContentLang (tl/bcl variant resolution)
```

---

## 6. Design System

Single source of truth: `constants/Colors.ts` (values) + `constants/Typography.ts` (roles). **One accent color** across the whole app: purple `#7C3AED` (light) / lavender `#A78BFA` (dark).

### 6.1 Color Tokens (light & dark)

Every token is defined for both schemes; `useThemeColor(token)` returns the active value. Navigation aliases keep `@react-navigation` themed without per-component toggles.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `background` | `#FAFAFA` | `#0E0E12` | Screen background |
| `surface` | `#FFFFFF` | `#1A1A20` | Cards, sheets, inputs |
| `accent` | `#7C3AED` | `#A78BFA` | Single brand accent |
| `text` | `#1A1A1A` | `#F5F5F5` | Primary text |
| `textMuted` | `#6B7280` | `#9CA3AF` | Secondary text |
| `border` | `#E5E7EB` | `#2A2A33` | Dividers, outlines, tracks |
| `tabDefault` | `#9CA3AF` | `#6B7280` | Inactive tab |
| `tabSelected` | `#7C3AED` | `#A78BFA` | Active tab |
| `success` | `#16A34A` | `#22C55E` | Correct answers, "Read" |
| `star` | `#F59E0B` | `#F59E0B` | Streak flame, warnings |
| `danger` | `#DC2626` | `#EF4444` | Log Out, errors |
| `onAccent` | `#FFFFFF` | `#1E1B4B` | Text/icon on accent surface |
| `primaryFixed` | `#eaddff` | `#2d2455` | MD3 lavender pill behind active tab icon |
| `tint` / `tabIconDefault` / `tabIconSelected` | — | — | @react-navigation aliases |

Theme switch is a **single `.dark`-equivalent flip**: `useTheme().isDark` re-selects the token table; `app/_layout.tsx` also swaps the `@react-navigation` theme and the `StatusBar` style.

### 6.2 Typography & Fonts

Two families, loaded in `app/_layout.tsx` via `expo-font` from vendored TTFs in `assets/fonts/`:

| Family | Weights | Role |
|---|---|---|
| **Space Mono** | 400, **700** | Display / titles / stat values (`SpaceMono_700Bold`) |
| **Inter** | 400, 600 | Body (`Inter_400Regular`), medium/semibold labels (`Inter_600SemiBold`) |

Font roles (`constants/Typography.ts → fonts`): `display`/`title` = `SpaceMono_700Bold`, `body` = `Inter_400Regular`, `medium`/`semibold` = `Inter_600SemiBold`.

Typographic scale (`typography`): `display 28/34`, `title 22/28`, `subtitle 18/24`, `body 16/24`, `caption 14/20`, `overline 12/16` (uppercase, letter-spaced). Screens additionally scale headings/body responsively via `useResponsive()`.

> The root layout loads 5 font entries (Inter Regular/SemiBold, Space Mono Regular/Bold, plus a `SpaceMono` alias) and renders `null` until fonts load (or error), then marks the `fonts` diagnostic step.

### 6.3 Logo & Iconography

- **Logo:** `src/components/StudyoLogo.tsx` — an inline `react-native-svg` component (`viewBox 0 0 473 528`, ~30 `<Path>` layers) recolored by the `color` prop (defaults to accent). Used on the splash, onboarding welcome, About, and headers (via `Screen showLogo`). Raster copies live in `assets/images/` (`icon.png`, adaptive icons, `splash-icon.png`, `favicon.png`, `studyo-logo.png`).
- **Splash animation:** `assets/onboarding/components/SplashLogoAnimation.tsx` — a **94-frame SVG animation** stepped on the JS thread by a timer and rendered through React state (deliberately **not** Reanimated `useAnimatedProps`, which fails to repaint per-frame on Fabric — see react-native-svg#2962). Frames live in `assets/onboarding/frames/`.
- **Icons:** Material Icons via `@expo/vector-icons/MaterialIcons`, wrapped by the `Icon` primitive. Icon names are typed as `MaterialIconName` (`types/course.ts`).

### 6.4 Layout, Spacing & Responsiveness

`hooks/useResponsive.ts` centralizes all layout decisions from `useWindowDimensions()`:

| Breakpoint | Width (dp) | Devices |
|---|---|---|
| `xs` | `< 375` | small phones (SE) |
| `sm` | `375–429` | normal phones |
| `md` | `430–767` | large phones (Pro Max) |
| `lg` | `≥ 768` | tablets / split windows |

Derived values: `hPad` (14–32), `gap` (16–20), `cardPad` (16–20), `contentMaxWidth` (caps at 720 on tablets so text doesn't stretch wall-to-wall), `headingSize` (20–28), `bodySize` (13–15), and `cols(minItemWidth)` for grids. Flags: `isTablet`, `isLargePhone`, `isSmall`, `isLandscape`.

**Invariants:** touch targets ≥ 44px (`minHeight/minWidth: 44`), lesson rows ≥ 48px, safe-area insets respected on sticky footers/tab bar via `useSafeAreaInsets()`.

---

## 7. Theme Context & Provider Tree

Five React contexts compose the app's state. The provider tree (from `app/_layout.tsx`):

```
SafeAreaProvider
└─ StudyoThemeProvider (useTheme)                 ← light/dark/system, persisted
   └─ RootLayoutNav
      └─ @react-navigation ThemeProvider (nav colors follow isDark)
         └─ ProgressProvider (useProgressStore)   ← completions, gating, streak, goal, quizzes
            └─ ContentLangProvider (useContentLang)← tl/bcl toggle, persisted
               └─ ProfileProvider (useProfile)     ← name/tagline/avatar, persisted
                  └─ NotificationsProvider         ← read state + push/email/quiet prefs
                     └─ <Stack> (screens) + <CrashOverlay/>
```

### Theme resolution

`useTheme()` exposes `{ pref, isDark, setPref }`:

- `pref` ∈ `'light' | 'dark' | 'system'`, persisted to `studyo.theme`.
- Effective `isDark = pref === 'system' ? deviceScheme === 'dark' : pref === 'dark'`.
- Hydration starts synchronously from the device scheme (no flash), then reconciles the stored pref once AsyncStorage resolves.
- `setPref` writes storage (fire-and-forget) and flips state → the entire tree re-themes because every component reads tokens via `useThemeColor()`.

All context providers follow the **same pattern**: start from a default, reconcile the persisted value in a mount effect, and write-through on every change (persistence never blocks the UI).

---

## 8. Routing (Expo Router)

File-based routing via **Expo Router** with **typed routes** enabled (`app.json → experiments.typedRoutes`). `entry.js` is the `main`, which arms diagnostics then delegates to `expo-router/entry`.

### Route tree & navigators

- **Root stack** (`app/_layout.tsx`), `initialRouteName = "splash"`, `headerShown: false`. There is intentionally **no `app/index.tsx`** (it would collide with `(tabs)/index.tsx`).
- **Tabs group** `(tabs)/_layout.tsx` — a `<Tabs>` navigator rendered with a **custom `TabBar`** (Home, Courses, Progress, Profile).
- **Nested stacks**: `onboarding/`, `settings/` (each a headerless `<Stack>`).

### Route parameters

| Route | Params |
|---|---|
| `/course/[id]` | `{ id: string }` (course id) |
| `/lesson/[id]` | `{ id: "courseId:order" }` |
| `/quiz/[courseId]` | `{ courseId: string, lessonId: string }` |
| `/quiz/results` | `{ courseId, lessonId, score, total, timeMs, answers (JSON) }` |
| `/(tabs)/courses` | `{ category?: string }` (optional deep filter) |

### Key navigation flows

```
Cold start → splash → (onboarded? /(tabs) : /onboarding/welcome)
onboarding: welcome → interests → goal → /(tabs)   (Skip → /(tabs))
Home/Courses → /course/[id] → /lesson/[id]
course quiz → /quiz/[courseId] → /quiz/results
results: "Back to Course" / header back → dismissTo /course/[id]  (no duplicate stack entry)
results: "Retake Quiz" → replace /quiz/[courseId]
Profile → settings/* , about, achievements, notifications
Log Out → reset onboarding keys → closeApp() (cold restart)
```

> **Navigation correctness note:** `quiz/results` uses `router.dismissTo({ pathname: '/course/[id]' })` (React Navigation `POP_TO`) rather than `router.replace`, so returning to the course pops back to the **existing** course screen instead of stacking a duplicate (which previously caused a "back returns to the same page" visual bug).

---

## 9. Stack Screens & Launch Logic

The launch sequence is deliberately choreographed so the animated splash is always seen, even in release builds where the JS bundle is already resident.

### Native ↔ animated splash handoff (`lib/splash-gate.ts`)

The native splash (from `expo-splash-screen`) must not be torn down until the **animated** `/splash` route has actually painted:

1. `app/_layout.tsx` calls `SplashScreen.preventAutoHideAsync()`.
2. On the root `View`'s `onLayout`, it awaits `whenSplashPainted()` (bounded by a **2000ms** timeout) before `SplashScreen.hideAsync()`.
3. `/splash` calls `signalSplashPainted()` on mount → opens the gate.

### Splash timing (`app/splash.tsx`)

- `MIN_VISIBLE_MS = 1200` — floor so the animation is seen even when onboarding reads resolve instantly (the release-APK failure mode).
- `SETTLE_MS = 500` — beat after the last frame before navigating.
- `SAFETY_MS = 4500` — ceiling: navigate no matter what.
- Destination resolved from `readOnboardingState()` → `resolveLaunchDestination()`. Respects `useReducedMotion()`.

### Onboarding gate (`lib/onboarding-state.ts`)

A single owner decides "has this user onboarded?" over three keys (`onboarded`, `interests`, `goal`). `resolveLaunchDestination` routes to `/(tabs)` if `onboarded === true` **or** both `interests` and `goal` are present; else `/onboarding/welcome`. `resetOnboarding()` clears exactly those keys (used by Log Out) so the two decisions can't disagree.

### Provider render + diagnostics marks

`app/_layout.tsx` records launch breadcrumbs (`layout-render`, `fonts`, `stack`, `providers`, `launch-complete`, `splash-handoff`, …) via `lib/diagnostics.ts` so a mid-boot crash leaves a trail (see §19).

---

## 10. Screens & Subpages Catalog

### Tabs

| Screen | File | What it does |
|---|---|---|
| **Home** | `(tabs)/index.tsx` | Greeting (`firstName`), **Daily Streak** + **Daily Goal** bento cards, Continue-Learning card, Recommended courses (horizontal on phones, grid on tablets). |
| **Courses** | `(tabs)/courses.tsx` | Search box (`searchCourses`), category chips, grid/list toggle by breakpoint, per-lesson "matching lessons" hints while searching. |
| **Progress** | `(tabs)/progress.tsx` | Overall progress ring, **Day Streak** / **Quiz Avg** / **Lessons Done** mini-cards, Quiz Performance, per-course breakdown, achievements strip. |
| **Profile** | `(tabs)/profile.tsx` | Avatar (image-picker, base64), inline name/tagline edit, stats, settings rows (Account, Notifications, Theme, About), **Log Out**. |

### Stack / detail screens

| Screen | File | What it does |
|---|---|---|
| **Splash** | `splash.tsx` | 94-frame logo animation → launch destination. |
| **Onboarding 1–3** | `onboarding/{welcome,interests,goal}.tsx` | Hero + Skip; interest chips (≥3); daily-goal radio (casual/regular/intensive). |
| **Course detail** | `course/[id].tsx` | Overview/Curriculum tabs, bilingual toggle, "What you'll learn" (pinned to Tagalog), gated lesson list with "Available in N min", per-lesson quizzes, CTA (`Start`/`Continue`/`Review course`/`Available in N min`). |
| **Lesson reader** | `lesson/[id].tsx` | Stepped sections (`splitLessonSections`), progress bar, "Read" state, timed lock notice for the next lesson, sticky nav + Mark Complete. |
| **Quiz runner** | `quiz/[courseId].tsx` | One question at a time, segmented progress, immediate correct/incorrect + explanation, hardware-back "Leave quiz?" guard. |
| **Quiz results** | `quiz/results.tsx` | Score ring **with centered %**, grade label, Correct/Time stats, per-question review, Retake / Back-to-Course. |
| **Achievements** | `achievements.tsx` | Full grid, All/Earned/Locked filters, earned %. |
| **Notifications** | `notifications.tsx` | SectionList with All/Unread/Course/System filters, mark-read. |
| **About** | `about.tsx` | Feature list, version, brand. |
| **Settings › Theme** | `settings/theme.tsx` | Light/Dark/System radio. |
| **Settings › Notifications** | `settings/notifications.tsx` | Animated toggles: push/email/quiet-hours. |
| **Modal / Not-found / +html** | `modal.tsx`, `+not-found.tsx`, `+html.tsx` | Example modal, 404, web HTML shell. |

---

## 11. Reusable Components

### Layer 1 — Primitives (`src/components/primitives.tsx`)

| Export | Purpose |
|---|---|
| `useThemeColor(token)` | Resolve a `Colors` token for the active scheme. |
| `Icon` | Material icon wrapper (typed name, size, color). |
| `Screen` | Page scaffold: safe-area, optional logo/title/back/right-slot, scroll, content max-width. |
| `Card` | Surface container (optional `onPress`, `variant`). |
| `Button` | `primary`/`secondary`/`danger` variants, sizes, loading state, label or children. |
| `ProgressBar` | Animated horizontal fill (Reanimated). |
| `ProgressRing` | SVG ring with **optional centered `label`** (e.g. `"80%"`). |
| `Badge` | `default`/`success`/`warning`/`error` pill. |
| `Avatar` | Initials avatar. |
| `Skeleton` | Shimmer placeholder. |
| `Toggle` | Themed switch. |
| `PageIndicator` | Onboarding page dots. |
| `Themed` | Themed style helpers. |

### Layer 2 — Composites (`src/components/composites.tsx`)

`CategoryChips`, `SectionHeader`, `EmptyState`, `CourseCard` (list/compact variants), `LessonListItem` (status-aware, gated), `StreakCard`, `LessonBody` (markdown → RN via `react-native-markdown-display`), `StatCard`, `AchievementBadge` (primary/locked), `QuizOption` (A–D, correct/incorrect states), `NotificationItem`, `SettingsRow` (icon, label, value, chevron, locked).

### Layer 3 & utilities

- **`tab-bar.tsx`** — custom bottom tab bar with a Reanimated lavender **pill** behind the active icon (color + scale interpolation), safe-area aware, 44px targets.
- **`StudyoLogo.tsx`** — brand SVG.
- **`notification-bell.tsx`** — header bell + unread badge (reads `useNotifications`).
- **`CrashOverlay.tsx`** — TEMP diagnostics overlay (see §19).

---

## 12. Hooks

| Hook | Kind | Responsibility |
|---|---|---|
| `useTheme` | Context | `pref/isDark/setPref`; persists `studyo.theme`; drives the whole theme. |
| `useProgressStore` | Context | Source of truth for completions, lesson gating, course/overall progress, **streak**, **daily-goal minutes**, best quiz scores. Exposes pure derivations (below). Persists `completions`, `completionTimes`, `quiz.attempts`. |
| `useContentLang` | Context | `lang/setLang` (`tl`/`bcl`), persists `studyo.contentLang`; plus `courseText`/`lessonText`/`courseOutcomes` resolvers. |
| `useProfile` | Context | `name/tagline/avatarUri` + `setProfile`; persists `studyo.profile`; `initials()`/`firstName()`. |
| `useNotifications` | Context | Seeded notifications + persisted read state + push/email/quiet-hours prefs. |
| `useResponsive` | Pure | Breakpoints, paddings, font sizes, columns from window dims. |
| `useStorage` | Util | `getItem<T>/setItem<T>/removeItem` typed JSON wrapper over AsyncStorage (errors degrade to `null`). |

### `useProgressStore` exported derivations (pure, unit-tested)

- `deriveLessonStatuses(lessons, completions, completionTimes, now)` → `completed`/`current`/`locked` with the **60-min timed gate**.
- `nextUnlockAt(...)` → epoch ms when a gated lesson unlocks (`prevTime + 60min`), powers "Available in N min".
- `courseProgress(courseId, lessonCount, completions)` → completed/total.
- `computeStreak(dayKeys)` → trailing consecutive days.
- `currentStreak(completionTimes, now)` → **live** streak ending today/yesterday (grace), else 0.
- `studiedMinutesOn(completionTimes, durationByLessonId, now)` → today's studied minutes (sum of durations of lessons completed today; resets at local midnight).
- `localDayKey(ts)` → `YYYY-MM-DD` local key.
- `LESSON_UNLOCK_DELAY_MS = 60 * 60 * 1000`.

---

## 13. Constants

| File | Exports |
|---|---|
| `constants/Colors.ts` | `ThemeColors` interface + `{ light, dark }` token tables (single accent, MD3 `primaryFixed`, nav aliases). Default export consumed by `useThemeColor`. |
| `constants/Typography.ts` | `fonts` (role → family) + `typography` (role → size/line-height/weight/spacing). |
| `constants/storage-keys.ts` | `STORAGE_KEYS` registry + `StorageKey` type (see §18). |

---

## 14. Types

| File | Types |
|---|---|
| `types/course.ts` | `Course`, `Lesson`, `LessonStatus` (`completed`/`current`/`locked`, derived), `ContentLang` (`tl`/`bcl`), `CourseI18n`, `LessonI18n`, `CourseCategory` (`Wika`/`Language`), `Difficulty`, `MaterialIconName`. Lesson id = `` `${courseId}:${order}` ``. |
| `types/quiz.ts` | `Option` (A–D), `Question` (`text/options/correctIndex/explanation/lessonId?`), `Quiz`, `LessonQuiz`, `QuizResult`. |
| `types/user.ts` | `ThemePref`, `Goal` (`casual`/`regular`/`intensive` = 15/30/60 min), `UserPrefs`. |
| `types/achievement.ts` | `Achievement` (derived `progress`/`earned`/`earnedDate`, never stored). |
| `types/notification.ts` | `AppNotification`, `NotificationType` (`course`/`achievement`/`system`). |
| `types/css.d.ts` | Ambient CSS module typing. |

---

## 15. Library / Pure Logic (`lib/`)

All pure, deterministic, unit-tested where noted:

| Module | Responsibility |
|---|---|
| `frontmatter.ts` | `parseFrontmatter(md)` → `{ meta, body }`. Minimal YAML head (`key: value`, quotes, `---` delimiters); malformed → `{ meta:{}, body:md }`. **Tested.** |
| `quiz-scoring.ts` | `gradeQuiz(answers, questions)` → `{score,total,percent}` (rounded, clamped); `recordBestScore`; `averageScore`. **Tested.** |
| `onboarding.ts` | `canContinueInterests` (≥3 unique); `GOAL_MINUTES {casual:15,regular:30,intensive:60}`; `goalToMinutes` (default casual). **Tested.** |
| `onboarding-state.ts` | `readOnboardingState`, `resolveLaunchDestination`, `resetOnboarding`, `ONBOARDING_KEYS`. |
| `lesson-sections.ts` | `splitLessonSections(md)` → sections split at `## ` (fence-aware). **Tested.** |
| `search.ts` | `searchCourses(courses, query)` — AND-matched over course + lesson text (incl. Bikol + body); returns matched-lesson hints. **Tested.** |
| `splash-gate.ts` | Native↔animated splash handoff (`signalSplashPainted`/`whenSplashPainted`, 2s bound). |
| `diagnostics.ts` | TEMP launch flight recorder (`startSession`, `mark`, `STEPS`, `readTrail`, `selfTest`). **Tested.** |
| `crash-capture.ts` | TEMP fatal-JS-error persistence (`installCrashHandler`, `captureError`, `readLastCrash`). |
| `close-app.ts` | Log Out cold restart. Uses `TurboModuleRegistry.get('RNExitApp')` (safe, returns null in Expo Go — never the throwing `getEnforcing`). Android = real process kill; iOS = alert (App Store rule); web = reload. |
| `cn.ts` | classname combiner (kept for parity; runtime uses StyleSheet). |

---

## 16. Content Pipeline & Data Layer

### Bundling `.md` as string modules

`metro.config.js` adds `md` to `resolver.sourceExts` and registers `metro.md-transformer.js` as the `babelTransformerPath`. The transformer turns any `.md`/`.mdx` file into `module.exports = "<raw text>"`, so `import lesson from './01.md'` yields the raw markdown string. Everything else delegates to Expo's default transformer.

### Registry (`src/repositories/content-registry.ts`)

Pure, offline, deterministic:

- `hydrateCourse(seed)` → app `Course` (lesson ids become `` `${courseId}:${order}` ``, Bikol `body`→`content`, `status:'locked'`, `progress:0`).
- `validateRegistry({seeds, availableLessonFiles?})` → integrity `RegistryIssue[]` (duplicate ids, empty titles/bodies, bad orders, quiz option/`correctIndex` ranges, orphan `.md`, topic-manifest match).
- `groupQuizByLesson(seed)` → `LessonQuiz[]` (splits a course quiz into per-lesson quizzes via `resolveLessonId`, which accepts canonical id, bare order, or file stem).
- `buildRegistry({seeds})` → `{ courses, quizzes, lessonQuizzes }`.

### App entry point (`src/data/courses.ts`)

Imports each `course.json`, `quiz.json`, and every lesson `.md` (Tagalog + Bikol variants), parses frontmatter (`title/order/minutes/description`), zips Bikol variants by index (`parseBilingualLessons`), assembles two `CourseSeed`s, and runs `buildRegistry`. Exports:

```ts
export const courses: Course[];
export const quizzes: Quiz[];
export const lessonQuizzes: LessonQuiz[]; // one per lesson that has questions
```

### Content authoring format

- `content/<course>/course.json` — `id/title/description/category/instructor/duration/rating/difficulty/icon/outcomes[]` (+ `bicolOutcomes[]` for bilingual).
- `content/<course>/quiz.json` — `{ questions: [{ text, options, correctIndex, explanation, lessonId }] }`.
- `content/<course>/lessons/*.md` — YAML frontmatter (`title`, `order`, `minutes`, `description`) + markdown body. `lessons-bcl/*.md` holds the parallel Bikol variant.
- `content/topics.json` — course-topic manifest (validated against course ids).

### Interest topics (`src/data/categories.ts`)

`buildInterestTopics(courses)` derives one selectable onboarding topic **per lesson** (id = lesson id, label = shortened title, icon inherited from course) — so onboarding always reflects the real curriculum.

---

## 17. Core Feature Logic

### Lesson gating (time-paced sequential)

`deriveLessonStatuses` classifies each lesson:

- `completed` — id in `completions`.
- `current` — first uncompleted lesson **iff** its predecessor was completed ≥ `LESSON_UNLOCK_DELAY_MS` (60 min) ago (or it's the first lesson, or predecessor has no timestamp → legacy never gates).
- `locked` — everything else.

`nextUnlockAt` powers the "Available in N min" hints. The label helper clamps remaining time to the 60-min delay so it reads **"60 min"** not "61 min" (guards against stale cached `now` + `Math.ceil` overshoot).

### Quiz scoring

`quiz/[courseId].tsx` runs one question at a time, accumulates `answers`, then on the last question computes score/percent, calls `recordQuizResult(lessonId, percent)` (best-score retention), and `router.replace('/quiz/results', …)`. Results renders a `ProgressRing` **with a centered `%` label** plus a per-question review.

### Daily goal

Home computes `studiedMinutes = studiedMinutesOn(completionTimes, durationByLessonId)` — the summed `minutes` of lessons **completed today** (local day), resetting at local midnight. Displayed numerator is capped at the goal (`Math.min(studied, goal)`), so it reads `15/15` not `16/15`; the bar (`goalPct`) is clamped to 100%. Goal target = `goalToMinutes(goal)` (15/30/60).

### Daily streak

`currentStreak(completionTimes, now)` = consecutive local study-days ending **today or yesterday** (one-day grace); older → `0`. Shown on Home ("Daily Streak") and Progress ("Day Streak").

### Achievements (derived, never stored)

`computeAchievements(completions, quizAttempts, courses)` yields six badges with `progress`/`earned`: First Step (1 lesson), Getting Started (5), Committed (10), Quiz Ace (≥90%), Course Champion (finish a course), Perfect Score (100%).

### Search

`searchCourses` AND-matches every whitespace term across course title/category/instructor and each lesson's title/description/body (+ Bikol variant); `matchedLessons` surfaces *why* a course matched.

---

## 18. Persistence (AsyncStorage)

All keys namespaced `studyo.*` (`constants/storage-keys.ts`). Every read degrades gracefully to a default; no versioned migration in v1.

| Key | Written by | Holds |
|---|---|---|
| `studyo.theme` | useTheme | `'light'\|'dark'\|'system'` |
| `studyo.onboarded` | onboarding | `true` |
| `studyo.interests` | onboarding | `string[]` of topic ids |
| `studyo.goal` | onboarding | `Goal` |
| `studyo.completions` | useProgressStore | `string[]` lesson ids |
| `studyo.completionTimes` | useProgressStore | `Record<lessonId, epochMs>` (gate + streak + goal) |
| `studyo.quiz.attempts` | useProgressStore | `Record<courseId\|lessonId, bestPercent>` |
| `studyo.contentLang` | useContentLang | `'tl'\|'bcl'` |
| `studyo.profile` | useProfile | `{ name, tagline, avatarUri? }` |
| `studyo.notifications.read` | useNotifications | `string[]` read ids |
| `studyo.notif.{push,email,quiet}` | useNotifications | `boolean` prefs |
| `studyo.diagnostics.lastCrash` | crash-capture | `CrashRecord` (TEMP) |
| `studyo.diagnostics.launchTrail` | diagnostics | `Trail` (TEMP) |
| `studyo.schemaVersion` | reserved | — |

---

## 19. Diagnostics & Crash Harness (temporary)

Release builds close silently on a fatal JS error (the red screen is stripped). This harness makes such crashes visible and is meant to be removed once the underlying release bug is closed.

- **`entry.js`** arms it before the router graph evaluates: `startSession()` + `installCrashHandler()`, and wraps `require('expo-router/entry')` in try/catch → `captureError`.
- **`lib/crash-capture.ts`** persists the last fatal JS error (`ErrorUtils` global handler + direct capture) to `studyo.diagnostics.lastCrash`.
- **`lib/diagnostics.ts`** records a **launch breadcrumb trail** (`STEPS.*`, e.g. `boot → layout-render → fonts → stack → providers → launch-complete → splash-handoff`), persisted per-mark, so the next launch shows how far the previous got. `selfTest()` throws on purpose to prove the capture path.
- **`src/components/CrashOverlay.tsx`** renders above the navigator on launch and shows: a captured error (JS bug) / no-error-incomplete-trail (JS died mid-startup) / no-error-complete-trail (crash is below JS or post-first-paint).

> To remove: delete `entry.js` (set `"main": "expo-router/entry"`), `lib/crash-capture.ts`, `lib/diagnostics.ts`, `CrashOverlay`, and the two `studyo.diagnostics.*` keys.

---

## 20. Commands & Developer Workflow

Run everything from `studyo-app/`:

```bash
npm start            # expo start (dev server)
npm run android      # expo start --android
npm run ios          # expo start --ios
npm run web          # expo start --web
npm run lint         # expo lint (ESLint 9 flat config)
npm run test         # jest (single run)

npx tsc --noEmit                     # type-check
npx expo start -c                    # start with cleared Metro cache
npx expo install <pkg>               # add SDK-compatible deps (NEVER npm add)
npx expo-doctor                      # diagnose config/deps
```

Run a single test:

```bash
npx jest hooks/useProgressStore.test.tsx
```

### QA gate (all must pass before a change is "done")

```bash
npx tsc --noEmit && npx expo lint && npx expo export --platform web && npx jest
```

> If `NODE_ENV=production` is set in your shell and devDependencies go missing, run `npm install --include=dev`. Prefer the **local** Expo CLI (`npx expo`) — a stale global `expo` can shadow it.

---

## 21. Build & Release (EAS)

Config: `app.json` (Expo) + `eas.json` (build profiles).

- **App identity:** name `Studyo`, slug `studyo-app`, scheme `studyoapp`, Android package `com.studyo.app`, adaptive icon on accent `#7C3AED`, `userInterfaceStyle: automatic`, portrait, typed routes, web = Metro static.
- **Plugins:** `expo-router`, `expo-splash-screen` (contain, white bg).

### EAS profiles (`eas.json`)

| Profile | Output | Notes |
|---|---|---|
| `development` | APK, dev client | internal distribution, `assembleDebug` |
| `preview` | APK | internal distribution |
| `production` | AAB (app-bundle) | `autoIncrement` |

```bash
npx eas-cli@latest build --platform android --profile preview      # test APK
npx eas-cli@latest build --platform android --profile production   # store AAB
npx eas-cli@latest update                                          # OTA update
```

> `ios/` and `android/` are **not** committed — this is Continuous Native Generation. Configure native behavior in `app.json`/config plugins, never by hand. Any library with native code needs a dev/EAS build (Expo Go only bundles its own native modules).

---

## 22. Testing

Jest with the `jest-expo` preset; `jest.setup.js` registers the official AsyncStorage mock so storage-backed suites load.

Test suites: `lib/quiz-scoring`, `lib/onboarding`, `lib/frontmatter`, `lib/lesson-sections`, `lib/search`, `lib/diagnostics`, `src/repositories/content-registry`, `hooks/useProgressStore` (derivations incl. gating, streak, daily-goal), `hooks/useTheme`.

```bash
npx jest            # full suite
npx jest --watch    # watch mode
```

---

## 23. Known Limitations & Stubs

- **Diagnostics/crash harness is temporary** (§19) — remove once the release crash is closed.
- **Notifications are seeded** (`src/data/notifications.ts`) — no remote push; the provider overlays persisted read state and local preference toggles only.
- **Avatar is stored as a base64 data-URI** in AsyncStorage (Profile) — fine for small images; prefer a file URI (`expo-file-system`) or hard downscale for large photos.
- **Bilingual toggle** drives course title/description and lesson body/title; "What you'll learn" outcomes are intentionally pinned to Tagalog.
- **No backend / accounts** — everything is on-device and offline-first.

---

*Studyo · Expo SDK 57 · React Native 0.86 · New Architecture · Hermes · offline-first Filipino & Bikol orthography learning.*
