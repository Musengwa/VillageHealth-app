import { Colors } from '@/constants/theme';
import { useCurrentPatient } from '@/context/CurrentPatientContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createPatientVisit } from '@/services/patientService';
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
  const { setCurrentPatient } = useCurrentPatient();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pendingSubmission = useRef<any | null>(null);

  const [personalDetails, setPersonalDetails] = useState({
    full_name: '',
    phone: '',
    nrc: '',
  });

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

      pendingSubmission.current = null;
      const visitId = data?.id ? String(data.id) : null;

      await setCurrentPatient({
        fullName: patientData.full_name ?? null,
        nrc: patientData.nrc ?? null,
        visitId,
      });

      if (visitId) {
        router.push(`/(tabs)/see-diagnosis?visitId=${visitId}`);
        return;
      }

      router.push('/(tabs)/see-diagnosis');
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
      pulse: parseInt(diagnosisDetails.pulse, 10),
      status: 'waiting',
      temperature: parseFloat(diagnosisDetails.temperature),
    };

    pendingSubmission.current = patientData;
    setShowConfirmModal(true);
  };

  const handleSeeDiagnosis = () => {
    const nrc = personalDetails.nrc.trim();
    const fullName = personalDetails.full_name.trim();

    void setCurrentPatient({
      fullName: fullName || null,
      nrc: nrc || null,
      visitId: null,
    });

    if (nrc) {
      router.push(`/(tabs)/see-diagnosis?nrc=${encodeURIComponent(nrc)}`);
      return;
    }

    router.push('/(tabs)/see-diagnosis');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Patient Registration</Text>
          <Text style={[styles.stepIndicator, { color: colors.tabIconDefault }]}>Step {step} of 2</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.seeButton, { borderColor: colors.tabIconDefault }]}
            onPress={handleSeeDiagnosis}>
            <Text style={[styles.seeButtonText, { color: colors.text }]}>See Diagnosis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.seeButton, { borderColor: colors.tint, backgroundColor: '#ffffff' }]}
            onPress={() => router.replace('/landing')}>
            <Text style={[styles.seeButtonText, { color: colors.tint }]}>Go Back Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      {step === 1 && (
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Details</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: '#ffffff',
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
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
                  backgroundColor: '#ffffff',
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
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
                  backgroundColor: '#ffffff',
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
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

      {step === 2 && (
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Diagnosis Details</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Blood Pressure</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: '#ffffff',
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
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
                  backgroundColor: '#ffffff',
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
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
            <Text style={[styles.label, { color: colors.text }]}>Temperature (C)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: '#ffffff',
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
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
                  backgroundColor: '#ffffff',
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
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
                        diagnosisDetails.intensity === level ? colors.tint : '#e7f5ea',
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
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Submission</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              Are you sure you want to send this form? Please review your information before confirming.
            </Text>

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

      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Success</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>Patient visit recorded successfully.</Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  setStep(1);
                  setPersonalDetails({ full_name: '', phone: '', nrc: '' });
                  setDiagnosisDetails({
                    blood_pressure: '',
                    intensity: 'low',
                    pulse: '',
                    sickness: '',
                    temperature: '',
                  });
                }}>
                <Text style={styles.modalButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showErrorModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowErrorModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: '#ffffff' }]}>
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerCopy: {
    flex: 1,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 10,
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
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    borderRadius: 8,
    borderWidth: 1.5,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  intensityButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  intensityButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 30,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 12,
    elevation: 5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    width: '100%',
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
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalCancel: {
    backgroundColor: 'transparent',
    borderColor: '#b9d5bf',
    borderWidth: 1.2,
  },
  modalCancelText: {
    color: '#2c5a38',
    fontWeight: '600',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
