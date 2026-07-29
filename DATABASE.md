# DATABASE.md — Rugby Orcos Negros — Esquema Completo

> **Última actualización:** 2026-07-28  
> **Motor:** PostgreSQL (Supabase)  
> **Tablas:** 53  
> **Foreign Keys:** 93  
> **RLS Policies:** 179  
> **Índices:** 140  
> **Triggers:** 37  
> **Vistas materializadas:** 3

---

## Índice de Tablas

| # | Tabla | Filas aprox | Propósito |
|---|-------|------------|-----------|
| 1 | `players` | ~50-200 | Jugadores del equipo |
| 2 | `user_profiles` | ~10-50 | Perfiles de usuario (auth) |
| 3 | `attribute_history` | ~100-500 | Historial de atributos por test |
| 4 | `injury_log` | ~10-50 | Registro de lesiones |
| 5 | `attendance` | ~200-2000 | Asistencia a eventos |
| 6 | `player_attendance_summary` | ~50-200 | Resumen de asistencia por jugador |
| 7 | `penalties` | ~50-200 | Penalizaciones (burpees/conos) |
| 8 | `infractions` | ~10-100 | Infracciones disciplinarias |
| 9 | `match_stats` | ~50-500 | Estadísticas de partidos |
| 10 | `wellness_logs` | ~50-500 | Registros de bienestar diario |
| 11 | `hia_assessments` | ~0-20 | Evaluaciones de conmoción cerebral |
| 12 | `workout_logs` | ~20-200 | Registros de entrenamiento |
| 13 | `schedule_events` | ~20-100 | Eventos del calendario |
| 14 | `championships` | ~0-10 | Campeonatos |
| 15 | `finances` | ~50-500 | Registros financieros |
| 16 | `inventory` | ~0-50 | Inventario del club |
| 17 | `fixtures` | ~10-100 | Partidos jugados |
| 18 | `rivals` | ~5-30 | Equipos rivales |
| 19 | `future_fixtures` | ~5-50 | Partidos futuros |
| 20 | `lineups` | ~0-30 | Formaciones tácticas |
| 21 | `makgora_teams` | ~5-15 | Equipos de Mak'Gora |
| 22 | `tournaments` | ~0-10 | Torneos Mak'Gora |
| 23 | `tournament_teams` | ~0-50 | Equipos en torneos |
| 24 | `tournament_matches` | ~0-200 | Partidos de torneo |
| 25 | `tournament_standings` | ~0-50 | Tabla de posiciones |
| 26 | `tournament_player_stats` | ~0-200 | Stats de jugadores en torneo |
| 27 | `player_loans` | ~0-30 | Préstamos entre equipos Mak'Gora |
| 28 | `match_invitations` | ~0-50 | Invitaciones a partidos |
| 29 | `guest_players` | ~0-30 | Jugadores invitados |
| 30 | `messages` | ~10-500 | Mensajería interna |
| 31 | `message_reactions` | ~0-100 | Reacciones a mensajes |
| 32 | `announcement_views` | ~0-100 | Vistas de anuncios |
| 33 | `custom_tactics` | ~0-20 | Tácticas guardadas |
| 34 | `rugby_positions` | ~10 | Posiciones de rugby |
| 35 | `teams` | ~5-10 | Equipos/divisiones |
| 36 | `team_members` | ~10-50 | Miembros de equipos |
| 37 | `push_tokens` | ~10-100 | Tokens de notificaciones push |
| 38 | `clubs` | ~1-5 | Clubes |
| 39 | `club_settings` | ~5-20 | Configuración del club |
| 40 | `ai_usage` | ~0-100 | Uso de IA |
| 41 | `ai_chat_history` | ~0-500 | Historial de chat IA |
| 42 | `club_config` | ~5-20 | Configuración por equipo |
| 43 | `exercise_catalog` | 1,472 | Catálogo de ejercicios |
| 44 | `gym_history` | ~0-200 | Historial de gimnasio |
| 45 | `fundraising_campaigns` | ~0-10 | Campañas de recaudación |
| 46 | `fundraising_assignments` | ~0-100 | Asignaciones de recaudación |
| 47 | `raffle_tickets` | ~0-500 | Tickets de rifa |
| 48 | `player_payments` | ~0-200 | Pagos de jugadores |
| 49 | `training_plans` | ~0-200 | Planes de entrenamiento |
| 50 | `event_rsvp` | ~0-500 | RSVPs de eventos |
| 51 | `notification_templates` | ~0-10 | Plantillas de notificación |
| 52 | `notification_history` | ~0-50 | Historial de notificaciones |
| 53 | `treasurer_deliveries` | ~0-20 | Entregas de tesorería |

