# CHANGELOG — Rugby Orcos Negros

> **Formato:** [YYYY-MM-DD] — Categoría: Descripción  
> **Versión actual:** v4.5  
> **Última actualización:** 2026-11-06

---

## 2026-11-06 — Rediseño "Vestuario nocturno", Pizarra y navegación simplificada

### UI / UX

- **[UI]** Nuevo sistema visual: superficies oscuras neutras, un solo acento verde, tipografías Inter + Barlow Condensed; sin glows ni gradientes
- **[UI]** Nuevo shell móvil: header fijo con hoja de cuenta, navegación inferior (staff y jugador) con hoja "Más" y componente `Sheet` compartido
- **[UI]** Rediseñados Inicio, Guerreros, Agenda, Mensajes, Tribunal, Mak'Gora, Estadísticas, Finanzas, Entrenos, Físico, Ficha, Campaña y Fixture, Rivales y el panel de admin (miembros en tarjetas)
- **[FIX]** `.btn-primary` sin estilos tras el cambio de tokens; barras horizontales de estadísticas de ~35 px en móvil; 0 px de overflow horizontal en las pantallas auditadas

### Navegación

- **[NAV]** Agenda: 3 pestañas (Calendario, Partidos, Rivales); "En vivo" solo aparece durante un partido
- **[NAV]** Entrenos: Plan inteligente + Constructor + Catálogo → "Crear rutina"
- **[NAV]** Estadísticas: 7 pestañas → Plantilla, Rendimiento, Salón de la Fama
- **[NAV]** Tribunal: Asistencia + Faltas y castigos. Mi Ficha (staff) pasa al menú de cuenta. Jugador: Fuerza & Rendimiento → Entreno › "Mi progreso"
- **[NAV]** Inicio: eliminados ranking y campeonatos duplicados y la consola Sin-Bin (el cronómetro de sin-bin del partido en vivo se mantiene)

### Pizarra Táctica

- **[PIZARRA]** Móvil "cancha primero": la cancha bajo el selector de equipo y cuatro pestañas debajo (táctica, jugadas, banca, compartir); vertical por defecto, media cancha y pantalla completa
- **[PIZARRA]** Selector de jugador en hoja inferior con búsqueda, orden por posición y disponibilidad; marca de lesionado/duda y de capitán
- **[PIZARRA]** Modo Dibujar: Carrera, Pase y Marcar con deshacer/rehacer; los trazos siguen orientación y vista y salen en la imagen compartida
- **[PIZARRA]** 13 jugadas de ejemplo agrupadas por estilo y "Mis jugadas": capturar fases, nombrar y guardar para todo el club

### Base de Datos

- **[DB]** Migración `81_tactical_plays.sql` (aplicada): tabla `tactical_plays` con RLS — lectura del equipo, escritura solo admin/entrenador como autor, tope de 30 fases y 150 KB por jugada. Sin conexión la jugada queda en el dispositivo y se sube después

---

## 2026-07-28 — Refactorización Arquitectónica Completa

### Arquitectura de Datos

- **[DATA]** Creado `src/services/dataService.js` — Single Source of Truth con 27 funciones cubriendo 12 tablas (event_rsvp, training_plans, attendance, player_payments, player_loans, tournaments, players, makgora_teams, finances, fundraising_campaigns, treasurer_deliveries)
- **[DATA]** Event bus implementado: cada escritura emite `window.dispatchEvent('data:changed')` para propagación cross-module
- **[DATA]** Creado `src/context/hooks/useDataListener.js` — hook reutilizable de 10 líneas para suscripción a cambios
- **[DATA]** `trainingPlanService.js` refactorizado → usa `dataService` en vez de `supabase.from()` directo (6 llamadas migradas)
- **[DATA]** `playerService.js` y `financeService.js` mergeados a `dataService.js` y eliminados

### Base de Datos

- **[DB]** Migración `phase_01_foreign_keys_and_views.sql` — 5 FKs nuevas:
  - `event_rsvp.player_id → players(id) ON DELETE CASCADE`
  - `training_plans.player_id → players(id) ON DELETE CASCADE`
  - `player_payments.player_id → players(id) ON DELETE CASCADE`
  - `attendance.player_id → players(id) ON DELETE CASCADE`
  - `finances.payment_id → player_payments(id) ON DELETE SET NULL`
