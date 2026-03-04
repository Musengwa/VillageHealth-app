import { profileService } from '@/services/profileService';
import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';

export default function DoctorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert('Enter email and password');
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        alert(error.message || 'Login failed');
        return;
      }

      const user = data?.user;
      if (!user?.id) {
        alert('No user returned from auth.');
        return;
      }

      // Ensure a doctors profile exists for this user id.
      const existing = await profileService.getProfile(user.id).catch(() => null);
      if (!existing) {
        // create minimal doctor profile with expected fields
        const username = email.split('@')[0];
        await profileService
          .upsertProfile({ id: user.id, name: username, activity_status: 'online' })
          .catch(() => null);
      }

      // navigate to doctor dashboard
      router.replace('/doctor/hello-doctor');
    } catch (e: any) {
      setLoading(false);
      alert(e?.message || 'Unexpected error');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.title}>Doctor Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.back} onPress={() => router.push('/landing')}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#34C759', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  back: { marginTop: 12, alignItems: 'center' },
  backText: { color: '#007AFF' },
});