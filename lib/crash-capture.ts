/**
 * lib/crash-capture.ts — TEMPORARY release-crash diagnostics.
 *
 * Why this exists: release builds (EAS `preview`/internal distribution) close
 * silently on a fatal JS error — the red screen and console output you get from
 * `expo start` are stripped out. Without a logcat route there is no way to read
 * the failure, so we persist it and re-display it on the next launch.
 *
 * Scope and limits:
 *   - Captures JavaScript errors only. A native abort (SIGSEGV, worklet runtime
 *     failure) never reaches JS, so an empty capture is itself a useful signal:
 *     it means the crash is below the JS layer.
 *   - Deliberately dependency-free (no react-native-css, no Reanimated) so the
 *     reporter still works if the crash came from one of those subsystems.
 *
 * Remove this file, CrashOverlay, the lastCrash key, and the ErrorUtils wiring in
 * entry.js once the underlying bug is fixed.
 */
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { getItem, removeItem, setItem } from '@/hooks/useStorage';

export type CrashRecord = {
  /** ISO timestamp of the capture. */
  at: string;
  message: string;
  stack?: string;
  /** Error name/type, e.g. "TypeError". */
  name?: string;
  /** True when RN flagged the error as fatal (app was going down). */
  isFatal?: boolean;
};

type GlobalErrorUtils = {
  getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
};

const errorUtils = (globalThis as { ErrorUtils?: GlobalErrorUtils }).ErrorUtils;

/** Keep the payload small — a full production stack can run to many KB. */
const MAX_STACK_CHARS = 8000;

function describe(error: unknown): { name?: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message || '(no message)',
      stack: error.stack ? error.stack.slice(0, MAX_STACK_CHARS) : undefined,
    };
  }
  if (typeof error === 'string') return { message: error };
  try {
    return { message: JSON.stringify(error) ?? String(error) };
  } catch {
    return { message: String(error) };
  }
}

/**
 * Persist an error record. Never throws.
 *
 * Exported separately from the global handler because `ErrorUtils.setGlobalHandler`
 * only sees errors that React Native explicitly routes through
 * `ErrorUtils.reportFatalError` / `reportSoftError`. An error thrown while the
 * module graph is still evaluating — which is precisely the launch crash this
 * whole harness exists to catch — propagates straight out of the bundle and may
 * never consult the global handler. So entry.js calls this directly from a
 * try/catch around the router require, rather than trusting ErrorUtils to see it.
 */
export function captureError(error: unknown, isFatal?: boolean): void {
  try {
    const { name, message, stack } = describe(error);
    const record: CrashRecord = {
      at: new Date().toISOString(),
      name,
      message,
      stack,
      isFatal,
    };
    // Fire-and-forget: the process may already be tearing down.
    void setItem(STORAGE_KEYS.lastCrash, record);
  } catch {
    /* reporting must never throw */
  }
}

/**
 * Persist a fatal error, then hand back to the previous handler. Never throws —
 * a reporter that can itself crash is worse than no reporter, and the previous
 * handler is always restored so a failure while reporting cannot recurse.
 */
export function installCrashHandler(): () => void {
  const previous = errorUtils?.getGlobalHandler?.();

  errorUtils?.setGlobalHandler?.((error, isFatal) => {
    captureError(error, isFatal);
    previous?.(error, isFatal);
  });

  return () => {
    if (previous) errorUtils?.setGlobalHandler?.(previous);
  };
}

/** Last captured crash, or null when there is nothing to show. */
export async function readLastCrash(): Promise<CrashRecord | null> {
  return getItem<CrashRecord>(STORAGE_KEYS.lastCrash);
}

export async function clearLastCrash(): Promise<void> {
  await removeItem(STORAGE_KEYS.lastCrash);
}
