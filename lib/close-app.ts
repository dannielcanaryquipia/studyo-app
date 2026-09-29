/**
 * lib/close-app.ts — best-effort process termination.
 *
 * Log Out uses this instead of routing anywhere. The point of the button is a
 * genuine cold start: wipe the onboarding state, kill the process, and let the
 * OS launch the app from scratch next time. Re-entering a route in-process would
 * only prove the router works, not that a cold launch does — and a cold launch
 * is the thing under test.
 *
 * ------------------------------------------------------------------
 * DO NOT "SIMPLIFY" THIS BACK TO `import RNExitApp from 'react-native-exit-app'`.
 *
 * That import crashes the entire app at startup, not just the Log Out button.
 * `react-native-exit-app` resolves its native module at import time with
 * `TurboModuleRegistry.getEnforcing('RNExitApp')` (NativeRNExitApp.ts), which
 * THROWS when the module is absent. A native module only exists in a binary
 * compiled with it, so the module is missing in Expo Go, in any dev client built
 * before this dependency was added, and in any already-installed APK running a
 * newer JS bundle.
 *
 * Because `lib/close-app` is imported by `app/(tabs)/profile.tsx`, that throw
 * happens while expo-router is still validating the route tree — the app dies
 * before first paint and you get a misleading secondary error, "Route
 * './(tabs)/profile.tsx' is missing the required default export", because the
 * module never finished evaluating.
 *
 * So the native module is looked up lazily and defensively instead. The package
 * stays in package.json dependencies — that is what makes autolinking compile
 * the Java into the APK, which is where the real exit comes from.
 * ------------------------------------------------------------------
 *
 * Implementation notes, all verified against the installed sources:
 *
 *  - The Android implementation is `Process.killProcess(Process.myPid())`
 *    (android/src/main/java/.../RNExitAppImpl.java), a true process kill, so the
 *    next launcher tap is always a cold start. v2.0.0 ships both `newarch/` and
 *    `oldarch/` sources.
 *
 *  - React Native core's `BackHandler.exitApp()` cannot do this on 0.86 and is
 *    deliberately not used. It calls `invokeDefaultBackPressHandler()` →
 *    `ReactActivity.invokeDefaultOnBackPressed()` → `Activity.onBackPressed()`,
 *    which finishes the activity and backgrounds the task while the process
 *    survives. The app would look like it closed but the next tap resumes the
 *    same warm task, defeating the point.
 *
 *  - iOS apps may not close themselves. That is an App Store guideline rule, not
 *    a missing capability, so there is nothing to implement.
 */
import { Alert, Platform, TurboModuleRegistry } from 'react-native';
import type { TurboModule } from 'react-native';

type RNExitAppSpec = TurboModule & {
  exitApp: () => void;
};

const NATIVE_MODULE_NAME = 'RNExitApp';

/**
 * Resolve the native module, or null when this binary does not contain it.
 * `get` (not `getEnforcing`) is the whole point — see the file header.
 */
function getNativeExitApp(): RNExitAppSpec | null {
  try {
    return TurboModuleRegistry.get<RNExitAppSpec>(NATIVE_MODULE_NAME) ?? null;
  } catch {
    return null;
  }
}

const MISSING_MODULE_TITLE = 'Rebuild required';
const MISSING_MODULE_BODY =
  'App exit needs a native build. Install a fresh APK (or dev client) built after this dependency was added. On iOS, apps cannot close themselves at all.';

/**
 * Terminate the app. On Android this kills the process, so nothing after the
 * call runs. There is no "did it work?" fallback: with a real kill there is no
 * code left alive to run one, and routing is not an acceptable substitute —
 * it would hide the failure this button exists to test.
 */
export function closeApp(): void {
  if (Platform.OS === 'web') {
    (globalThis as { location?: { reload?: () => void } }).location?.reload?.();
    return;
  }

  const nativeExitApp = getNativeExitApp();
  if (nativeExitApp) {
    nativeExitApp.exitApp();
    return;
  }

  Alert.alert(MISSING_MODULE_TITLE, MISSING_MODULE_BODY);
}
