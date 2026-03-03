import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createDiagnosis, updatePatientVisit } from '@/services/patientService';
import { profileService } from '@/services/profileService';
import { useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function DiagnosisScreen() {
  const router = useRouter();
  const route: any = useRoute();
  const patientId = (route?.params?.patientId as string) || undefined;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const markAttended = async () => {
      if (!patientId) return;
      try {
        const doctor = await profileService.getOrCreateLoggedInDoctorProfile();
        // mark the visit as attended and assign doctor
        await updatePatientVisit(patientId, { status: 'completed', doctor_id: doctor?.id }).catch(() => null);
      } catch (e) {
        // ignore errors here — non-critical
        if (!mounted) return;
      }
    };
    markAttended();
    return () => {
      mounted = false;
    };
  }, [patientId]);

  const submit = async () => {
    if (!patientId) {
      Alert.alert('Missing patient', 'No patient selected.');
      return;
    }
    if (!diagnosis.trim()) {
      Alert.alert('Validation', 'Please enter a diagnosis.');
      return;
    }

    setLoading(true);
    try {
      const doctor = await profileService.getOrCreateLoggedInDoctorProfile();
      const payload = {
        patient_visit_id: patientId,
        doctor_id: doctor.id,
        diagnosis: diagnosis.trim(),
        prescription: prescription.trim(),
        notes: notes.trim(),
      };

      const { data, error } = await createDiagnosis(payload as any);
      if (error) throw error;

      // Optionally update patient visit status to 'diagnosed'
      await updatePatientVisit(patientId, { status: 'diagnosed' }).catch(() => null);

      Alert.alert('Success', 'Diagnosis submitted.');
      router.back();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message || 'Failed to submit diagnosis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.text }]}>Send Diagnosis</Text>
        <Text style={[styles.label, { color: colors.text }]}>Diagnosis</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.tint }]}
          multiline
          value={diagnosis}
          onChangeText={setDiagnosis}
          placeholder="Diagnosis details"
          placeholderTextColor={colors.tabIconDefault}
        />

        <Text style={[styles.label, { color: colors.text }]}>Prescription</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.tint }]}
          multiline
          value={prescription}
          onChangeText={setPrescription}
          placeholder="Medicine / dosage"
          placeholderTextColor={colors.tabIconDefault}
        />

        <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.tint }]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes"
          placeholderTextColor={colors.tabIconDefault}
        />

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.tint }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.cancel]} onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.tabIconDefault }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, flex: 1 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 44, marginTop: 6 },
  button: { marginTop: 20, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  cancel: { marginTop: 12, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
