import { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface HouseholdMemberRow {
  id: string;
  household_id: string;
  role: 'CFO' | 'MEMBER';
  display_name: string;
  email: string;
  avatar: string | null;
  monthly_income: number;
  allocation_strategy: { contribution: number; wealthRatio: number } | null;
  is_private_mode: boolean;
}

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async (): Promise<Session | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const onAuthStateChange = (callback: (session: Session | null) => void) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
};

// Returns null when the signed-in user hasn't created/joined a household yet.
export const getMyHouseholdMember = async (): Promise<HouseholdMemberRow | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data as HouseholdMemberRow | null;
};

export const createHousehold = async (householdName: string, displayName: string): Promise<HouseholdMemberRow> => {
  const { data, error } = await supabase.rpc('create_household', {
    p_household_name: householdName,
    p_display_name: displayName,
  });
  if (error) throw error;
  return data as HouseholdMemberRow;
};

export const joinHousehold = async (inviteCode: string, displayName: string): Promise<HouseholdMemberRow> => {
  const { data, error } = await supabase.rpc('join_household', {
    p_invite_code: inviteCode.trim().toLowerCase(),
    p_display_name: displayName,
  });
  if (error) throw error;
  return data as HouseholdMemberRow;
};

export const getHouseholdInviteCode = async (householdId: string): Promise<string> => {
  const { data, error } = await supabase.from('households').select('invite_code').eq('id', householdId).single();
  if (error) throw error;
  return data.invite_code as string;
};
