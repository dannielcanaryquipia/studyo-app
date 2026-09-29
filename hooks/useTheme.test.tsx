/**
 * hooks/useTheme.test.ts — Phase B §6.2 required unit test.
 * §3.1 resolution: system→device, manual wins, persistence roundtrip (mocked AsyncStorage).
 */
import { act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { ThemeProvider, useTheme } from './useTheme';

const wrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

describe('useTheme', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to system → device scheme (light under jest)', async () => {
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current.pref).toBe('system');
    expect(result.current.isDark).toBe(false);
  });

  it('manual pref wins and persists to studyo.theme', async () => {
    const { result } = await renderHook(() => useTheme(), { wrapper });
    await act(async () => {
      result.current.setPref('dark');
    });
    expect(result.current.pref).toBe('dark');
    expect(result.current.isDark).toBe(true);
    await expect(AsyncStorage.getItem(STORAGE_KEYS.theme)).resolves.toBe('"dark"');
  });

  it('restores a stored pref on mount (roundtrip)', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.theme, '"dark"');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.pref).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('ignores a corrupt stored pref and stays on system', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.theme, 'not-a-theme');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.pref).toBe('system');
  });
});