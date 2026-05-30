import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
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
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (error) return true;
    return count === 0;
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    checkFirstRun,
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
