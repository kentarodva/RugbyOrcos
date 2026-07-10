import { z } from 'zod';

const systemRoleEnum = z.enum(['desarrollador', 'presidente', 'promotor', 'entrenador', 'tesorero', 'arbitro', 'jugador']);
const playerStatusEnum = z.enum(['activo', 'lesionado', 'suspendido', 'inactivo']);
const playerRolEnum = z.enum(['Titular', 'Suplente', 'Entrenador', 'Capitan', 'Subcapitan']);
const playerPositionEnum = z.enum(['Pilar', 'Talonador', 'Segunda Línea', 'Flanker', 'Octavo', 'Medio Melé', 'Apertura', 'Centro', 'Ala', 'Zaguero', 'Wing']);

const playerAttributesSchema = z.object({
  force: z.number(),
  speed: z.number(),
  stamina: z.number(),
  technique: z.number(),
});

const playerAttendanceSchema = z.object({
  total: z.number(),
  present: z.number(),
  late: z.number(),
  absentUnjustified: z.number(),
  absentJustified: z.number(),
});

const playerPenaltiesSchema = z.object({
  burpees: z.number(),
  cones: z.boolean(),
});

const playerContactSchema = z.object({
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});

const playerClothingSizesSchema = z.object({
  jersey: z.string(),
  shorts: z.string(),
  socks: z.string(),
});

const playerGymStatsSchema = z.object({
  squat: z.number(),
  bench: z.number(),
  deadlift: z.number(),
});

const playerMetaSchema = z.object({
  docType: z.string().optional().nullable(),
  docNum: z.string().optional().nullable(),
  age: z.number().optional().nullable(),
  startYear: z.number().optional().nullable(),
});

const playerInjuryLogSchema = z.object({
  diagnosis: z.string(),
  date: z.string(),
  weeks: z.number(),
  phase: z.number(),
});

const playerMatchStatsSchema = z.object({
  id: z.string(),
  date: z.string(),
  opponent: z.string().optional().nullable(),
  tries: z.number(),
  conversions: z.number(),
  tackles: z.number(),
  turnovers: z.number(),
  yellowCards: z.number(),
  redCards: z.number(),
  mvp: z.boolean(),
});

const playerWellnessLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  sleep: z.number(),
  soreness: z.number(),
  stress: z.number(),
});

const playerWorkoutLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  routine: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  exercises: z.array(z.object({ exerciseId: z.string() })),
  completed: z.boolean(),
});

export const playerSchema = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  name: z.string(),
  firstName: z.string().optional().nullable(),
  middleName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  secondLastName: z.string().optional().nullable(),
  apodo: z.string().optional().nullable(),
  camiseta: z.number().optional().nullable(),
  contacto: playerContactSchema,
  rol: playerRolEnum,
  posicion: playerPositionEnum.optional().nullable(),
  position_id: z.number().optional().nullable(),
  estado: playerStatusEnum,
  attributes: playerAttributesSchema,
  history: z.array(playerAttributesSchema),
  injuryLog: z.array(playerInjuryLogSchema),
  attendance: playerAttendanceSchema,
  penalties: playerPenaltiesSchema,
  infractionLog: z.array(z.any()),
  clothingSizes: playerClothingSizesSchema,
  matchStats: z.array(playerMatchStatsSchema),
  wellnessLogs: z.array(playerWellnessLogSchema),
  hiaAssessments: z.array(z.any()),
  workoutLog: z.array(playerWorkoutLogSchema),
  systemRole: systemRoleEnum,
  memberships: z.object({ paid: z.number(), due: z.number(), lastPayment: z.string().optional().nullable(), lastAmount: z.number().optional().nullable() }).optional(),
  teamCategory: z.string(),
  teamId: z.string().uuid().optional(),
  weight: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  gymStats: playerGymStatsSchema,
  _meta: playerMetaSchema.optional().nullable(),
  username: z.string().optional().nullable(),
  makgora_team_id: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  health_insurance: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  medical_conditions: z.string().optional().nullable(),
  had_fractures: z.boolean().optional(),
  fracture_details: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  avatar_id: z.string().optional().nullable(),
  photo_url: z.string().optional().nullable(),
  preferences: z.record(z.any()).optional(),
  document_type: z.string().optional().nullable(),
  document_number: z.string().optional().nullable(),
});

export const scheduleEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  time: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  mapsLink: z.string().optional().nullable(),
  type: z.string(),
  teamCategory: z.string(),
  teamId: z.string().uuid().optional(),
  linkedRoutine: z.string().optional().nullable(),
  recurrenceGroup: z.string().optional().nullable(),
});

export const financeRecordSchema = z.object({
  id: z.string(),
  type: z.enum(['ingreso', 'egreso']),
  desc: z.string(),
  amount: z.number(),
  date: z.string(),
  category: z.string(),
  teamCategory: z.string(),
  teamId: z.string().uuid().optional(),
});

export const fixtureSchema = z.object({
  id: z.string(),
  date: z.string(),
  opponent: z.string(),
  orcosScore: z.number(),
  opponentScore: z.number(),
  tries: z.number(),
  mvp: z.string(),
  teamCategory: z.string(),
  teamId: z.string().uuid().optional(),
});

export const futureFixtureSchema = z.object({
  id: z.string(),
  opponent: z.string(),
  date: z.string(),
  time: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  teamCategory: z.string(),
  teamId: z.string().uuid().optional(),
});

export const rivalSchema = z.object({
  id: z.string(),
  name: z.string(),
  colors: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const championshipSchema = z.object({
  id: z.string(),
  name: z.string(),
  deadlineDate: z.string(),
  description: z.string().optional().nullable(),
  teamCategory: z.string(),
  teamId: z.string().uuid().optional(),
});

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  total: z.number(),
  assignedTo: z.string().optional().nullable(),
  status: z.string(),
  teamCategory: z.string(),
  teamId: z.string().uuid().optional(),
});
