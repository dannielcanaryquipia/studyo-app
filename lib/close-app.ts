/**
 * lib/close-app.ts — best-effort process termination.
 *
 * Log Out uses this instead of routing anywhere. The point of the button is a
 * genuine cold start: wipe the onboarding state, kill the process, and let the
 * OS launch the app from scratch next time. Re-entering a route in-process would
 * only prove the router works, not that a cold launch does — and a cold launch
 * is the thing under test.
 *
 * Implementation notes, all verified against the installed sources rather than
 * assumed:
 *
 *  - `react-native-exit-app` calls `Process.killProcess(Process.myPid())`
 *    (android/src/main/java/.../RNExitAppImpl.java). That is a real process
 *    kill, so the next launcher tap is always a cold start.
 *
 *  - React Native core's `BackHandler.exitApp()` CANNOT do this on 0.86 and is
 *    deliberately not used. It calls `invokeDefaultBackPressHandler()`, which
 *    reaches `ReactActivity.invokeDefaultOnBackPressed()` and then
 *    `Activity.onBackPressed()` — that finishes the activity and backgrounds the
 *    task while the process stays alive, so the next tap resumes the same warm
 *    task. The app would appear to close and would still fail to test a cold
 *    start.
 *
 *  - iOS apps may not close themselves. That is an App Store guideline rule, not
 *    a missing capability, so there is nothing to implement — this reports it
 *    instead of silently doing nothing.
 *
 * Because the Android path kills the process synchronously there is no
 * "did it work?" fallback to schedule: no code after the call would run anyway.
 */
import { Alert, Platform } from 'react-native';
import RNExitApp from 'react-native-exit-app';

const IOS_TITLE = 'Cannot close the app';
const IOS_BODY =
  'iOS does not allow an app to close itself. Close Studyo from the app switcher, then reopen it to get a fresh start.';

/**
 * Terminate the app. Resolves nowhere on Android — the process is gone.
 * On iOS this surfaces an explanation instead of navigating.
 */
export function closeApp(): void {
  if (Platform.OS === 'web') {
    (globalThis as { location?: { reload?: () => void } }).location?.reload?.();
    return;
  }

  if (Platform.OS === 'android') {
    RNExitApp.exitApp();
    return;
  }

  Alert.alert(IOS_TITLE, IOS_BODY);
}
