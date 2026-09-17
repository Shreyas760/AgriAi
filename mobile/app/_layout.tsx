import { Stack } from 'expo-router';
import { I18nProvider } from '../lib/i18n';
export default function Layout() { return <I18nProvider><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /><Stack.Screen name="index" /></Stack></I18nProvider>; }
