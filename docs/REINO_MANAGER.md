# REINO MANAGER — Documentación Completa

> **Proyecto:** Rugby Orcos Negros — Club Manager v4.1
> **Stack:** React 18 + Vite 4 + Supabase (PostgreSQL) + Capacitor 5
> **Repo:** `Rugby Orcos/` (PWA)

---

## 1. STACK TECNOLÓGICO

| Categoría | Tecnología |
|-----------|-----------|
| Frontend | React 18 + Vite 4 + Framer Motion 12 |
| Backend | Supabase (PostgreSQL 15, Auth, Storage, API REST) |
| Auth | Email/Password via Supabase Auth + temp_password flag |
| Mobile | Capacitor 5 (Android APK) + PWA (iOS Safari) |
| Charts | Recharts 3 |
| Validación | Zod 4 |
| Testing | Vitest 4 + Playwright + Testing Library |
| IA | Groq, DeepSeek, Gemini (multi-provider con fallback) |
| Estilos | CSS puro con Custom Properties (glassmorphism + neon) |
| PWA | vite-plugin-pwa (16 assets precacheados + runtime cache) |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) |
| SVG Avatars | 40 iconos de game-icons.net (CC BY 3.0) en `public/avatars/` |
| Conexión MCP | Supabase MCP via `supabase_execute_sql` — config en `~/.config/opencode/opencode.json` — URL proyecto: `qtvmqlbjcotvbzuwanjs` |

---

## 2. ARQUITECTURA GENERAL

### Provider Hierarchy (desde `main.jsx`)

```
ErrorBoundary
  └── AuthProvider (AuthContext)
        └── ClubProvider (ClubContext)
              └── ToastProvider (ToastContext)
                    └── App
```

### Estado Global (ClubContext)

Compose ~15 custom hooks. Expone:

```js
// Team
activeTeam, setActiveTeam

// Players
players, addPlayer, updatePlayer, deletePlayer, recordAttendance,
recordMatchInfractions, redeemPenalty, recordPhysicalTest, recordInjury,
updateInjuryPhase, recordMatchStats, recordWellness, runHiaProtocol,
updateClothingSizes, updateGymStats, logWorkout, normalizePlayer,
createPlayerCredentials, resetPlayerPassword, bulkUpdatePosition

// Schedule
schedule, addScheduleEvent, deleteScheduleEvent, generateWhatsAppMessage

// Championships
championships, addChampionship

// Finances
finances, addFinanceRecord, deleteFinanceRecord, recordMembershipPayment,
deleteMembershipPayment, reverseMembershipPayment, handleMonthlyCharge,
applyMonthlyCharge, mensualidadBase, clubConfig

// Inventory
inventory, addInventoryItem, updateInventoryItem

// Fixtures / Rivals / Future Fixtures
fixtures, addFixture, deleteFixture
rivals, addRival, updateRival, deleteRival
futureFixtures, addFutureFixture, deleteFutureFixture

// Match Invitations
matchInvitations, createInvitation, cancelInvitation, deleteInvitation,
updateInvitationResponse

// Loans
loans, requestLoan, updateLoanStatus

// Clubs / Dynamic clubs
dynamicClubs, getAllClubs, getAllClubsLabels, addClub, deleteClub

// Fundraising (recaudación)
campaigns, allPayments, loadCampaigns, loadAllPayments, addCampaign,
updateCampaign, deleteCampaign, getAssignments, getRaffleTickets,
bulkAssignTickets, bulkAssignFood, markTicketSold, registerPayment,
deletePayment, sellTickets

// Permissions
currentUser, hasPermission, isSuperRole, userRole, userTier

// Sync
syncStatus, exportData, importData

// View/UI
viewMode, setViewMode, divisionView, setDivisionView,
makgoraTeamId, setMakgoraTeamId, makgoraTeams

// Admin
resetStaffPassword
```

### Routing

No React Router. Sistema manual por tab:

```js
// Public route
pathname.startsWith('/invitacion/') || pathname.startsWith('/invitation/')
  → <MatchInvitation />

// Not authenticated
  → <Login />

// Needs password change (temp_password flag)
  → <ChangePasswordModal /> (fullscreen blocking)

// Player role (jugador)
  → <PlayerDashboard /> + <Footer />

// No profile
  → "Sin rango en el Reino" screen

// Staff/admin (13 tabs, activeTab state)
  ├── dashboard     → <Dashboard />
  ├── roster        → <Roster />
  ├── estadisticas  → <Estadisticas /> (LAZY)
  ├── cancha        → <CanchaTactica /> (LAZY)
  ├── tribunal      → <Tribunal />
  ├── awards        → <AwardsHall />
  ├── makgora       → <MakgoraHub />
  ├── calendario    → <Calendario />
  ├── invitaciones  → <Invitaciones />
  ├── finanzas      → <Finanzas />
  ├── entrenamientos→ <TrainingHub /> (LAZY)
  ├── messages      → <Messages />
  └── ia            → <AIChat /> (LAZY)
```

Modals overlay (AnimatePresence): AdminPanel, ImportCSV, Settings, Announcements, BirthdayCelebration.

### Supabase Client (`src/supabaseClient.js`)

```js
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key');
```

---

## 3. BASE DE DATOS — TODAS LAS TABLAS (esquema `public`)

### 3.1 Tablas Core

#### `players` (59 filas, RLS: ON)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| user_id | UUID | | FK → auth.users.id |
| legacy_id | VARCHAR(10) | | nullable |
| first_name | VARCHAR(100) NOT NULL | | |
| last_name | VARCHAR(100) NOT NULL | '' | En Colombia guarda "segundo nombre + apellidos" |
| nickname | VARCHAR(100) | | nullable, usado para username si existe |
| username | VARCHAR(50) | | UNIQUE, para login |
| document_type | VARCHAR(50) | | nullable |
| document_number | VARCHAR(50) | | nullable |
| birth_date | DATE | | nullable |
| age | INTEGER | | nullable |
| phone | VARCHAR(30) | | nullable |
| email | VARCHAR(150) | | nullable |
| initial_category | VARCHAR(50) | | nullable |
| start_year | INTEGER | | nullable |
| current_category | VARCHAR(50) | | nullable |
| internal_team | VARCHAR(50) | | nullable |
| team_category | VARCHAR(100) | | "orcos" etc. |
| weight_kg | NUMERIC(5,1) | | nullable |
| height_m | NUMERIC(4,2) | | nullable |
| had_fractures | BOOLEAN | false | nullable |
| fracture_details | TEXT | | nullable |
| allergies | TEXT | | nullable |
| medical_conditions | TEXT | | nullable |
| health_insurance | VARCHAR(100) | | nullable |
| emergency_contact_name | VARCHAR(200) | | nullable |
| emergency_contact_phone | VARCHAR(30) | | nullable |
| commitment_accepted | BOOLEAN | true | nullable |
| jersey_number | INTEGER | | nullable |
| role | VARCHAR(50) | 'Titular' | nullable |
| position | VARCHAR(50) | | nullable |
| status | VARCHAR(30) | 'activo' | nullable |
| attr_force | INTEGER | 50 | nullable |
| attr_speed | INTEGER | 50 | nullable |
| attr_stamina | INTEGER | 50 | nullable |
| attr_technique | INTEGER | 70 | nullable |
| clothing_jersey | VARCHAR(10) | | nullable |
| clothing_shorts | VARCHAR(10) | | nullable |
| clothing_socks | VARCHAR(10) | | nullable |
| gym_squat | NUMERIC(6,1) | 0 | nullable |
| gym_bench | NUMERIC(6,1) | 0 | nullable |
| gym_deadlift | NUMERIC(6,1) | 0 | nullable |
| makgora_team_id | UUID | | FK → makgora_teams.id |
| system_role | VARCHAR(50) | 'jugador' | nullable |
| source | VARCHAR(30) | 'manual' | nullable |
| form_submitted_at | TIMESTAMPTZ | | nullable |
| created_at | TIMESTAMPTZ | NOW() | nullable |
| updated_at | TIMESTAMPTZ | NOW() | nullable |
| position_id | INTEGER | | nullable, FK → rugby_positions.id |
| **avatar_id** | TEXT | | añadido migration 20 |
| **photo_url** | TEXT | | añadido migration 20 |

