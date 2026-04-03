import { useCurrentPatient } from '@/context/CurrentPatientContext';
import {
  Diagnosis as DiagnosisRecord,
  getDiagnosesByNrc,
  getDiagnosesByPatientVisitId,
  subscribeToDiagnosisChanges,
  subscribeToPatientVisitChanges,
} from '@/services/patientService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

const palette = {
  background: '#f7fefc',
  surface: '#ffffff',
  surfaceMuted: '#e9f9f4',
  border: '#d5ebe3',
  primary: '#126148',
  primarySoft: '#eefcf8',
  primaryDark: '#0c7e58',
  text: 'rgb(0, 0, 0)',
  textMuted: '#085b3f',
  success: '#4f8070',
  successSoft: '#daf7ec',
  warning: '#d97706',
  warningSoft: '#fff1d7',
  shadow: 'rgba(16, 35, 71, 0.08)',
};

function normalizeParam(value?: string | string[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatDate(date?: string | null) {
  if (!date) {
    return 'Just now';
  }

  return new Date(date).toLocaleString();
}

function formatSyncTime(date?: string | null) {
  if (!date) {
    return 'Waiting for sync';
  }

  return `Updated ${new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

export default function SeeDiagnosis() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ nrc?: string | string[]; visitId?: string | string[] }>();
  const { isHydrated, nrc: storedNrc, setCurrentPatient, visitId: storedVisitId } = useCurrentPatient();

  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const routeVisitId = normalizeParam(params.visitId);
  const routeNrc = normalizeParam(params.nrc);
  const pageMaxWidth = width >= 1024 ? Math.min(width * 0.5, 760) : 760;
  const isCompact = width < 560;

  const activePatient = useMemo(
    () => ({
      nrc: routeNrc ?? storedNrc,
      visitId: routeVisitId ?? storedVisitId,
    }),
    [routeNrc, routeVisitId, storedNrc, storedVisitId]
  );

  useEffect(() => {
    if (!routeNrc && !routeVisitId) {
      return;
    }

    void setCurrentPatient({
      nrc: routeNrc ?? null,
      visitId: routeVisitId ?? null,
    });
  }, [routeNrc, routeVisitId, setCurrentPatient]);

  const fetchDiagnoses = useCallback(
    async ({ isRefresh = false, silent = false }: { isRefresh?: boolean; silent?: boolean } = {}) => {
      if (!isHydrated && !routeNrc && !routeVisitId) {
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else if (!silent) {
        setLoading(true);
      }

      try {
        let result:
          | Awaited<ReturnType<typeof getDiagnosesByNrc>>
          | Awaited<ReturnType<typeof getDiagnosesByPatientVisitId>>
          | null = null;

        if (activePatient.nrc) {
          result = await getDiagnosesByNrc(activePatient.nrc);
        } else if (activePatient.visitId) {
          result = await getDiagnosesByPatientVisitId(activePatient.visitId);
        }

        if (!result || result.error) {
          if (result?.error) {
            console.error('Failed to load diagnoses', result.error);
          }
          setDiagnoses([]);
          return;
        }

        setDiagnoses(result.data ?? []);
        setLastUpdatedAt(new Date().toISOString());
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activePatient.nrc, activePatient.visitId, isHydrated, routeNrc, routeVisitId]
  );

  useEffect(() => {
    void fetchDiagnoses();
  }, [fetchDiagnoses]);

  useEffect(() => {
    if (!activePatient.nrc && !activePatient.visitId) {
      return;
    }

    const refreshDiagnoses = () => {
      void fetchDiagnoses({ silent: true });
    };

    const unsubscribeDiagnosisChanges = subscribeToDiagnosisChanges(refreshDiagnoses, {
      patientVisitId: activePatient.visitId,
    });
    const unsubscribePatientVisitChanges = subscribeToPatientVisitChanges(refreshDiagnoses, {
      nrc: activePatient.nrc,
      visitId: activePatient.visitId,
    });
    const intervalId = setInterval(refreshDiagnoses, 15000);

    return () => {
      clearInterval(intervalId);
      unsubscribeDiagnosisChanges();
      unsubscribePatientVisitChanges();
    };
  }, [activePatient.nrc, activePatient.visitId, fetchDiagnoses]);

  const emptyMessage =
    activePatient.visitId || activePatient.nrc
      ? 'No diagnosis yet. This page will update automatically when the doctor responds.'
      : 'No diagnosis is linked to this patient yet.';
  const displayedNrc = activePatient.nrc || 'Not available';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void fetchDiagnoses({ isRefresh: true })}
            tintColor={palette.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={[styles.pageShell, { maxWidth: pageMaxWidth }]}>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>See Diagnosis</Text>
                <Text style={styles.heroSubtitle}>
                  {activePatient.nrc
                    ? `Tracking updates for NRC ${activePatient.nrc}`
                    : 'Tracking the latest diagnosis for the selected patient'}
                </Text>
              </View>

              <View style={[styles.heroActions, isCompact && styles.heroActionsCompact]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => void fetchDiagnoses({ isRefresh: true })}>
                  <MaterialIcons name="refresh" size={18} color={palette.primary} />
                  <Text style={styles.secondaryButtonText}>
                    {refreshing ? 'Refreshing' : 'Refresh'}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => router.replace('/landing')}>
                  <MaterialIcons name="home" size={18} color={palette.primary} />
                  <Text style={styles.secondaryButtonText}>Home</Text>
                </Pressable>
              </View>
            </View>

              <View style={styles.heroMetaRow}>
                <View style={styles.metaPill}>
                  <MaterialIcons name="badge" size={16} color={palette.primary} />
                  <Text style={styles.metaPillText}>NRC: {displayedNrc}</Text>
                </View>
              <View style={styles.metaPill}>
                <MaterialIcons name="schedule" size={16} color={palette.success} />
                <Text style={styles.metaPillText}>{formatSyncTime(lastUpdatedAt)}</Text>
              </View>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={palette.primary} size="large" />
              <Text style={styles.loadingText}>Checking for diagnosis updates...</Text>
            </View>
          ) : diagnoses.length ? (
            <View style={styles.cardStack}>
              {diagnoses.map((item, index) => (
                <View key={item.id ?? `${item.patient_visit_id}-${index}`} style={styles.diagnosisCard}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardEyebrow}>
                        {index === 0 ? 'Latest Reply' : `Reply ${index + 1}`}
                      </Text>
                      <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
                    </View>
                    <View style={styles.readyBadge}>
                      <Text style={styles.readyBadgeText}>Doctor Reply</Text>
                    </View>
                  </View>

                  <View style={[styles.diagnosisBody, isCompact && styles.diagnosisBodyCompact]}>
                    <View style={styles.replyColumn}>
                      <View style={styles.replyBubble}>
                        <View style={styles.replyTitleRow}>
                          <MaterialIcons name="forum" size={18} color={palette.primary} />
                          <Text style={styles.replyTitle}>Reply to your medical query</Text>
                        </View>
                        <Text style={styles.replyText}>
                          {item.diagnosis || 'No diagnosis details yet.'}
                        </Text>
                      </View>

                      <View style={styles.notesCard}>
                        <View style={styles.notesTitleRow}>
                          <MaterialIcons name="sticky-note-2" size={16} color={palette.warning} />
                          <Text style={styles.notesTitle}>Doctor Notes</Text>
                        </View>
                        <Text style={styles.notesText}>
                          {item.notes || 'No extra notes were added.'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sideColumn}>
                      <View style={styles.infoCard}>
                        <View style={styles.infoTitleRow}>
                          <MaterialIcons name="medication" size={18} color={palette.success} />
                          <Text style={styles.infoCardTitle}>Prescription</Text>
                        </View>
                        <Text style={styles.infoCardValue}>
                          {item.prescription || 'No prescription added yet.'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="notifications-active" size={24} color={palette.primary} />
              </View>
              <Text style={styles.emptyTitle}>Waiting for the doctor update</Text>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          )}

          <View style={[styles.footerActions, isCompact && styles.footerActionsCompact]}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => router.push('/(tabs)/patient-form')}>
              <MaterialIcons name="event-available" size={18} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Make Appointment</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryFooterButton, pressed && styles.buttonPressed]}
              onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={18} color={palette.primary} />
              <Text style={styles.secondaryButtonText}>Back</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    paddingBottom: 32,
  },
  pageShell: {
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  heroCopy: {
    flex: 1,
    minWidth: 220,
  },
  heroTitle: {
    color: palette.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroActionsCompact: {
    width: '100%',
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaPillText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minWidth: 112,
  },
  secondaryButtonText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  loadingCard: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  cardStack: {
    gap: 14,
  },
  diagnosisCard: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  cardEyebrow: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardDate: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  readyBadge: {
    backgroundColor: palette.successSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  readyBadgeText: {
    color: palette.success,
    fontSize: 12,
    fontWeight: '800',
  },
  diagnosisBody: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  diagnosisBodyCompact: {
    flexDirection: 'column',
  },
  replyColumn: {
    flex: 1.45,
  },
  sideColumn: {
    flex: 1,
    justifyContent: 'space-between',
  },
  replyBubble: {
    backgroundColor: palette.primarySoft,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  replyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  replyTitle: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  replyText: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 24,
  },
  notesCard: {
    backgroundColor: '#f9fbff',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  notesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    
    marginBottom: 8,
  },
  notesTitle: {
    color: palette.warning,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  notesText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  infoCard: {
    backgroundColor: '#f8fff9',
    borderWidth: 1,
    borderColor: '#cfe9d6',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardTitle: {
    color: palette.success,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  infoCardValue: {
    color: palette.text,
    fontSize: 14,
    lineHeight: 21,
  },
  infoChipList: {
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  infoChipText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyState: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  footerActionsCompact: {
    flexDirection: 'column',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  secondaryFooterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.92,
  },
});
