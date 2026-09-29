import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, useThemeColor } from '@/src/components/primitives';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationBell() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const danger = useThemeColor('danger');
  const hasUnread = unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hasUnread ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      onPress={() => router.push('/notifications')}
      style={nb.btn}>
      <View style={{ position: 'relative' }}>
        <Icon name={hasUnread ? 'notifications-active' : 'notifications-none'} size={22} />
        {hasUnread && (
          <View style={[nb.badge, { backgroundColor: danger }]}>
            <Text style={nb.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const nb = StyleSheet.create({
  btn: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: 'Inter_600SemiBold', color: '#FFF', fontSize: 10, lineHeight: 12 },
});
