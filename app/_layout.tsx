import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  ErrorBoundary,
  Stack,
  ThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { mark, STEPS } from '@/lib/diagnostics';
import { ContentLangProvider } from '@/hooks/useContentLang';
import { NotificationsProvider } from '@/hooks/useNotifications';
import { ProfileProvider } from '@/hooks/useProfile';
import { ProgressProvider } from '@/hooks/useProgressStore';
import { ThemeProvider as StudyoThemeProvider, useTheme } from '@/hooks/useTheme';
import { CrashOverlay } from '@/src/components/CrashOverlay';
import { SplashOverlay } from '@/src/components/SplashOverlay';

export { ErrorBoundary };

// The splash is NOT a route. The cold-start URL is `/`, which resolves to
// `(tabs)/index` (home) — an `initialRouteName: 'splash'` only sets the stack
// anchor, not the loaded screen, so in a release build home rendered first and
// the splash route ran invisibly underneath. The splash is now <SplashOverlay>,
// rendered on top of the navigator and dismissed when it finishes.
// Routing: (tabs) is the entry; first launch redirects to onboarding/welcome
// from under the overlay.

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

function RootLayoutNav() {
  const { isDark } = useTheme();

  useEffect(() => {
    mark(STEPS.PROVIDERS);
    mark(STEPS.STACK);
    mark(STEPS.LAUNCH_COMPLETE);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* StatusBar text/icon color adapts to light/dark theme automatically */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ThemeProvider value={isDark ? StudyoDarkNavTheme : StudyoLightNavTheme}>
        <ProgressProvider>
          <ContentLangProvider>
            <ProfileProvider>
              <NotificationsProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  {/* Entry: (tabs); first launch redirects to onboarding */}
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="achievements" />
                  <Stack.Screen name="notifications" />
                  <Stack.Screen name="about" />
                  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                {/* The opening animation, above the navigator. Dismisses itself. */}
                <SplashOverlay />
                <CrashOverlay />
              </NotificationsProvider>
            </ProfileProvider>
          </ContentLangProvider>
        </ProgressProvider>
      </ThemeProvider>
    </View>
  );
}
