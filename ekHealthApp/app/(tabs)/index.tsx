import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPatientVisits, PatientVisit } from '@/services/patientService';
import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [patients, setPatients] = useState<PatientVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await getPatientVisits();
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/(tabs)/Auth');
        setLoading(false);
        return;
      }

      setAuthorized(true);
      fetchPatients();
    };

    checkAuthAndLoad();
  }, [router]);

  if (!authorized && loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.tint} />
      </SafeAreaView>
    );
  }

  if (!authorized && !loading) {
    return null;
  }

  const waitingCount = patients.filter(item => item.status === 'waiting').length;
  const surfaceColor = colorScheme === 'dark' ? '#143323' : '#f4fbf6';
  const borderColor = colorScheme === 'dark' ? '#28533e' : '#d6eede';
  const mutedTextColor = colorScheme === 'dark' ? '#9eb5a6' : '#5d7464';

  const renderPatientCard = ({ item }: { item: PatientVisit }) => (
    <TouchableOpacity
      onPress={() => router.push(`/doctor/diagnosis?patientId=${item.id}`)}
      style={[
        styles.patientCard,
        {
          backgroundColor: surfaceColor,
          borderColor,
        },
      ]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.patientName, { color: colors.text }]}>{item.full_name}</Text>
        <Text
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === 'waiting' ? '#e8b04b' : colors.tint,
            },
          ]}>
          {item.status?.toUpperCase()}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.cardLabel, { color: mutedTextColor }]}>Phone: {item.phone}</Text>
        <Text style={[styles.cardLabel, { color: mutedTextColor }]}>NRC: {item.nrc}</Text>
        <Text style={[styles.cardLabel, { color: colors.text }]}>Sickness: {item.sickness}</Text>
        <Text style={[styles.cardLabel, { color: colors.text }]}>
          Temperature: {item.temperature}
          {'\u00B0'}C
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: surfaceColor, borderColor }]}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.tint} />
      ) : (
        <>
          <Text style={[styles.emptyText, { color: colors.text }]}>No patient visits yet</Text>
          <Text style={[styles.emptySubtext, { color: mutedTextColor }]}>
            Pull down to refresh after a patient is added.
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={patients}
        renderItem={renderPatientCard}
        keyExtractor={(item, index) => `${item.id ?? index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchPatients} tintColor={colors.tint} />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={[styles.badge, { backgroundColor: surfaceColor, borderColor }]}>
              <Text style={[styles.badgeText, { color: colors.tint }]}>Doctor Dashboard</Text>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Patient Visits</Text>
            <Text style={[styles.subtitle, { color: mutedTextColor }]}>
              Keep track of waiting patients and open a diagnosis in one tap.
            </Text>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: surfaceColor, borderColor }]}>
                <Text style={[styles.statValue, { color: colors.text }]}>{patients.length}</Text>
                <Text style={[styles.statLabel, { color: mutedTextColor }]}>Total Visits</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: surfaceColor, borderColor }]}>
                <Text style={[styles.statValue, { color: colors.tint }]}>{waitingCount}</Text>
                <Text style={[styles.statLabel, { color: mutedTextColor }]}>Waiting</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 32,
  },
  headerSection: {
    marginBottom: 22,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 18,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  patientCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  patientName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
  cardContent: {
    gap: 8,
  },
  cardLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
