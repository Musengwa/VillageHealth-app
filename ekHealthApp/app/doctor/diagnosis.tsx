import {
  Diagnosis as DiagnosisRecord,
  createDiagnosis,
  getDiagnoses,
  getPatientVisits,
  PatientVisit,
  subscribeToDiagnosisChanges,
  subscribeToPatientVisitChanges,
  updatePatientVisit,
} from '@/services/patientService';
import { DoctorProfile, profileService } from '@/services/profileService';
import { supabase } from '@/services/supabase';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

type QueueTab = 'pending' | 'completed';
type DoctorStatus = 'online' | 'offline';

const completedStatuses = new Set(['completed', 'diagnosed']);

const palette = {
  background: '#f4f8ff',
  surface: '#ffffff',
  surfaceMuted: '#eef4ff',
  border: '#cddcff',
  borderStrong: '#9ab8ff',
  primary: '#1d4ed8',
  primarySoft: '#dbeafe',
  primaryDark: '#163eaf',
  text: '#102347',
  textMuted: '#5f739c',
  success: '#0f9f6e',
  successSoft: '#daf7ec',
  warning: '#d97706',
  warningSoft: '#fff1d7',
  shadow: 'rgba(16, 35, 71, 0.08)',
  overlay: 'rgba(10, 23, 54, 0.3)',
};

function isCompletedVisit(visit?: PatientVisit | null) {
  return completedStatuses.has((visit?.status || '').toLowerCase());
}

function formatDate(date?: string | null) {
  if (!date) return 'No date';
  return new Date(date).toLocaleString();
}

function buildDiagnosisMap(diagnoses: DiagnosisRecord[]) {
  return diagnoses.reduce<Record<string, DiagnosisRecord>>((acc, item) => {
    if (item.patient_visit_id && !acc[item.patient_visit_id]) {
      acc[item.patient_visit_id] = item;
    }
    return acc;
  }, {});
}

