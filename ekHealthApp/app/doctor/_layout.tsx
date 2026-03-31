import { Stack } from 'expo-router';
import React from 'react';

export default function DoctorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="diagnosis" />
      <Stack.Screen name="patients" />
      <Stack.Screen name="hello-doctor" />
    </Stack>
  );
}
