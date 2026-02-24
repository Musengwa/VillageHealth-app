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
