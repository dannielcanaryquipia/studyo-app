import { Tabs } from 'expo-router';

import { TabBar } from '@/src/components/tab-bar';

const TABS = [
  { name: 'index', title: 'Home' },
  { name: 'courses', title: 'Courses' },
  { name: 'progress', title: 'Progress' },
  { name: 'profile', title: 'Profile' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}>
      {TABS.map(({ name, title }) => (
        <Tabs.Screen key={name} name={name} options={{ title }} />
      ))}
    </Tabs>
  );
}