export default function DiagnosisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;
  const { width } = useWindowDimensions();

  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [patientVisits, setPatientVisits] = useState<PatientVisit[]>([]);
  const [latestDiagnoses, setLatestDiagnoses] = useState<Record<string, DiagnosisRecord>>({});
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patientId ?? null);
  const [activeTab, setActiveTab] = useState<QueueTab>('pending');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState<DoctorStatus | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const selectedPatientIdRef = useRef<string | null>(patientId ?? null);

  const pendingVisits = useMemo(
    () => patientVisits.filter(visit => !isCompletedVisit(visit)),
    [patientVisits]
  );
  const completedVisits = useMemo(
    () => patientVisits.filter(visit => isCompletedVisit(visit)),
    [patientVisits]
  );
  const selectedPatient =
    patientVisits.find(visit => visit.id === selectedPatientId) ||
    pendingVisits[0] ||
    completedVisits[0] ||
    null;
  const selectedDiagnosis = selectedPatient?.id ? latestDiagnoses[selectedPatient.id] : null;
  const selectedIsCompleted = isCompletedVisit(selectedPatient);
  const queueCount = pendingVisits.length;
  const completedCount = completedVisits.length;
  const showAvailability = (profile?.activity_status || 'online') === 'online';
  const visibleVisits = activeTab === 'pending' ? pendingVisits : completedVisits;
  const contentMaxWidth = width >= 1280 ? 1120 : width >= 1024 ? 980 : width >= 820 ? 760 : 680;
  const modalMaxWidth = width >= 1024 ? 760 : width >= 760 ? 660 : 520;
  const isCompactScreen = width < 480;
  const isNarrowScreen = width < 390;

  useEffect(() => {
    selectedPatientIdRef.current = selectedPatientId;
  }, [selectedPatientId]);

  const syncDraftForPatient = useCallback(
    (nextPatientId: string | null, diagnosisMap: Record<string, DiagnosisRecord>) => {
      setSelectedPatientId(nextPatientId);

      if (!nextPatientId) {
        setDiagnosis('');
        setPrescription('');
        setNotes('');
        return;
      }

      const existingDiagnosis = diagnosisMap[nextPatientId];
      if (existingDiagnosis) {
        setDiagnosis(existingDiagnosis.diagnosis || '');
        setPrescription(existingDiagnosis.prescription || '');
        setNotes(existingDiagnosis.notes || '');
        return;
      }

      setDiagnosis('');
      setPrescription('');
      setNotes('');
    },
    []
  );

  const applyWorkspaceData = useCallback(
    (
      visits: PatientVisit[],
      diagnosisMap: Record<string, DiagnosisRecord>,
      options?: { preferredPatientId?: string | null; preserveDraft?: boolean }
    ) => {
      const currentSelectedId = selectedPatientIdRef.current;
      const fallbackPatientId =
        (options?.preferredPatientId &&
          visits.some(visit => visit.id === options.preferredPatientId) &&
          options.preferredPatientId) ||
        (currentSelectedId && visits.some(visit => visit.id === currentSelectedId) && currentSelectedId) ||
        visits.find(visit => !isCompletedVisit(visit))?.id ||
        visits[0]?.id ||
        null;
      const fallbackVisit = fallbackPatientId
        ? visits.find(visit => visit.id === fallbackPatientId) || null
        : null;
      const shouldSyncDraft =
        !options?.preserveDraft ||
        !fallbackPatientId ||
        fallbackPatientId !== currentSelectedId ||
        Boolean(diagnosisMap[fallbackPatientId]) ||
        isCompletedVisit(fallbackVisit);

      setPatientVisits(visits);
      setLatestDiagnoses(diagnosisMap);

      if (fallbackVisit) {
        setActiveTab(isCompletedVisit(fallbackVisit) ? 'completed' : 'pending');
      }

      if (shouldSyncDraft) {
        syncDraftForPatient(fallbackPatientId, diagnosisMap);
        return;
      }

      setSelectedPatientId(fallbackPatientId);
    },
    [syncDraftForPatient]
  );

  const refreshWorkspaceData = useCallback(
    async ({
      preferredPatientId,
      isRefresh = false,
      silent = false,
      preserveDraft = false,
    }: {
      preferredPatientId?: string | null;
      isRefresh?: boolean;
      silent?: boolean;
      preserveDraft?: boolean;
    } = {}) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!silent) {
        setLoading(true);
      }

      try {
        const [visitsResult, diagnosesResult] = await Promise.all([getPatientVisits(), getDiagnoses()]);

        if (visitsResult.error) throw visitsResult.error;
        if (diagnosesResult.error) throw diagnosesResult.error;

        applyWorkspaceData(visitsResult.data || [], buildDiagnosisMap(diagnosesResult.data || []), {
          preferredPatientId,
          preserveDraft,
        });
      } catch (error: any) {
        Alert.alert('Unable to load doctor workspace', error?.message || 'Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyWorkspaceData]
  );

  useEffect(() => {
    let isActive = true;

    const initializeWorkspace = async () => {
      setLoading(true);

      try {
        const [doctorProfile, visitsResult, diagnosesResult] = await Promise.all([
          profileService.getOrCreateLoggedInDoctorProfile(),
          getPatientVisits(),
          getDiagnoses(),
        ]);

        if (!isActive) return;
        if (visitsResult.error) throw visitsResult.error;
        if (diagnosesResult.error) throw diagnosesResult.error;

        setProfile(doctorProfile);
        applyWorkspaceData(visitsResult.data || [], buildDiagnosisMap(diagnosesResult.data || []), {
          preferredPatientId: patientId ?? null,
        });
      } catch (error: any) {
        if ((error?.message || '').includes('No authenticated user found')) {
          router.replace('/doctor/login');
          return;
        }

        Alert.alert('Unable to load doctor workspace', error?.message || 'Please try again.');
      } finally {
        if (isActive) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void initializeWorkspace();

    return () => {
      isActive = false;
    };
  }, [applyWorkspaceData, patientId, router]);

  useEffect(() => {
    const handleRealtimeChange = () =>
      refreshWorkspaceData({
        preferredPatientId: patientId ?? selectedPatientIdRef.current,
        preserveDraft: true,
        silent: true,
      });

    const unsubscribeVisits = subscribeToPatientVisitChanges(handleRealtimeChange);
    const unsubscribeDiagnoses = subscribeToDiagnosisChanges(handleRealtimeChange);

    return () => {
      unsubscribeVisits();
      unsubscribeDiagnoses();
    };
  }, [patientId, refreshWorkspaceData]);

  const handleSelectPatient = (visit: PatientVisit) => {
    setActiveTab(isCompletedVisit(visit) ? 'completed' : 'pending');
    syncDraftForPatient(visit.id || null, latestDiagnoses);
    setIsPatientModalOpen(true);
  };

  const handleStatusChange = async (nextStatus: DoctorStatus) => {
    if (profile?.activity_status === nextStatus) return;

    setStatusSaving(nextStatus);
    try {
      const updatedProfile = await profileService.setDoctorStatus(nextStatus);
      setProfile(updatedProfile);
    } catch (error: any) {
      Alert.alert('Unable to update status', error?.message || 'Please try again.');
    } finally {
      setStatusSaving(null);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await profileService.setDoctorStatus('offline').catch(() => null);
      await supabase.auth.signOut();
      router.replace('/landing');
    } finally {
      setSigningOut(false);
    }
  };

  const submitDiagnosis = async () => {
    if (!selectedPatient?.id) {
      Alert.alert('Missing patient', 'Select a patient to complete the diagnosis.');
      return;
    }

    if (!diagnosis.trim()) {
      Alert.alert('Diagnosis required', 'Add the diagnosis before completing this visit.');
      return;
    }

    setSaving(true);
    try {
      const doctorProfile = profile || (await profileService.getOrCreateLoggedInDoctorProfile());
      const payload = {
        patient_visit_id: selectedPatient.id,
        doctor_id: doctorProfile.id,
        diagnosis: diagnosis.trim(),
        prescription: prescription.trim(),
        notes: notes.trim(),
      };

      const { data, error } = await createDiagnosis(payload);
      if (error) throw error;

      const visitUpdate = await updatePatientVisit(selectedPatient.id, {
        status: 'completed',
        doctor_id: doctorProfile.id,
      });
      if (visitUpdate.error) throw visitUpdate.error;

      const savedDiagnosis: DiagnosisRecord = {
        ...payload,
        id: data?.id,
        created_at: data?.created_at || new Date().toISOString(),
      };
      const nextDiagnosisMap = {
        ...latestDiagnoses,
        [selectedPatient.id]: savedDiagnosis,
      };

      setLatestDiagnoses(nextDiagnosisMap);
      setPatientVisits(prev =>
        prev.map(visit =>
          visit.id === selectedPatient.id
            ? { ...visit, status: 'completed', doctor_id: doctorProfile.id }
            : visit
        )
      );
      setActiveTab('completed');
      syncDraftForPatient(selectedPatient.id, nextDiagnosisMap);
      setIsPatientModalOpen(false);

      Alert.alert('Diagnosis completed', 'The patient has been moved to the completed list.');
    } catch (error: any) {
      Alert.alert('Unable to save diagnosis', error?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>Loading diagnosis workspace...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                refreshWorkspaceData({
                  preferredPatientId: selectedPatient?.id,
                  isRefresh: true,
                  preserveDraft: true,
                })
              }
              tintColor={palette.primary}
            />
          }
          showsVerticalScrollIndicator={false}>
          <View style={[styles.pageShell, { maxWidth: contentMaxWidth }]}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>Doctor Workspace</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && styles.buttonPressed,
                  signingOut && styles.buttonDisabled,
                ]}
                onPress={handleSignOut}
                disabled={signingOut}>
                <Text style={styles.signOutButtonText}>
                  {signingOut ? 'Signing Out...' : 'Log Out'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.availabilityCard}>
              <View style={styles.availabilityTopRow}>
                <View style={styles.availabilityNameBlock}>
                  <Text style={styles.profileNameDark}>
                    {profile?.name ? `Dr. ${profile.name}` : 'Doctor'}
                  </Text>
                  <Text style={styles.profileMetaDark}>
                    {profile?.specialization || 'General practice'}
                  </Text>
                </View>

                <View style={styles.availabilitySwitchBlock}>
                  <Text style={styles.availabilityLabel}>Show availability</Text>
                  <Switch
                    value={showAvailability}
                    onValueChange={value => handleStatusChange(value ? 'online' : 'offline')}
                    disabled={Boolean(statusSaving)}
                    trackColor={{ false: '#d7e3ff', true: '#8eb2ff' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              <View style={styles.availabilityMetaRow}>
                <View style={styles.metaPill}>
                  <MaterialIcons name="assignment-late" size={16} color={palette.primary} />
                  <Text style={styles.metaPillText}>{queueCount} Pending</Text>
                </View>
                <View style={styles.metaPill}>
                  <MaterialIcons name="check-circle" size={16} color={palette.success} />
                  <Text style={styles.metaPillText}>{completedCount} Completed</Text>
                </View>
                <View style={styles.metaPill}>
                  <MaterialIcons
                    name={showAvailability ? 'visibility' : 'visibility-off'}
                    size={18}
                    color={showAvailability ? palette.primary : palette.textMuted}
                  />
                  <Text style={styles.metaPillText}>
                    {statusSaving ? 'Saving...' : showAvailability ? 'Visible' : 'Hidden'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.segmentedCard}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleIcon}>
                  <MaterialIcons name="dashboard" size={18} color={palette.primary} />
                </View>
                <Text style={styles.sectionHeading}>Diagnosis Queue</Text>
              </View>

              <View style={styles.segmentedControl}>
                <Pressable
                  style={[
                    styles.segmentButton,
                    activeTab === 'pending' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setActiveTab('pending')}>
                  <MaterialIcons
                    name="assignment-late"
                    size={16}
                    color={activeTab === 'pending' ? palette.primary : palette.textMuted}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      activeTab === 'pending' && styles.segmentButtonTextActive,
                    ]}>
                    Pending
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.segmentButton,
                    activeTab === 'completed' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setActiveTab('completed')}>
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color={activeTab === 'completed' ? palette.primary : palette.textMuted}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      activeTab === 'completed' && styles.segmentButtonTextActive,
                    ]}>
                    Completed
                  </Text>
                </Pressable>
              </View>

              <View style={styles.queueList}>
                {visibleVisits.length ? (
                  visibleVisits.map(visit => {
                    const visitDiagnosis = visit.id ? latestDiagnoses[visit.id] : null;
                    const complete = isCompletedVisit(visit);

                    return (
                      <Pressable
                        key={visit.id || `${visit.full_name}-${visit.created_at}`}
                        style={({ pressed }) => [
                          styles.patientCard,
                          isCompactScreen && styles.patientCardCompact,
                          pressed && styles.cardPressed,
                        ]}
                        onPress={() => handleSelectPatient(visit)}>
                        <View style={styles.patientCardMain}>
                          <View style={[styles.patientAvatar, isCompactScreen && styles.patientAvatarCompact]}>
                            <MaterialIcons
                              name={complete ? 'check-circle' : 'local-hospital'}
                              size={isCompactScreen ? 22 : 26}
                              color={complete ? palette.success : palette.primary}
                            />
                          </View>

                          <View style={styles.patientCardBody}>
                            <View style={styles.patientCardTopRow}>
                              <View style={styles.patientCardHeader}>
                                <Text style={[styles.patientName, isCompactScreen && styles.patientNameCompact]}>
                                  {visit.full_name}
                                </Text>
                                <Text style={styles.patientMeta}>
                                  {visit.sickness || 'General visit'}
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.badge,
                                  complete ? styles.completedBadge : styles.pendingBadge,
                                ]}>
                                <Text
                                  style={[
                                    styles.badgeText,
                                    complete ? styles.completedBadgeText : styles.pendingBadgeText,
                                  ]}>
                                  {complete ? 'Completed' : 'Pending'}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.patientFactsRow}>
                              <View style={styles.inlineFact}>
                                <MaterialIcons name="call" size={14} color={palette.primary} />
                                <Text style={styles.inlineFactText} numberOfLines={1}>
                                  {visit.phone}
                                </Text>
                              </View>
                              <View style={styles.inlineFact}>
                                <MaterialIcons name="badge" size={14} color={palette.primary} />
                                <Text style={styles.inlineFactText} numberOfLines={1}>
                                  {visit.nrc}
                                </Text>
                              </View>
                              <View style={styles.inlineFact}>
                                <MaterialIcons
                                  name="device-thermostat"
                                  size={14}
                                  color={palette.primary}
                                />
                                <Text style={styles.inlineFactText}>
                                  {visit.temperature ?? '-'} deg C
                                </Text>
                              </View>
                              <View style={styles.inlineFact}>
                                <MaterialIcons name="schedule" size={14} color={palette.primary} />
                                <Text style={styles.inlineFactText} numberOfLines={1}>
                                  {formatDate(visit.created_at)}
                                </Text>
                              </View>
                            </View>

                            <View style={[styles.patientFooter, isCompactScreen && styles.patientFooterStack]}>
                              <Text
                                style={visitDiagnosis ? styles.previewText : styles.previewPlaceholder}
                                numberOfLines={2}>
                                {visitDiagnosis?.diagnosis ||
                                  (complete
                                    ? 'Open to review the saved diagnosis.'
                                    : 'Tap to open the diagnosis form.')}
                              </Text>
                              <View style={[styles.openPill, isCompactScreen && styles.openPillCompact]}>
                                <Text style={styles.openPillText}>
                                  {complete ? 'View' : 'Diagnose'}
                                </Text>
                                <MaterialIcons name="arrow-forward" size={16} color={palette.primary} />
                              </View>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>
                      {activeTab === 'pending'
                        ? 'No uncompleted diagnoses right now'
                        : 'No completed diagnoses yet'}
                    </Text>
                    <Text style={styles.emptyStateText}>
                      {activeTab === 'pending'
                        ? 'New patient visits will appear here automatically.'
                        : 'Completed diagnoses will move here as soon as you finish them.'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={isPatientModalOpen && Boolean(selectedPatient)}
          transparent
          animationType="fade"
          onRequestClose={() => setIsPatientModalOpen(false)}>
          <View style={[styles.modalOverlay, isCompactScreen && styles.modalOverlayCompact]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalKeyboard}>
              <View style={[styles.modalCard, isCompactScreen && styles.modalCardCompact, { maxWidth: modalMaxWidth }]}>
                {selectedPatient ? (
                  <ScrollView
                    contentContainerStyle={styles.modalScrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalTitleWrap}>
                        <Text style={[styles.modalTitle, isCompactScreen && styles.modalTitleCompact]}>
                          {selectedPatient.full_name}
                        </Text>
                        <Text style={styles.modalSubtitle}>
                          {selectedPatient.sickness || 'General visit'}
                        </Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.modalCloseButton,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={() => setIsPatientModalOpen(false)}>
                        <MaterialIcons name="close" size={20} color={palette.text} />
                      </Pressable>
                    </View>

                    <View style={styles.modalFactsRow}>
                      <View style={[styles.infoChip, isNarrowScreen && styles.infoChipFull]}>
                        <MaterialIcons name="call" size={16} color={palette.primary} />
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue}>{selectedPatient.phone}</Text>
                      </View>
                      <View style={[styles.infoChip, isNarrowScreen && styles.infoChipFull]}>
                        <MaterialIcons name="badge" size={16} color={palette.primary} />
                        <Text style={styles.infoLabel}>NRC</Text>
                        <Text style={styles.infoValue}>{selectedPatient.nrc}</Text>
                      </View>
                      <View style={[styles.infoChip, isNarrowScreen && styles.infoChipFull]}>
                        <MaterialIcons name="favorite-border" size={16} color={palette.primary} />
                        <Text style={styles.infoLabel}>Pulse</Text>
                        <Text style={styles.infoValue}>{selectedPatient.pulse ?? '-'} bpm</Text>
                      </View>
                      <View style={[styles.infoChip, isNarrowScreen && styles.infoChipFull]}>
                        <MaterialIcons name="device-thermostat" size={16} color={palette.primary} />
                        <Text style={styles.infoLabel}>Temperature</Text>
                        <Text style={styles.infoValue}>{selectedPatient.temperature ?? '-'} deg C</Text>
                      </View>
                    </View>

                    {selectedIsCompleted ? (
                      <View style={styles.completedPanel}>
                        <View style={styles.readOnlyBlock}>
                          <Text style={styles.readOnlyLabel}>Diagnosis</Text>
                          <Text style={styles.readOnlyValue}>
                            {selectedDiagnosis?.diagnosis || 'No diagnosis saved.'}
                          </Text>
                        </View>

                        <View style={styles.readOnlyBlock}>
                          <Text style={styles.readOnlyLabel}>Prescription</Text>
                          <Text style={styles.readOnlyValue}>
                            {selectedDiagnosis?.prescription || 'No prescription added.'}
                          </Text>
                        </View>

                        <View style={styles.readOnlyBlock}>
                          <Text style={styles.readOnlyLabel}>Notes</Text>
                          <Text style={styles.readOnlyValue}>
                            {selectedDiagnosis?.notes || 'No extra notes added.'}
                          </Text>
                        </View>

                        <Text style={styles.completedTimestamp}>
                          Completed {formatDate(selectedDiagnosis?.created_at)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.formCard}>
                        <Text style={styles.formIntro}>
                          Complete the diagnosis here. Once you submit, this visit moves straight
                          to the completed list.
                        </Text>

                        <Text style={styles.fieldLabel}>Diagnosis</Text>
                        <TextInput
                          style={[styles.input, styles.tallInput]}
                          multiline
                          textAlignVertical="top"
                          value={diagnosis}
                          onChangeText={setDiagnosis}
                          placeholder="Explain the diagnosis clearly"
                          placeholderTextColor={palette.textMuted}
                        />

                        <Text style={styles.fieldLabel}>Prescription</Text>
                        <TextInput
                          style={[styles.input, styles.mediumInput]}
                          multiline
                          textAlignVertical="top"
                          value={prescription}
                          onChangeText={setPrescription}
                          placeholder="Medicine, dosage, and instructions"
                          placeholderTextColor={palette.textMuted}
                        />

                        <Text style={styles.fieldLabel}>Notes</Text>
                        <TextInput
                          style={[styles.input, styles.mediumInput]}
                          multiline
                          textAlignVertical="top"
                          value={notes}
                          onChangeText={setNotes}
                          placeholder="Add any follow-up notes"
                          placeholderTextColor={palette.textMuted}
                        />

                        <Pressable
                          style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.buttonPressed,
                            saving && styles.buttonDisabled,
                          ]}
                          onPress={submitDiagnosis}
                          disabled={saving}>
                          <MaterialIcons name="send" size={16} color="#ffffff" />
                          <Text style={styles.primaryButtonText}>
                            {saving ? 'Saving Diagnosis...' : 'Complete Diagnosis'}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </ScrollView>
                ) : null}
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: palette.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    paddingBottom: 36,
  },
  pageShell: {
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: palette.primary,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  signOutButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  signOutButtonText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  availabilityCard: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  availabilityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  availabilityNameBlock: {
    flex: 1,
    paddingRight: 12,
  },
  profileNameDark: {
    color: palette.text,
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 4,
  },
  profileMetaDark: {
    color: palette.textMuted,
    fontSize: 14,
  },
  availabilitySwitchBlock: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  availabilityLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  availabilityMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  metaPillText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  segmentedCard: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 24,
    padding: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionHeading: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '800',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceMuted,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: palette.surface,
    shadowColor: '#6f9cff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 2,
  },
  segmentButtonText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  segmentButtonTextActive: {
    color: palette.primary,
  },
  queueList: {
    gap: 12,
  },
  patientCard: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 22,
    padding: 16,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 2,
  },
  patientCardCompact: {
    padding: 14,
  },
  cardPressed: {
    opacity: 0.94,
  },
  patientCardMain: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  patientAvatar: {
    width: 68,
    minHeight: 122,
    borderRadius: 18,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    paddingHorizontal: 10,
  },
  patientAvatarCompact: {
    width: 56,
    minHeight: 104,
    marginRight: 12,
  },
  patientCardBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  patientCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  patientCardHeader: {
    flex: 1,
    paddingRight: 12,
  },
  patientName: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  patientNameCompact: {
    fontSize: 16,
  },
  patientMeta: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  patientFactsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  inlineFact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginBottom: 8,
    maxWidth: '100%',
  },
  inlineFactText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    flexShrink: 1,
  },
  patientFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientFooterStack: {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  previewText: {
    color: palette.primaryDark,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    paddingRight: 12,
  },
  previewPlaceholder: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    paddingRight: 12,
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  openPillCompact: {
    marginTop: 10,
  },
  openPillText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '800',
    marginRight: 6,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pendingBadge: {
    backgroundColor: palette.warningSoft,
  },
  pendingBadgeText: {
    color: palette.warning,
  },
  completedBadge: {
    backgroundColor: palette.successSoft,
  },
  completedBadgeText: {
    color: palette.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.overlay,
    paddingHorizontal: 18,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  modalOverlayCompact: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  modalKeyboard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: palette.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 6,
  },
  modalCardCompact: {
    maxHeight: '96%',
    padding: 14,
    borderRadius: 22,
  },
  modalScrollContent: {
    paddingBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  modalTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalTitleCompact: {
    fontSize: 20,
  },
  modalSubtitle: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFactsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  infoChip: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  infoChipFull: {
    flexBasis: '100%',
  },
  infoLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 6,
  },
  infoValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  completedPanel: {
    backgroundColor: '#f9fbff',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 22,
    padding: 16,
  },
  readOnlyBlock: {
    marginBottom: 16,
  },
  readOnlyLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  readOnlyValue: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 22,
  },
  completedTimestamp: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#f9fbff',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 22,
    padding: 16,
  },
  formIntro: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  fieldLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.text,
    fontSize: 15,
    marginBottom: 14,
  },
  tallInput: {
    minHeight: 112,
  },
  mediumInput: {
    minHeight: 92,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  emptyState: {
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
