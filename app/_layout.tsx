import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  ErrorBoundary,
  Stack,
  ThemeProvider,
  useRouter,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { mark, STEPS } from '@/lib/diagnostics';
import { whenSplashPainted } from '@/lib/splash-gate';
import { ContentLangProvider } from '@/hooks/useContentLang';
import { NotificationsProvider } from '@/hooks/useNotifications';
import { ProfileProvider } from '@/hooks/useProfile';
import { ProgressProvider } from '@/hooks/useProgressStore';
import { ThemeProvider as StudyoThemeProvider, useTheme } from '@/hooks/useTheme';
import { CrashOverlay } from '@/src/components/CrashOverlay';

export { ErrorBoundary };

// No root app/index.tsx — the root stack begins at splash.
// Routing: splash → onboarding/{welcome,interests,goal} → (tabs)
export const unstable_settings = {
  initialRouteName: 'splash',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

const StudyoLightNavTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.accent,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const StudyoDarkNavTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.accent,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular: require('../assets/fonts/Inter-Regular.ttf'),
    Inter_600SemiBold: require('../assets/fonts/Inter-SemiBold.ttf'),
    SpaceMono_400Regular: require('../assets/fonts/SpaceMono-Regular.ttf'),
    SpaceMono_700Bold: require('../assets/fonts/SpaceMono-Bold.ttf'),
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) console.error('[studyo] Font load error:', error);
  }, [error]);

  mark(STEPS.LAYOUT_RENDER);

  if (!loaded && !error) return null;

  mark(STEPS.FONTS);

  return (
    // SafeAreaProvider MUST wrap everything — it measures device insets and
    // makes them available to SafeAreaView and useSafeAreaInsets() everywhere.
    <SafeAreaProvider>
      <StudyoThemeProvider>
        <RootLayoutNav />
      </StudyoThemeProvider>
    </SafeAreaProvider>
  );
}

// Module-level flag: resets on every real page load, persists through Fast Refresh.
// On web, ensures splash always plays when the browser tab first loads.
let _webSplashPending = true;

function RootLayoutNav() {
  const { isDark } = useTheme();
  const router = useRouter();

  useEffect(() => {
    mark(STEPS.PROVIDERS);
    mark(STEPS.LAUNCH_COMPLETE);
  }, []);

  // Web-only: redirect to /splash on first mount so the animation always plays
  // regardless of which URL the browser reloads at. Module-level flag ensures
  // this redirect only fires once per full page load (not on Fast Refresh).
  useEffect(() => {
    if (Platform.OS === 'web' && _webSplashPending) {
      _webSplashPending = false;
      router.replace('/splash');
    }
  }, [router]);

  const nativeSplashHidden = useRef(false);
  const handleRootLayout = useCallback(() => {
    if (nativeSplashHidden.current) return;
    nativeSplashHidden.current = true;
    mark(STEPS.STACK);
    // onLayout only proves the root View was measured — it does not mean /splash
    // has drawn anything. In a release APK the bundle is already resident, so the
    // router can resolve the destination in this same frame. Dropping the native
    // splash here tore it down before the animated splash had painted, and the
    // user landed on the destination having never seen the animation.
    // The wait is bounded inside the gate, so a /splash that never mounts still
    // resolves.
    whenSplashPainted().then(() => {
      mark(STEPS.SPLASH_HANDOFF);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  return (
    <View style={{ flex: 1 }} onLayout={handleRootLayout}>
      {/* StatusBar text/icon color adapts to light/dark theme automatically */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ThemeProvider value={isDark ? StudyoDarkNavTheme : StudyoLightNavTheme}>
        <ProgressProvider>
          <ContentLangProvider>
            <ProfileProvider>
              <NotificationsProvider>
                <Stack initialRouteName="splash" screenOptions={{ headerShown: false }}>
                  {/* Flow: splash → onboarding (3 steps) → (tabs) */}
                  <Stack.Screen name="splash" options={{ animation: 'none' }} />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="achievements" />
                  <Stack.Screen name="notifications" />
                  <Stack.Screen name="about" />
                  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <CrashOverlay />
              </NotificationsProvider>
            </ProfileProvider>
          </ContentLangProvider>
        </ProgressProvider>
      </ThemeProvider>
    </View>
  );
}
