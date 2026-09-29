/**
 * lib/diagnostics.ts — TEMPORARY launch flight recorder.
 *
 * A fatal JS error is only half the problem: a native abort (SIGSEGV, worklet
 * runtime failure, native module throw) never reaches `ErrorUtils`, so the crash
 * overlay shows nothing and you cannot tell "no JS error" apart from "the reporter
 * is broken". That ambiguity is why the last crash hunt stalled.
 *
 * So we record a breadcrumb trail instead of relying on a single error record.
 * Each step is appended and persisted as it happens, so the NEXT launch can show
 * exactly how far the previous launch got:
 *
 *   - trail ends before `LAUNCH_COMPLETE`  -> the crash is during JS launch
 *   - trail reaches `LAUNCH_COMPLETE`      -> JS ran to completion, so anything
 *                                             that still kills the app is below
 *                                             the JS layer (native), or happens
 *                                             after first paint
 *
 * `selfTest()` deliberately throws so the capture path can be proven to work on a
 * real device before its silence is trusted as evidence.
 *
 * Writes are serialised through a single promise chain. Concurrent read-modify-
 * write on one key would otherwise drop marks — exactly the runs where a fast
 * launch crashes, and those are the runs that matter.
 */
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { getItem, setItem } from '@/hooks/useStorage';

const TRAIL_KEY = STORAGE_KEYS.launchTrail;

/** Bounded so a long session cannot grow the record without limit. */
const MAX_MARKS = 60;

/** After this many marks, `markLaunch` probes stop appending. See its docs. */
const LAUNCH_MARK_LIMIT = 12;

export type TrailMark = { step: string; t: number };

export type Trail = {
  sessionId: string;
  startedAt: number;
  /** True once the app reached LAUNCH_COMPLETE — see module docs. */
  completed: boolean;
  marks: TrailMark[];
};

/**
 * Canonical step names. Centralised so the writer and the diagnostics screen
 * cannot drift apart and invent a step the screen does not know how to explain.
 */
export const STEPS = {
  BOOT: 'boot',
  ROUTER_LOADED: 'router-loaded',
  LAYOUT_MODULE: 'layout-module',
  LAYOUT_RENDER: 'layout-render',
  FONTS: 'fonts',
  FONTS_ERROR: 'fonts-error',
  THEME_PROVIDER: 'theme-provider',
  THEME_PROVIDER_RENDER: 'theme-provider-render',
  NAV_RENDER: 'nav-render',
  THEME_OK: 'theme-ok',
  CSS_VIEW_OK: 'css-view-ok',
  PROVIDERS: 'providers',
  STACK: 'stack',
  SPLASH_MODULE: 'splash-module',
  SPLASH_RENDER: 'splash-render',
  SPLASH_ANIM_START: 'splash-anim-start',
  SPLASH_ANIM_DONE: 'splash-anim-done',
  SPLASH_HANDOFF: 'splash-handoff',
  SPLASH_LAUNCH: 'splash-launch',
  TABS_LAYOUT: 'tabs-layout',
  TABBAR_RENDER: 'tabbar-render',
  HOME_RENDER: 'home-render',
  LAUNCH_COMPLETE: 'launch-complete',
} as const;

function newSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

let trail: Trail = { sessionId: newSessionId(), startedAt: Date.now(), completed: false, marks: [] };
let queue: Promise<unknown> = Promise.resolve();
let started = false;

function persist(): void {
  const snapshot: Trail = { ...trail, marks: trail.marks.slice() };
  queue = queue.then(() => setItem(TRAIL_KEY, snapshot)).catch(() => {
    /* diagnostics must never break the app */
  });
}

/**
 * Begin a launch session, discarding the previous one. Call once, as early as
 * possible. Safe to call again (it just restarts the trail) so a Fast Refresh
 * during development does not leave a half-reset trail.
 */
export function startSession(): void {
  if (started) return;
  started = true;
  trail = { sessionId: newSessionId(), startedAt: Date.now(), completed: false, marks: [] };
  mark(STEPS.BOOT);
  persist();
}

/**
 * Record a step. Never throws, never awaits — safe to call from module scope.
 *
 * Consecutive duplicates collapse to one entry. Several steps are marked from
 * render bodies, and without this a screen that re-renders 30 times would push
 * the early startup steps out of the bounded ring and destroy exactly the
 * evidence a launch crash depends on.
 */
export function mark(step: string): void {
  try {
    if (!started) {
      started = true;
      trail = { sessionId: newSessionId(), startedAt: Date.now(), completed: false, marks: [] };
    }
    if (trail.marks[trail.marks.length - 1]?.step === step) return;
    trail.marks.push({ step, t: Date.now() });
    if (trail.marks.length > MAX_MARKS) trail.marks.shift();
    if (step === STEPS.LAUNCH_COMPLETE) trail.completed = true;
    persist();
  } catch {
    /* diagnostics must never break the app */
  }
}

/**
 * Record a step, but only while the launch is still in its first few steps.
 *
 * For probes inside components that render many times (a CSS `View` wrapper runs
 * on every node of every screen). The consecutive-duplicate rule in `mark` is not
 * enough, because re-renders of *different* trees interleave and each would append
 * again — flooding the bounded ring and pushing out the early steps. Capping on
 * position keeps launch bisection clean and ignores everything after startup.
 */
export function markLaunch(step: string): void {
  try {
    if (trail.marks.length >= LAUNCH_MARK_LIMIT) return;
    mark(step);
  } catch {
    /* diagnostics must never break the app */
  }
}

/** In-memory view — no I/O, for asserting on the current run. */
export function currentTrail(): Trail {
  return trail;
}

/** Persisted trail from this or the previous launch. */
export async function readTrail(): Promise<Trail | null> {
  return getItem<Trail>(TRAIL_KEY);
}

export async function clearTrail(): Promise<void> {
  trail = { sessionId: newSessionId(), startedAt: Date.now(), completed: false, marks: [] };
  await setItem(TRAIL_KEY, trail);
}

/**
 * Prove the capture path end to end. Throws on purpose; the error should be
 * captured and shown by the overlay on the next launch. If it is not, the
 * reporter is broken and its silence proves nothing.
 */
export function selfTest(): never {
  throw new Error('[studyo diagnostics] intentional self-test crash');
}