Índices: `idx_players_user`(user_id), `idx_players_team`(team_category), `idx_players_status`(status)

---

#### `user_profiles` (6 filas, RLS: OFF → ON con policies específicas)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| user_id | UUID NOT NULL | | UNIQUE, FK → auth.users.id |
| display_name | VARCHAR(100) NOT NULL | | |
| system_role | VARCHAR(50) NOT NULL | 'jugador' | CHECK: desarrollador,presidente,promotor,entrenador,tesorero,arbitro,jugador |
| club_scope | VARCHAR(50) | | nullable |
| division_scope | VARCHAR(50) | | nullable |
| is_active | BOOLEAN | true | nullable |
| created_at | TIMESTAMPTZ | NOW() | nullable |
| updated_at | TIMESTAMPTZ | NOW() | nullable |
| **preferences** | JSONB | '{}' | añadido posteriormente |

---

#### `club_config` (1 fila, RLS: ON)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | SERIAL | | PK |
| team_category | TEXT | 'orcos' | |
| key | TEXT NOT NULL | | UNIQUE(team_category, key) |
| value | TEXT NOT NULL | | |
| updated_at | TIMESTAMPTZ | NOW() | |

Seed: `('orcos', 'mensualidad_base', '10000')`, `('orcos', 'last_monthly_charge', '2026-06')`

---

#### `club_settings` (0 filas, RLS: ON)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| key | TEXT NOT NULL | | |
| value | TEXT | | nullable |
| updated_at | TIMESTAMPTZ | NOW() | |

---

### 3.2 Tablas de Equipo

#### `team_members` (0 filas, RLS: ON)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| user_id | UUID NOT NULL | | FK → auth.users.id |
| team_category | VARCHAR(100) NOT NULL | | |
| role | VARCHAR(50) NOT NULL | 'jugador' | |
| is_active | BOOLEAN | true | nullable |
| joined_at | TIMESTAMPTZ | NOW() | nullable |

---

#### `teams` (0 filas, RLS: ON)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| name | TEXT NOT NULL | | |
| code | TEXT NOT NULL | | UNIQUE |
| created_by | UUID | | FK → auth.users.id, nullable |
| created_at | TIMESTAMPTZ | NOW() | |

---

### 3.3 Tablas de Jugador (hijas de `players`)

#### `attribute_history` (RLS: ON)
| Columnas | id(UUID PK), player_id(UUID FK→players CASCADE), recorded_date(DATE), attr_force, attr_speed, attr_stamina, attr_technique(INTEGER), created_at(TIMESTAMPTZ) |
|---|---|

#### `injury_log` (RLS: ON)
| Columnas | id(UUID PK), player_id(UUID FK→players CASCADE), diagnosis(TEXT), injury_date(DATE), recovery_weeks(INTEGER DEFAULT 0), phase(INTEGER DEFAULT 1 CHECK 1-4), notes(TEXT), created_at(TIMESTAMPTZ) |
|---|---|

#### `attendance` (RLS: ON)
| Columnas | id(UUID PK), player_id(UUID FK→players CASCADE), event_date(DATE), status(VARCHAR(30) CHECK present/late/absent_unjustified/absent_justified), created_at(TIMESTAMPTZ) |
|---|---|

#### `player_attendance_summary` (RLS: ON)
| Columnas | player_id(UUID PK FK→players CASCADE), total(INTEGER DEFAULT 0), present, late, absent_unjustified, absent_justified(INTEGER), updated_at(TIMESTAMPTZ) |
|---|---|

#### `penalties` (RLS: ON)
| Columnas | player_id(UUID PK FK→players CASCADE), burpees(INTEGER DEFAULT 0), cones(BOOLEAN DEFAULT false), updated_at(TIMESTAMPTZ) |
|---|---|

#### `infractions` (RLS: ON)
| Columnas | id(UUID PK), player_id(UUID FK→players CASCADE), infraction_date(DATE), penalties, yellow_cards, red_cards(INTEGER), fault_type(VARCHAR(50)), context(VARCHAR(50) DEFAULT 'partido'), notes, description(TEXT), created_at(TIMESTAMPTZ) |
|---|---|

#### `match_stats` (RLS: ON)
| Columnas | id(UUID PK), player_id(UUID FK→players CASCADE), match_date(DATE), opponent(VARCHAR(100)), tries, conversions, tackles, turnovers, yellow_cards, red_cards(INTEGER DEFAULT 0), mvp(BOOLEAN DEFAULT false), context(VARCHAR(20) CHECK general/makgora), tournament_id(UUID), created_at(TIMESTAMPTZ) |
|---|---|

#### `wellness_logs` (RLS: ON)
| Columnas | id(UUID PK), player_id(UUID FK→players CASCADE), log_date(DATE), sleep_quality(INTEGER CHECK 1-5), muscle_soreness(INTEGER CHECK 1-5), stress_level(INTEGER CHECK 1-5), created_at(TIMESTAMPTZ) |
|---|---|

#### `hia_assessments` (0 filas, RLS: ON)
| Columnas | id(UUID PK), player_id(UUID FK→players CASCADE), assessment_date(DATE), symptoms(TEXT[]), result(VARCHAR(50)), suspension_days(INTEGER DEFAULT 14), created_at(TIMESTAMPTZ) |
|---|---|

#### `workout_logs` (RLS: ON)
| Columnas | id(UUID PK), player_id(UUID FK→players CASCADE), workout_date(DATE), routine_name(VARCHAR(200)), category(VARCHAR(50)), exercises(JSONB DEFAULT '[]'), completed(BOOLEAN DEFAULT false), created_at(TIMESTAMPTZ) |
|---|---|

---

### 3.4 Tablas de Calendario y Partidos

#### `schedule_events` (2 filas, RLS: ON)
| id(UUID PK), user_id(UUID), title(VARCHAR(200)), date(DATE), time(VARCHAR(10)), location(VARCHAR(300)), maps_link(VARCHAR(500)), type(VARCHAR(30) DEFAULT 'entrenamiento'), team_category(VARCHAR(100)), linked_routine(VARCHAR(200)), recurrence_group(UUID), context(VARCHAR(20) CHECK general/makgora), created_at(TIMESTAMPTZ) |
|---|

#### `championships` (0 filas, RLS: ON)
| id(UUID PK), user_id(UUID), name(VARCHAR(200)), deadline_date(DATE), description(TEXT), team_category(VARCHAR(100)), created_at(TIMESTAMPTZ) |
|---|

#### `fixtures` (0 filas, RLS: ON)
| id(UUID PK), user_id(UUID), date(DATE), opponent(VARCHAR(200)), orcos_score, opponent_score(INTEGER DEFAULT 0), tries(INTEGER DEFAULT 0), mvp(VARCHAR(200)), team_category(VARCHAR(100)), context(VARCHAR(20) CHECK general/makgora), tournament_id(UUID), created_at(TIMESTAMPTZ) |
|---|

