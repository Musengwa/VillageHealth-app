import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function HeroScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>E.K Health</Text>
        </View>

        <Text style={styles.title}>Doctor Portal</Text>
        <Text style={styles.subtitle}>
          Manage patient visits, diagnoses, and prescriptions in one secure workspace.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What you can do</Text>
          <Text style={styles.cardItem}>- Review waiting patient visits</Text>
          <Text style={styles.cardItem}>- Record diagnosis and treatment notes</Text>
          <Text style={styles.cardItem}>- Track doctor activity status</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/Auth')}>
          <Text style={styles.primaryButtonText}>Log In as Doctor</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
  },
  badgeText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  title: {
    color: '#f8fafc',
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 26,
  },
  card: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },
  cardTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardItem: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
