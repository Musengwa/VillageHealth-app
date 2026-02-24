import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createPatientVisit } from '@/services/patientService';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PatientFormScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Personal Details, Step 2: Diagnosis Details

  // Personal Details State
  const [personalDetails, setPersonalDetails] = useState({
    full_name: '',
    phone: '',
    nrc: '',
  });

  // Diagnosis Details State
  const [diagnosisDetails, setDiagnosisDetails] = useState({
    blood_pressure: '',
    pulse: '',
    temperature: '',
    sickness: '',
    intensity: 'low',
  });

  const handlePersonalDetailChange = (field: string, value: string) => {
    setPersonalDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleDiagnosisDetailChange = (field: string, value: string) => {
    setDiagnosisDetails(prev => ({ ...prev, [field]: value }));
  };

  const validatePersonalDetails = () => {
    if (!personalDetails.full_name.trim()) {
      Alert.alert('Validation Error', 'Please enter patient name');
      return false;
    }
    if (!personalDetails.phone.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number');
      return false;
    }
    if (!personalDetails.nrc.trim()) {
      Alert.alert('Validation Error', 'Please enter NRC number');
      return false;
    }
    return true;
  };

  const validateDiagnosisDetails = () => {
    if (!diagnosisDetails.blood_pressure.trim()) {
      Alert.alert('Validation Error', 'Please enter blood pressure');
      return false;
    }
    if (!diagnosisDetails.pulse.trim()) {
      Alert.alert('Validation Error', 'Please enter pulse rate');
      return false;
    }
    if (!diagnosisDetails.temperature.trim()) {
      Alert.alert('Validation Error', 'Please enter temperature');
      return false;
    }
    if (!diagnosisDetails.sickness.trim()) {
      Alert.alert('Validation Error', 'Please describe the sickness');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateDiagnosisDetails()) return;

    setLoading(true);
    try {
      const patientData = {
        ...personalDetails,
        ...diagnosisDetails,
        pulse: parseInt(diagnosisDetails.pulse),
        temperature: parseFloat(diagnosisDetails.temperature),
        status: 'waiting',
      };

      const { data, error } = await createPatientVisit(patientData);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Patient visit recorded successfully', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setStep(1);
            setPersonalDetails({ full_name: '', phone: '', nrc: '' });
            setDiagnosisDetails({ blood_pressure: '', pulse: '', temperature: '', sickness: '', intensity: 'mild' });
          },
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to record patient visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Patient Registration</Text>
        <Text style={[styles.stepIndicator, { color: colors.tabIconDefault }]}>
          Step {step} of 2
        </Text>
      </View>

      {/* Step 1: Personal Details */}
      {step === 1 && (
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Details</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Enter patient's full name"
              placeholderTextColor={colors.tabIconDefault}
              value={personalDetails.full_name}
              onChangeText={value => handlePersonalDetailChange('full_name', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Enter phone number"
              placeholderTextColor={colors.tabIconDefault}
              value={personalDetails.phone}
              onChangeText={value => handlePersonalDetailChange('phone', value)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>NRC Number</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Enter NRC number"
              placeholderTextColor={colors.tabIconDefault}
              value={personalDetails.nrc}
              onChangeText={value => handlePersonalDetailChange('nrc', value)}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={() => {
              if (validatePersonalDetails()) {
                setStep(2);
              }
            }}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Diagnosis Details */}
      {step === 2 && (
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Diagnosis Details</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Blood Pressure</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="e.g., 120/80"
              placeholderTextColor={colors.tabIconDefault}
              value={diagnosisDetails.blood_pressure}
              onChangeText={value => handleDiagnosisDetailChange('blood_pressure', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Pulse Rate (bpm)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Enter pulse rate"
              placeholderTextColor={colors.tabIconDefault}
              value={diagnosisDetails.pulse}
              onChangeText={value => handleDiagnosisDetailChange('pulse', value)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Temperature (°C)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Enter temperature"
              placeholderTextColor={colors.tabIconDefault}
              value={diagnosisDetails.temperature}
              onChangeText={value => handleDiagnosisDetailChange('temperature', value)}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Sickness/Condition</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Describe the patient's condition"
              placeholderTextColor={colors.tabIconDefault}
              value={diagnosisDetails.sickness}
              onChangeText={value => handleDiagnosisDetailChange('sickness', value)}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Intensity</Text>
            <View style={styles.intensityContainer}>
              {['low', 'medium', 'high', 'critical'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.intensityButton,
                    {
                      backgroundColor:
                        diagnosisDetails.intensity === level ? colors.tint : colors.tabIconDefault,
                    },
                  ]}
                  onPress={() => handleDiagnosisDetailChange('intensity', level)}>
                  <Text
                    style={[
                      styles.intensityButtonText,
                      {
                        color: diagnosisDetails.intensity === level ? '#fff' : colors.text,
                      },
                    ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: colors.tint }]}
              onPress={() => setStep(1)}>
              <Text style={[styles.buttonText, { color: colors.tint }]}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  intensityButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  intensityButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 30,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  secondaryButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#20b7f3',
  },
});
