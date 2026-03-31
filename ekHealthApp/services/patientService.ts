import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface PatientVisit {
  id?: string;
  full_name: string;
  phone: string;
  nrc: string;
  blood_pressure: string;
  pulse: number;
  temperature: number;
  sickness: string;
  intensity: string;
  status?: string;
  doctor_id?: string;
  created_at?: string;
}

export interface Diagnosis {
  id?: string;
  patient_visit_id: string;
  doctor_id?: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  created_at?: string;
}

type TableChangeHandler = () => void | Promise<void>;

type TableSubscriptionOptions = {
  table: 'patient_visits' | 'diagnoses';
  filter?: string;
  onChange: TableChangeHandler;
};

function subscribeToTableChanges({
  table,
  filter,
  onChange,
}: TableSubscriptionOptions): () => void {
  const channelName = `realtime:${table}:${filter ?? 'all'}:${Date.now()}:${Math.random()
    .toString(36)
    .slice(2)}`;

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      },
      () => {
        void onChange();
      }
    )
    .subscribe(status => {
      if (status === 'CHANNEL_ERROR') {
        console.warn(`Realtime subscription failed for ${table}${filter ? ` (${filter})` : ''}.`);
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

// Patient Visit Services
export const createPatientVisit = async (patientData: PatientVisit) => {
  try {
    const { data, error } = await supabase
      .from('patient_visits')
      .insert([patientData])
      .select();
    
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error( error);
    return { data: null, error };
  }
};

export const getPatientVisits = async () => {
  try {
    const { data, error } = await supabase
      .from('patient_visits')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching patient visits:', error);
    return { data: null, error };
  }
};

export const getPatientVisitById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('patient_visits')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching patient visit:', error);
    return { data: null, error };
  }
};

export const updatePatientVisit = async (id: string, patientData: Partial<PatientVisit>) => {
  try {
    const { data, error } = await supabase
      .from('patient_visits')
      .update(patientData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Error updating patient visit:', error);
    return { data: null, error };
  }
};

export const deletePatientVisit = async (id: string) => {
  try {
    const { error } = await supabase
      .from('patient_visits')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting patient visit:', error);
    return { error };
  }
};

// Diagnosis Services
export const createDiagnosis = async (diagnosisData: Diagnosis) => {
  try {
    const { data, error } = await supabase
      .from('diagnoses')
      .insert([diagnosisData])
      .select();
    
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Error creating diagnosis:', error);
    return { data: null, error };
  }
};

export const getDiagnosesByPatientVisitId = async (patientVisitId: string) => {
  try {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('patient_visit_id', patientVisitId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching diagnoses:', error);
    return { data: null, error };
  }
};

export const getDiagnoses = async () => {
  try {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all diagnoses:', error);
    return { data: null, error };
  }
};

export const subscribeToPatientVisitChanges = (
  onChange: TableChangeHandler,
  options?: { nrc?: string | null; visitId?: string | null }
) => {
  const filter = options?.visitId
    ? `id=eq.${options.visitId}`
    : options?.nrc
      ? `nrc=eq.${options.nrc}`
      : undefined;

  return subscribeToTableChanges({
    table: 'patient_visits',
    filter,
    onChange,
  });
};

export const subscribeToDiagnosisChanges = (
  onChange: TableChangeHandler,
  options?: { patientVisitId?: string | null }
) => {
  const filter = options?.patientVisitId
    ? `patient_visit_id=eq.${options.patientVisitId}`
    : undefined;

  return subscribeToTableChanges({
    table: 'diagnoses',
    filter,
    onChange,
  });
};

export const getDiagnosesByNrc = async (nrc: string) => {
  try {
    // find latest patient_visit for this NRC
    console.debug('[getDiagnosesByNrc] looking up visits for nrc=', nrc);
    const { data: visits, error: visitError } = await supabase
      .from('patient_visits')
      .select('id')
      .eq('nrc', nrc)
      .order('created_at', { ascending: false })
      .limit(1);

    console.debug('[getDiagnosesByNrc] visits result=', visits, 'error=', visitError);
    if (visitError) throw visitError;
    const visitId = visits?.[0]?.id;
    if (!visitId) return { data: [], error: null };

    const res = await getDiagnosesByPatientVisitId(visitId);
    console.debug('[getDiagnosesByNrc] diagnoses result for visitId=', visitId, res);
    return res;
  } catch (error) {
    console.error('Error fetching diagnoses by NRC:', error);
    return { data: null, error };
  }
};

export const updateDiagnosis = async (id: string, diagnosisData: Partial<Diagnosis>) => {
  try {
    const { data, error } = await supabase
      .from('diagnoses')
      .update(diagnosisData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Error updating diagnosis:', error);
    return { data: null, error };
  }
};

// Doctor Services
export const getDoctors = async () => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('activity_status', 'online');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return { data: null, error };
  }
};