- **[DB]** Columna `finances.payment_id` (UUID) agregada — reemplaza el frágil `[pid:UUID]` en `desc`
- **[DB]** 3 vistas materializadas creadas: `player_training_summary`, `player_rsvp_summary`, `player_payment_summary`
- **[DB]** Migración `phase_02_soft_delete_rule.sql` — regla permanente:
  - Trigger `trg_prevent_player_delete` bloquea `DELETE FROM players`
  - RLS `players_hide_deleted` filtra `WHERE deleted_at IS NULL`
  - Columna `players.deleted_at` (timestamptz) + índice `idx_players_deleted`
- **[DB]** `deletePlayer()` y `deleteAllPlayers()` → soft-delete (`status='inactivo', deleted_at=NOW()`)
- **[DB]** `exec_sql_batch` RPC dropeada (agujero de SQL arbitrario)
- **[DB]** RLS habilitado en `fundraising_campaigns`, `fundraising_assignments`, `raffle_tickets`
- **[DB]** CHECK `players_role_check` actualizado: agregado `'Entrenador'`
- **[DB]** Índices agregados: `fixtures.rival_id`, `future_fixtures.rival_id`
- **[DB]** UNIQUE constraints agregados: `gym_history(player_id, recorded_date)`, `match_stats(player_id, match_date, opponent)`
- **[DB]** `user_profiles_select` RLS reemplazado → solo staff/admin ven todos los perfiles

### Filtros

- **[UX]** `useFilterByView.js` reescrito — exporta `useTeamPlayers()` y `useViewFilter()`
- **[UX]** 9 componentes migrados a `useTeamPlayers()`: `TrainingHub`, `Roster`, `AwardsHall`, `Estadisticas`, `Rivales`, `Tribunal`, `CanchaTactica`, `Dashboard`, `Calendario`
- **[UX]** `AIChat/useAIChatState.js` → `useViewFilter()` en vez de filtro duplicado `teamCategory === activeTeam`
- **[UX]** 0 filtros duplicados restantes en el código

### Catálogo de Ejercicios

- **[FEAT]** 1,324 ejercicios importados con GIFs funcionales y nombres traducidos al español
- **[FEAT]** Traducciones vía Gemini 2.5 Flash (974 ejercicios, 73%) + regex (350 ejercicios, 27%)
- **[FEAT]** GIFs corregidos — mapeo `media_id` vs repo upstream `hasaneyldrm/exercises-dataset` usando GitHub Tree API
- **[FEAT]** `get_exercise_catalog_light()` RPC creada en Supabase — devuelve JSON liviano (~265 KB vs ~5 MB)
- **[FEAT]** `getExerciseByCode()` para carga lazy de instrucciones y GIFs en el modal
- **[FEAT]** Filtros traducidos al español: músculos, equipos, categorías (dropdowns dinámicos)
- **[FEAT]** Paginación 50/100 con navegación `« Pág 3 de 27 »`
- **[FEAT]** Ejercicios del sistema (`source='manual'`) ocultos del catálogo general
- **[FEAT]** Preview modal con lazy-load de GIF + instrucciones

### Constructor de Rutinas

- **[FEAT]** Nueva pestaña `🛠️ Constructor` en TrainingHub con `BuilderTab.jsx` (605 líneas)
- **[FEAT]** Layout simplificado: 7 categorías con descripciones, cada una con su botón `➕ Añadir`
- **[FEAT]** `CatalogAdder` — modal contextual que se abre por categoría con buscador, filtros y paginación
- **[FEAT]** Buscador rápido global con resultados modal `position: fixed` + selector de categoría destino
- **[FEAT]** Buscador de jugador: input con autocomplete estilo YouTube, `position: fixed` calculada
- **[UX]** Reordenamiento con flechas `▲▼` en cada ejercicio de la rutina
- **[UX]** Controles `sets × reps` mejorados con inputs numéricos

### RoutineBuilder (modal del jugador)

- **[UX]** Rediseño completo — filtros traducidos, paginación, reordenamiento
- **[UX]** Modal de 920px con layout 2 columnas mejorado
- **[UX]** Preview con GIF + instrucciones lazy-load

### ExercisePicker

- **[UX]** Filtros sincronizados con traducciones (MUSCLE_LABELS, EQUIP_LABELS)
- **[UX]** Preview lazy-load con GIF

### Conexión Cross-Module