#### `rivals` (0 filas, RLS: ON)
| id(UUID PK), user_id(UUID), name(VARCHAR(200)), colors(VARCHAR(200)), contact(VARCHAR(200)), notes(TEXT), created_at(TIMESTAMPTZ) |
|---|

#### `future_fixtures` (1 fila, RLS: ON)
| id(UUID PK), user_id(UUID), opponent(VARCHAR(200)), date(DATE), time(VARCHAR(10)), location(VARCHAR(300)), team_category(VARCHAR(100)), created_at(TIMESTAMPTZ) |
|---|

#### `lineups` (RLS: ON)
| id(UUID PK), user_id(UUID), team_category(VARCHAR(100)), formation(VARCHAR(100)), orientation(VARCHAR(20) DEFAULT 'horizontal'), size(VARCHAR(20) DEFAULT 'medium'), notes(TEXT), positions(JSONB DEFAULT '{}'), created_at, updated_at, UNIQUE(user_id, team_category) |
|---|

---

### 3.5 Tablas de Invitaciones

#### `match_invitations` (0 filas, RLS: ON)
| id(UUID PK), user_id(UUID), future_fixture_id(UUID FK→future_fixtures), token(VARCHAR(200)), rival_name(VARCHAR(200)), status(VARCHAR(50) DEFAULT 'active'), expires_at(DATE), created_at(TIMESTAMPTZ), rival_id(UUID FK→rivals), guest_count(INTEGER DEFAULT 0), response(VARCHAR(50) DEFAULT 'pending'), response_notes(TEXT), responded_at(TIMESTAMPTZ), notified_at(TIMESTAMPTZ) |
|---|

#### `guest_players` (0 filas, RLS: ON)
| id(UUID PK), invitation_id(UUID FK→match_invitations), name(VARCHAR(200)), number(INTEGER), position(VARCHAR(200)), notes(VARCHAR(200)), created_at(TIMESTAMPTZ) |
|---|

---

### 3.6 Tablas de Finanzas y Membresías

#### `finances` (1 fila, RLS: ON)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| user_id | UUID NOT NULL | | |
| type | VARCHAR(30) NOT NULL | | CHECK ingreso/egreso |
| descripcion | TEXT | | nullable |
| amount | NUMERIC(12,2) NOT NULL | | |
| date | DATE | CURRENT_DATE | nullable |
| category | VARCHAR(50) | | nullable |
| team_category | VARCHAR(100) | | nullable |
| created_at | TIMESTAMPTZ | NOW() | |

---

#### `player_payments` (5 filas, RLS: ON)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| player_id | UUID NOT NULL | | FK→players(id) CASCADE |
| amount | NUMERIC NOT NULL | | |
| payment_date | DATE NOT NULL | CURRENT_DATE | |
| source | TEXT NOT NULL | | CHECK membership/fundraising |
| assignment_id | UUID | | FK→fundraising_assignments(id) SET NULL |
| campaign_id | UUID | | FK→fundraising_campaigns(id) SET NULL |
| notes | TEXT | '' | nullable |
| created_at | TIMESTAMPTZ NOT NULL | NOW() | |

---

#### `inventory` (RLS: ON)
| id(UUID PK), user_id(UUID), name(VARCHAR(200)), total(INTEGER DEFAULT 1), assigned_to(VARCHAR(200)), status(VARCHAR(50) DEFAULT 'Excelente'), team_category(VARCHAR(100)), created_at, updated_at |
|---|

---

### 3.7 Tablas de Mak'Gora (Torneos)

#### `makgora_teams` (6 filas — seed data)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| name | VARCHAR(100) NOT NULL | | Orcos, Cuervos, Trolls, Gargolas, Pitbull, Buffalos |
| rpg_name | VARCHAR(100) | | nullable |
| emblem_color | VARCHAR(50) | | nullable |
| sort_order | INTEGER | 0 | nullable |
| is_active | BOOLEAN | true | nullable |
| created_at | TIMESTAMPTZ | NOW() | |

#### `tournaments` (0 filas)
| id(UUID PK), name(VARCHAR(200)), edition_name(VARCHAR(200)), start_date, end_date, status(VARCHAR(30) CHECK proximo/en_curso/finalizado/cancelado), winner_team_id(UUID FK→makgora_teams), created_by(UUID), created_at, updated_at |
|---|

#### `tournament_teams` (0 filas)
| id(UUID PK), tournament_id(UUID FK→tournaments CASCADE), team_id(UUID FK→makgora_teams), captain_player_id(UUID), created_at, UNIQUE(tournament_id, team_id) |
|---|

#### `tournament_matches` (0 filas)
| id(UUID PK), tournament_id(UUID FK→tournaments CASCADE), round(INTEGER), phase(VARCHAR(30) CHECK regular/semifinal/final/tercer_puesto), home_team_id, away_team_id(UUID FK→makgora_teams), home_score, away_score(INTEGER), home_tries, away_tries(INTEGER DEFAULT 0), match_date(DATE), match_time(VARCHAR(10)), location(VARCHAR(300)), status(VARCHAR(30) CHECK pendiente/jugado/cancelado/forfeit), mvp(VARCHAR(200)), created_at, updated_at |
|---|

#### `tournament_standings` (0 filas)
| id(UUID PK), tournament_id(UUID FK→tournaments CASCADE), team_id(UUID FK→makgora_teams), played, won, drawn, lost, points_for, points_against(INTEGER DEFAULT 0), point_diff(INTEGER GENERATED ALWAYS AS (points_for - points_against) STORED), tries_for, tries_against(INTEGER DEFAULT 0), bonus_points, total_points, position(INTEGER DEFAULT 0), updated_at, UNIQUE(tournament_id, team_id) |
|---|

#### `tournament_player_stats` (0 filas)
| id(UUID PK), match_id(UUID FK→tournament_matches CASCADE), player_id(UUID FK→players CASCADE), tries, conversions, tackles, turnovers, yellow_cards, red_cards(INTEGER DEFAULT 0), mvp(BOOLEAN DEFAULT false), created_at |
|---|

#### `player_loans` (0 filas)
| id(UUID PK), player_id(UUID FK→players CASCADE), from_team_id, to_team_id(UUID FK→makgora_teams), tournament_id(UUID FK→tournaments), match_id(UUID FK→tournament_matches), start_date(DATE), end_date(DATE), reason(TEXT), status(VARCHAR(30) CHECK pending/approved/rejected/returned/cancelled), approved_by(UUID), notes(TEXT), created_at, updated_at |
|---|

---

### 3.8 Tablas de Recaudación (Fundraising)

#### `fundraising_campaigns` (1 fila, RLS: ON)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| team_category | TEXT NOT NULL | | orcos |
| name | TEXT NOT NULL | | |
| type | TEXT NOT NULL | | CHECK raffle/food/general |
| description | TEXT | '' | nullable |
| status | TEXT NOT NULL | 'active' | CHECK active/closed/cancelled |
| deadline | DATE | | nullable |
| ticket_price | NUMERIC | | nullable |
| total_tickets | INTEGER | | nullable |
| prizes | JSONB | '[]' | json array of {name, value} (migration 17) |
| created_at | TIMESTAMPTZ NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ NOT NULL | NOW() | |

Índices: `idx_fundraising_campaigns_team`(team_category)

