import { DoctorProfile, profileService } from '@/services/profileService';
import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HelloDoctor() {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const p = await profileService.getOrCreateLoggedInDoctorProfile();
        if (mounted) setProfile(p);
      } catch {
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        await profileService.setDoctorStatus(user.id, 'offline').catch(() => null);
      }

      await supabase.auth.signOut();
    } finally {
      router.replace('/landing');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello{profile?.name ? `, Dr. ${profile.name}` : ', Doctor'}</Text>
      {profile ? (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={styles.subtitle}>{profile.specialization || 'General Doctor'}</Text>
          <Text>Status: {profile.activity_status || 'offline'}</Text>
          {profile.created_at ? <Text>Joined: {new Date(profile.created_at).toLocaleDateString()}</Text> : null}
        </View>
      ) : (
        <Text style={{ marginTop: 12 }}>No profile data found.</Text>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#007AFF', marginTop: 18 }]}
        onPress={async () => {
          try {
            await profileService.getOrCreateLoggedInDoctorProfile();
            router.replace('/doctor/patients');
          } catch (e) {
            Alert.alert('Session required', 'Please login first.');
            router.replace('/doctor/login');
          }
        }}>
        <Text style={styles.buttonText}>See Patients</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 12 },
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
