import { supabase } from './supabase';

export type DoctorStatus = 'online' | 'offline';

export interface DoctorProfile {
  id: string;
  name: string;
  specialization: string | null;
  activity_status: DoctorStatus | null;
  created_at: string | null;
}

async function getLoggedInDoctorIdentity() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user?.id) throw new Error('No authenticated user found.');

  const fallbackName =
    (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
    user.email?.split('@')[0] ||
    'Doctor';

  return {
    userId: user.id,
    fallbackName,
    specialization: user.user_metadata?.specialization || null,
  };
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
    const identity = await getLoggedInDoctorIdentity();
    const existing = await profileService.getProfile(identity.userId).catch(() => null);
    if (existing) return existing;

    const newProfile = {
      id: identity.userId,
      name: identity.fallbackName,
      specialization: identity.specialization,
      activity_status: 'online' as DoctorStatus,
    };

    return await profileService.upsertProfile(newProfile);
  },

  setDoctorStatus: async (status: DoctorStatus) => {
    const identity = await getLoggedInDoctorIdentity();
    
    // Map status to database enum values
    // If your database enum doesn't support 'online'/'offline', adjust the mapping below
    const mappedStatus = status === 'online' ? 'online' : 'offline';
    
    try {
      // Simply update the activity_status field without upserting
      const { data, error } = await supabase
        .from('doctors')
        .update({ activity_status: mappedStatus })
        .eq('id', identity.userId)
        .select('id,name,specialization,activity_status,created_at')
        .single();
      
      if (error) {
        console.error('Status update error:', error);
        throw new Error(
          error.message?.includes('null')
            ? 'Status update failed. Please ensure your account is properly set up.'
            : error.message || 'Failed to update status'
        );
      }
      
      return data as DoctorProfile;
    } catch (error) {
      console.error('setDoctorStatus error:', error);
      throw error;
    }
  },
};