#### `fundraising_assignments` (59 filas, RLS: ON)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| campaign_id | UUID NOT NULL | | FK→fundraising_campaigns CASCADE |
| player_id | UUID NOT NULL | | FK→players CASCADE |
| amount_due | NUMERIC NOT NULL | 0 | |
| amount_paid | NUMERIC NOT NULL | 0 | |
| ticket_start | INTEGER | | nullable (solo rifas) |
| ticket_end | INTEGER | | nullable (solo rifas) |
| notes | TEXT | '' | nullable |
| created_at | TIMESTAMPTZ NOT NULL | NOW() | |
| | | | UNIQUE(campaign_id, player_id) |

Índices: `idx_fundraising_assignments_campaign`(campaign_id), `idx_fundraising_assignments_player`(player_id)

#### `raffle_tickets` (500 filas, RLS: ON)
| Columna | Tipo | Default | Notas |
|---------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| campaign_id | UUID NOT NULL | | FK→fundraising_campaigns CASCADE |
| ticket_number | INTEGER NOT NULL | | |
| assigned_to | UUID | | FK→players(id) SET NULL, nullable |
| sold_to_name | TEXT | '' | nullable |
| sold_at | DATE | | nullable |
| is_sold | BOOLEAN NOT NULL | FALSE | |
| created_at | TIMESTAMPTZ NOT NULL | NOW() | |
| | | | UNIQUE(campaign_id, ticket_number) |

Índice: `idx_raffle_tickets_campaign`(campaign_id)

---

### 3.9 Tablas de Mensajería, Notificaciones e IA

#### `messages` (2 filas, RLS: ON)
| id(UUID PK), sender_id(UUID FK→auth.users.id), receiver_id(UUID FK→auth.users.id, nullable), channel(VARCHAR(50) DEFAULT 'direct'), text(TEXT), read_at(TIMESTAMPTZ), created_at(TIMESTAMPTZ), attachments(JSONB DEFAULT '[]') |
|---|

#### `push_tokens` (0 filas, RLS: ON)
| id(UUID PK), player_id(UUID FK→players), user_id(UUID), token(TEXT), team_category(TEXT), makgora_team_id(UUID), position(TEXT), created_at, updated_at |
|---|

#### `push_tokens_test` (similar a push_tokens, para pruebas)
|---|

#### `announcement_views` (RLS: ON)
| Columnas | id(UUID PK), announcement_id(UUID), user_id(UUID), viewed_at(TIMESTAMPTZ) |
|---|

#### `custom_tactics` (3 filas, RLS: ON)
| id(UUID PK), user_id(UUID FK→auth.users), name(TEXT), scope(TEXT DEFAULT 'all'), formation_type(TEXT DEFAULT 'union'), positions_horizontal(JSONB), positions_vertical(JSONB), lineup(JSONB DEFAULT '{}'), notes(TEXT DEFAULT ''), sort_order(INTEGER DEFAULT 0), created_at, updated_at |
|---|

#### `ai_chat_history` (0 filas, RLS: ON)
| user_id(UUID PK FK→auth.users), messages(JSONB DEFAULT '[]'), updated_at(TIMESTAMPTZ) |
|---|

#### `ai_usage` (0 filas, RLS: ON)
| id(UUID PK), user_id(UUID FK→auth.users), provider_id(TEXT), model_id(TEXT), usage_date(DATE), request_count(INTEGER DEFAULT 1) |
|---|

#### `rugby_positions` (lookup table)
| Columnas | id(INTEGER PK), name(VARCHAR(100)), abbreviation(VARCHAR(10)), category(VARCHAR(50)), sort_order(INTEGER) |
|---|

---

### 3.10 Resumen de Tablas (46 totales en `public`)

| # | Tabla | Filas | RLS | Propósito |
|---|-------|-------|-----|-----------|
| 1 | players | 59 | ON | Jugadores del club |
| 2 | user_profiles | 6 | ON | Perfiles de auth (rol, scope) |
| 3 | club_config | 1 | ON | Config del club (mensualidad, etc) |
| 4 | club_settings | 0 | ON | Settings generales |
| 5 | team_members | 0 | ON | Miembros de equipo |
| 6 | teams | 0 | ON | Equipos multideporte |
| 7 | attribute_history | | ON | Historial de atributos |
| 8 | injury_log | | ON | Lesiones |
| 9 | attendance | | ON | Asistencia |
| 10 | player_attendance_summary | | ON | Resumen de asistencia |
| 11 | penalties | | ON | Penitencias |
| 12 | infractions | | ON | Faltas |
| 13 | match_stats | | ON | Estadísticas de partido |
| 14 | wellness_logs | | ON | Bienestar (sueño, estrés) |
| 15 | hia_assessments | 0 | ON | Evaluaciones HIA (conmoción) |
| 16 | workout_logs | | ON | Registros de entrenamiento |
| 17 | schedule_events | 2 | ON | Eventos del calendario |
| 18 | championships | 0 | ON | Campeonatos |
| 19 | finances | 1 | ON | Registro financiero |
| 20 | inventory | | ON | Inventario |
| 21 | fixtures | 0 | ON | Partidos jugados |
| 22 | rivals | 0 | ON | Rivales |
| 23 | future_fixtures | 1 | ON | Partidos programados |
| 24 | lineups | | ON | Alineaciones guardadas |
| 25 | makgora_teams | 6 | ON | Equipos Mak'Gora |
| 26 | tournaments | 0 | ON | Torneos Mak'Gora |
| 27 | tournament_teams | 0 | ON | Equipos en torneos |
| 28 | tournament_matches | 0 | ON | Partidos de torneo |
| 29 | tournament_standings | 0 | ON | Tabla de posiciones |
| 30 | tournament_player_stats | 0 | ON | Stats de jugadores en torneo |
| 31 | player_loans | 0 | ON | Préstamos de jugadores Mak'Gora |
| 32 | fundraising_campaigns | 1 | ON | Campañas de recaudación |
| 33 | fundraising_assignments | 59 | ON | Asignaciones a jugadores |
| 34 | raffle_tickets | 500 | ON | Boletos de rifa |
| 35 | player_payments | 5 | ON | Pagos (membresía + recaudación) |
| 36 | messages | 2 | ON | Mensajes internos |
| 37 | push_tokens | 0 | ON | Tokens de notificaciones push |
| 38 | push_tokens_test | 0 | ON | Test de push |
| 39 | announcement_views | | ON | Vistas de anuncios |
| 40 | custom_tactics | 3 | ON | Tácticas personalizadas |
| 41 | ai_chat_history | 0 | ON | Historial de chat IA |
| 42 | ai_usage | 0 | ON | Uso de IA por usuario |
| 43 | rugby_positions | | ? | Catálogo de posiciones |
| 44 | match_invitations | 0 | ON | Invitaciones a partidos |
| 45 | guest_players | 0 | ON | Jugadores invitados |
| 46 | clubs | 0 | ON | Clubs dinámicos |

---

## 4. FUNCIONES SQL

### `is_admin()` — Security Definer
```sql
SELECT EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_id = auth.uid()
  AND system_role IN ('desarrollador','presidente','promotor')
  AND is_active = true
);
```
Usada en RLS de casi todas las tablas con user_id.

### `get_user_tier()` — Mapea rol → tier numérico
```sql
SELECT CASE u.system_role
  WHEN 'desarrollador' THEN 0
  WHEN 'presidente' THEN 1
  WHEN 'promotor' THEN 2
  WHEN 'entrenador' THEN 3
  WHEN 'tesorero' THEN 3
  WHEN 'arbitro' THEN 3
  ELSE 4
END
FROM user_profiles u WHERE u.user_id = auth.uid();
```
Usada en RLS de fundraising y player_payments.

### `admin_create_player_credentials(p_player_id UUID, p_password TEXT DEFAULT NULL)` — Security Definer

