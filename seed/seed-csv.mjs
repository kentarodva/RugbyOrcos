// Seed: Lee el CSV de Google Forms y lo inserta en Supabase
// Uso: node seed/seed-csv.mjs
// Requiere: SERVICE_ROLE_KEY en .env

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// ── MAPEOS ──
const CLUB_MAP = {
  'orcos': 'orcos', 'cuervos': 'cuervos', 'trolls': 'trolls',
  'gargolas': 'gargolas', 'gárgolas': 'gargolas', 'pitbull': 'pitbull',
  'buffalos': 'buffalos',
};

const CATEGORY_MAP = {
  'masculino mayores': 'masculina_mayor',
  'masculina mayor': 'masculina_mayor',
  'femenino mayores': 'femenina_mayor',
  'femenina mayor': 'femenina_mayor',
  'juvenil masculino': 'juveniles_masculina',
  'juveniles masculino': 'juveniles_masculina',
  'juvenil femenino': 'juveniles_femenina',
  'juveniles femenino': 'juveniles_femenina',
};

const POSITIONS = [
  'Pilar','Talonador','Segunda Linea','Ala','Octavo',
  'Medio Mele','Apertura','Centro','Wing','Zaguero'
];

function clean(v) {
  if (v == null) return '';
  return String(v).trim();
}

function normalizeClub(raw) {
  const s = String(raw || '').trim().toLowerCase();
  for (const [k, v] of Object.entries(CLUB_MAP)) {
    if (s.includes(k)) return v;
  }
  return 'orcos';
}

function normalizeCategory(raw) {
  const s = String(raw || '').trim().toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_MAP)) {
    if (s === k) return v;
  }
  return 'masculina_mayor';
}

function parseWeight(raw) {
  const s = String(raw || '').replace(',','.').replace(/[^0-9.]/g,'');
  const n = parseFloat(s);
  return (isNaN(n) || n < 20 || n > 250) ? null : Math.round(n);
}

function parseHeight(raw) {
  let s = String(raw || '').replace(',','.').replace(/[^0-9.]/g,'');
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  if (n >= 100) return n / 100;
  if (n >= 3) return n / 100;
  return n;
}

function parsePhone(raw) {
  const s = String(raw || '').replace(/[^0-9+]/g, '');
  if (!s || s.length < 7) return null;
  if (s.startsWith('57') && s.length === 12) return '+' + s;
  if (s.length === 10) return '+57' + s;
  if (s.startsWith('+')) return s;
  return '+57' + s;
}

function parseBool(raw) {
  const s = String(raw || '').toLowerCase().trim();
  return s.includes('sí') || s.includes('si');
}

function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const parts = s.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  return null;
}

function parseAge(raw) {
  const n = parseInt(raw, 10);
  return isNaN(n) || n < 10 || n > 80 ? null : n;
}

function assignJersey(jerseyByTeam, teamCategory) {
  if (!jerseyByTeam[teamCategory]) jerseyByTeam[teamCategory] = new Set();
  for (let i = 1; i <= 99; i++) {
    if (!jerseyByTeam[teamCategory].has(i)) {
      jerseyByTeam[teamCategory].add(i);
      return i;
    }
  }
  return 99;
}

// ── LEER CSV ──
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Uso: node seed/seed-csv.mjs <ruta/al/archivo.csv>');
  process.exit(1);
}

const csvRaw = readFileSync(csvPath, 'utf-8');
const records = parse(csvRaw, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
});

console.log(`Total registros CSV: ${records.length}`);

// ── PROCESAR ──
const seen = new Set();
const jerseyByTeam = {};
const players = [];
let skipped = 0;

