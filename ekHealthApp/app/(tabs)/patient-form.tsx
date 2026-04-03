import { Colors } from '@/constants/theme';
import { useCurrentPatient } from '@/context/CurrentPatientContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  createPatientVisit,
  getDiagnosesByNrc,
  getDiagnosesByPatientVisitId,
  subscribeToDiagnosisChanges,
  subscribeToPatientVisitChanges,
} from '@/services/patientService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

export default function PatientFormScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { isHydrated, nrc: storedNrc, setCurrentPatient, visitId: storedVisitId } = useCurrentPatient();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasDiagnosisNotification, setHasDiagnosisNotification] = useState(false);
  const pendingSubmission = useRef<any | null>(null);

  // Responsive: on large screens (Windows desktop) add 30% whitespace on both ends
  const isLargeScreen = Platform.OS === 'web' && width >= 1024;
  const horizontalPadding = isLargeScreen ? '30%' : 20;

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

  const enteredNrc = personalDetails.nrc.trim();
  const diagnosisLookup = useMemo(
    () =>
      enteredNrc
        ? { nrc: enteredNrc, visitId: null as string | null }
        : { nrc: storedNrc, visitId: storedVisitId },
    [enteredNrc, storedNrc, storedVisitId]
  );

  const checkDiagnosisAvailability = useCallback(async () => {
    if (!isHydrated && !diagnosisLookup.nrc && !diagnosisLookup.visitId) {
      return;
    }

    if (!diagnosisLookup.nrc && !diagnosisLookup.visitId) {
      setHasDiagnosisNotification(false);
      return;
    }

    try {
      const result = diagnosisLookup.nrc
        ? await getDiagnosesByNrc(diagnosisLookup.nrc)
        : diagnosisLookup.visitId
          ? await getDiagnosesByPatientVisitId(diagnosisLookup.visitId)
          : null;

      if (!result || result.error) {
        setHasDiagnosisNotification(false);
        return;
      }

      setHasDiagnosisNotification(Boolean(result.data?.length));
    } catch (error) {
      setHasDiagnosisNotification(false);
    }
  }, [diagnosisLookup.nrc, diagnosisLookup.visitId, isHydrated]);

  useEffect(() => {
    void checkDiagnosisAvailability();
  }, [checkDiagnosisAvailability]);

  useEffect(() => {
    if (!diagnosisLookup.nrc && !diagnosisLookup.visitId) {
      return;
    }

    const refreshAvailability = () => {
      void checkDiagnosisAvailability();
    };

    const unsubscribeDiagnosisChanges = subscribeToDiagnosisChanges(refreshAvailability, {
      patientVisitId: diagnosisLookup.visitId,
    });
    const unsubscribePatientVisitChanges = subscribeToPatientVisitChanges(refreshAvailability, {
      nrc: diagnosisLookup.nrc,
      visitId: diagnosisLookup.visitId,
    });
    const intervalId = setInterval(refreshAvailability, 15000);

    return () => {
      clearInterval(intervalId);
      unsubscribeDiagnosisChanges();
      unsubscribePatientVisitChanges();
    };
  }, [checkDiagnosisAvailability, diagnosisLookup.nrc, diagnosisLookup.visitId]);

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

    const pulseNum = parseInt(diagnosisDetails.pulse, 10);
    const tempNum = parseFloat(diagnosisDetails.temperature);

    if (isNaN(pulseNum) || pulseNum <= 0) return 'Pulse rate must be a valid positive number';
    if (isNaN(tempNum) || tempNum <= 0) return 'Temperature must be a valid number';

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

  const getInputBackgroundColor = () => '#ffffff';
  const getCardBackgroundColor = () => '#ffffff';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f8f9fa' }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingHorizontal: horizontalPadding, paddingBottom: 40, paddingTop: 20 },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: '#000' }]}>Patient Registration</Text>
          <View style={styles.stepBadge}>
            <Text style={[styles.stepIndicator, { color: colors.tint }]}>Step {step} of 2</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
              style={[styles.outlineButton, styles.notificationButton, styles.diagnosisButton]}
              onPress={handleSeeDiagnosis}>
              {hasDiagnosisNotification ? <View style={styles.notificationDot} /> : null}
              <Text style={[styles.outlineButtonText, styles.diagnosisButtonText]}>See Diagnosis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outlineButton, { borderColor: colors.tint }]}
            onPress={() => router.replace('/landing')}>
            <Text style={[styles.outlineButtonText, { color: colors.tint }]}>Go Back Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step 1: Personal Details */}
      {step === 1 && (
        <View style={[styles.formCard, { backgroundColor: getCardBackgroundColor(), shadowColor: '#000' }]}>
          <Text style={[styles.sectionTitle, { color: '#000' }]}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#000' }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: getInputBackgroundColor(),
                  borderColor: '#ddd',
                  color: '#000',
                },
              ]}
              placeholder="Enter patient's full name"
              placeholderTextColor="#999"
              value={personalDetails.full_name}
              onChangeText={value => handlePersonalDetailChange('full_name', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#000' }]}>Phone Number</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: getInputBackgroundColor(),
                  borderColor: '#ddd',
                  color: '#000',
                },
              ]}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              value={personalDetails.phone}
              onChangeText={value => handlePersonalDetailChange('phone', value)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#000' }]}>NRC Number</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: getInputBackgroundColor(),
                  borderColor: '#ddd',
                  color: '#000',
                },
              ]}
              placeholder="Enter NRC number"
              placeholderTextColor="#999"
              value={personalDetails.nrc}
              onChangeText={value => handlePersonalDetailChange('nrc', value)}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
            onPress={() => {
              const msg = validatePersonalDetails();
              if (msg) {
                setErrorMessage(msg);
                setShowErrorModal(true);
                return;
              }
              setStep(2);
            }}>
            <Text style={styles.primaryButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Diagnosis Details */}
      {step === 2 && (
        <View style={[styles.formCard, { backgroundColor: getCardBackgroundColor(), shadowColor: '#000' }]}>
          <Text style={[styles.sectionTitle, { color: '#000' }]}>Clinical Assessment</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#000' }]}>Blood Pressure</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: getInputBackgroundColor(),
                  borderColor: '#ddd',
                  color: '#000',
                },
              ]}
              placeholder="e.g., 120/80"
              placeholderTextColor="#999"
              value={diagnosisDetails.blood_pressure}
              onChangeText={value => handleDiagnosisDetailChange('blood_pressure', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#000' }]}>Pulse Rate (bpm)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: getInputBackgroundColor(),
                  borderColor: '#ddd',
                  color: '#000',
                },
              ]}
              placeholder="Enter pulse rate"
              placeholderTextColor="#999"
              value={diagnosisDetails.pulse}
              onChangeText={value => handleDiagnosisDetailChange('pulse', value)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#000' }]}>Temperature (°C)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: getInputBackgroundColor(),
                  borderColor: '#ddd',
                  color: '#000',
                },
              ]}
              placeholder="Enter temperature"
              placeholderTextColor="#999"
              value={diagnosisDetails.temperature}
              onChangeText={value => handleDiagnosisDetailChange('temperature', value)}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#000' }]}>Sickness / Condition</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: getInputBackgroundColor(),
                  borderColor: '#ddd',
                  color: '#000',
                },
              ]}
              placeholder="Describe the patient's condition"
              placeholderTextColor="#999"
              value={diagnosisDetails.sickness}
              onChangeText={value => handleDiagnosisDetailChange('sickness', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#000' }]}>Intensity Level</Text>
            <View style={styles.intensityContainer}>
              {['low', 'medium', 'high', 'critical'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.intensityButton,
                    {
                      backgroundColor:
                        diagnosisDetails.intensity === level ? colors.tint : '#f0f0f0',
                    },
                  ]}
                  onPress={() => handleDiagnosisDetailChange('intensity', level)}>
                  <Text
                    style={[
                      styles.intensityButtonText,
                      {
                        color: diagnosisDetails.intensity === level ? '#fff' : '#000',
                        fontWeight: diagnosisDetails.intensity === level ? '600' : '500',
                      },
                    ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.tint }]}
              onPress={() => setStep(1)}>
              <Text style={[styles.secondaryButtonText, { color: colors.tint }]}>← Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.tint }]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Submit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: getCardBackgroundColor() }]}>
            <View style={styles.modalIconContainer}>
              <MaterialIcons name="assignment" size={36} color={colors.tint} />
            </View>
            <Text style={[styles.modalTitle, { color: '#000' }]}>Confirm Submission</Text>
            <Text style={[styles.modalText, { color: '#666' }]}>
              Please review all information before confirming. This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalCancelText}>Review</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirm, { backgroundColor: colors.tint }]}
                onPress={() => {
                  setShowConfirmModal(false);
                  if (pendingSubmission.current) performSubmit(pendingSubmission.current);
                }}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
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
          <View style={[styles.modalContainer, { backgroundColor: getCardBackgroundColor() }]}>
            <View style={styles.modalIconContainer}>
             <MaterialIcons name="error" size={36} color={colors.tint} />
            </View>
            <Text style={[styles.modalTitle, { color: '#000' }]}>Error</Text>
            <Text style={[styles.modalText, { color: '#666' }]}>{errorMessage}</Text>

            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowErrorModal(false)}>
                <Text style={styles.modalCancelText}>Close</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirm, { backgroundColor: colors.tint }]}
                onPress={() => {
                  setShowErrorModal(false);
                  if (pendingSubmission.current) performSubmit(pendingSubmission.current);
                }}>
                <Text style={styles.modalConfirmText}>Retry</Text>
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
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
    flexWrap: 'wrap',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  stepBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerActions: {
    gap: 10,
  },
  outlineButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  diagnosisButton: {
    borderColor: '#126148',
    backgroundColor: '#eefaf3',
  },
  diagnosisButtonText: {
    color: '#126148',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -4,
    left: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  outlineButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    letterSpacing: -0.2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 100,
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  intensityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 30,
    marginHorizontal: 2,
  },
  intensityButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIcon: {
    fontSize: 36,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalCancelText: {
    fontWeight: '600',
    color: '#666',
  },
  modalConfirm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});
