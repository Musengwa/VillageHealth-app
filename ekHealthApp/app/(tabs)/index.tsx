<<<<<<< HEAD
=======
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPatientVisits, PatientVisit } from '@/services/patientService';
import { supabase } from '@/services/supabase';
>>>>>>> 0e63f0ff1517d7351176e2c8db8fa29e61beaa90
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

<<<<<<< HEAD
export default function LandingPage() {
  const router = useRouter();

=======
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
      onPress={() => router.push(`/doctor/diagnosis?patientId=${item.id}`)}
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

>>>>>>> 0e63f0ff1517d7351176e2c8db8fa29e61beaa90
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EK Health</Text>
      <Text style={styles.subtitle}>Welcome</Text>

<<<<<<< HEAD
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(tabs)/patientType')}
      >
        <Text style={styles.buttonText}>Patient</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.doctorButton]}
        onPress={() => router.push('/doctor/login')}
      >
        <Text style={styles.buttonText}>Doctor</Text>
      </TouchableOpacity>
=======
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
>>>>>>> 0e63f0ff1517d7351176e2c8db8fa29e61beaa90
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 50,
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    marginVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  doctorButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
});
