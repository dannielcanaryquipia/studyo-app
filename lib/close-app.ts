/**
 * lib/close-app.ts — best-effort process termination.
 *
 * Log Out uses this instead of routing back through /splash. The point of the
 * button is a genuine cold start: wipe the onboarding state, kill the process,
 * and let the OS launch the app from scratch next time. Re-entering /splash
 * in-process would only prove the router works, not that a fresh launch does —
 * and a fresh launch is the thing under test.
 *
 * Platform reality, checked against package.json — there is no `expo-dev-client`,
 * `expo-updates`, or `react-native-exit-app` installed, so nothing here can rely
 * on a dev-only native module or on an extra dependency:
 *
 *  - Android: `BackHandler.exitApp()` finishes the activity task. It is React
 *    Native core, so it behaves the same in Expo Go, a dev client, and a release
 *    APK. React Native guards it on `isTaskRoot()`, which is false for a
 *    deep-link launch, so it is a *silent* no-op in that case. Hence the grace
 *    timer: if the process is still alive to run it, the close did not happen.
 *  - iOS: there is no supported way for an app to close itself. This is an App
 *    Store guideline prohibition, not a missing capability.
 *  - Web: a reload is the closest equivalent.
 */
import { BackHandler, Platform } from 'react-native';

/** How long to wait before concluding `exitApp()` did not take effect. */
const EXIT_GRACE_MS = 300;

/**
 * Terminate the app. `onUnsupported` runs only when the platform cannot close
 * the app, or when the Android close silently failed — it is the caller's
 * degraded path, not the normal one.
 */
export function closeApp(onUnsupported: () => void): void {
  if (Platform.OS === 'web') {
    (globalThis as { location?: { reload?: () => void } }).location?.reload?.();
    return;
  }

  if (Platform.OS !== 'android') {
    onUnsupported();
    return;
  }

  BackHandler.exitApp();

  // Only reached if the process survived exitApp().
  setTimeout(onUnsupported, EXIT_GRACE_MS);
}
