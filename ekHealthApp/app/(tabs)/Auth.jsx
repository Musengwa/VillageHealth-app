import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function AuthScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const upsertDoctorProfile = useCallback(async (userId, fallbackUser = null, preferredName = '', preferredSpecialization = '') => {
    const fallbackName =
      fallbackUser?.user_metadata?.full_name ||
      fallbackUser?.user_metadata?.name ||
      fallbackUser?.email?.split('@')[0] ||
      'Doctor';
    const fallbackSpecialization = fallbackUser?.user_metadata?.specialization || null;

    const { error } = await supabase.from('doctors').upsert(
      [
        {
          id: userId,
          name: preferredName.trim() || fallbackName,
          specialization: preferredSpecialization.trim() || fallbackSpecialization,
          activity_status: 'online',
        },
      ],
      { onConflict: 'id' }
    );

    if (error) throw error;
  }, []);

  useEffect(() => {
    const checkCurrentSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session?.user?.id) {
        try {
          await upsertDoctorProfile(data.session.user.id, data.session.user);
        } catch (upsertError) {
          console.warn('Doctor upsert on restore failed:', upsertError?.message || upsertError);
        }
        router.replace('/(tabs)/index');
      }
      setCheckingSession(false);
    };

    checkCurrentSession();
  }, [router, upsertDoctorProfile]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Email and password are required.');
      return;
    }

    if (isSignUp && !name.trim()) {
      Alert.alert('Missing name', 'Doctor name is required for sign up.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              specialization: specialization.trim() || null,
            },
          },
        });
        if (error) throw error;

        if (data.session?.user?.id) {
          await upsertDoctorProfile(data.session.user.id, data.session.user, name, specialization);
          Alert.alert('Account created', 'Doctor account created successfully.');
          router.replace('/(tabs)/index');
          return;
        }

        Alert.alert(
          'Verify your email',
          'Account created. Check your inbox, then sign in to complete doctor profile setup.'
        );
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;

        if (data.user?.id) {
          await upsertDoctorProfile(data.user.id, data.user, name, specialization);
        }

        Alert.alert('Signed in', 'Welcome back, doctor.');
        router.replace('/(tabs)/index');
      }
    } catch (error) {
      Alert.alert('Authentication failed', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loaderText}>Checking session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.title}>{isSignUp ? 'Doctor Sign Up' : 'Doctor Sign In'}</Text>
        <Text style={styles.subtitle}>Use your doctor account to access patient records.</Text>

        <View style={styles.form}>
          {isSignUp ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Specialization (optional)"
                placeholderTextColor="#64748b"
                value={specialization}
                onChangeText={setSpecialization}
              />
            </>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#64748b"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          <Pressable style={styles.authButton} onPress={handleAuth} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.authButtonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => setIsSignUp(prev => !prev)} disabled={loading}>
            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 24,
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0f172a',
  },
  authButton: {
    marginTop: 8,
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchText: {
    textAlign: 'center',
    color: '#0369a1',
    marginTop: 8,
    fontWeight: '600',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
});
