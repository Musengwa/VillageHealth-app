import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'landing',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'light' ? DefaultTheme : DarkTheme}>
      <Stack screenOptions={{
        headerShown: false,
        footerShown: false,
      }}>
        <Stack.Screen name="/landing" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="doctor" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}