for (const r of records) {
  const firstName = clean(r['2. Nombres Completos  ']);
  const lastName = clean(r['3. Apellidos Completos  ']);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const alias = clean(r['9. Alias (apodo o nombre con el que te conocen en el club). Si no tienes, puedes ignorar la pregunta.']);

  if (!fullName && !alias) { skipped++; continue; }

  const internalTeam = clean(r['Selecciona el equipo Interno al que pertences']);
  const club = normalizeClub(internalTeam);
  const category = normalizeCategory(clean(r['12. Categoría Actual']));
  const teamCategory = `${club}_${category}`;

  const dedupeKey = `${fullName.toLowerCase()}|${alias.toLowerCase()}|${club}`;
  if (seen.has(dedupeKey)) { skipped++; continue; }
  seen.add(dedupeKey);

  const weight = parseWeight(r['13. Peso (kg)  ']);
  const height = parseHeight(r['14. Estatura (metros)  ']);
  const birthDate = parseDate(r['6. Fecha de Nacimiento  ']);
  const age = parseAge(r['7. Edad  ']);
  const phone = parsePhone(r['8. Número de Celular  ']);
  const hadFractures = parseBool(r['  15. ¿Has tenido alguna fractura?  ']);
  const hasAllergy = clean(r['16. ¿Tienes alguna alergia?. Si tu respuesta es afirmativa, explica tu situación']);
  const hasIllness = clean(r['17. ¿Tienes alguna enfermedad de base? . Si tu respuesta es afirmativa, explica tu situación.']);

  players.push({
    first_name: firstName,
    last_name: lastName,
    nickname: alias || null,
    document_type: clean(r['4. Tipo de documento  ']) || null,
    document_number: clean(r['5. Número de Documento  ']) || null,
    birth_date: birthDate,
    age,
    phone,
    email: null,
    initial_category: normalizeCategory(clean(r['10. Categoría en la que iniciaste en el club  '])),
    start_year: parseInt(r['11. Año en que iniciaste?'], 10) || null,
    current_category: category,
    internal_team: internalTeam || null,
    team_category: teamCategory,
    weight_kg: weight,
    height_m: height,
    had_fractures: hadFractures,
    fracture_details: hadFractures ? clean(r['Si respuesta enterior fue "Sí". Detalla dondé fué']) : null,
    allergies: hasAllergy && hasAllergy.toLowerCase() !== 'no' ? hasAllergy : null,
    medical_conditions: hasIllness && hasIllness.toLowerCase() !== 'no' ? hasIllness : null,
    health_insurance: clean(r['18. A qué EPS estas afiliado?']) || null,
    emergency_contact_name: clean(r['  19. Nombre y Apellidos del Contacto  ']) || null,
    emergency_contact_phone: parsePhone(r['20. Número de Celular del Contacto  ']),
    commitment_accepted: clean(r['1. Compromiso con el Club (Obligatorio)\n  ¿Aceptas el siguiente compromiso como integrante del Club de Rugby Orcos?\n\n""Me comprometo a cumplir con los principios de calidad, a respetar y promover las normas, principios éticos y morales establecidos por el club; a participar activamente en las actividades, entrenamientos, eventos deportivos, pedagógicos y culturales programados por el club; a cumplir con las cuotas ordinarias y extraordinarias definidas por la organización; y a respetar y acatar las decisiones tomadas por el club.""   ']).toLowerCase().includes('sí'),
    jersey_number: assignJersey(jerseyByTeam, teamCategory),
    role: 'Titular',
    position: POSITIONS[players.length % POSITIONS.length],
    status: 'activo',
    attr_force: weight ? Math.min(95, Math.max(40, Math.round(weight * 0.55))) : 50,
    attr_speed: weight ? Math.min(95, Math.max(40, Math.round(85 - (weight - 70) * 0.2))) : 50,
    attr_stamina: 75,
    attr_technique: 70,
    source: 'csv_seed',
  });
}

// ── INSERTAR EN SUPABASE ──
// Para el seed, usamos un user_id dummy "00000000-0000-0000-0000-000000000000"
// que luego se reasigna al admin real en la app
const SEED_USER_ID = '00000000-0000-0000-0000-000000000000';

console.log(`\nInsertando ${players.length} jugadores en Supabase...`);
let inserted = 0;
let errors = 0;

for (const p of players) {
  try {
    const { error } = await supabase.from('players').insert({
      user_id: SEED_USER_ID,
      first_name: p.first_name,
      last_name: p.last_name,
      nickname: p.nickname,
      document_type: p.document_type,
      document_number: p.document_number,
      birth_date: p.birth_date,
      age: p.age,
      phone: p.phone,
      email: p.email,
      initial_category: p.initial_category,
      start_year: p.start_year,
      current_category: p.current_category,
      internal_team: p.internal_team,
      team_category: p.team_category,
      weight_kg: p.weight_kg,
      height_m: p.height_m,
      had_fractures: p.had_fractures,
      fracture_details: p.fracture_details,
      allergies: p.allergies,
      medical_conditions: p.medical_conditions,
      health_insurance: p.health_insurance,
      emergency_contact_name: p.emergency_contact_name,
      emergency_contact_phone: p.emergency_contact_phone,
      commitment_accepted: p.commitment_accepted,
      jersey_number: p.jersey_number,
      role: p.role,
      position: p.position,
      status: p.status,
      attr_force: p.attr_force,
      attr_speed: p.attr_speed,
      attr_stamina: p.attr_stamina,
      attr_technique: p.attr_technique,
      source: p.source,
    });

    if (error) {
      console.error(`  ✗ ${p.first_name} ${p.last_name}: ${error.message}`);
      errors++;
    } else {
      inserted++;
      if (inserted % 10 === 0) console.log(`  ✓ ${inserted}/${players.length} jugadores...`);
    }
  } catch (err) {
    console.error(`  ✗ ${p.first_name} ${p.last_name}: ${err.message}`);
    errors++;
  }
}

// ── RESUMEN ──
console.log('');
console.log('═══════════════════════════════════════');
console.log('  RESUMEN DE IMPORTACION');
console.log('═══════════════════════════════════════');
console.log(`  Registros CSV:          ${records.length}`);
console.log(`  Procesados:             ${players.length}`);
console.log(`  Insertados en Supabase: ${inserted}`);
console.log(`  Errores:                ${errors}`);
console.log(`  Omitidos:               ${skipped}`);

const byClub = {};
players.forEach(p => {
  const c = p.team_category.split('_')[0];
  byClub[c] = (byClub[c] || 0) + 1;
});
console.log('\n  Por club:');
Object.entries(byClub).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`    ${c}: ${n}`));

const byCat = {};
players.forEach(p => {
  const parts = p.team_category.split('_');
  byCat[parts.slice(1).join('_')] = (byCat[parts.slice(1).join('_')] || 0) + 1;
});
console.log('\n  Por categoria:');
Object.entries(byCat).sort().forEach(([c,n]) => console.log(`    ${c}: ${n}`));

console.log('═══════════════════════════════════════');
