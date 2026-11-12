// Matriz de seguridad por roles: cada rol intenta leer y modificar datos sensibles.
// SOLO contra el Supabase LOCAL (escribe datos de prueba). Requiere las cuentas de prueba
// admin@, coach@, tesorero@, jugador@ y novato@orcos.club con la misma contraseña.
//   ANON=<anon key local> CREDS=<archivo con PASSWORD=...> node scripts/security/role-matrix.mjs
// Sale con código 1 si alguna regla no se cumple.
import fs from 'node:fs';
const API = 'http://127.0.0.1:54321', ANON = process.env.ANON;
if (!API.includes('127.0.0.1')) throw new Error('Solo local');
const PASS = fs.readFileSync(process.env.CREDS, 'utf8').match(/PASSWORD=(.*)/)[1].trim();

async function login(email) {
  const r = await fetch(`${API}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASS }) });
  const j = await r.json(); return { jwt: j.access_token, uid: j.user?.id };
}
const anon = { jwt: ANON, uid: null };
async function call(who, method, path, body, prefer = 'return=representation') {
  const r = await fetch(`${API}/rest/v1/${path}`, { method, headers: { apikey: ANON, Authorization: `Bearer ${who.jwt}`, 'Content-Type': 'application/json', Prefer: prefer }, body: body && JSON.stringify(body) });
  const json = await r.json().catch(() => null);
  return { status: r.status, json };
}
// "permitido" = la operación tuvo efecto (filas devueltas / rpc sin error)
const affected = (r) => r.status < 300 && (Array.isArray(r.json) ? r.json.length > 0 : r.json != null && !r.json?.error);
const rows = (r) => (Array.isArray(r.json) ? r.json.length : 0);

const users = {
  presidente: await login('admin@orcos.club'),
  entrenador: await login('coach@orcos.club'),
  tesorero: await login('tesorero@orcos.club'),
  jugador: await login('jugador@orcos.club'),
  otro_jugador: await login('novato@orcos.club'),
  anonimo: anon,
};
const svc = users.presidente;
const { json: [mine] } = await call(users.jugador, 'GET', `players?user_id=eq.${users.jugador.uid}&select=id`);
const { json: [other] } = await call(svc, 'GET', `players?user_id=eq.${users.otro_jugador.uid}&select=id`);
const P = mine.id, O = other.id;

const results = [];
function check(area, what, who, ok, expected) {
  const pass = ok === expected;
  results.push({ area, what, who, got: ok ? 'PUEDE' : 'no puede', expected: expected ? 'PUEDE' : 'no puede', pass });
}

for (const [who, u] of Object.entries(users)) {
  const isStaff = ['presidente', 'entrenador', 'tesorero'].includes(who);
  const isPlayer = who === 'jugador' || who === 'otro_jugador';
  const F = who === 'otro_jugador' ? P : O; // la ficha ajena para este usuario
  // Lectura
  let r = await call(u, 'GET', 'players?select=id&deleted_at=is.null');
  check('Fichas', 'ver fichas de TODO el club', who, rows(r) > 1, isStaff);
  r = await call(u, 'GET', `injury_log?select=id&player_id=eq.${F}`);
  check('Salud', 'ver lesiones de OTRO jugador', who, rows(r) > 0, isStaff);
  r = await call(u, 'GET', `wellness_logs?select=id&player_id=eq.${F}`);
  check('Salud', 'ver bienestar (sueño/estrés) de OTRO jugador', who, rows(r) > 0, isStaff);
  r = await call(u, 'GET', `hia_assessments?select=id&player_id=eq.${F}`);
  check('Salud', 'ver evaluaciones de conmoción de OTRO jugador', who, rows(r) > 0, isStaff);
  r = await call(u, 'GET', `player_payments?select=id&player_id=eq.${F}`);
  check('Dinero', 'ver pagos de OTRO jugador', who, rows(r) > 0, isStaff);
  r = await call(u, 'GET', `finances?select=id${u.uid ? `&user_id=neq.${u.uid}` : ''}`);
  check('Dinero', 'ver movimientos de caja AJENOS', who, rows(r) > 0, isStaff);
  r = await call(u, 'GET', 'user_profiles?select=user_id,system_role');
  check('Usuarios', 'ver la lista de cuentas y roles', who, rows(r) > 1, isStaff || isPlayer);

  if (who === 'anonimo') {
    r = await call(u, 'POST', 'rpc/resolve_player_login', { p_query: 'a' });
    check('Usuarios', 'sacar emails buscando por una letra', who, rows(r) > 1, false);
    continue;
  }
  if (!isPlayer) continue;
  // Escritura de un jugador: escalar privilegios o alterar lo que no le toca
  r = await call(u, 'PATCH', `user_profiles?user_id=eq.${u.uid}`, { system_role: 'presidente' });
  const { json: [prof] } = await call(svc, 'GET', `user_profiles?user_id=eq.${u.uid}&select=system_role`);
  check('Roles', 'auto-ascenderse a presidente', who, prof?.system_role === 'presidente', false);
  if (prof?.system_role !== 'jugador') await call(svc, 'PATCH', `user_profiles?user_id=eq.${u.uid}`, { system_role: 'jugador' });

  const own = who === 'jugador' ? P : O, foreign = who === 'jugador' ? O : P;
  r = await call(u, 'PATCH', `players?id=eq.${foreign}`, { weight_kg: 1 });
  check('Fichas', 'editar la ficha de OTRO jugador', who, affected(r), false);
  r = await call(u, 'POST', 'rpc/player_record_progress_snapshot', { p_player_id: foreign, p_weight: 1 });
  check('Fichas', 'editar peso de OTRO jugador (vía función)', who, affected(r), false);
  r = await call(u, 'PATCH', `players?id=eq.${own}`, { memberships_paid: 999999 });
  const { json: [me1] } = await call(svc, 'GET', `players?id=eq.${own}&select=memberships_paid`);
  check('Dinero', 'marcarse la cuota como pagada', who, Number(me1?.memberships_paid) === 999999, false);
  r = await call(u, 'PATCH', `players?id=eq.${own}`, { penalties_burpees: 0, penalty_burpees: 0 });
  r = await call(u, 'PATCH', `penalties?player_id=eq.${own}`, { burpees: 0 });
  check('Disciplina', 'borrarse sus propios burpees', who, affected(r), false);
  r = await call(u, 'POST', 'attendance', { player_id: own, event_date: '2026-11-01', status: 'present' });
  check('Disciplina', 'marcarse presente él mismo', who, affected(r), false);
  r = await call(u, 'POST', 'player_payments', { player_id: own, amount: 50000, source: 'membership', payment_date: '2026-11-01' });
  check('Dinero', 'registrarse un pago', who, affected(r), false);
  r = await call(u, 'POST', 'finances', { user_id: u.uid, type: 'income', amount: 1, category: 'otros', description: 'x', date: '2026-11-01', team_category: 'orcos_masculina_mayor' });
  check('Dinero', 'escribir en el libro de caja', who, affected(r), false);
  r = await call(u, 'POST', 'messages', { sender_id: u.uid, channel: 'announcement', text: 'falso' });
  check('Mensajes', 'publicar un anuncio oficial', who, affected(r), false);
  r = await call(u, 'POST', 'rpc/admin_reset_staff_password', { p_user_id: users.presidente.uid, p_new_password: 'x123456' });
  check('Usuarios', 'cambiar la contraseña del presidente', who, r.status < 300 && r.json?.success === true, false);
  r = await call(u, 'POST', 'rpc/update_standing', { p_tournament_id: '00000000-0000-0000-0000-000000000000', p_team_id: '00000000-0000-0000-0000-000000000000', p_played: 1, p_won: 1, p_drawn: 0, p_lost: 0, p_points_for: 99, p_points_against: 0, p_total_points: 5, p_bonus: 0 });
  check('Torneos', 'alterar la tabla de posiciones (rechazo por permiso)', who, !(r.status >= 400 && /presidencia|permission|42501/i.test(JSON.stringify(r.json))), false);
  r = await call(u, 'POST', 'gym_history', { player_id: foreign, recorded_date: '2026-11-01', squat: 500 });
  check('Fichas', 'inventar historial de gimnasio de OTRO', who, affected(r), false);
  r = await call(u, 'DELETE', `players?id=eq.${own}`);
  check('Fichas', 'borrar su propia ficha', who, affected(r), false);
  if (affected(r)) await call(svc, 'PATCH', `players?id=eq.${own}`, { deleted_at: null });
}

// Staff: lo que NO le corresponde a cada uno
let r = await call(users.entrenador, 'POST', 'rpc/apply_monthly_charge', { p_player_ids: [P] });
check('Dinero', 'cobrar mensualidades', 'entrenador', r.status < 300, false);
r = await call(users.entrenador, 'PATCH', `user_profiles?user_id=eq.${users.entrenador.uid}`, { system_role: 'presidente' });
const { json: [cp] } = await call(svc, 'GET', `user_profiles?user_id=eq.${users.entrenador.uid}&select=system_role`);
check('Roles', 'auto-ascenderse a presidente', 'entrenador', cp?.system_role === 'presidente', false);
if (cp?.system_role !== 'entrenador') await call(svc, 'PATCH', `user_profiles?user_id=eq.${users.entrenador.uid}`, { system_role: 'entrenador' });
r = await call(users.tesorero, 'POST', 'rpc/admin_create_staff_user', { p_email: 'x@x.co', p_password: 'x1234567', p_display_name: 'x', p_system_role: 'presidente', p_club_scope: null });
check('Usuarios', 'crear cuentas de staff', 'tesorero', r.json?.success === true, false);
r = await call(users.tesorero, 'POST', 'rpc/apply_monthly_charge', { p_player_ids: [P], p_period: '2026-08-01' });
check('Dinero', 'cobrar mensualidades', 'tesorero', r.status < 300, true);

// Claves del staff: solo presidencia (se reasigna la MISMA clave para no romper las cuentas de prueba)
for (const who of ['entrenador', 'tesorero', 'presidente']) {
  const target = who === 'presidente' ? users.entrenador.uid : users.presidente.uid;
  const rr = await call(users[who], 'POST', 'rpc/admin_reset_staff_password', { p_user_id: target, p_new_password: PASS });
  check('Usuarios', 'cambiar la contraseña de otro miembro del staff', who, rr.json?.success === true, who === 'presidente');
}
// Login por usuario: exacto devuelve email; parcial solo sugiere
const { json: [acc] } = await call(svc, 'GET', `players?id=eq.${P}&select=username`);
let lr = await call(anon, 'POST', 'rpc/resolve_player_login', { p_query: acc.username });
check('Login', 'entrar con el usuario exacto (obtiene su email)', 'anonimo', !!lr.json?.[0]?.email, true);
lr = await call(anon, 'POST', 'rpc/resolve_player_login', { p_query: acc.username.slice(0, -1) });
check('Login', 'obtener email con un usuario incompleto', 'anonimo', (lr.json || []).some(x => x.email), false);

const fails = results.filter(x => !x.pass);
if (process.env.OUT_JSON) fs.writeFileSync(process.env.OUT_JSON, JSON.stringify(results, null, 2));
for (const x of results) console.log(`${x.pass ? 'OK   ' : 'FALLA'} | ${x.area} | ${x.who} | ${x.what} → ${x.got} (debe: ${x.expected})`);
console.log(`\n${results.length - fails.length}/${results.length} correctas, ${fails.length} fallas`);
if (fails.length) process.exit(1);
