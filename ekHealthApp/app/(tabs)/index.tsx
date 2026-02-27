import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPatientVisits, PatientVisit } from '@/services/patientService';
import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  if (!authorized && !loading) {
    return null;
  }

  const renderPatientCard = ({ item }: { item: PatientVisit }) => (
    <TouchableOpacity
      style={[
        styles.patientCard,
        {
          backgroundColor: colors.tabIconDefault,
          borderColor: colors.tint,
        },
      ]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.patientName, { color: colors.text }]}>{item.full_name}</Text>
        <Text
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === 'waiting' ? '#FFA500' : '#4CAF50',
            },
          ]}>
          {item.status?.toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardLabel, { color: colors.text }]}>Phone: {item.phone}</Text>
        <Text style={[styles.cardLabel, { color: colors.text }]}>NRC: {item.nrc}</Text>
        <Text style={[styles.cardLabel, { color: colors.text }]}>
          Sickness: {item.sickness}
        </Text>
        <Text style={[styles.cardLabel, { color: colors.text }]}>
          Temperature: {item.temperature}°C
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Patient Visits</Text>
        <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
          {patients.length} patient(s)
        </Text>
      </View>

      <FlatList
        data={patients}
        renderItem={renderPatientCard}
        keyExtractor={item => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchPatients} tintColor={colors.tint} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No patient visits yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
              Tap New Patient to add a patient visit
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  patientCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  cardContent: {
    gap: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '400',
  },
});
