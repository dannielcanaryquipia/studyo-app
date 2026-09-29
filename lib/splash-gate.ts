/**
 * lib/splash-gate.ts — handoff between the native splash and the animated one.
 *
 * The root layout used to call `SplashScreen.hideAsync()` from the wrapper
 * `View`'s `onLayout`. `onLayout` only proves the View was *measured*. It says
 * nothing about whether the `/splash` screen has drawn a frame.
 *
 * That distinction is invisible in Expo Go, where the JS bundle download
 * dominates startup and the native splash is comfortably still on screen by the
 * time the router resolves. In a release APK the bundle is already resident, so
 * the router can reach the launch destination in the same frame the root View is
 * measured. Hiding the native splash there tears it down while the animated
 * splash has drawn nothing, and the user lands on the destination having never
 * seen the animation.
 *
 * So: `/splash` reports `signalSplashPainted()` from its mount effect, and the
 * root layout awaits `whenSplashPainted()` before dropping the native splash.
 *
 * The wait is bounded. If `/splash` never mounts — unexpected route resolution,
 * a native error during startup — the gate opens anyway rather than stranding
 * the user on the native splash forever.
 */

/** Upper bound on how long the native splash may be held waiting for /splash. */
const TIMEOUT_MS = 2000;

let opened = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let waiters: (() => void)[] = [];

function open(): void {
  if (opened) return;
  opened = true;
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  const pending = waiters;
  waiters = [];
  for (const resolve of pending) resolve();
}

/**
 * Called by the `/splash` route on mount. Its only claim is "something has
 * painted on the animated splash" — it deliberately does not wait for the
 * animation or for the onboarding lookup.
 */
export function signalSplashPainted(): void {
  open();
}

/** Resolves once `/splash` has mounted, or after TIMEOUT_MS, whichever is first. */
export function whenSplashPainted(): Promise<void> {
  if (opened) return Promise.resolve();
  return new Promise<void>((resolve) => {
    waiters.push(resolve);
    if (timer === null) {
      timer = setTimeout(open, TIMEOUT_MS);
    }
  });
}
