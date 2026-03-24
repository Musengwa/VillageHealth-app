import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LandingPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>EK Health</Text>
        </View>

        <Text style={styles.title}>Welcome to a faster check-up flow</Text>
        <Text style={styles.subtitle}>
          Book a patient visit or move into the doctor workspace from one clean, secure screen.
        </Text>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Quick access</Text>
          <Text style={styles.featureText}>
            Start a patient intake, record visits, and keep the whole process moving smoothly.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/patientType')}>
          <Text style={styles.primaryButtonText}>Continue as Patient</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/doctor/login')}>
          <Text style={styles.secondaryButtonText}>Doctor Sign In</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#ffffff',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ebf8ef',
    borderWidth: 1,
    borderColor: '#cbe8d3',
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f7a43',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    marginBottom: 14,
    color: '#163020',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: '#5d7464',
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: '#f4fbf6',
    borderColor: '#d6eede',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#184a2d',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#557063',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    marginBottom: 14,
    backgroundColor: '#1f9d55',
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#1f9d55',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#1f9d55',
  },
  secondaryButtonText: {
    fontSize: 17,
    color: '#1f9d55',
    fontWeight: '700',
  },
});
