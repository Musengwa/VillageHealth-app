import { supabase } from './supabase';

export interface DoctorProfile {
  id: string;
  name: string;
  specialization: string | null;
  activity_status: 'online' | 'offline' | null;
  created_at: string | null;
}

export const profileService = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('doctors')
      .select('id,name,specialization,activity_status,created_at')
      .eq('id', userId)
      .single();
    if (error) {
      // return null if not found instead of throwing to simplify callers
      if (error?.details?.includes('Results contain 0 rows')) return null;
      throw error;
    }
    return data as DoctorProfile | null;
  },

  upsertProfile: async (profile: Partial<DoctorProfile> & { id: string; name: string }) => {
    const { data, error } = await supabase
      .from('doctors')
      .upsert(profile, { onConflict: 'id' })
      .select('id,name,specialization,activity_status,created_at')
      .single();
    if (error) throw error;
    return data as DoctorProfile;
  },

  getOrCreateLoggedInDoctorProfile: async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user?.id) throw new Error('No authenticated user found.');

    const existing = await profileService.getProfile(user.id).catch(() => null);
    if (existing) return existing;

    const fallbackName =
      (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
      user.email?.split('@')[0] ||
      'Doctor';

    const newProfile = {
      id: user.id,
      name: fallbackName,
      specialization: user.user_metadata?.specialization || null,
      activity_status: 'online' as const,
    };

    return await profileService.upsertProfile(newProfile);
  },

  setDoctorStatus: async (userId: string, status: 'online' | 'offline') => {
    const { data, error } = await supabase
      .from('doctors')
      .update({ activity_status: status })
      .eq('id', userId)
      .select('id,name,specialization,activity_status,created_at')
      .single();
    if (error) throw error;
    return data as DoctorProfile;
  },
};
