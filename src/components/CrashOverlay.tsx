/**
 * src/components/CrashOverlay.tsx — TEMPORARY release-crash diagnostics.
 *
 * Renders on every launch, above the navigator, and answers the one question that
 * has stalled this hunt: did JavaScript die, or did something below JS?
 *
 *   - a captured error      -> a JS bug, and the stack is right here
 *   - no error, incomplete  -> JS died during startup, after the listed step
 *   - no error, complete    -> JS ran to completion, so the crash is below the JS
 *                              layer (native abort / worklet runtime) or after
 *                              first paint
 *
 * The third case used to be indistinguishable from a broken reporter, which is
 * why `lib/diagnostics.ts` also records a launch trail. Run the self-test from
 * /diagnostics to confirm the capture path still works before trusting silence.
 *
 * Built on bare react-native primitives on purpose. It deliberately avoids
 * @/src/tw (react-native-css), Reanimated, and the custom SpaceMono/Inter
 * families: if any of those subsystems is the thing that crashed, a reporter
 * depending on them would fail in exactly the same way and show nothing.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { currentTrail, readTrail } from '@/lib/diagnostics';
import type { Trail } from '@/lib/diagnostics';
import { clearLastCrash, readLastCrash } from '@/lib/crash-capture';
import type { CrashRecord } from '@/lib/crash-capture';

type Verdict =
  | { kind: 'js-error'; text: string }
  | { kind: 'js-during-startup'; text: string }
  | { kind: 'below-js'; text: string }
  | { kind: 'unknown'; text: string };

function judge(crash: CrashRecord | null, trail: Trail | null): Verdict {
  if (crash) {
    return { kind: 'js-error', text: 'JavaScript threw a fatal error. The stack below is the cause.' };
  }
  if (!trail || trail.marks.length === 0) {
    return {
      kind: 'unknown',
      text: 'No crash and no launch trail were recorded. Either the app ran normally last time, or it died before the first breadcrumb could be written.',
    };
  }
  const last = trail.marks[trail.marks.length - 1].step;
  if (trail.completed) {
    return {
      kind: 'below-js',
      text: `No JavaScript error was captured, and JS launch completed (last step: ${last}). The crash is below the JS layer — a native abort, a worklet runtime failure, or something after first paint. This needs logcat.`,
    };
  }
  return {
    kind: 'js-during-startup',
    text: `No JavaScript error was captured, but JS launch did NOT complete. It died during startup at or after: ${last}. The crash is inside JS startup, or in native code reached from there.`,
  };
}

export function CrashOverlay() {
  const [crash, setCrash] = useState<CrashRecord | null>(null);
  const [trail, setTrail] = useState<Trail | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      Promise.all([readLastCrash(), readTrail()]).then(([c, t]) => {
        if (!alive) return;
        setCrash(c);
        setTrail(t);
      });

    void load();
    // The launch's own later breadcrumbs persist asynchronously through a serialised
    // write queue, and this component's effect runs before the parent layout's. So the
    // first read races them and under-reports the trail by a few steps. Re-read once
    // the queue has drained.
    const t = setTimeout(() => void load(), 800);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    void clearLastCrash();
  }, []);

  /**
   * Only take over the screen when there is something to report.
   *
   * Two traps this avoids:
   *  - `startSession` persists a trail on EVERY launch, so a naive "trail exists"
   *    test would cover the app in diagnostics on every single start. Instead the
   *    trail only counts if it belongs to an *earlier* session — i.e. it is
   *    evidence about a launch that is over.
   *  - A previous session that reached launch-complete is also not a failure; the
   *    app is alive and the trail belongs at /diagnostics, not over the UI.
   */
  const fromEarlierSession = trail !== null && trail.sessionId !== currentTrail().sessionId;
  const shouldShow = crash !== null || (fromEarlierSession && trail!.completed === false);
  if (dismissed || !shouldShow) return null;

  const verdict = judge(crash, trail);
  const showTrail = trail !== null && trail.marks.length > 0;

  return (
    <View style={styles.backdrop}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.badge}>LAUNCH DIAGNOSTICS</Text>

        <Text style={verdict.kind === 'js-error' ? styles.titleBad : styles.titleGood}>
          {verdict.kind === 'js-error' ? 'JS error captured' : 'No JS error captured'}
        </Text>
        <Text style={styles.verdict}>{verdict.text}</Text>

        {crash ? (
          <>
            <Text style={styles.title}>{crash.name ?? 'Error'}</Text>
            <Text style={styles.message}>{crash.message}</Text>
            <Text style={styles.meta}>
              {crash.at}
              {crash.isFatal ? '  ·  fatal' : ''}
            </Text>
            {crash.stack ? <Text style={styles.stack}>{crash.stack}</Text> : null}
          </>
        ) : null}

        {showTrail ? (
          <>
            <Text style={styles.section}>Launch trail · {trail!.marks.length} steps</Text>
            <Text style={styles.meta}>
              session {trail!.sessionId} · launched {new Date(trail!.startedAt).toISOString()}
              {trail!.completed ? ' · completed' : ' · did NOT complete'}
            </Text>
            <View style={styles.trailBox}>
              {trail!.marks.map((m, i) => (
                <Text key={`${m.step}-${i}`} style={styles.trailLine}>
                  <Text style={styles.trailTime}>+{String(m.t - trail!.startedAt).padStart(5, ' ')}ms </Text>
                  {m.step}
                </Text>
              ))}
            </View>
          </>
        ) : null}

        <Pressable
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss crash report"
          style={styles.button}>
          <Text style={styles.buttonLabel}>Dismiss</Text>
        </Pressable>

        <Text style={styles.hint}>
          Screenshot this and send it to your coding agent, then rebuild once fixed.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 48,
    gap: 12,
  },
  badge: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: '#f5f5f5',
    fontSize: 20,
    fontWeight: '700',
  },
  titleBad: {
    color: '#f87171',
    fontSize: 20,
    fontWeight: '700',
  },
  titleGood: {
    color: '#fbbf24',
    fontSize: 20,
    fontWeight: '700',
  },
  verdict: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    color: '#f5f5f5',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  message: {
    color: '#fca5a5',
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    color: '#9ca3af',
    fontSize: 11,
  },
  trailBox: {
    backgroundColor: '#0b0b0d',
    borderRadius: 8,
    padding: 12,
    gap: 2,
  },
  trailLine: {
    color: '#d1d5db',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  trailTime: {
    color: '#6b7280',
  },
  stack: {
    color: '#d1d5db',
    fontSize: 11,
    lineHeight: 16,
    backgroundColor: '#0b0b0d',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 8,
  },
});

export default CrashOverlay;
