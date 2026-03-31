import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { CurrentPatientProvider } from '@/context/CurrentPatientContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'landing',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      border: '#d7e9d8',
      card: '#ffffff',
      notification: colors.tint,
      primary: colors.tint,
      text: colors.text,
    },
  };

  return (
    <CurrentPatientProvider>
      <ThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            footerShown: false,
          }}>
          <Stack.Screen name="/landing" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="doctor" />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </CurrentPatientProvider>
  );
}