- **[EVENT]** Event bus activado — 9 tipos de eventos, 8 con listener
- **[EVENT]** Calendario, Tribunal, PlayerDashboard escuchan `event_rsvp`
- **[EVENT]** PlayerDashboard escucha `training_plans`, `attendance`, `player_payments`
- **[EVENT]** Roster escucha `player_loans`
- **[EVENT]** FundraisingTab escucha `fundraising_campaigns`
- **[EVENT]** MakgoraHub escucha `tournaments`, `tournament_matches`, `player_loans`
- **[EVENT]** MakgoraHub emite `tournaments` (create/delete), `tournament_matches` (create)
- **[EVENT]** useFundraising emite `fundraising_campaigns` (create)
- **[EVENT]** Messages emite `messages` (send/announce)
- **[CODE]** BuilderTab, RoutineBuilder, ExercisePicker, Messages → `parseSupabaseError()` para errores amigables

### Security

- **[SEC]** `exec_sql_batch` RPC dropeada
- **[SEC]** API key de Google expuesta en `seed/gemini-translate.mjs:3` (⚠️ requiere limpieza manual)
- **[SEC]** `supabase.raw()` con `Number(amount)` validado antes de interpolar
- **[SEC]** `dataService.js` no tiene auth checks explícitos — depende de RLS de Supabase

### Performance

- **[PERF]** 10 componentes convertidos a lazy-load: `Roster`, `Tribunal`, `Calendario`, `Finanzas`, `PlayerDashboard`, `AwardsHall`, `MakgoraHub`, `MatchInvitation`, `Invitaciones`, `Messages`
- **[PERF]** Bundle principal: **1,237 KB → 415 KB (-66%)**
- **[PERF]** `@imgly/background-removal` → dynamic import (762 KB fuera del bundle inicial)
- **[PERF]** `ExercisePreviewModal` → lazy fetch de instrucciones + GIF vía `getExerciseByCode()`

### UX

- **[UX]** Dark mode instantáneo — script bloqueante en `index.html` aplica `background-color: #0a0c10` antes de React
- **[UX]** Botón PWA "Instalar" oculto — `manifest.json` desvinculado de `index.html`
- **[UX]** Login: mensajes de error user-friendly en vez de `alert(err.message)` crudo

### Documentación

- **[DOC]** `RULES.md` — 7 categorías de reglas arquitectónicas (DB, servicios, filtros, event bus, frontend, seguridad, performance)
- **[DOC]** `DATABASE.md` — documentación completa de 53 tablas con columnas, FKs, RLS, triggers, índices
- **[DOC]** `CHANGELOG.md` (este archivo) — registro cronológico de cambios
- **[DOC]** `DEPLOY.md` — instrucciones de deploy a Cloudflare Pages (gratis)
- **[MIG]** `seed/migrations/phase_01_foreign_keys_and_views.sql`
- **[MIG]** `seed/migrations/phase_02_soft_delete_rule.sql`

---

## Historial Previo (resumen)

### 2026-07-14 ~ 2026-07-21 — Features y Bug Fixes (sesiones anteriores)

- **[FEAT]** Membership persistence: columnas `memberships_paid/due/last_payment_date/last_payment_amount` en `players`
- **[FEAT]** Error handling: `parseSupabaseError()` con 18 categorías, 15s fetch timeout
- **[FEAT]** PhotoEditor: background removal con ONNX, crop, drag, touch support
- **[FEAT]** Dashboard: counters sincronizados con `divisionView`, title dinámico
- **[FEAT]** Mak'Gora: normalización de team IDs, selector de división en RosterControls
- **[FEAT]** Attendance: RSVPs pre-fill, toggle "Solo confirmados", search input, fee count
- **[FEAT]** MonthlyChargeModal: player search + pending-charge banner
- **[FEAT]** Multi‑module search inputs: InfractionForm, AttendanceForm, FaultBookTab, MonthlyChargeModal
- **[FEAT]** Exercise catalog UI: CatalogTab, ExercisePicker, ExercisePreviewModal
- **[FEAT]** Plan onboarding: 11 positions, days/week, equipment, season, goal, dislikes
- **[FEAT]** RoutineBuilder: two‑column layout, sets×reps editing, preview modal
- **[FEAT]** Import dataset: 1,324 ejercicios desde `hasaneyldrm/exercises-dataset`, 10 idiomas
- **[FEAT]** Tailwind CSS v4 integrado en PlayerDashboard
- **[FIX]** useFilterByView: divisionMatch bug (early return `activeTeamId`)
- **[FIX]** Birthday countdown: `today.setHours(0,0,0,0)` para `Math.round` correcto
- **[FIX]** Sync pull: `silent:true` → `notifyUser:true` en errores de clubs/makgora/teams
- **[FIX]** useSync deps: `userTier` y `profile?.team_id` agregados
- **[FIX]** PhotoEditor: ref‑based positioning, document‑level event listeners
- **[FIX]** Player avatar: cache‑buster `?t=timestamp`, delete old storage file before upload