**Versión actual en BD** (difíere de migration 24 — usa `IF EXISTS (UPDATE) ELSE (INSERT)` en vez de `DELETE`):
```sql
DECLARE
  v_player RECORD;
  v_base TEXT; v_username TEXT; v_counter INTEGER := 0;
  v_email TEXT; v_user_id UUID; v_password TEXT;
  v_last TEXT;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;

  -- Primer nombre + primer apellido (Colombia: last_name guarda "segundo nombre + apellidos")
  v_last := COALESCE(NULLIF(split_part(v_player.last_name, ' ', 2), ''), split_part(v_player.last_name, ' ', 1));
  v_base := regexp_replace(lower(COALESCE(NULLIF(v_player.nickname,''), split_part(v_player.first_name, ' ', 1)||'.'||v_last)), '[^a-z0-9.]', '', 'g');
  IF length(v_base) > 40 THEN v_base := left(v_base, 40); END IF;
  IF v_base = '' OR v_base = '.' THEN v_base := 'guerrero'; END IF;
  v_username := v_base;
  WHILE EXISTS (SELECT 1 FROM players WHERE username = v_username AND id != p_player_id) LOOP
    v_counter := v_counter + 1; v_username := v_base || v_counter::TEXT;
  END LOOP;

  v_email := v_username || '@orcos.club';
  v_password := upper(substr(md5(random()::TEXT), 1, 4)) || substr(md5(random()::TEXT), 1, 4);

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email AND deleted_at IS NULL) THEN
    UPDATE auth.users SET
      encrypted_password = crypt(v_password, gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object('display_name', ... , 'temp_password', 'true'),
      updated_at = now()
    WHERE email = v_email AND deleted_at IS NULL
    RETURNING id INTO v_user_id;
  ELSE
    INSERT INTO auth.users (...) VALUES (...)
    RETURNING id INTO v_user_id;
  END IF;

  UPDATE players SET username = v_username, email = v_email WHERE id = p_player_id;
  INSERT INTO user_profiles (...) VALUES (...) ON CONFLICT (user_id) DO UPDATE ...;

  RETURN jsonb_build_object('success', true, 'username', v_username, 'email', v_email, 'password', v_password);
END;
```

**Nota:** No usa `SET search_path`. pgcrypto está en schema `extensions`, encontrado via search_path por defecto: `"$user", public, extensions`.

### `admin_reset_player_password(p_player_id UUID, p_new_password TEXT)` — Security Definer
Busca player por ID, toma su email, actualiza `encrypted_password` + metadata con `temp_password=true`.

### `admin_reset_staff_password(p_user_id UUID, p_new_password TEXT)` — Security Definer
Actualiza password de cualquier auth user (para staff).

### `update_standing(...)` — Upsert de standings
```sql
-- upsert en tournament_standings
IF EXISTS (SELECT ...) THEN UPDATE ELSE INSERT END IF;
```

### `notify_schedule_event()` — Trigger function
```sql
PERFORM net.http_post(
  url := 'https://.../functions/v1/send-push',
  headers := jsonb_build_object('Content-Type', 'application/json'),
  body := json_build_object('title', 'Nuevo evento: ' || NEW.title, 'body', ..., 'filters', ...)::text
);
RETURN NEW;
```

### `update_invitation_guest_count()` — Trigger function
```sql
-- AFTER INSERT/DELETE en guest_players
-- UPDATE match_invitations SET guest_count = guest_count +/- 1
```

### `update_push_token_timestamp()` — Trigger function
```sql
-- BEFORE UPDATE en push_tokens
NEW.updated_at = now(); RETURN NEW;
```

---

## 5. TRIGGERS

| Trigger | Timing | Evento | Tabla | Función |
|---------|--------|--------|-------|---------|
| trg_guest_count | AFTER | INSERT, DELETE | guest_players | update_invitation_guest_count() |
| trg_push_tokens_updated_at | BEFORE | UPDATE | push_tokens | update_push_token_timestamp() |
| trg_notify_schedule_event | AFTER | INSERT | schedule_events | notify_schedule_event() |

---

## 6. STORAGE

### Bucket: `player-avatares`

| Propiedad | Valor |
|-----------|-------|
| Público | true |
| Tamaño máximo | 2 MB (2097152 bytes) |
| Tipos permitidos | image/jpeg, image/png, image/webp |
| Política SELECT | Todos (bucket_id = 'player-avatars') |
| Política INSERT | Staff autenticado (get_user_tier() <= 3) |
| Política UPDATE | Staff autenticado (get_user_tier() <= 3) |

---

## 7. SISTEMA DE ROLES Y PERMISOS

### RPG_ROLES (desde `context/constants.js`)

| system_role | RPG | Icono | Color | Tier | Permisos |
|------------|-----|-------|-------|------|----------|
| desarrollador | Arquitecto del Reino | 🏰 | #e040fb | 0 | Todo |
| presidente | Señor de la Guerra | ⚔️ | #ffb300 | 1 | Todo |
| promotor | Comandante de Horda | 🛡️ | #ff6d00 | 2 | CRUD staff, no delete |
| entrenador | Maestro de Armas | 🏋️ | #00e676 | 3 | CRUD básico |
| tesorero | Guardian del Botín | 💰 | #00b0ff | 3 | CRUD básico |
| arbitro | Juez del Coliseo | ⚖️ | #ffea00 | 3 | CRUD básico |
| jugador | Guerrero | 👹 | #9e9e9e | 4 | Solo ver, editar perfil propio |

### SUPER_ROLES = ['desarrollador', 'presidente']

### Mapeo a permisos RLS

| Operación | Tier requerido |
|-----------|---------------|
| SELECT en tablas public | tier <= 4 (todos autenticados) |
| INSERT/UPDATE en fundraising | tier <= 3 (staff) |
| DELETE en fundraising | tier <= 1 (super roles) |
| INSERT/UPDATE en player_payments | system_role != 'jugador' |
| DELETE en player_payments | system_role ∈ super_roles |
| INSERT/UPDATE storage avatars | tier <= 3 (staff) |
| Admin panel, clubs, teams | is_admin() (tier <= 2) |

---

## 8. SISTEMA DE CREDENCIALES (AUTH)

### Flujo completo

```
[Roster] → Staff abre perfil de jugador
         → Clic "Forjar Credenciales"
         → CredentialModal se abre
         → Clic "Forjar" → llama a:
             ClubContext.createPlayerCredentials(playerId)
               → supabase.rpc('admin_create_player_credentials', { p_player_id, p_password: null })
               → Función SQL devuelve { username, email, password }
               → updatePlayer local (setPlayers)
         → Modal muestra resultado:
             Usuario: kennent.vergara
             Email: kennent.vergara@orcos.club  <-- para iniciar sesión
             Contraseña: 26B858ca
             [📋 Copiar credenciales] → clipboard
         → Staff pega en WhatsApp y envía al jugador

[Jugador] → Abre app/login
          → Ingresa email + contraseña temporal
          → AuthContext detecta user_metadata.temp_password === true
          → requirePasswordChange = true
          → App.jsx renderiza solo <ChangePasswordModal /> (fullscreen)
          → Jugador ingresa nueva contraseña (≥6 chars, confirm)
          → Supabase: auth.updateUser({ data: { temp_password: false } })
          → clearPasswordChangeFlag() → App carga normal
```

### Reglas de username

```
1. Si tiene nickname: usar nickname
2. Sino: split_part(first_name, ' ', 1) + '.' + split_part(last_name, ' ', 2)
   (last_name en Colombia = "segundo_nombre apellido1 apellido2")
3. Si no hay segunda palabra: split_part(last_name, ' ', 1)
4. regexp_replace(lower(...), '[^a-z0-9.]', '', 'g')
5. Si duplicado: añadir sufijo numérico (v_base || counter::TEXT)
6. Max 40 chars. Si vacío: 'guerrero'
```

