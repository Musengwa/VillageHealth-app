import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EK Health</Text>
      <Text style={styles.subtitle}>Welcome</Text>

      <Text style={styles.subtitle}>for a quicker check up process</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(tabs)/patientType')}
      >
        <Text style={styles.buttonText}>Patient</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.doctorButton]}
        onPress={() => router.push('/doctor/login')}
      >
        <Text style={styles.buttonText}>Doctor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 50,
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    marginVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  doctorButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
});
