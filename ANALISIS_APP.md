# Análisis Integral — Rugby Orcos (Reino Manager v5.0)

> **Fecha del análisis:** Junio 2026
> **Stack:** React 18 + Vite + Supabase + Capacitor (Android) + PWA
> **Modo del proyecto:** Supabase-First (PostgreSQL = única fuente de verdad)
> **Estado del repo:** desplegado en Vercel + APK Android compilado

---

## Índice

1. [Diagnóstico del estado actual](#1-diagnóstico-del-estado-actual)
   - 1.1 [Lo que funciona bien](#11-lo-que-funciona-bien)
   - 1.2 [Lo que está fallando o es bug activo](#12-lo-que-está-fallando-o-es-bug-activo)
   - 1.3 [Lo que falta](#13-lo-que-falta)
   - 1.4 [Lo que se debe mejorar](#14-lo-que-se-debe-mejorar)
2. [Modelo de roles propuesto](#2-modelo-de-roles-propuesto)
   - 2.1 [Diagrama del modelo pedido](#21-diagrama-del-modelo-pedido)
   - 2.2 [Dos "capitanes" que conviven](#22-dos-capitanes-que-conviven)
   - 2.3 [Matriz de permisos resultante](#23-matriz-de-permisos-resultante)
   - 2.4 [Schema propuesto](#24-schema-propuesto)
3. [Plan de implementación por fases](#3-plan-de-implementación-por-fases)
   - Fase 0 — Hotfixes
   - Fase 1 — Schema de Divisiones
   - Fase 2 — Rol Capitán
   - Fase 3 — Capitán de Mak'Gora
   - Fase 4 — Equipos internos
   - Fase 5 — Consolidación del data layer
   - Fase 6 — Seguridad y auditoría
   - Fase 7 — Reportes consolidados
   - Fase 8 — Onboarding y pulido
4. [Decisiones que necesito que tomes](#4-decisiones-que-necesito-que-tomes)
5. [Resumen ejecutivo](#5-resumen-ejecutivo)

---

## 1) Diagnóstico del estado actual

### 1.1 Lo que funciona bien

| Área | Estado | Evidencia |
|---|---|---|
| **Auth + Login unificado** | Sólido | Email/password para staff, username/password para jugadores. `AuthContext` con `repairProfile` que re-vincula perfiles huérfanos. |
| **Roster + atributos RPG** | Sólido | 59 jugadores, CRUD completo, 4 atributos (Fuerza/Velocidad/Resistencia/Técnica), historial físico SVG, lesiones 4 fases, gym 1RM. |
| **Mak'Gora (torneo interno)** | Sólido | 6 equipos, fixture round-robin, standings con `point_diff` GENERATED, préstamos entre equipos, historial de campeones. |
| **Recaudación (rifas/comidas)** | Sólido | 500 tickets, asignación 1:1 a jugadores, FIFO, doble fuente de pago. |
| **Invitaciones a rivales** | Sólido | Link público sin login, token único, RSVP, GuestRoster, Match Center. |
| **IA multi-proveedor** | Sólido | Groq → DeepSeek → Gemini con failover, cache LRU, rate limit, 14 fuentes de contexto. |
| **Tests del motor de reglas** | Muy bueno | 19 archivos en `src/__tests__/engine/`, `usePermissions.test.js`, `usePlayers.test.jsx` bien cubiertos. |
| **PWA + Capacitor Android** | Desplegado | vite-plugin-pwa con 16 assets precacheados, APK Android compilado. |
| **Live Match** | Funcional | Inicio, eventos en vivo, pausa, fin, eliminación. |
| **Pizarra Táctica** | Funcional | 11 formaciones, drag-and-drop, 3 tamaños, banco de suplentes. |
| **Salón de la Fama** | Funcional | 43 premios auto, certificados HTML imprimibles. |

### 1.2 Lo que está fallando o es un bug activo

| Severidad | Problema | Evidencia | Impacto |
|---|---|---|---|
| **CRÍTICO** | **Inconsistencia "Capitán" con/sin tilde** | Schema Zod exige `'Capitán'` con tilde. Modales (`AddPlayerModal.jsx:5`, `EditPlayerModal.jsx:5`) y CSV (`csvImport.js:39-40`) usan `'Capitan'` sin tilde. `PlayerCard.jsx:74` y `PositionNode.jsx:42` comparan `'Capitan'`. `promptBuilder.js:188` y `assignmentEngine.js:30` comparan `'Capitán'`. | Cualquier capitán creado desde UI falla validación Zod, no aparece en prompt IA, no recibe insignia dorada. |
| **CRÍTICO** | **Bypass de permisos en tabs** | `App.jsx:233-245` renderiza tabs por `activeTab === 'X'` sin chequear `hasPermission`. Sidebar oculta el botón, pero un deep-link / push notification / DevTools puede evadirlo. | Un jugador (tier 4) podría ver Roster, Finanzas, Admin si se manipula el estado. La seguridad real descansa 100% en RLS de Supabase. |
| **CRÍTICO** | **`useSync.js:155-160` filtra Entrenador sin scope = vacío** | Si `userTier === 3` y `clubScope === null`, se carga `user_id === user.id` (que no existe en players para Entrenador) → Entrenador sin `club_scope` configurado no ve NINGÚN jugador. | Bug de caso borde real. Entrenadores recién creados quedan ciegos hasta que el admin les configure scope. |
| **ALTO** | **`internal_team` es campo huérfano** | Existe en `players.internal_team` (varchar libre), se importa por CSV, pero **ningún componente lo lee ni lo filtra** ni tiene CRUD. | Equipos "A/B" para sábados no se pueden gestionar. La información se pierde. |
| **ALTO** | **3 sistemas de partido paralelos** | `fixtures` (resultados), `future_fixtures` (programados), `tournament_matches` (de torneo). No hay FK que los conecte, no hay flag "este future ya se jugó y se convirtió en fixture". | MVP almacenado de 3 formas distintas (varchar en 2, boolean en 1). Reportes partido-a-partido imposibles de consolidar. |
| **ALTO** | **`match_stats` y `tournament_player_stats` son duplicados** | Mismas columnas (tries/conversions/tackles/turnovers/cards/mvp) pero sin FK cruzada. | Estadísticas de un partido de torneo no aparecen en la ficha del jugador. |
| **ALTO** | **`raffle_tickets` con 3 campos de "comprador"** | `assigned_to` (uuid), `sold_to_name` (text), `buyer_name` (varchar). No hay unicidad. | Imposible saber a ciencia cierta quién compró cada boleta. Riesgo contable. |
| **MEDIO** | **No hay FKs ni tabla `categories`** | `team_category` es varchar libre en 12 tablas. Si renombrás una categoría, hay que tocar 12 lugares. | Deuda técnica importante. Cualquier reporte "por categoría" es frágil. |
| **MEDIO** | **Navegación sin route guard** | No hay `ProtectedRoute`, no hay chequeo de permiso en mutaciones del context. | Si falla RLS en Supabase, no hay segunda línea. |
| **MEDIO** | **CRUD de Capitán inexistente** | `tournament_teams.captain_player_id` existe en DB pero ningún componente del frontend lo lee ni lo escribe. | El único "capitán" del sistema es decorativo. |
| **MEDIO** | **Capa de Supabase fragmentada** | 11+ hooks/componentes hacen `supabase.from(...).upsert()` directo, sin pasar por `apisupabase`. | Cambios de esquema hay que tocarlos en muchos lugares. |
| **BAJO** | **`useActiveTeam.js` default hardcodeado** | Línea 6: `ORCOS_MASCULINA_MAYOR` fijo, ignora el `system_role` y `division_scope` del perfil. | Jugador nuevo ve vista Masculina Mayor antes de cualquier cambio. |
| **BAJO** | **`Finanzas/RaffleAssignmentModal.jsx:8` UUID con `Math.random()`** | Manual en lugar de `crypto.randomUUID()`. | No es cryptographically secure, suficiente para ids internos pero mejorable. |
| **BAJO** | **Cobertura de tests del data layer (~4%)** | `supabaseApi.test.js` solo cubre 1 de 25 funciones. Filtrado por tier+scope no testeado. | Cambios en upsert/fetch pueden romper producción sin detección. |
| **BAJO** | **Tests de componentes son smoke tests** | Solo verifican que renderizan, no flujos. No hay e2e de "crear jugador → asistencia → cobrar membresía". | Regresiones de UX no se detectan automáticamente. |

### 1.3 Lo que falta

| Área | Falta |
|---|---|
| **Roles** | **Capitán de división como rol de sistema con login propio** (es lo que pediste). |
| **Roles** | **Subcapitán como rol de sistema** (opcional, lo mencionaste implícito). |
| **Scope** | Hacer que `division_scope` sea un FK real a una tabla `divisiones` (hoy es varchar libre). |
| **Equipos internos** | CRUD de "equipo A vs B" para partidos internos. El campo `internal_team` está pero no se gestiona. |
| **Capitán de Mak'Gora** | UI para asignar `tournament_teams.captain_player_id` desde `TeamManager.jsx` + vista para que el capitán vea "su" equipo del torneo. |
| **Route guards** | `ProtectedRoute` que valide `hasPermission` antes de montar tabs y ejecute `signOut`/`forbidden` si falla. |
| **Reportes consolidados** | Un solo endpoint de "partido" que unifique `fixtures + future_fixtures + tournament_matches`. |
| **Auditoría** | Tabla `audit_log` para registrar quién editó qué (especialmente sensible en finanzas). |
| **Onboarding** | Cuando se crea un Entrenador/Capitán, wizard para asignar scope (división). |
| **Notificaciones por scope** | Hoy push notifications van a todos los `push_tokens`. Filtrar por `division_scope` o `team_category`. |
| **Documentación de roles** | Matriz "qué puede hacer cada rol" visible desde `Settings`. |
| **Tests e2e de flujos críticos** | Login → crear jugador → asistencia → cobro. Capitán → solo ve su división. |

### 1.4 Lo que se debe mejorar

| Tema | Mejora |
|---|---|
| **Multi-tenancy** | Hoy es mono-tenant en la práctica (tabla `clubs` vacía). Cuando se active, asegurar que el filtrado por `club_scope + division_scope` funcione en TODOS los hooks. |
| **Capa de datos** | Consolidar TODAS las operaciones Supabase en un módulo de services. Cada hook importa `playersService.add(...)` en vez de hacer `supabase.from(...)`. |
| **Validación Zod en runtime** | Hoy `supabasePlayerToReact` degrada silenciosamente si falla. Lanzar o loguear de forma audible. |
| **Estados de carga** | Muchos componentes no tienen skeletons ni loading states. La carpeta `src/components/Skeletons/` existe pero se usa poco. |
| **Errores visibles** | `errorHandler.js` loguea pero la UI a veces no muestra nada al usuario. Estandarizar `<ErrorState>` reutilizable. |
| **Accesibilidad** | No se ve `aria-*`, no se ve navegación por teclado más allá de `useGlobalShortcuts`. |
| **i18n** | Todo hardcodeado en español. Si se abre a otros clubes, se necesitará i18n. |
| **Performance** | `App.jsx` ya usa `lazy` para los 4 módulos pesados. Bien. Pero `ClubContext` carga TODO al inicio (53 tablas). Considerar fetch lazy por tab. |

---

## 2) Modelo de roles propuesto

### 2.1 Diagrama del modelo pedido

```
                          CLUB = Orcos Negros
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   DIVISIÓN M          DIVISIÓN F           DIVISIÓN JUVENILES
   Masculina Mayor      Femenina Mayor      Masc / Fem
        │                       │
   ┌────┴────┐              ...                    ...
   │         │
CATEGORÍA  CATEGORÍA
 M-1ª      M-2ª
   │         │
 CAPITÁN   CAPITÁN
 Marcos    Pedro
 (login)   (login)

        ↓ Paralelo, no jerárquico ↓

  TORNEO INTERNO MAK'GORA (X tiempo, normalmente en modo club)
       │
  ┌────┼────┬────┬────┬────┐
  │    │    │    │    │    │
ORCOS CUERVOS TROLLS GÁRGOLAS PITBULLS BÚFALOS
  │     │      │      │       │       │
CAP_CAP_  CAP_  CAP_  CAP_  CAP_
ITÁN1    ITÁN2  ITÁN3 ITÁN4 ITÁN5 ITÁN6
(puede   (puede
ser el   ser uno
mismo   distinto
Marcos  al de
o no)   división)
```

### 2.2 Dos "capitanes" que conviven

| Concepto | Persistencia | Scope | Login propio | Permisos | Ejemplo |
|---|---|---|---|---|---|
| **Capitán de división** (CLUB) | Permanente, vive en `user_profiles.division_scope` | `division_scope = 'masculina_mayor'` | SÍ | Ver jugadores, calendario, asistencia, lesiones, estadísticas de SU división. NO finanzas globales, NO admin, NO otras divisiones, NO crear usuarios. | Marcos (capitán de Masculina Mayor) entra y ve solo los ~25 jugadores de su división, los entrenamientos del martes/jueves, y puede registrar asistencia. |
| **Capitán de equipo Mak'Gora** (TORNEO) | Temporal, vive en `tournament_teams.captain_player_id` | `tournament_team_id` específico | NO (es solo una etiqueta de un `players.rol`) | Solo decorativo. La gestión del torneo la hace el Presidente/Promotor desde MakgoraHub. | Marcos también puede ser capitán de Orcos en el torneo Mak'Gora, o el Presidente puede nombrar a otro jugador como capitán del equipo Orcos. |

### 2.3 Matriz de permisos resultante

| Acción | Desarr. | Presidente | Promotor | Entrenador | Tesorero | Árbitro | **Capitán** *(nuevo)* | Jugador |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Ver dashboard club completo | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | solo su división | solo su perfil |
| Ver roster | ✓ todos | ✓ todos | ✓ su club | ✓ su club | – | – | **✓ su división** | – |
| Ver estadísticas | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **✓ su división** | solo suyas |
| Crear/editar jugadores | ✓ | ✓ | ✓ | ✓ | – | – | – (solo ver) | – |
| Calendario / agenda | ✓ | ✓ | ✓ | ✓ | – | – | **✓ su división** | – (vista separada) |
| Crear/editar entrenamientos | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| Crear eventos rápidos | ✓ | ✓ | ✓ | ✓ | – | – | **✓ su división** | – |
| RSVP a eventos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ver finanzas club | ✓ | ✓ | ✓ | – | ✓ | – | – | solo su membresía |
| Ver finanzas de su división | ✓ | ✓ | ✓ | – | ✓ | – | **✓ (cuánto pagan SUS jugadores)** | – |
| Tribunal / sanciones | ✓ | ✓ | ✓ | ✓ | – | ✓ | **✓ registrar faltas de su división** | – |
| Préstamos Mak'Gora | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| Crear tácticas | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| Crear usuarios | ✓ | ✓ | ✓ | – | – | – | – | – |
| Admin Panel | ✓ | ✓ | – | – | – | – | – | – |
| Configurar IA | ✓ | ✓ | – | – | – | – | – | – |
| Mak'Gora (gestión torneo) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | – |
| Mensajería | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **✓ (canales de su división)** | ✓ |

### 2.4 Schema propuesto

Migración nueva (la propongo, hay que validar antes de ejecutar):

```sql
-- 1) Tabla divisiones (catálogo real)
CREATE TABLE divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  code varchar UNIQUE NOT NULL,        -- 'masculina_mayor', 'femenina_mayor', 'juveniles_masculina', 'juveniles_femenina'
  label text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2) Tabla categories (lo que hoy es teams)
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid REFERENCES divisions(id) ON DELETE CASCADE,
  code varchar UNIQUE NOT NULL,        -- 'orcos_masculina_mayor', 'orcos_juvenil_a', etc.
  label text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3) Add 'capitan' and 'subcapitan' to system_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'capitan';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'subcapitan';

-- 4) user_profiles.division_scope ahora es FK real
ALTER TABLE user_profiles
  ADD COLUMN division_id uuid REFERENCES divisions(id) ON DELETE SET NULL;
-- mantener division_scope varchar por compatibilidad durante migración
-- luego: UPDATE user_profiles SET division_id = (SELECT id FROM divisions WHERE code = division_scope);

-- 5) team_members.captain puede ser un user (no solo player)
ALTER TABLE team_members
  ADD COLUMN captain_user_id uuid REFERENCES auth.users(id);
```

Cambio propuesto en `usePermissions.js` (resumen, no es código todavía):

```
hasPermission(action):
  - tier 0 (desarrollador): todo
  - tier 1 (presidente): todo
  - tier 2 (promotor): todo su club
  - tier 3 (entrenador/tesorero/arbitro): según action
  - NUEVO: tier 3.5 (capitan): subset de entrenador, solo SU division
  - tier 4 (jugador): solo su perfil
```

Cambio propuesto en `useSync.js` (filtrado por `division_id`):

```js
// Hoy:
if (userTier >= 2 && profile?.club_scope) {
  playerQuery.ilike('team_category', profile.club_scope + '%');
}

// Propuesto:
if (userTier === 3.5 && profile?.division_id) {
  // Capitán: solo su división
  playerQuery.in('team_category',
    supabase.from('categories').select('code').eq('division_id', profile.division_id)
  );
} else if (userTier >= 2 && profile?.club_scope) {
  // Entrenador: su club completo
  playerQuery.ilike('team_category', profile.club_scope + '%');
}
```

---

## 3) Plan de implementación por fases

### Fase 0 — Hotfixes (1-2 días) 🔴 URGENTE

1. **Unificar "Capitán" con tilde** en todos los strings del código:
   - `AddPlayerModal.jsx:5` y `EditPlayerModal.jsx:5` → cambiar `'Capitan'` por `'Capitán'`
   - `csvImport.js:39-40` → cambiar a `'Capitán'`
   - `PlayerCard.jsx:17,73-74` y `PositionNode.jsx:42,54` → cambiar comparaciones a `'Capitán'`
   - **Decisión**: elegir UNO. Recomendación: **con tilde** (estándar RAE + ya lo usa el schema).
2. **Fix Entrenador sin `club_scope`** (`useSync.js:155-160`): si tier 3 y sin scope, fallar explícitamente con mensaje "Tu perfil no tiene club_scope asignado, contacta al admin". No quedar en estado vacío silencioso.
3. **Proteger tabs en `App.jsx`**: agregar `hasPermission(tab.perm || 'view_all')` antes de renderizar cada tab. Si no tiene permiso, redirigir a `dashboard`.

### Fase 1 — Schema de Divisiones (3-5 días) 🟡 IMPORTANTE

1. Crear migración `51_divisions_table.sql` con la tabla `divisions` y FK en `user_profiles`.
2. Migrar los 4 valores hardcodeados de `DIVISIONES` (`masculina_mayor`, `femenina_mayor`, `juveniles_masculina`, `juveniles_femenina`) a filas reales.
3. Crear script de backfill: para cada `user_profiles.division_scope` existente, setear `division_id` correspondiente.
4. Actualizar `useClubs.js` y `usePermissions.js` para usar la nueva tabla.
5. UI: en `AdminPanel > Members`, dropdown de división con datos reales (no strings sueltos).
6. Test: capitán de "Masculina Mayor" solo ve 25 jugadores, no los 59.

### Fase 2 — Rol Capitán (5-7 días) 🟡 IMPORTANTE

1. **Schema**:
   - Migración `52_capitan_role.sql` con `ALTER TYPE user_role ADD VALUE 'capitan'`.
   - En `user_profiles`: `division_id` requerido para capitanes.
2. **`usePermissions.js`**:
   - Agregar tier 3.5 para `capitan` con permisos reducidos.
   - Permisos: `view_own_division` (players/schedule/stats/attendance de su division), `register_attendance_own_division`, `view_own_division_finances`, `view_own_division_messages`, `view_makgora`.
3. **`useSync.js`**:
   - Nueva rama de filtrado: `if (userRole === 'capitan')` → cargar solo datos de `division_id` del perfil.
4. **`AuthContext.signUp`** (o en `UserManagement.jsx`):
   - Al crear un usuario `capitan`, pedir `division_id` obligatorio.
   - Validar que un capitán no sea capitán de 2 divisiones distintas.
5. **`App.jsx`**:
   - Si `profile.system_role === 'capitan'`, renderizar un `CapitanDashboard` en vez del panel staff completo.
6. **`components/CapitanDashboard.jsx`** (nuevo):
   - 4 tabs: Mi División (resumen), Guerreros (read-only de jugadores de su división), Calendario (read-only + RSVP), Tribunal (registrar faltas de su división).
   - Banner: "Eres Capitán de [División]. Solo ves tu división."
7. **Sidebar adaptado**: capitán ve solo los 4 tabs de su dashboard.
8. **Tests**:
   - Unit: `usePermissions.test.js` con casos de capitán.
   - Integration: capitán de Masculina Mayor no ve jugadores de Femenina Mayor.
   - E2e: login como capitán → ve solo 25 jugadores.

### Fase 3 — Capitán de Mak'Gora (3-4 días) 🟢 DESEABLE

1. **Schema**: ya existe `tournament_teams.captain_player_id`, solo hay que usarlo.
2. **UI en `MakgoraHub/TeamManager.jsx`**:
   - Dropdown para asignar capitán de equipo.
   - Validar que el capitán pertenezca al `players.makgora_team_id` correspondiente.
3. **Vista para el capitán** (puede ser la MISMA `PlayerDashboard` con scope especial):
   - Si el jugador logueado es capitán de un `tournament_team`, mostrar tab "Mi equipo Mak'Gora" con: roster del equipo, próximo partido, standings, mi stats.
4. **Tests**: capitán de Orcos (en Mak'Gora) ve el fixture pero NO el de los otros equipos.

### Fase 4 — Equipos internos (4-5 días) 🟢 DESEABLE

1. **Schema**: nueva tabla `internal_teams` (`id`, `name`, `team_category`, `created_at`).
2. **Schema**: nueva tabla `internal_team_members` (`internal_team_id`, `player_id`, `jersey`).
3. **UI**: nuevo tab "Equipos Internos" en `Roster` (o sección dentro de Roster).
4. **CRUD**: crear equipo A, B, C, asignar jugadores, ver roster.
5. **Filtrado**: en `Dashboard` y `Calendario`, poder filtrar por "equipo interno".
6. **Migración**: rellenar `internal_teams` desde el campo libre `players.internal_team` actual.

### Fase 5 — Consolidación del data layer (5-7 días) 🟢 MEJORA

1. Crear `src/services/` con un módulo por dominio:
   - `playersService.js`, `scheduleService.js`, `financesService.js`, `matchesService.js`, `makgoraService.js`, `tournamentsService.js`, `invitationsService.js`, `fundraisingService.js`, `authService.js`, `usersService.js`.
2. Cada servicio encapsula Supabase + Zod validation + error handling.
3. Refactorizar los 11+ hooks/componentes que hacen `supabase.from(...)` directo.
4. **Decisión**: `apisupabase` (en `src/data/`) queda deprecated o se fusiona con `services/`.

### Fase 6 — Seguridad y auditoría (3-4 días) 🟢 MEJORA

1. **ProtectedRoute**: componente que valida `hasPermission` antes de montar.
2. **audit_log table**: registrar cada mutación sensible (finanzas, edición de jugadores, sanciones, cambios de rol).
3. **RLS review**: auditar políticas en `user_profiles`, `finances`, `tournament_teams`, especialmente con el nuevo rol `capitan`.

### Fase 7 — Reportes consolidados (5-7 días) 🟢 DESEABLE

1. Endpoint unificado de "partido" que junte `fixtures + future_fixtures + tournament_matches` con flag `kind`.
2. `tournament_player_stats` se sincroniza con `match_stats` cuando un partido de torneo se finaliza.
3. Reporte "Mi temporada" para cada jugador (todos sus partidos, tries, tackles, MVPs).

### Fase 8 — Onboarding y pulido (3-4 días) 🟢 DESEABLE

1. Wizard de creación de Entrenador/Capitán con asignación de scope.
2. Notificaciones push filtradas por `division_id` o `team_category`.
3. Documentación visible de roles (matriz en `Settings > Permisos`).
4. Tests e2e de flujos críticos.

---

## 4) Decisiones que necesito que tomes

Antes de implementar, necesito que confirmes o cambies:

### D1. Capitán con login propio
**Mi recomendación: SÍ, rol `capitan` con login propio y vista restringida a su división.**
- ¿Confirmas? ¿O querés que el capitán sea "delegado" del Entrenador (sin login, solo etiqueta)?

### D2. Nombre del rol
- ¿`capitan` (sin tilde, snake_case, consistente con `desarrollador`, `presidente`, etc.)?
- ¿O `capitán` (con tilde, más legible)? Esto impacta el enum de Postgres.

### D3. Capitán de Mak'Gora: misma persona o distinta
- Entiendo que **pueden ser distintas** (Marcos capitán de Masculina Mayor en club, y a la vez Pedro es capitán de Orcos en Mak'Gora). ¿Correcto?
- ¿O querés que sea siempre la misma persona?

### D4. ¿Subcapitán también con login?
- Hoy `players.rol` permite `Subcapitán`. ¿Lo mantenemos solo como etiqueta, o querés otro rol de sistema con permisos?

### D5. ¿Equipos internos "A vs B" los construimos ahora?
- Esto resuelve el campo huérfano `internal_team`. ¿Prioridad alta, media o baja para tu lanzamiento?

### D6. ¿Fase 5 (consolidar data layer) la hacemos antes o después del Capitán?
- **Antes** = refactor primero, después implementar Capitán con código limpio. Más lento al inicio, más rápido después.
- **Después** = Capitán rápido sobre la base actual, refactor después. Más rápido al inicio, riesgo de deuda técnica.

### D7. ¿`internal_team` (varchar libre) lo migramos a tabla formal o lo eliminamos?
- **Migrar**: preserva datos históricos.
- **Eliminar**: parte de cero, más simple. ¿Tenés datos importantes ahí?

### D8. ¿Roster de Capitán permite ver contacto personal (teléfono, email) de los jugadores?
- En CLUB, el Presidente ve todo. ¿El Capitán también?
- O ¿solo ve info deportiva (posición, atributos, asistencia) y NO contacto?

### D9. ¿El Capitán puede registrar SANCIONES (Tribunal) o solo ASISTENCIA?
- Mi propuesta: sanciones NO (lo hace Entrenador/Árbitro), asistencia SÍ.

### D10. ¿Hay otros roles que faltan?
- Mencionaste "etc...". ¿Hay otros roles no contemplados? Por ejemplo:
  - **Kinesiólogo/médico** (gestión de lesiones, HIA, wellness)
  - **Coordinador de infantiles** (alguien que vea SOLO juveniles)
  - **Manager** (algo entre Presidente y Promotor)
  - **Responsable de redes sociales** (solo mensajería y anuncios)

---

## 5) Resumen ejecutivo

La app es **funcional, completa y bien arquitecturada** (Supabase-first, PWA, IA multi-proveedor, 546 tests), pero tiene un **bug crítico de Capitán con/sin tilde** y un **hueco funcional grande: el rol de Capitán de división no existe como usuario del sistema**.

La **Fase 1 (Schema Divisiones) + Fase 2 (Rol Capitán)** es el corazón del trabajo que pediste, y representa **8-12 días de trabajo ordenado**. Todo lo demás (Fase 3 en adelante) es mejora que se puede iterar.

### Orden sugerido de ejecución

1. **Fase 0** (hotfixes) → 1-2 días
2. **Fase 1** (Schema Divisiones) → 3-5 días
3. **Fase 2** (Rol Capitán) → 5-7 días
4. Iterar con feedback real del usuario
5. Fase 3 en adelante según prioridad

### Riesgos principales

- **Migración de datos**: pasar de `division_scope` varchar a FK `division_id` requiere backfill cuidadoso.
- **RLS policies**: las políticas actuales no contemplan el rol `capitan`. Hay que escribirlas.
- **Multi-tenancy**: la tabla `clubs` está vacía. Si en algún momento se quiere abrir a otros clubes, todo el filtrado tiene que revisarse.
- **Tests**: hay que escribir tests del nuevo rol antes de mergear a main.

---

*"En el scrum y en la vida, siempre juntos. Siempre Orcos."*
