// Jest global setup. Registers the official AsyncStorage mock so suites that
// persist through @react-native-async-storage/async-storage (useProgressStore,
// useTheme, …) can load — the real module resolves a native TurboModule at
// import time, which throws under Jest.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
