// ── Type Definitions — Rugby Orcos v4.0 ──

// ── RPG Roles ──
type SystemRole = 'desarrollador' | 'presidente' | 'promotor' | 'entrenador' | 'tesorero' | 'arbitro' | 'jugador';
type PlayerStatus = 'activo' | 'lesionado' | 'suspendido' | 'inactivo';
type PlayerRol = 'Titular' | 'Suplente' | 'Entrenador' | 'Capitán' | 'Subcapitán';
type PlayerPosition = 'Pilar' | 'Talonador' | 'Segunda Línea' | 'Flanker' | 'Octavo' | 'Medio Melé' | 'Apertura' | 'Centro' | 'Ala' | 'Zaguero' | 'Wing';
type Division = 'masculina_mayor' | 'femenina_mayor' | 'juveniles_masculina' | 'juveniles_femenina';
type SyncStatus = 'idle' | 'syncing' | 'online' | 'offline';
type LoanStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled';
type InvitationStatus = 'active' | 'completed' | 'expired';
type FinanceType = 'ingreso' | 'egreso';

// ── Player ──
interface PlayerAttributes {
  force: number;
  speed: number;
  stamina: number;
  technique: number;
}

interface PlayerAttendance {
  total: number;
  present: number;
  late: number;
  absentUnjustified: number;
  absentJustified: number;
}

interface PlayerPenalties {
  burpees: number;
  cones: boolean;
}

interface PlayerContact {
  phone?: string;
  email?: string;
}

interface PlayerClothingSizes {
  jersey: string;
  shorts: string;
  socks: string;
}

interface PlayerGymStats {
  squat: number;
  bench: number;
  deadlift: number;
}

interface PlayerInjuryLog {
  diagnosis: string;
  date: string;
  weeks: number;
  phase: number;
}

interface PlayerMatchStats {
  id: string;
  date: string;
  opponent?: string;
  tries: number;
  conversions: number;
  tackles: number;
  turnovers: number;
  yellowCards: number;
  redCards: number;
  mvp: boolean;
}

interface PlayerWellnessLog {
  id: string;
  date: string;
  sleep: number;
  soreness: number;
  stress: number;
}

interface PlayerWorkoutLog {
  id: string;
  date: string;
  ejercicios: Array<{ exerciseId: string }>;
  type: string;
}

interface PlayerMembership {
  paid: number;
  due: number;
  lastPayment?: string;
  lastAmount?: number;
}

interface PlayerMeta {
  docType?: string;
  docNum?: string;
  age?: number;
  startYear?: number;
}

interface Player {
  id: string;
  name: string;
  apodo?: string;
  camiseta?: number;
  contacto: PlayerContact;
  rol: PlayerRol;
  posicion?: PlayerPosition;
  estado: PlayerStatus;
  attributes: PlayerAttributes;
  history: PlayerAttributes[];
  injuryLog: PlayerInjuryLog[];
  attendance: PlayerAttendance;
  penalties: PlayerPenalties;
  infractionLog: any[];
  clothingSizes: PlayerClothingSizes;
  matchStats: PlayerMatchStats[];
  wellnessLogs: PlayerWellnessLog[];
  hiaAssessments: any[];
  workoutLog: PlayerWorkoutLog[];
  systemRole: SystemRole;
  memberships: PlayerMembership;
  teamCategory: string;
  weight?: number;
  height?: number;
  gymStats: PlayerGymStats;
  _meta?: PlayerMeta;
  username?: string;
  makgora_team_id?: string;
}

// ── Schedule ──
interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  mapsLink?: string;
  type: string;
  teamCategory: string;
  linkedRoutine?: string;
  recurrenceGroup?: string;
}

// ── Finance ──
interface FinanceRecord {
  id: string;
  type: FinanceType;
  desc: string;
  amount: number;
  date: string;
  category: string;
  teamCategory: string;
}

// ── Fixture ──
interface Fixture {
  id: string;
  date: string;
  opponent: string;
  orcosScore: number;
  opponentScore: number;
  tries: number;
  mvp: string;
  teamCategory: string;
}

// ── Future Fixture ──
interface FutureFixture {
  id: string;
  opponent: string;
  date: string;
  time?: string;
  location?: string;
  teamCategory: string;
}

// ── Rival ──
interface Rival {
  id: string;
  name: string;
  colors?: string;
  contact?: string;
  notes?: string;
}

// ── Championship ──
interface Championship {
  id: string;
  name: string;
  deadlineDate: string;
  description?: string;
  teamCategory: string;
}

// ── Inventory ──
interface InventoryItem {
  id: string;
  name: string;
  total: number;
  assignedTo?: string;
  status: string;
  teamCategory: string;
}

// ── User Profile ──
interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  system_role: SystemRole;
  club_scope?: string;
  division_scope?: string;
  is_active: boolean;
}

// ── Mak'Gora ──
interface MakgoraTeam {
  id: string;
  name: string;
  rpg_name?: string;
  emblem_color?: string;
  sort_order: number;
  is_active: boolean;
}

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  winner_team_id?: string;
}

interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  phase: string;
  home_team_id: string;
  away_team_id: string;
  home_score?: number;
  away_score?: number;
  status: string;
}

interface TournamentStanding {
  id: string;
  tournament_id: string;
  team_id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points_for: number;
  points_against: number;
  point_diff: number;
  bonus_points: number;
  total_points: number;
}

interface PlayerLoan {
  id: string;
  player_id: string;
  from_team_id?: string;
  to_team_id: string;
  tournament_id?: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: LoanStatus;
}

// ── Invitation ──
interface MatchInvitation {
  id: string;
  user_id: string;
  future_fixture_id: string;
  token: string;
  rival_name?: string;
  status: InvitationStatus;
  expires_at: string;
}

interface GuestPlayer {
  id: string;
  invitation_id: string;
  name: string;
  number?: number;
  position?: string;
  notes?: string;
}

// ── AI ──
interface AIProviderConfig {
  id: string;
  name: string;
  icon: string;
  desc: string;
  priority: number;
  apiKeyStorage: string;
  endpoint: string;
  models: Record<string, AIModel>;
  defaultModel: string;
}

interface AIModel {
  id: string;
  label: string;
  icon: string;
  desc: string;
  maxTokens: number;
  timeout: number;
  dailyLimit: number;
  temperature: { chat: number; training: number; analysis: number };
}
