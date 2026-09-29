/**
 * lib/diagnostics.test.ts
 *
 * The crash hunt stalled because "no error captured" was ambiguous — it could
 * mean the crash was below JS, or it could mean the reporter itself was broken.
 * These tests remove that ambiguity by driving the same paths the device runs.
 *
 * Two distinct paths are covered, because they are genuinely different:
 *   1. captureError()      — the module-init path entry.js uses around the router
 *                            require. A throw there bypasses ErrorUtils entirely.
 *   2. ErrorUtils global   — the normal runtime path for errors React Native
 *     handler               routes through reportFatalError.
 *
 * Writing these tests is what surfaced that path 1 is not covered by path 2.
 *
 * Deliberately outside `app/` — every file there is an expo-router route and
 * would be bundled into the release build.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import {
  captureError,
  clearLastCrash,
  installCrashHandler,
  readLastCrash,
} from '@/lib/crash-capture';
import { currentTrail, mark, readTrail, STEPS } from '@/lib/diagnostics';

/** Drain the fire-and-forget write chain. */
const flush = () => new Promise((r) => setTimeout(r, 0));

type ErrorUtilsLike = {
  getGlobalHandler?: () => unknown;
  setGlobalHandler?: (h: (e: unknown, isFatal?: boolean) => void) => void;
  reportFatalError?: (e: unknown) => void;
};

const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;

beforeEach(async () => {
  await clearLastCrash();
});

describe('launch trail', () => {
  it('records steps in the order they happen', () => {
    mark(STEPS.BOOT);
    mark(STEPS.ROUTER_LOADED);
    mark(STEPS.LAYOUT_MODULE);

    const steps = currentTrail().marks.map((m) => m.step);
    expect(steps).toEqual([STEPS.BOOT, STEPS.ROUTER_LOADED, STEPS.LAYOUT_MODULE]);
  });

  it('collapses consecutive duplicate marks so re-renders cannot evict early steps', () => {
    mark(STEPS.TABBAR_RENDER);
    // Simulates a screen that re-renders repeatedly.
    mark(STEPS.HOME_RENDER);
    mark(STEPS.HOME_RENDER);
    mark(STEPS.HOME_RENDER);

    const steps = currentTrail().marks.map((m) => m.step);
    expect(steps.filter((s) => s === STEPS.HOME_RENDER)).toHaveLength(1);
  });

  it('flags completion when the app reaches the end of startup', () => {
    expect(currentTrail().completed).toBe(false);
    mark(STEPS.LAUNCH_COMPLETE);
    expect(currentTrail().completed).toBe(true);
  });

  it('persists the trail so the next launch can read it', async () => {
    mark(STEPS.SPLASH_RENDER);
    await flush();

    const stored = await readTrail();
    expect(stored).not.toBeNull();
    expect(stored!.marks.map((m) => m.step)).toContain(STEPS.SPLASH_RENDER);
  });
});

describe('crash capture — module-init path (entry.js)', () => {
  it('records an error passed directly to captureError', async () => {
    captureError(new Error('module init exploded'), true);
    await flush();

    const record = await readLastCrash();
    expect(record).not.toBeNull();
    expect(record!.message).toBe('module init exploded');
    expect(record!.isFatal).toBe(true);
    expect(record!.stack).toBeTruthy();
  });

  it('captures a non-Error throw without throwing itself', async () => {
    captureError('a bare string failure', true);
    await flush();

    const record = await readLastCrash();
    expect(record!.message).toBe('a bare string failure');
  });

  it('writes under the documented storage key', async () => {
    captureError(new Error('key check'), true);
    await flush();

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.lastCrash);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).message).toBe('key check');
  });
});

describe('crash capture — ErrorUtils runtime path', () => {
  it('captures an error React Native routes through reportFatalError', async () => {
    const original = errorUtils?.getGlobalHandler?.();
    // Benign previous handler, so the real one cannot tear down the test run.
    errorUtils?.setGlobalHandler?.(() => {});
    const uninstall = installCrashHandler();

    errorUtils?.reportFatalError?.(new Error('runtime fatal'));

    await flush();
    const record = await readLastCrash();
    expect(record).not.toBeNull();
    expect(record!.message).toBe('runtime fatal');

    uninstall();
    errorUtils?.setGlobalHandler?.(original as (e: unknown, isFatal?: boolean) => void);
  });

  it('restores the previous handler on uninstall', () => {
    const sentinel = () => {};
    errorUtils?.setGlobalHandler?.(sentinel);
    const uninstall = installCrashHandler();
    expect(errorUtils?.getGlobalHandler?.()).not.toBe(sentinel);

    uninstall();
    expect(errorUtils?.getGlobalHandler?.()).toBe(sentinel);
  });
});

describe('crash record lifecycle', () => {
  it('clears the record, so a stale one cannot be misread as current', async () => {
    captureError(new Error('stale'), true);
    await flush();
    expect(await readLastCrash()).not.toBeNull();

    await clearLastCrash();
    expect(await readLastCrash()).toBeNull();
  });
});