### Dominio email

`username@orcos.club`

### Password generado

`upper(substr(md5(random()::TEXT), 1, 4)) || substr(md5(random()::TEXT), 1, 4)`
→ 8 caracteres alfanuméricos (4 mayúsculas + 4 minúsculas/números). Ej: `26B858ca`

### Re-forjar (repetir)

`IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email AND deleted_at IS NULL) THEN UPDATE ELSE INSERT END IF;`
→ Nunca DELETE en auth.users (FK desde messages).
→ UPDATE actualiza password + temp_password flag.

---

## 9. MÓDULO DE RECAUDACIÓN (FUNDRAISING)

### Tipos de campaña

| Tipo | Descripción | Mecanismo |
|------|------------|-----------|
| raffle | Rifa con boletos numerados | Boletos 1..N, asignación secuencial |
| food | Comida (flat por persona) | amount_due fijo por jugador |
| general | Recaudación genérica | amount_due sin boletos |

### Flujo de Rifa

```
1. Staff crea campaña → NewCampaignModal (2-step wizard + prizes)
2. Staff asigna boletos → RaffleAssignmentModal
   - Asignación secuencial: primer boleto libre → última posición
   - Delete antes de insert (evita UNIQUE violation)
   - Puede asignar todos (assignAll) o por jugador
3. Staff vende boletos → SellTicketsModal
   - FIFO bidireccional (selecciona jugador → vende X boletos de su lote)
   - Input capped al total sin vender
4. Staff registra pago → RegisterPaymentModal
   - Crea player_payments (source='fundraising') + finanzas (como ingreso, desc con [cid:...])
5. Staff ve histoŕico → PaymentHistoryModal
```

### Flujo de Comida/General

```
1. Crear campaña
2. Asignar jugadores con amount_due
3. Registrar pagos (partial o full)
4. Ver stats individuales
```

### Eliminación

- DELETE campaña: solo tier <= 1 (super roles)
- DELETE pago: solo super roles
- Bidireccional: al borrar pago, actualiza amount_paid en assignment y elimina registro de finances

### Pagos

- Unificados en `player_payments` con columna `source` ('membership' | 'fundraising')
- `recordMembershipPayment` crea player_payments + finances (enlazado por `[pid:paymentId]` en desc)
- `registerPayment` (fundraising) también crea ambos registros
- `deletePayment` busca en `allPayments` o hace query directa a Supabase (por si no está en estado)

### Premios

- Almacenados como JSONB en `fundraising_campaigns.prizes`
- Formato: `[{ "name": "1° Bicicleta", "value": 500000 }, { "name": "2° Balón", "value": 80000 }]`
- Editables en EditCampaignModal

### Rentabilidad

```
Rentabilidad = (amount_paid total / amount_due total) * 100
```

---

## 10. SISTEMA DE AVATARES

### 40 SVG Mitológicos

- Ubicación: `public/avatares/*.svg`
- 40 iconos de game-icons.net (CC BY 3.0)
- Fuente blanca sobre fondo transparente (sin CSS filter inversion)
- Catálogo en `src/data/mythicalAvatars.js`: array de `{ id, name }`

### Componentes

- **PlayerPhoto**: Circle component, 3 estados:
  1. `photo_url` → muestra foto real
  2. `avatar_id` → muestra SVG (ruta via `getAvatarPath(id)`)
  3. fallback → iniciales del nombre
  - Modo `editable` superpone overlay 📷 al hover

- **AvatarPicker**: Modal con grid de 40 SVGs + botón de subir foto + botón limpiar
  - Seleccionar SVG llama a `usePlayerAvatar.setAvatar(id)`
  - Subir foto: file input → comprime a WebP 512px via Canvas → sube a Storage

### Hook: `usePlayerAvatar`

```js
const { avatarId, photoUrl, uploading, setAvatar, setPhoto, clearPhoto } = usePlayerAvatar(player, updatePlayer);
```

- **setAvatar(id)**: updatePlayer({ avatar_id: id, photo_url: null })
- **setPhoto(file)**: upload a `player-avatars/{playerId}.webp` (upsert) → updatePlayer({ avatar_id: null, photo_url: publicUrl })
- **clearPhoto()**: remove from Storage + updatePlayer({ photo_url: null })

### Integración

| Componente | Tamaño | Modal AvatarPicker |
|-----------|--------|-------------------|
| PlayerCard (Roster) | 42px | No |
| PlayerDetail (Roster) | 80px | Sí (vía onUpdatePlayer) |
| PlayerDashboard | 80px | Sí (vía updatePlayer from ClubContext) |

---

## 11. FRONTEND — ÁRBOL DE COMPONENTES

### Vista completa (staff)

```
<App>
  ├── <Header /> (logo, nav tabs, user info)
  ├── <AdminPanel /> (condicional, hasPermission)
  ├── <main>
  │     <AnimatePresence mode="wait">
  │       └── <activeTab />
  │     </AnimatePresence>
  │   </main>
  ├── <ImportCSVModal /> (condicional)
  ├── <Settings /> (condicional)
  ├── <AnnouncementModal /> (condicional)
  ├── <BirthdayCelebration /> (condicional)
  ├── <Sidebar />
  └── <Footer />
```

### Vista jugador

```
<App>
  ├── <PlayerDashboard />
  └── <Footer />
```

### Tabs (13 total, 4 lazy)

1. **Dashboard** — MetricsCards, RadarChart, AttendanceTimeline, InjuryReport, UpcomingEvents, etc.
2. **Roster** — PlayerCard grid, PlayerModal (PlayerDetail + modales anidados), AddPlayerModal, CredentialModal, ResetPasswordModal, AvatarPicker
3. **Estadísticas** (LAZY) — Atributos, Demografia, Fisico, KPI, charts
4. **CanchaTáctica** (LAZY) — PitchField, PositionNode, tactic editor
5. **Tribunal** — ControlTab, FaultBookTab, PenaltyCard
6. **AwardsHall** — Logros
7. **Mak'Gora Hub** — torneos, standings, loans
8. **Calendario** — AgendaTab, FixtureTab, FutureTab, GuestRoster
9. **Invitaciones** — match invitations CRUD
10. **Finanzas** — FinanceTab, FundraisingTab, InventoryTab, SummaryCards, MembershipList, etc.
11. **Entrenamientos** (LAZY) — CatalogTab, PlanTab, PlayersTab
12. **Messages** — chat interno
13. **IA** (LAZY) — AIChat multi-provider

### Modales globales

- AdminPanel: UserManagement, ImportCSV
- Settings
- AnnouncementModal
- BirthdayCelebration

---

## 12. CONTEXT HOOKS (desde `src/context/hooks/`)

| Hook | Propósito | Estado principal |
|------|-----------|-----------------|
| useAuth | Sesión, profile, login/logout | session, user, profile, requirePasswordChange |
| usePlayers | CRUD jugadores + atributos + gym | players[] |
| useSchedule | Eventos de calendario | schedule[] |
| useChampionships | Campeonatos | championships[] |
| useFinances | Finanzas + membresías | finances[], mensualidadBase |
| useInventory | Inventario | inventory[] |
| useMatches | Fixtures + rivals + future | fixtures[], rivals[], futureFixtures[] |
| useInvitations | Invitaciones a partidos | matchInvitations[] |
| useLoans | Préstamos Mak'Gora | loans[] |
| useNotifications | Notificaciones locales/push | sendLocalNotification |
| useActiveTeam | Equipo activo | activeTeam |
| useClubs | Clubs dinámicos | dynamicClubs |
| usePermissions | Roles y permisos | currentUser, userTier, hasPermission |
| useSync | Sincronización bidireccional | syncStatus |
| useDataIO | Import/Export datos | exportData, importData |
| useFundraising | Campañas, asignaciones, pagos | campaigns[], allPayments[] |

