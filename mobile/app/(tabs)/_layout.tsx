import { Tabs } from 'expo-router';
import { useI18n } from '../../lib/i18n';
export default function TabsLayout() { const { t } = useI18n(); return <Tabs screenOptions={{ headerStyle: { backgroundColor: '#176b3a' }, headerTintColor: '#fff', tabBarActiveTintColor: '#176b3a' }}>
  <Tabs.Screen name="index" options={{ title: t.home, tabBarIcon: () => null }} />
  <Tabs.Screen name="advisory" options={{ title: t.advisory, tabBarIcon: () => null }} />
  <Tabs.Screen name="diagnose" options={{ title: t.diagnose, tabBarIcon: () => null }} />
  <Tabs.Screen name="profile" options={{ title: t.profile, tabBarIcon: () => null }} />
</Tabs>; }
