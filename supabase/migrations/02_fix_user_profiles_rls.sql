-- ============================================================
-- FIX: user_profiles sin RLS (elimina recursion de is_admin)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