---

## 13. MIGRACIONES

| # | Archivo | Qué hace |
|---|---------|----------|
| 00 | reset_db.sql | DROP todo — reset completo |
| 01 | schema_v4.sql | Schema inicial: 30 tablas, funciones, RLS, seed Mak'Gora |
| 02 | fix_user_profiles_rls.sql | Corrige políticas de user_profiles |
| 03 | admin_reset_staff_password.sql | Función para resetear pass de staff |
| 04 | match_invitations.sql | Tablas de invitaciones |
| 05 | messages.sql | Tabla de mensajería interna |
| 06 | enhance_invitations.sql | Mejora columnas de invitaciones |
| 07 | custom_tactics.sql | Tabla de tácticas personalizadas |
| 08 | team_members_and_normalize.sql | Tabla team_members + función normalize |
| 09 | fix_makgora_dupes.sql | Limpia duplicados Mak'Gora |
| 10 | push_tokens.sql | Tabla de push tokens |
| 11 | push_trigger.sql | Trigger de notificaciones + función |
| 12 | (missing) | |
| 13 | eliminar_localstorage.sql | Elimina lógica legacy de localStorage |
| 14 | auto_attributes.sql | Sistema de atributos automáticos |
| 15 | fundraising.sql | 4 tablas: campaigns, assignments, tickets, payments |
| 16 | club_config.sql | Tabla + seed mensualidad_base |
| 17 | campaign_prizes.sql | Columna prizes JSONB en campaigns |
| 18 | fundraising_rls.sql | get_user_tier() + RLS para fundraising |
| 19 | fix_player_credentials.sql | Fix inicial de función de credenciales |
| 20 | player_avatars.sql | avatar_id + photo_url + storage bucket + policies |
| 21 | fix_generate_username_function.sql | Fix de tipo VARCHAR vs TEXT |
| 22 | fix_varchar_type_casting.sql | Otro intento de fix de tipos |
| 23 | fix_inline_username_generation.sql | Username inline (sin función externa) |
| 24 | final_credential_fix.sql | Fix final (pero aún con DELETE auth.users) |
| * | [MCP directo] | Versión actual con IF EXISTS (UPDATE) ELSE (INSERT) en auth.users |
| * | 20250530_unique_constraint_name_birth.sql | UNIQUE(first_name, last_name, birth_date) |

---

## 14. DECISIONES CLAVE DE ARQUITECTURA

### 1. Sin React Router
- Routing manual con `activeTab` state + renders condicionales
- Más simple para PWA sin URLs profundas
- Solo excepción: `/invitacion/:token` para invitaciones públicas

### 2. Supabase-First (sin localStorage de escritura)
- Toda escritura va directo a Supabase via `upsert()`
- localStorage solo cache de lectura
- SyncStatus indica offline si Supabase no responde

### 3. Memberships sin tabla separada
- No hay tabla `memberships`
- El estado de membresía se deriva de `player_payments WHERE source='membership'`
- `due` siempre = `mensualidadBase` (no se decrementa)
- `paid` es la suma de pagos de membresía
- Status: `al_dia` si paid >= due

### 4. Cargo mensual (monthly charge)
- `applyMonthlyCharge` suma `mensualidadBase` a `due` de cada jugador
- `last_monthly_charge` se guarda en `club_config` como 'YYYY-MM'
- Botón deshabilitado si ya existe cargo para el mes actual
- Nuevos jugadores no reciben cargo del mes (skip first month)

### 5. Bidirectional sync pagos ↔ finances
- `recordMembershipPayment` y `registerPayment` crean 2 registros:
  - `player_payments` (tracking individual)
  - `finances` (libro contable, desc con `[pid:paymentId]` o `[cid:campaignId]`)
- `deleteMembershipPayment` y `deletePayment` buscan el `[pid:]` en desc y borran el registro de finances

### 6. Rifa: asignación secuencial obligatoria
- No existe random en rifas
- Sistema: primer boleto libre → último ocupado
- Delete antes de insert (evita UNIQUE(campaign_id, ticket_number))
- Pago conservado via ON DELETE SET NULL en FK

### 7. Credenciales: IF EXISTS (UPDATE) ELSE (INSERT)
- No se puede DELETE de auth.users (FK desde messages)
- Re-forjar = UPDATE password + metadata
- username/email se regeneran siempre (no COALESCE con valor anterior)

### 8. pgcrypto sin schema prefix
- pgcrypto está en schema `extensions`
- La función NO usa `SET search_path`
- Search_path por defecto es `"$user", public, extensions`
- `crypt()` y `gen_salt('bf')` se encuentran sin schema prefix

### 9. last_name en Colombia
- El campo last_name guarda "segundo_nombre apellido1 apellido2"
- Ej: "David Vergara Arroyo"
- Para username se usa `split_part(last_name, ' ', 2)` → "Vergara"
- Si no hay segunda palabra: `split_part(last_name, ' ', 1)` → fallback

### 10. Avatares: SVG first, photo second
- 40 SVGs mitológicos siempre disponibles
- Foto real opcional (subida a Storage)
- PlayerPhoto muestra: foto → SVG → iniciales
- No hay CSS invert en SVGs (son blancos sobre transparencia)

### 11. Modals fuera de glass-panel
- `backdrop-filter: blur(12px)` en `.glass-panel` rompe `position: fixed`
- Todos los modals se renderizan a nivel de tab (fuera de glass-panel)

---

## 15. DEUDA TÉCNICA / PENDIENTES

- [ ] Migration 24 en disco usa DELETE auth.users (roto por FK) — actualizar a la versión IF EXISTS (UPDATE) ELSE (INSERT)
- [ ] El archivo `.sql` de la versión final de `admin_create_player_credentials` solo existe en BD, no en disco
- [ ] `createPlayerCredentials` en `usePlayers.js:340` mapea a `p.contacto.email` — puede no existir si contacto es undefined
- [ ] Pruebas de login: verificar ChangePasswordModal se muestra correctamente con credenciales recién forjadas
- [ ] Pruebas de avatar: verificar upload a Storage + PlayerPhoto rendering
- [ ] No hay cleanup de `raffle_tickets` al cerrar campaña (status='closed')
- [ ] `handleDeleteFinanceRecord` busca `[pid:...]` en desc — texto frágil si desc cambia formato
- [ ] No hay paginación en player_payments (allPayments carga todo)
- [ ] `wellness_logs` no tiene UNIQUE(player_id, log_date) — permite entradas duplicadas
- [ ] `custom_tactics` RLS permite a cualquier authenticated user ver tácticas de scope 'all' — revisar si es seguro
- [ ] Migration 20250530_unique_constraint_name_birth.sql está fuera de secuencia numérica
- [ ] `push_tokens_test` es una copia de push_tokens — revisar si sigue siendo necesaria

---

## 16. LÓGICA DE NEGOCIO DESTACADA

### 16.1 Penalizaciones Automáticas

| Infracción | Burpees | Otra |
|-----------|---------|------|
| Tarde | 15 | — |
| Falta injustificada | 50 | Sanción de conos |
| Falta leve en partido | 10 | — |
| Tarjeta amarilla | 50 | — |
| Tarjeta roja | 100 | Suspensión automática (`activo = false`) |

