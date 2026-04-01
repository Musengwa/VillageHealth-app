import { profileService } from '@/services/profileService';
import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const palette = {
  background: '#f4f8ff',
  surface: '#ffffff',
  border: '#cddcff',
  primary: '#1d4ed8',
  primaryDark: '#163eaf',
  text: '#102347',
  textMuted: '#5f739c',
};

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        alert(error.message || 'Login failed');
        return;
      }

      const user = data?.user;
      if (!user?.id) {
        alert('No user returned from auth.');
        return;
      }

      const existing = await profileService.getProfile(user.id).catch(() => null);
      if (!existing) {
        const username = email.trim().split('@')[0];
        await profileService
          .upsertProfile({ id: user.id, name: username, activity_status: 'online' })
          .catch(() => null);
      } else if (existing.activity_status !== 'online') {
        await profileService.setDoctorStatus('online').catch(() => null);
      }

      router.replace('/doctor/diagnosis');
    } catch (e: any) {
      alert(e?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Doctor Access</Text>
        <Text style={styles.title}>Sign in to the diagnosis board</Text>
        <Text style={styles.subtitle}>
          Enter your doctor account details to open the live diagnosis workspace.
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={palette.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={palette.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={onLogin}
          disabled={loading}>
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Open Diagnosis Board</Text>}
        </Pressable>

        <Pressable style={styles.back} onPress={() => router.push('/landing')}>
          <Text style={styles.backText}>Back to landing</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: palette.background,
  },
  card: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 28,
    padding: 24,
  },
  eyebrow: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  input: {
    backgroundColor: '#f9fbff',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: palette.text,
    fontSize: 15,
    marginBottom: 14,
  },
  button: {
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  back: {
    alignItems: 'center',
    marginTop: 16,
  },
  backText: {
    color: palette.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
