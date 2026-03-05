import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDiagnosesByNrc, getDiagnosesByPatientVisitId } from '@/services/patientService';
import { getLastNrc, getLastVisitId } from '@/services/visitStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Diagnosis = {
  id: string;
  date: string;
  summary: string;
  notes?: string;
};

export default function SeeDiagnosis() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Placeholder data — replace with real data fetch when available
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(false);

  // Prefer lookup by last-entered NRC, then by visitId
  let visitId: string | null = null;
  let nrc: string | null = null;

  try {
    // try reading query params safely
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useSearchParams } = require('expo-router');
    const params = useSearchParams?.() ?? {};
    visitId = params.visitId ?? null;
    nrc = params.nrc ?? null;
  } catch (e) {
    visitId = null;
    nrc = null;
  }

  if (!nrc) nrc = getLastNrc() ?? null;
  if (!visitId) visitId = getLastVisitId() ?? null;

  useEffect(() => {
    let mounted = true;
    const fetchDiagnoses = async () => {
      console.debug('[SeeDiagnosis] fetchDiagnoses start nrc=', nrc, 'visitId=', visitId);
      setLoading(true);
      try {
        let res: any = null;
        if (nrc) {
          res = await getDiagnosesByNrc(String(nrc));
        } else if (visitId) {
          res = await getDiagnosesByPatientVisitId(String(visitId));
        }

        console.debug('[SeeDiagnosis] fetch result=', res);

        if (!mounted) return;
        if (!res) {
          setDiagnoses([]);
        } else if (res.error) {
          console.error('Failed to load diagnoses', res.error);
          setDiagnoses([]);
        } else {
          setDiagnoses(res.data ?? []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDiagnoses();
    return () => {
      mounted = false;
    };
  }, [nrc, visitId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>See Diagnosis</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.tint} />
      ) : (
        <FlatList
          data={diagnoses}
          keyExtractor={item => item.id ?? Math.random().toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.text }]}>{visitId ? 'Awaiting diagnosis.' : 'No diagnoses available.'}</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderColor: colors.tabIconDefault, backgroundColor: colors.tabIconDefault + '20' }]}> 
              <Text style={[styles.cardDate, { color: colors.text }]}>{(item as any).created_at ?? item.date}</Text>
              {((item as any).diagnosis ?? item.summary) ? (
                <Text style={[styles.cardSummary, { color: colors.text }]}>{(item as any).diagnosis ?? item.summary}</Text>
              ) : null}
              {item.notes ? <Text style={[styles.cardNotes, { color: colors.text }]}>{item.notes}</Text> : null}
              {/* debug: show full object if expected fields missing */}
              {(!(item as any).diagnosis && !item.summary) && (
                <Text style={[styles.cardNotes, { color: colors.text, marginTop: 8 }]}>{JSON.stringify(item)}</Text>
              )}
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

        <TouchableOpacity
          style={[styles.fabButton, styles.fabSecondary]}
          onPress={() => router.back()}>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  list: {
    paddingBottom: 120,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
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
    position: 'absolute',
    right: 16,
    bottom: 26,
    alignItems: 'flex-end',
    gap: 8,
  },
  fabButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
  },
  fabSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 8,
  },
  fabSecondaryText: {
    color: '#333',
  },
});
