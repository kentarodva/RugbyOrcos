-- ============================================================
-- validate_db_integrity.sql
-- Validación rápida de integridad tras las migraciones.
-- Ejecutar en Supabase SQL Editor. Todo debe devolver 0 (cero).
-- ============================================================

-- FK: user_profiles sin auth user
SELECT 'user_profiles sin auth' AS check_name, COUNT(*) AS errors
FROM user_profiles WHERE user_id NOT IN (SELECT id FROM auth.users);

-- FK: team_category inválido
SELECT 'players team_category inválido' AS check_name, COUNT(*) AS errors
FROM players WHERE team_category IS NOT NULL AND team_category NOT IN (SELECT category FROM teams);
SELECT 'schedule_events team_category inválido' AS check_name, COUNT(*) AS errors
FROM schedule_events WHERE team_category IS NOT NULL AND team_category NOT IN (SELECT category FROM teams);
SELECT 'finances team_category inválido' AS check_name, COUNT(*) AS errors
FROM finances WHERE team_category IS NOT NULL AND team_category NOT IN (SELECT category FROM teams);

-- FK: team_id inválido
SELECT 'players team_id inválido' AS check_name, COUNT(*) AS errors
FROM players WHERE team_id IS NOT NULL AND team_id NOT IN (SELECT id FROM teams);
SELECT 'schedule_events team_id inválido' AS check_name, COUNT(*) AS errors
FROM schedule_events WHERE team_id IS NOT NULL AND team_id NOT IN (SELECT id FROM teams);
SELECT 'user_profiles team_id inválido' AS check_name, COUNT(*) AS errors
FROM user_profiles WHERE team_id IS NOT NULL AND team_id NOT IN (SELECT id FROM teams);

-- FK: teams.club_id inválido
SELECT 'teams club_id inválido' AS check_name, COUNT(*) AS errors
FROM teams WHERE club_id IS NOT NULL AND club_id NOT IN (SELECT id FROM clubs);

-- Sincronización: team_category vs team_id
SELECT 'players team_category sin team_id' AS check_name, COUNT(*) AS errors
FROM players WHERE team_category IS NOT NULL AND team_id IS NULL;
SELECT 'players team_id sin team_category' AS check_name, COUNT(*) AS errors
FROM players WHERE team_id IS NOT NULL AND team_category IS NULL;
SELECT 'players team_category ≠ team_id' AS check_name, COUNT(*) AS errors
FROM players p JOIN teams t ON p.team_category = t.category
WHERE p.team_id != t.id;

-- CHECK constraints: valores inválidos
SELECT 'players status inválido' AS check_name, COUNT(*) AS errors
FROM players WHERE status IS NOT NULL AND status NOT IN ('activo','inactivo','lesionado','suspendido');
SELECT 'players role inválido' AS check_name, COUNT(*) AS errors
FROM players WHERE role IS NOT NULL AND role NOT IN ('Titular','Capitan','Subcapitan','Suplente');
SELECT 'players system_role inválido' AS check_name, COUNT(*) AS errors
FROM players WHERE system_role IS NOT NULL AND system_role NOT IN ('desarrollador','presidente','promotor','entrenador','tesorero','arbitro','jugador');

-- RLS: todas las tablas con RLS habilitado
SELECT 'tablas sin RLS' AS check_name, COUNT(*) AS errors
FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;

-- Auditoría: updated_at not null en tablas financieras
SELECT 'finances sin updated_at' AS check_name, COUNT(*) AS errors FROM finances WHERE updated_at IS NULL;
SELECT 'schedule_events sin updated_at' AS check_name, COUNT(*) AS errors FROM schedule_events WHERE updated_at IS NULL;

-- Resumen final
SELECT '=== VALIDACIÓN COMPLETA ===' AS status;
