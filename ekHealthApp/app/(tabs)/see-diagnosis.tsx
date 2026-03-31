import { Colors } from '@/constants/theme';
import { useCurrentPatient } from '@/context/CurrentPatientContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDiagnosesByNrc, getDiagnosesByPatientVisitId } from '@/services/patientService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Diagnosis = {
  id: string;
  date: string;
  notes?: string;
  summary: string;
};

function normalizeParam(value?: string | string[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default function SeeDiagnosis() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ nrc?: string | string[]; visitId?: string | string[] }>();
  const { isHydrated, nrc: storedNrc, setCurrentPatient, visitId: storedVisitId } = useCurrentPatient();

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(false);

  const routeVisitId = normalizeParam(params.visitId);
  const routeNrc = normalizeParam(params.nrc);

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

  useEffect(() => {
    let isMounted = true;

    const fetchDiagnoses = async () => {
      if (!isHydrated && !routeNrc && !routeVisitId) {
        return;
      }

      setLoading(true);

      try {
        let result: any = null;

        if (activePatient.nrc) {
          result = await getDiagnosesByNrc(activePatient.nrc);
        } else if (activePatient.visitId) {
          result = await getDiagnosesByPatientVisitId(activePatient.visitId);
        }

        if (!isMounted) {
          return;
        }

        if (!result || result.error) {
          if (result?.error) {
            console.error('Failed to load diagnoses', result.error);
          }
          setDiagnoses([]);
          return;
        }

        setDiagnoses(result.data ?? []);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchDiagnoses();

    return () => {
      isMounted = false;
    };
  }, [activePatient, isHydrated, routeNrc, routeVisitId]);

  const emptyMessage =
    activePatient.visitId || activePatient.nrc ? 'Awaiting diagnosis.' : 'No diagnoses available.';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>See Diagnosis</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            {activePatient.nrc
              ? `Showing results for NRC ${activePatient.nrc}`
              : 'Check the latest diagnosis for the current patient'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.homeButton, { borderColor: colors.tint }]}
          onPress={() => router.replace('/landing')}>
          <Text style={[styles.homeButtonText, { color: colors.tint }]}>Go Back Home</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.tint} />
      ) : (
        <FlatList
          data={diagnoses}
          keyExtractor={item => item.id ?? Math.random().toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.text }]}>{emptyMessage}</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderColor: '#d7e9d8' }]}>
              <Text style={[styles.cardDate, { color: colors.text }]}>{(item as any).created_at ?? item.date}</Text>
              {((item as any).diagnosis ?? item.summary) ? (
                <Text style={[styles.cardSummary, { color: colors.text }]}>
                  {(item as any).diagnosis ?? item.summary}
                </Text>
              ) : null}
              {item.notes ? <Text style={[styles.cardNotes, { color: colors.text }]}>{item.notes}</Text> : null}
              {!(item as any).diagnosis && !item.summary ? (
                <Text style={[styles.cardNotes, { color: colors.text, marginTop: 8 }]}>{JSON.stringify(item)}</Text>
              ) : null}
            </View>
          )}
        />
      )}

      <View style={styles.fabContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/(tabs)/patient-form')}>
          <Text style={styles.fabText}>Make Appointment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.fabButton, styles.fabSecondary]} onPress={() => router.back()}>
          <Text style={[styles.fabText, styles.fabSecondaryText]}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    gap: 12,
    marginBottom: 12,
  },
  headerCopy: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  homeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  homeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingBottom: 120,
  },
  emptyText: {
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardSummary: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardNotes: {
    fontSize: 14,
  },
  fabContainer: {
    alignItems: 'flex-end',
    bottom: 26,
    gap: 8,
    position: 'absolute',
    right: 16,
  },
  fabButton: {
    borderRadius: 999,
    elevation: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
  },
  fabSecondary: {
    backgroundColor: '#ffffff',
    borderColor: '#b9d5bf',
    borderWidth: 1.5,
    marginTop: 8,
  },
  fabSecondaryText: {
    color: '#2c5a38',
  },
});
