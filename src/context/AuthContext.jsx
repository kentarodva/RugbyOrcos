import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const tp = session.user.user_metadata?.temp_password;
        setRequirePasswordChange(tp === true || tp === 'true');
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const tp = session.user.user_metadata?.temp_password;
        setRequirePasswordChange(tp === true || tp === 'true');
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setRequirePasswordChange(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const userEmail = supabase.auth.getUser().then(r => r.data.user?.email).catch(() => null);
    const email = await userEmail;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
      setLoading(false);
      return;
    }

    if (email) {
      const repaired = await repairProfile(email, userId);
      if (repaired) {
        setProfile(repaired);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
  };

  const repairProfile = async (email, userId) => {
    if (!email || !userId) return null;
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`display_name.ilike.%${email.split('@')[0]}%`)
        .neq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (data) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ user_id: userId })
          .eq('id', data.id);

        if (!updateError) {
          const { data: refreshed } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          return refreshed || { ...data, user_id: userId };
        }
      }
    } catch { /* multiple rows or network error */ }
    return null;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email, password, displayName, systemRole = 'desarrollador') => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { error: authError };
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: authData.user.id,
        display_name: displayName,
        system_role: systemRole,
        club_scope: null,
        division_scope: null,
        is_active: true,
      }, { onConflict: 'user_id' });

    if (profileError) {
      if (import.meta.env.DEV) console.warn('Error creando perfil:', profileError.message);
      return { error: profileError };
    }

    return { data: authData, error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const checkFirstRun = async () => {
    if (typeof supabase.rpc === 'function') {
      try {
        const res = await supabase.rpc('check_is_first_run');
        if (res && typeof res.data === 'boolean' && !res.error) {
          return res.data;
        }
      } catch { /* fallback to user_profiles count */ }
    }
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (error) return false;
    return count === 0;
  };

  const forceAdmin = async () => {
    if (!user) return false;
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        display_name: profile?.display_name || user.email?.split('@')[0] || 'Admin',
        system_role: 'desarrollador',
        is_active: true,
      }, { onConflict: 'user_id' });

    if (error) return false;
    await fetchProfile(user.id);
    return true;
  };

  const clearPasswordChangeFlag = async () => {
    if (!user) return;
    await supabase.auth.updateUser({ data: { temp_password: false } });
    setRequirePasswordChange(false);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    requirePasswordChange,
    signIn,
    signUp,
    signOut,
    checkFirstRun,
    forceAdmin,
    clearPasswordChangeFlag,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

export default AuthContext;
