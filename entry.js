/**
 * entry.js — application entry point.
 *
 * Its only job is to arm the release-crash diagnostics BEFORE the router's
 * module graph is evaluated, then hand control to expo-router.
 *
 * Why this file exists at all: release builds close silently. The red screen and
 * console output you get from `expo start` are stripped from a release bundle,
 * so a fatal JS error is invisible. `lib/crash-capture.ts` persists the error
 * and `CrashOverlay` re-displays it on the next launch — but both were dead code
 * until now, because nothing ever called `installCrashHandler()` and there was no
 * entry file to call it from. `package.json` pointed straight at
 * `expo-router/entry`, so the global handler was never installed.
 *
 * Two separate capture paths, both deliberate:
 *
 *  1. `installCrashHandler()` covers errors React Native routes through
 *     `ErrorUtils.reportFatalError` / `reportSoftError`.
 *  2. The try/catch below covers an error thrown while the module graph is still
 *     evaluating. That is precisely the launch crash this harness exists to
 *     catch, and it propagates straight out of the bundle without necessarily
 *     consulting the global handler — so ErrorUtils alone cannot be trusted to
 *     see it.
 *
 * `startSession()` opens a fresh launch trail so a crash mid-boot leaves a
 * breadcrumb showing how far it got.
 *
 * Remove this file, set `"main": "expo-router/entry"` in package.json, and delete
 * `lib/crash-capture.ts`, `CrashOverlay`, and the lastCrash/launchTrail keys once
 * the underlying release bug is fixed.
 */
import { startSession } from './lib/diagnostics';
import { captureError, installCrashHandler } from './lib/crash-capture';

// Guarded because Fast Refresh re-evaluates this module; without the guard each
// reload would chain another handler onto ErrorUtils.
if (!globalThis.__studyoCrashHandlerInstalled) {
  globalThis.__studyoCrashHandlerInstalled = true;
  startSession();
  installCrashHandler();
}

try {
  require('expo-router/entry');
} catch (error) {
  captureError(error, true);
  throw error;
}
