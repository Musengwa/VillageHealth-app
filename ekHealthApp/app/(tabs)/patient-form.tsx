import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createPatientVisit } from '@/services/patientService';
import { setLastNrc, setLastVisitId } from '@/services/visitStore';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Personal Details, Step 2: Diagnosis Details
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pendingSubmission = useRef<any | null>(null);

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

  const validatePersonalDetails = (): string | null => {
    if (!personalDetails.full_name.trim()) return 'Please enter patient name';
    if (!personalDetails.phone.trim()) return 'Please enter phone number';
    if (!personalDetails.nrc.trim()) return 'Please enter NRC number';
    return null;
  };

  const validateDiagnosisDetails = (): string | null => {
    if (!diagnosisDetails.blood_pressure.trim()) return 'Please enter blood pressure';
    if (!diagnosisDetails.pulse.trim()) return 'Please enter pulse rate';
    if (!diagnosisDetails.temperature.trim()) return 'Please enter temperature';
    if (!diagnosisDetails.sickness.trim()) return "Please describe the patient's condition";
    return null;
  };

  const performSubmit = async (patientData: any) => {
    setLoading(true);
    try {
      const { data, error } = await createPatientVisit(patientData);

      if (error) {
        throw error;
      }

      // Navigate directly to the diagnoses page for this visit
      pendingSubmission.current = null;
      const visitId = data?.id;
      if (visitId) {
        setLastVisitId(String(visitId));
        setLastNrc(patientData.nrc ?? null);
        router.push(`/(tabs)/see-diagnosis?visitId=${visitId}`);
      } else {
        setLastVisitId(null);
        setLastNrc(patientData.nrc ?? null);
        router.push('/(tabs)/see-diagnosis');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setErrorMessage(err?.message ?? 'Failed to record patient visit');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const validationMsg = validateDiagnosisDetails();
    if (validationMsg) {
      setErrorMessage(validationMsg);
      setShowErrorModal(true);
      return;
    }

    const patientData = {
      ...personalDetails,
      ...diagnosisDetails,
      pulse: parseInt(diagnosisDetails.pulse),
      temperature: parseFloat(diagnosisDetails.temperature),
      status: 'waiting',
    };

    // Save pending submission so "Retry" can reuse it
    pendingSubmission.current = patientData;

    // Show confirmation modal before actually sending
    setShowConfirmModal(true);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Patient Registration</Text>
          <Text style={[styles.stepIndicator, { color: colors.tabIconDefault }]}>Step {step} of 2</Text>
        </View>

        <TouchableOpacity
          style={[styles.seeButton, { borderColor: colors.tabIconDefault }]}
          onPress={() => router.push('/(tabs)/see-diagnosis')}
        >
          <Text style={[styles.seeButtonText, { color: colors.text }]}>See Diagnosis</Text>
        </TouchableOpacity>
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
              const msg = validatePersonalDetails();
              if (msg) {
                setErrorMessage(msg);
                setShowErrorModal(true);
                return;
              }
              setStep(2);
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
      {/* Confirmation Modal (Are you sure?) */}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Submission</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>Are you sure you want to send this form? Please review your information before confirming.</Text>

            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalCancelText}>Review</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={() => {
                  setShowConfirmModal(false);
                  if (pendingSubmission.current) performSubmit(pendingSubmission.current);
                }}>
                <Text style={styles.modalButtonText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Success</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>Patient visit recorded successfully.</Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  setStep(1);
                  setPersonalDetails({ full_name: '', phone: '', nrc: '' });
                  setDiagnosisDetails({ blood_pressure: '', pulse: '', temperature: '', sickness: '', intensity: 'mild' });
                }}>
                <Text style={styles.modalButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowErrorModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Error</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>{errorMessage}</Text>

            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowErrorModal(false)}>
                <Text style={styles.modalCancelText}>Close</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={() => {
                  setShowErrorModal(false);
                  if (pendingSubmission.current) performSubmit(pendingSubmission.current);
                }}>
                <Text style={styles.modalButtonText}>Retry</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  seeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  seeButtonText: {
    fontSize: 14,
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: '#ccc',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