### Vistas Materializadas
- `player_training_summary` — Planes de entrenamiento por jugador
- `player_rsvp_summary` — RSVPs por jugador
- `player_payment_summary` — Pagos por jugador

---

## Tabla Principal: `players`

| Columna | Tipo | Null | Default | FK |
|---------|------|------|---------|-----|
| `id` | UUID PK | NO | `gen_random_uuid()` | — |
| `user_id` | UUID | YES | — | `auth.users(id)` |
| `legacy_id` | VARCHAR(10) | YES | — | — |
| `username` | VARCHAR(50) | YES | — | — |
| `first_name` | VARCHAR(100) | NO | — | — |
| `middle_name` | VARCHAR(100) | YES | — | — |
| `last_name` | VARCHAR(100) | NO | — | — |
| `second_last_name` | VARCHAR(100) | YES | — | — |
| `nickname` | VARCHAR(100) | YES | — | — |
| `document_type` | VARCHAR(20) | YES | — | — |
| `document_number` | VARCHAR(30) | YES | — | — |
| `birth_date` | DATE | YES | — | — |
| `age` | INTEGER | YES | — | — |
| `phone` | VARCHAR(30) | YES | — | — |
| `email` | VARCHAR(150) | YES | — | — |
| `initial_category` | VARCHAR(50) | YES | — | — |
| `start_year` | INTEGER | YES | — | — |
| `current_category` | VARCHAR(50) | YES | — | — |
| `internal_team` | VARCHAR(50) | YES | — | — |
| `team_category` | VARCHAR(50) | YES | — | `teams(category) NO ACTION` |
| `team_id` | UUID | YES | — | `teams(id) NO ACTION` |
| `weight_kg` | NUMERIC(5,1) | YES | — | — |
| `height_m` | NUMERIC(3,2) | YES | — | — |
| `had_fractures` | BOOLEAN | YES | `false` | — |
| `fracture_details` | TEXT | YES | — | — |
| `allergies` | TEXT | YES | — | — |
| `medical_conditions` | TEXT | YES | — | — |
| `health_insurance` | VARCHAR(100) | YES | — | — |
| `emergency_contact_name` | VARCHAR(150) | YES | — | — |
| `emergency_contact_phone` | VARCHAR(30) | YES | — | — |
| `commitment_accepted` | BOOLEAN | YES | — | — |
| `jersey_number` | INTEGER | YES | — | — |
| `role` | VARCHAR(30) | YES | `'Titular'` | — |
| `position` | VARCHAR(100) | YES | — | — |
| `position_id` | INTEGER | YES | — | `rugby_positions(id) NO ACTION` |
| `status` | VARCHAR(20) | YES | `'activo'` | — |
| `attr_force` | INTEGER | YES | `50` | — |
| `attr_speed` | INTEGER | YES | `50` | — |
| `attr_stamina` | INTEGER | YES | `50` | — |
| `attr_technique` | INTEGER | YES | `50` | — |
| `clothing_jersey` | VARCHAR(5) | YES | `'M'` | — |
| `clothing_shorts` | VARCHAR(5) | YES | `'M'` | — |
| `clothing_socks` | VARCHAR(10) | YES | `'40-42'` | — |
| `gym_squat` | NUMERIC(5,1) | YES | `0` | — |
| `gym_bench` | NUMERIC(5,1) | YES | `0` | — |
| `gym_deadlift` | NUMERIC(5,1) | YES | `0` | — |
| `system_role` | VARCHAR(30) | YES | `'jugador'` | — |
| `makgora_team_id` | UUID | YES | — | `makgora_teams(id) SET NULL` |
| `avatar_id` | TEXT | YES | — | — |
| `photo_url` | TEXT | YES | — | — |
| `source` | VARCHAR(30) | YES | — | — |
| `form_submitted_at` | TIMESTAMPTZ | YES | — | — |
| `memberships_paid` | NUMERIC(10,2) | YES | `0` | — |
| `memberships_due` | NUMERIC(10,2) | YES | `0` | — |
| `last_payment_date` | DATE | YES | — | — |
| `last_payment_amount` | NUMERIC(10,2) | YES | — | — |
| `deleted_at` | TIMESTAMPTZ | YES | — | — |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` | — |
| `updated_at` | TIMESTAMPTZ | YES | — | — |

### Constraints — `players`
- `CHECK(role IN ('Titular','Capitan','Subcapitan','Suplente','Entrenador'))`
- `CHECK(status IN ('activo','lesionado','suspendido','inactivo'))`
- `UNIQUE(username)`
- `UNIQUE(first_name, last_name, birth_date) WHERE birth_date IS NOT NULL`
- `UNIQUE(email) WHERE email IS NOT NULL AND email != ''`

### RLS — `players`
- `players_hide_deleted` — ALL — `USING(deleted_at IS NULL)`
- `players_select` — SELECT — `USING(true)`
- `players_insert` — INSERT — `user_id = auth.uid() OR is_admin()`
- `players_update` — UPDATE — `user_id = auth.uid() OR is_admin()`
- `players_delete` — DELETE — `user_id = auth.uid() OR is_admin()`

### Triggers — `players`
- `trg_prevent_player_delete` — **BEFORE DELETE** — `RAISE EXCEPTION` (bloquea hard-delete)
- `trg_recalculate_attributes` — BEFORE UPDATE — recalculate attributes on weight/height/gym changes
- `trg_sync_team_id_players` — BEFORE INSERT/UPDATE — syncs `team_id` from `team_category`
- `trg_sync_team_category_players` — BEFORE INSERT/UPDATE — syncs `team_category` from `team_id`
- `trg_sync_user_profile` — AFTER INSERT/UPDATE — syncs `username`, `email`, `system_role` to `user_profiles`

### Índices — `players`
- `idx_players_deleted` — `deleted_at WHERE deleted_at IS NULL`
- `idx_players_makgora_team` — `makgora_team_id`
- `idx_players_position` — `position_id`
- `idx_players_status` — `status`
- `idx_players_team` — `team_category`
- `idx_players_team_id` — `team_id`
- `idx_players_user` — `user_id`

---

## Regla Arquitectónica: REGLA #1 — Soft-Delete

**NUNCA se ejecuta `DELETE FROM players`.** El trigger `trg_prevent_player_delete` bloquea cualquier intento.

"Eliminar" = `UPDATE SET status='inactivo', deleted_at=NOW()`  
"Recuperar" = `UPDATE SET status='activo', deleted_at=NULL`

La RLS `players_hide_deleted` oculta automáticamente jugadores con `deleted_at` de todas las queries.

---

## Foreign Keys — Todas

| Tabla | Columna | Referencia | On Delete |
|-------|---------|-----------|-----------|
| `attendance` | `player_id` | `players(id)` | **CASCADE** |
| `attendance` | `event_id` | `schedule_events(id)` | SET NULL |
| `attribute_history` | `player_id` | `players(id)` | **CASCADE** |
| `event_rsvp` | `player_id` | `players(id)` | **CASCADE** |
| `event_rsvp` | `event_id` | `schedule_events(id)` | **CASCADE** |
| `finances` | `payment_id` | `player_payments(id)` | SET NULL |
| `fixtures` | `rival_id` | `rivals(id)` | SET NULL |
| `fixtures` | `tournament_id` | `tournaments(id)` | NO ACTION |
| `fundraising_assignments` | `player_id` | `players(id)` | **CASCADE** |
| `fundraising_assignments` | `campaign_id` | `fundraising_campaigns(id)` | **CASCADE** |
| `gym_history` | `player_id` | `players(id)` | **CASCADE** |
| `hia_assessments` | `player_id` | `players(id)` | **CASCADE** |
| `infractions` | `player_id` | `players(id)` | **CASCADE** |
| `injury_log` | `player_id` | `players(id)` | **CASCADE** |
| `match_stats` | `player_id` | `players(id)` | **CASCADE** |
| `match_stats` | `tournament_id` | `tournaments(id)` | NO ACTION |
| `penalties` | `player_id` | `players(id)` | **CASCADE** |
| `player_attendance_summary` | `player_id` | `players(id)` | **CASCADE** |
| `player_loans` | `player_id` | `players(id)` | **CASCADE** |
| `player_loans` | `tournament_id` | `tournaments(id)` | NO ACTION |
| `player_loans` | `match_id` | `tournament_matches(id)` | NO ACTION |
| `player_loans` | `from_team_id` | `makgora_teams(id)` | NO ACTION |
| `player_loans` | `to_team_id` | `makgora_teams(id)` | NO ACTION |
| `player_payments` | `player_id` | `players(id)` | **CASCADE** |
| `player_payments` | `campaign_id` | `fundraising_campaigns(id)` | SET NULL |
| `player_payments` | `assignment_id` | `fundraising_assignments(id)` | SET NULL |
| `push_tokens` | `player_id` | `players(id)` | **CASCADE** |
| `raffle_tickets` | `campaign_id` | `fundraising_campaigns(id)` | **CASCADE** |
| `raffle_tickets` | `assigned_to` | `players(id)` | NO ACTION |
| `tournament_matches` | `tournament_id` | `tournaments(id)` | **CASCADE** |
| `tournament_player_stats` | `player_id` | `players(id)` | **CASCADE** |
| `tournament_player_stats` | `match_id` | `tournament_matches(id)` | **CASCADE** |
| `tournament_standings` | `tournament_id` | `tournaments(id)` | **CASCADE** |
| `tournament_teams` | `tournament_id` | `tournaments(id)` | **CASCADE** |
| `tournament_teams` | `captain_player_id` | `players(id)` | NO ACTION |
| `training_plans` | `player_id` | `players(id)` | **CASCADE** |
| `treasurer_deliveries` | `player_id` | `players(id)` | NO ACTION |
| `treasurer_deliveries` | `campaign_id` | `fundraising_campaigns(id)` | NO ACTION |
| `wellness_logs` | `player_id` | `players(id)` | **CASCADE** |
| `workout_logs` | `player_id` | `players(id)` | **CASCADE** |
| `workout_logs` | `plan_id` | `training_plans(id)` | NO ACTION |

---

## Vistas Materializadas

### `player_training_summary`
```sql
SELECT player_id, COUNT(*) as total_plans, MAX(created_at) as last_plan_date,
  COUNT(*) FILTER (WHERE source = 'ai') as ai_plans,
  COUNT(*) FILTER (WHERE source = 'custom') as custom_plans