**Redención**: jugador puede redimir burpees (se resetean a 0) y conos; si estaba suspendido, se reactiva.

### 16.2 Protocolo HIA (Head Injury Assessment)

1. Staff ejecuta `runHiaProtocol(playerId, symptomsDetected)`.
2. Si hay síntomas → `lesionado`, 14 días de recuperación, notificación.
3. Siempre se registra la evaluación en `hiaAssessments`.

### 16.3 Sistema de Lesiones con Fases

- Fase 1-4: progresión de recuperación.
- `updateInjuryPhase(id, phase)`: avanza fase.
- Fase 4 = alta médica: limpia `injuryLog`, restaura `activo`.

### 16.4 Recurrencia de Eventos en Agenda

- `none`: evento único.
- `semanal`: 4 ocurrencias semanales.
- `quincenal`: 2 ocurrencias con 14 días de intervalo.
- Cada ocurrencia tiene su propio ID, agrupadas por `recurrenceGroup`.
- **Custom**: checkboxes de días (Lun·Mar·Mie·Jue·Vie·Sab·Dom) × selector de semanas (1-8) con vista previa.
- **Presets**: L-V, L-M-V, Sab — recuerda última configuración en localStorage.
- **Anti-duplicado**: misma fecha + misma hora + mismo `teamCategory` → no crea duplicado.
- **QuickTrainingPanel**: crear entrenos en 2 clicks con memoria de última hora/lugar.

### 16.5 Algoritmo Húngaro (Táctica)

`tacticAssignmentEngine.js`:
1. Define requisitos por posición con pesos (fuerza, velocidad, resistencia, técnica).
2. `scorePlayerForPosition()`: score 0-100 combinando atributos base + bonus posición + rendimiento reciente.
3. Convierte scores a matriz de costos.
4. Ejecuta algoritmo húngaro para asignación óptima global (mínimo costo).

### 16.6 IA Entrenador Personal — Contexto de 14 fuentes

`engine/promptBuilder.js → buildAITrainingContext(player)` compila:

| Fuente | Datos que la IA recibe |
|--------|----------------------|
| `attributes` | Fuerza, Velocidad, Resistencia, Técnica (0-100) |
| `history[]` | Tendencia: delta de cada atributo desde el primer test |
| `gymStats` + `weight` | 1RM ratios: squat/BW, bench/BW, deadlift/BW |
| `matchStats[]` | Tries, tackles promedio, tarjetas, MVPs, tendencia tackles |
| `workoutLog[]` | Sesiones en 30d, racha máxima, ejercicios más saltados |
| `wellnessLogs[]` | Sueño, dolor, estrés promedio 7d. Alertas de fatiga |
| `injuryLog[]` | Lesión activa (diagnóstico, fase, semanas). Lesiones pasadas |
| `had_fractures` | Fracturas óseas previas → precaución en impacto |
| `hiaAssessments[]` | Conmociones (HIA). Si hay síntomas → reducir contacto |
| `attendance` | % asistencia, llegadas tarde |
| `penalties` | Burpees pendientes → carga adicional |
| `_meta` | Edad, años en el club |

Multi-proveedor: Groq → DeepSeek → Gemini con fallback automático. Si ningún proveedor configurado → fallback al motor de reglas `assignmentEngine.js`.

---

## 17. ANÁLISIS COMPETITIVO

### Comparación directa vs otras apps de rugby

| Feature | **Orcos Negros** | Koach Rugby | SportEasy | STRIVE | SquadDeck | ClubZap | Pitchero | YourZown |
|---------|:--------------:|:-----------:|:---------:|:------:|:---------:|:-------:|:--------:|:--------:|
| Roster Management | ✅ Completo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Match Stats | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Training Plans | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tactical Whiteboard | ✅ **Drag & Drop** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Financial Management | ✅ Ingresos/Egresos | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Inventory | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Attendance/Discipline | ✅ Tribunal completo | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Injury Tracking | ✅ Fases + HIA | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Wellness Monitoring | ✅ Sueño, dolor, estrés | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI Coach Assistant | ✅ **Multi-proveedor** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Match Analysis (IA) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Internal Tournament | ✅ **Mak'Gora RPG** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Loan System | ✅ Entre equipos | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Player Login | ✅ **Con credenciales** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| RPG System | ✅ **Roles, títulos** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Fundraising (Rifas) | ✅ Premios + FIFO | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Self-Sale Flow | ✅ **Colombiano** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Calendar/Schedule | ✅ Agenda + Fixture | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Messaging/Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mobile App | ⚠️ Capacitor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PWA | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Payment Collection | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Online Registration | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Club Website | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Offline-first | ✅ Sync Supabase | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Open Source | ✅ **Código completo** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Fortalezas Únicas
1. **Pizarra Táctica Interactiva** — ninguna app de rugby tiene drag & drop táctico con 15 posiciones
2. **Sistema RPG Completo** — engagement vía gamificación
3. **IA Multi-proveedor** — fallback automático entre 3 proveedores
4. **Torneo Interno Mak'Gora** — con préstamos y estadísticas
5. **Offline-first** — funciona sin conexión
6. **Open Source** — control total de datos

### Debilidades vs Competencia
1. Sin cobros/pagos online (Stripe, PayPal)
2. Sin registro online para jugadores
3. Sin app nativa iOS (solo Android vía Capacitor)
4. Sin sitio web público del club
5. Sin multi-club completo

---

## 18. ROADMAP & MEJORAS PROPUESTAS

### Fase 1 — Estabilización
- [ ] Corregir bug `camiseta.toString()` en Roster filter
- [ ] Validación de schemas con Zod para datos de Supabase
- [ ] Tests unitarios para hooks críticos
- [ ] Manejo de errores consistente en todos los catch

### Fase 2 — Mobile & Offline
- [ ] IndexedDB como backend de offline (reemplazar localStorage)
- [ ] UI de resolución de conflictos de sync
- [ ] Responsive overhaul para móvil
- [ ] Notificaciones push con Supabase Realtime

### Fase 3 — Pagos & Registro
- [ ] Integración Stripe para pagos de membresías
- [ ] Portal de autoregistro para jugadores
- [ ] Website público del club

### Fase 4 — IA Avanzada
- [ ] Predicción de lesiones basada en carga + bienestar
- [ ] Recomendación de alineación óptima del XV
- [ ] Generación automática de planes de entrenamiento

### Fase 5 — Comunidad & Social
- [ ] Muro social del club (fotos, celebraciones)
- [ ] Perfiles públicos de jugadores (compartibles)
- [ ] Encuestas y votaciones (MVP, mejor ejercicio)
- [ ] App iOS nativa

### Mejoras de Rendimiento y UX Propuestas

| Mejora | Impacto | Esfuerzo |
|--------|---------|----------|
| Virtual scrolling en roster (react-window) | Alto | 2-3d |
| Lazy loading en todos los tabs | Medio | 1d |
| Tutorial interactivo de onboarding | Alto | 3-4d |
| Tooltips en íconos y botones | Medio | 1d |
| Skeletons / loading states en todos los módulos | Medio | 2d |
| Feedback visual en operaciones CRUD | Alto | 1d |
| Responsive mejorado para móvil | Alto | 3-4d |

---

## 19. REGLA DE ORO

**Cada modal que escribe a Supabase DEBE trigger un reload de datos al cerrarse. Cada operación asíncrona DEBE lanzar error (no `.then(() => {}, () => {})` silencioso). Cada feature debe funcionar end-to-end: guardar → refrescar → mostrar.**
