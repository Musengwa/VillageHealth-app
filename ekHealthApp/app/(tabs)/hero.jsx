import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function HeroScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>E.K Health</Text>
        </View>

        <Text style={styles.title}>Doctor Portal</Text>
        <Text style={styles.subtitle}>
          Manage patient visits, diagnoses, and prescriptions in one calm, secure workspace.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What you can do</Text>
          <Text style={styles.cardItem}>Review waiting patient visits</Text>
          <Text style={styles.cardItem}>Record diagnosis and treatment notes</Text>
          <Text style={styles.cardItem}>Track doctor activity status</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/patient-form')}>
          <Text style={styles.primaryButtonText}>I am a Patient</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/(tabs)/Auth')}>
          <Text style={styles.secondaryButtonText}>Log in as Doctor</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ebf8ef',
    borderWidth: 1,
    borderColor: '#cbe8d3',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
  },
  badgeText: {
    color: '#1f7a43',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  title: {
    color: '#163020',
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    color: '#5d7464',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 26,
  },
  card: {
    backgroundColor: '#f4fbf6',
    borderColor: '#d6eede',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  cardTitle: {
    color: '#184a2d',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardItem: {
    color: '#557063',
    fontSize: 14,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#1f9d55',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#1f9d55',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#1f9d55',
  },
  secondaryButtonText: {
    color: '#1f9d55',
    fontSize: 16,
    fontWeight: '700',
  },
});