FROM training_plans GROUP BY player_id;
```

### `player_rsvp_summary`
```sql
SELECT player_id, COUNT(*) as total_rsvps,
  COUNT(*) FILTER (WHERE status = 'going') as confirmed,
  COUNT(*) FILTER (WHERE status = 'maybe') as maybe_count,
  COUNT(*) FILTER (WHERE status = 'declined') as declined
FROM event_rsvp GROUP BY player_id;
```

### `player_payment_summary`
```sql
SELECT player_id, SUM(amount) as total_paid, COUNT(*) as payment_count,
  MAX(payment_date) as last_payment_date
FROM player_payments GROUP BY player_id;
```

---

## UNIQUE Constraints Clave

| Tabla | Constraint |
|-------|-----------|
| `attendance` | `UNIQUE(player_id, event_id)` |
| `event_rsvp` | `UNIQUE(event_id, player_id)` |
| `gym_history` | `UNIQUE(player_id, recorded_date)` |
| `match_stats` | `UNIQUE(player_id, match_date, opponent)` |
| `training_plans` | `UNIQUE(player_id, week_start)` |
| `wellness_logs` | `UNIQUE(player_id, log_date)` |
| `workout_logs` | `UNIQUE(player_id, workout_date)` |
| `fundraising_assignments` | `UNIQUE(campaign_id, player_id)` |
| `raffle_tickets` | `UNIQUE(campaign_id, ticket_number)` |
| `club_config` | `UNIQUE(team_category, key)` |
| `ai_usage` | `UNIQUE(user_id, provider_id, model_id, usage_date)` |
| `players` | `UNIQUE(username)`, `UNIQUE(email) WHERE ...` |
| `exercise_catalog` | `UNIQUE(code)` |

---

## Servicio de Datos (dataService.js)

El `dataService.js` (27 funciones, 12 tablas) es el **Single Source of Truth** para acceso a datos. Ver `RULES.md` R2.1 para política de uso.

### Tablas con cobertura completa (READ + WRITE + EMIT)
- `event_rsvp` — `fetchEventRsvps`, `fetchPlayerRsvps`, `fetchAllRsvps`, `upsertRsvp`, `deleteRsvp`
- `training_plans` — `fetchTrainingPlans`, `persistTrainingPlan`, `completeTrainingPlan`
- `attendance` — `recordAttendance`, `fetchEventAttendance`
- `player_payments` — `recordMembershipPayment`, `reverseMembershipPayment`, `fetchPlayerPayments`
- `player_loans` — `fetchPlayerLoans`, `createPlayerLoan`, `updateLoanStatus`

### Tablas con cobertura READ-ONLY
- `players` — `fetchPlayersWithRelations`, `fetchPlayers`
- `tournaments` — `fetchTournaments`
- `makgora_teams` — `fetchMakgoraTeams`
- `tournament_player_stats` — `fetchTournamentStats`
- `fundraising_campaigns` — `getCampaigns`
- `treasurer_deliveries` — `getTreasurerDeliveries`

---

## Event Bus (data:changed)

9 tipos de eventos, 8 con listener. Ver `RULES.md` R4 para política de uso.

| Evento | Emisor | Listeners |
|--------|--------|-----------|
| `event_rsvp` | dataService | Calendario, Tribunal, PlayerDashboard |
| `training_plans` | dataService | PlayerDashboard |
| `attendance` | dataService | PlayerDashboard |
| `player_payments` | dataService | PlayerDashboard |
| `player_loans` | dataService | Roster, MakgoraHub |
| `fundraising_campaigns` | useFundraising | FundraisingTab |
| `tournaments` | useMakgoraState | MakgoraHub |
| `tournament_matches` | useMakgoraState | MakgoraHub |
| `messages` | Messages.jsx | (sin listener — requiere ActivityFeed) |

---

## Migraciones

Todas las migraciones están en `seed/migrations/`. Las dos más importantes:

| Archivo | Contenido |
|---------|-----------|
| `phase_01_foreign_keys_and_views.sql` | 5 FKs + 3 vistas materializadas + `payment_id` en finances |
| `phase_02_soft_delete_rule.sql` | Trigger anti-hard-delete + RLS `players_hide_deleted` + índice |

---

## Reglas de Integridad

1. **NUNCA hard-delete** de players (trigger + RLS)
2. **Siempre FK con CASCADE** en tablas dependientes de players
3. **Siempre UNIQUE** en tablas de historial para evitar duplicados
4. **Siempre índice** en columnas FK
5. **Siempre RLS** en tablas nuevas (verificar con `SELECT rowsecurity FROM pg_tables WHERE tablename = '...'`)
6. **Nunca `supabase.from()` directo** en componentes — usar `dataService.js`
7. **Siempre emit** en escrituras de dataService (`emit()` después de cada write)
8. **Siempre useDataListener** en componentes que consumen datos compartidos
