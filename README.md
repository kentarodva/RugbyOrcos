# RUGBY ORCOS NEGROS — Reino Manager v5.1

<p align="center">
  <img src="assets/orcos_logo.png" alt="Rugby Orcos Shield" width="180" />
</p>

Aplicacion Web Progresiva (PWA) para la gestion integral del club de rugby **Orcos Negros**. Arquitectura **Supabase-First** — PostgreSQL como unica fuente de verdad. Datos compartidos en tiempo real entre 80+ miembros. Tematica RPG de fantasia epica con roles, torneos, entrenamientos, finanzas y mas.

---

## Stack Tecnologico

| Categoria | Tecnologia |
|-----------|-----------|
| Frontend | React 18 + Vite 4 |
| Backend | **Supabase** (PostgreSQL, Auth, API, RLS) |
| Auth | Email/Password + Username para Guerreros |
| Mobile | Capacitor (Android APK) + PWA (iOS Safari) |
| IA | Groq · DeepSeek · Gemini (multi-provider con fallback) |
| Estilos | CSS puro con Custom Properties (glassmorphism + neon) |
| PWA | vite-plugin-pwa (16 assets precacheados + runtime cache) |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) |

---

## REGLA DE ORO — Arquitectura Supabase-First

**PostgreSQL (Supabase) es la unica fuente de verdad.** Toda escritura va directo a la BD via `upsert()`. Toda lectura viene de `fetchAll()`. localStorage es solo cache de lectura.

| Operacion | Destino |
|---|---|
| Crear evento/partido/finanza/jugador | `supabase.from('tabla').upsert()` |
| Leer datos al cargar | `useSyncPull → fetchAll() → setState` |
| Recargar pagina | `fetchAll()` — los datos vienen de Supabase |
| Otro usuario abre la app | Ve los mismos datos (segun permisos RLS) |

**Sin backup, sin merge, sin re-push.** Si Supabase no responde, `syncStatus='offline'`.

---

## Estructura del Proyecto

```
Rugby Orcos/
├── src/
│   ├── main.jsx                 # Entry point
│   ├── App.jsx                  # Header, tabs, navegacion, admin panel
│   ├── index.css                # Design system (neon, glassmorphism, variables)
│   ├── supabaseClient.js        # Cliente Supabase
│   ├── context/
│   │   ├── AuthContext.jsx      # Autenticacion (login, signup, perfil, roles)
│   │   ├── ClubContext.jsx      # Estado global, CRUD, permisos, sync Supabase
│   │   └── ToastContext.jsx     # Notificaciones toast
│   ├── components/
│   │   ├── Login.jsx            # Login unificado (email/username + password)
│   │   ├── Dashboard.jsx        # Inicio (metricas, HIA, wellness, eventos)
│   │   ├── Roster.jsx           # CRUD jugadores, atributos RPG, insignias, credenciales
│   │   ├── CanchaTactica/       # Pizarra: formaciones, dibujo, jugadas guardadas
│   │   ├── Tribunal.jsx         # Asistencia, infracciones, rankings
│   │   ├── Calendario.jsx       # Agenda/Fixture/Proximos/Rivales (QuickTrainingPanel)
│   │   ├── Finanzas.jsx         # Caja chica, membresias, inventario (AddInventoryForm)
│   │   ├── TrainingHub.jsx      # Plan inteligente + IA Personal Trainer multi-proveedor
│   │   ├── AIChat.jsx           # Chat tactico multi-proveedor IA
│   │   ├── AwardsHall.jsx       # Salon de la Fama (43 premios + certificados)
│   │   ├── MakgoraHub.jsx       # Torneo Mak'Gora (equipos, fixture, standings, prestamos)
│   │   ├── Invitaciones.jsx     # Dashboard de invitaciones a rivales
│   │   ├── MatchInvitation.jsx  # Pagina publica de invitacion (sin login)
│   │   ├── PlayerDashboard.jsx  # Vista del Guerrero (Partidos, Entreno, Fisico, Ficha + Mas)
│   │   ├── UserManagement.jsx   # Admin de usuarios, roles y reset password
│   │   ├── Settings.jsx         # Configuracion IA, tema claro/oscuro, cuenta
│   │   ├── Rivales.jsx          # Gestion de equipos rivales
│   │   ├── AuthCallback.jsx     # Callback de autenticacion
│   │   ├── ErrorBoundary.jsx    # Captura de errores React
│   │   ├── Messages.jsx          # Mensajeria interna con attachments, reacciones, busqueda
│   │   ├── AnnouncementModal.jsx # Anuncios tipo popup
│   │   ├── AvatarPicker.jsx     # 40 SVGs mitologicos + subir foto
│   │   ├── PlayerPhoto.jsx      # Avatar/foto con fallback a iniciales
│   │   ├── WorkoutLogger.jsx    # Logging de ejercicios completados
│   │   ├── PlayerProgressTab.jsx# Graficas de progreso gym
│   │   ├── PlayerCompare.jsx    # Comparativa lado a lado de 2 jugadores
│   │   ├── Toast.jsx            # Componente toast
│   │   ├── Dashboard/
│   │   │   ├── ActivityFeed.jsx # Actividad reciente del club
│   │   │   └── MiniRanking.jsx  # Top 3 asistencia/MVP/tries
│   │   ├── Calendario/AgendaTab/
│   │   │   ├── MonthlyView.jsx  # Calendario en vista mensual
│   │   │   └── EventRsvp.jsx    # Confirmacion de asistencia (going/maybe/not_going)
│   │   ├── TrainingHub/
│   │   │   ├── TeamOverview.jsx # Vista equipo con alertas de carga
│   │   │   └── ExerciseForm.jsx # Creacion de ejercicios personalizados
│   │   └── MakgoraHub/
│   │       └── ChampionsHistory.jsx # Salón de campeones historico
│   ├── data/
│   │   ├── supabaseApi.js       # Capa API Supabase + conversor de datos
│   │   ├── exerciseLibrary.js   # 44 ejercicios de rugby
│   │   └── faultExerciseMap.js  # Mapa fallos → ejercicios correctivos
│   ├── __tests__/                # 59 archivos, 594 tests
│   └── engine/
│       ├── assignmentEngine.js  # Motor de reglas para planes de entrenamiento
│       ├── aiProvider.js        # Router multi-proveedor IA + generateTrainingPlan
│       ├── promptBuilder.js     # buildAITrainingContext (14 fuentes de datos)
│       ├── aiCache.js           # Cache LRU en localStorage
│       ├── aiConfig.js          # Configuracion de proveedores IA
│       ├── contentFilter.js     # Filtro de contenido rugby
│       ├── matchAnalyzer.js     # Analisis de partidos con IA
│       ├── attributeCalculator.js# Calculo de atributos RPG desde datos fisicos
│       ├── overtrainingDetector.js# Deteccion temprana de sobreentrenamiento
│       ├── planNormalizer.js    # Normalizador de planes IA → engine
│       ├── trainingPlanService.js# Servicio de persistencia de planes
│       └── providers/           # Groq, DeepSeek, Gemini, OpenRouter
├── supabase/migrations/
│   ├── 00_reset_db.sql
│   ├── 01_schema_v4.sql         # 27 tablas + RLS + funciones
│   ├── 02_fix_user_profiles_rls.sql
│   ├── 03_admin_reset_staff_password.sql
│   ├── 04_match_invitations.sql
│   ├── 05_messages.sql
│   ├── 06_enhance_invitations.sql
│   ├── 07_custom_tactics.sql
│   ├── 08_team_members_and_normalize.sql
│   ├── 09_fix_makgora_dupes.sql
│   ├── 10_push_tokens.sql
│   ├── 11_push_trigger.sql
│   ├── 12_unique_constraint_name_birth.sql
│   ├── 13_add_payment_date_to_player_payments.sql
│   ├── 14_finances_rls.sql
│   ├── 15_fundraising.sql               # Fundraising: campañas, asignaciones, tickets, pagos
│   ├── 16_club_config.sql               # Config por equipo (mensualidad_base)
│   ├── 17_campaign_prizes.sql           # Premios JSONB en campañas
│   ├── 18_fundraising_rls.sql           # RLS policies + get_user_tier()
│   ├── 19_fix_player_credentials.sql    # Fix inicial de credenciales
│   ├── 20_player_avatars.sql            # avatar_id + photo_url + storage
│   ├── 21-23_fix_username_generation.sql# Fixes de tipo VARCHAR vs TEXT
│   ├── 24_final_credential_fix.sql      # IF EXISTS UPDATE ELSE INSERT
│   ├── 25_exercise_catalog.sql          # Catálogo de 45+ ejercicios
│   ├── 26_gym_history.sql              # Historial de fuerza (squat/bench/deadlift)
│   ├── 29_security_audit_fixes.sql     # RLS, UNIQUE wellness, search_path
│   ├── 30_training_plans.sql           # Planes de entrenamiento persistidos
│   ├── 31_fix_child_table_rls.sql      # RLS en tablas hijas (wellness, HIA, etc)
│   ├── 32_agenda_enhancements.sql      # notes, end_date, event_rsvp
│   ├── 33_event_scope.sql              # scope_type + scope_value (visibilidad)
│   ├── 34-40_security_rls_performance.sql # Fixes RLS, índices, revoke anon
│   ├── 41-42_live_matches.sql          # Live match tracking + eventos
│   ├── 43-52_fixes_and_enhancements.sql # UNIQUE, salud, credenciales, nombres
│   ├── 53_smart_username_and_name_fields.sql # Username + nombres compuestos
│   ├── 54-57_stats_health_attributes.sql # Estadísticas, salud, atributos RPG
│   ├── 58_sync_user_profile.sql         # Trigger auto-creación user_profiles
│   ├── 59_add_missing_foreign_keys.sql  # 33 FKs (user_id, team_category, UUIDs)
│   ├── 60_security_checks_and_timestamps.sql # 9 CHECKs + updated_at financiero
│   ├── 61_performance_indexes.sql       # 40+ índices FK + WHERE
│   ├── 62_data_quality.sql              # TIME nativo, UNIQUE workouts, CHECKs
│   ├── 63_add_team_id_fk_columns.sql    # team_id UUID FK 12 tablas + triggers
│   └── 64_complete_user_team_links.sql  # user_profiles ↔ teams ↔ clubs
├── android/                     # Proyecto Android Capacitor
├── vercel.json                  # Config SPA fallback para Vercel
└── .env                         # Variables de entorno (NO COMMITEAR)
```

---

## Integridad Referencial (DB Normalizada)

La base de datos está completamente normalizada con integridad referencial estricta:

| Métrica | Valor |
|---------|-------|
| Foreign Keys | 133 |
| CHECK constraints | 94 |
| Índices | 164 |
| Tablas con RLS | 53/53 (100%) |
| Tablas totales | 53 |

### Jerarquía de relaciones

```
clubs (id, name, code)
  └── teams (id, category, division, club_id FK→clubs)
        ├── players (team_id FK, team_category FK)
        ├── schedule_events (team_id FK, team_category FK)
        ├── finances (team_id FK, team_category FK)
        ├── championships (team_id FK, team_category FK)
        ├── fixtures (team_id FK, team_category FK)
        ├── future_fixtures (team_id FK, team_category FK)
        ├── inventory (team_id FK, team_category FK)
        ├── lineups (team_id FK, team_category FK)
        ├── team_members (team_id FK, team_category FK)
        ├── push_tokens (team_id FK, team_category FK)
        ├── fundraising_campaigns (team_id FK, team_category FK)
        ├── club_config (team_id FK, team_category FK)
        └── user_profiles (team_id FK, club_scope FK)
```

Triggers bidireccionales mantienen sincronizadas `team_category` (VARCHAR) y `team_id` (UUID). El frontend lee ambos y puede migrar gradualmente a UUID. Todos los `user_id` tienen FK a `auth.users(id)`.

---

## Roles RPG — Jerarquia del Reino

| Tier | Rol Sistema | Rol RPG | Icono | Permisos |
|:----:|------------|---------|:-----:|----------|
| 0 | Desarrollador | Arquitecto del Reino | 🏰 | Todo el sistema |
| 1 | Presidente | Senor de la Guerra | ⚔️ | Todos los clubes, crear usuarios |
| 2 | Promotor | Comandante de Horda | 🛡️ | Su club completo |
| 3 | Entrenador | Maestro de Armas | 🏋️ | Entrenamientos, roster, tactica |
| 3 | Tesorero | Guardian del Botin | 💰 | Finanzas, membresias |
| 3 | Arbitro | Juez del Coliseo | ⚖️ | Tribunal, disciplina |
| 4 | Jugador | Guerrero | 👹 | Solo su perfil personal |

---

## Flujo de Login

### Staff (Arquitecto, Senor, Comandante, Maestro, Guardian, Juez)
- Ingresa su **email** + contrasena → Supabase Auth → accede al panel completo segun permisos

### Guerrero (Jugador)
- Ingresa su **nombre de usuario** (ej: `kennent.vergara`) o **email** + contrasena
- La app busca el jugador por `players.user_id` UUID (FK a `auth.users`) → match directo
- Fallback: busca por nombre (`display_name`) o email del perfil
- Accede al PlayerDashboard (barra inferior + menu Mas)
- Si el perfil no tiene `birth_date`, se muestra wizard de bienvenida

### Fundar Reino (primer uso / staff nuevo)
- Admin > Miembros > crear usuario con email + password + rol

---

## Modulos

### Dashboard
Metricas del squad, protocolo HIA (conmociones), wellness check-in, eventos, partidos recientes. El cronometro de Sin-Bin vive en el partido en vivo (Match Center).

### Roster
CRUD de jugadores con atributos RPG (Fuerza, Velocidad, Resistencia, Tecnica). Historial fisico SVG. Lesiones 4 fases. Gimnasio 1RM. Insignias automaticas. **Forjar Credenciales** (genera username + password). **Restablecer Contrasena** de jugador. **Asignacion a equipo Mak'Gora** desde ficha de edicion.

### Pizarra Tactica
11 formaciones, drag-and-drop, selector de jugador con busqueda y disponibilidad, banco de suplentes, orientacion H/V, media cancha y pantalla completa. **Modo Dibujar** (carrera, pase, marca) con deshacer/rehacer. **13 jugadas de ejemplo** y **Mis jugadas** guardadas para todo el club en `tactical_plays` (migracion 81). Compartir como imagen, texto de WhatsApp o PDF.

### Tribunal Disciplinario
Dos pestanas: **Asistencia** y **Faltas y castigos** (penitencias, infracciones). Rankings de Honor, MVPs, Tries y Tackles arriba.

### Salon de la Fama
**43 premios automaticos** basados en estadisticas (15 de Honor + 28 de la Taberna). Certificados HTML imprimibles.

### Mak'Gora
Torneo interno con 6 equipos. Crear torneos, fixture round-robin, registrar resultados, tabla de posiciones (puntos bonus). Historial de campeones. **Prestamos de jugadores** entre equipos (solicitar, aprobar, devolver). Badge en Roster.

### Invitaciones
Dashboard centralizado de invitaciones a equipos rivales. Genera links unicos por partido, los rivales registran sus jugadores sin login. Contador en vivo, respuesta aceptar/rechazar, GuestRoster visible en proximos partidos y Match Center. Badge de invitaciones activas en gestion de rivales.

### Agenda (Grupo CLUB > Calendario)
Tres pestanas: **Calendario**, **Partidos** (proximos, jugados, campeonatos e invitaciones juntos) y **Rivales**. La pestana "En vivo" solo aparece durante un partido, con un aviso para abrirlo.
Recurrencia personalizada (dias de la semana x N semanas con vista previa). Panel de **Entreno Rapido** (crear entrenos en 2 clicks con memoria de ultima hora/lugar). Anti-duplicado (misma fecha+hora+equipo). WhatsApp formatter con mapa. Vista semanal. Editar/borrar cualquier evento. Los eventos se guardan en Supabase y son visibles para todos los miembros de la division.

### PlayerDashboard (Guerrero, tier 4)
El Guerrero navega con una barra inferior: **Partidos** (proximos entrenos y partidos con RSVP), **Entreno** (plan IA, registro de ejercicios y "Mi progreso" con graficas de fuerza), **Fisico** (wellness check-in diario) y **Ficha** (atributos RPG, insignias, perfil). En **Mas**: Membresia & Cuotas y Coach Tactico IA. El perfil es completamente editable por el jugador (peso, altura, EPS, salud, experiencia). Primer login muestra wizard de bienvenida para completar datos requeridos.

### Finanzas
Caja chica, membresias con abonos parciales y cobro mensual automatico, inventario con custodios.
**Recaudacion**: campanas de rifa (boletas numeradas secuenciales, premios multiples, venta FIFO con abono tracking) y comidas, pagos unificados en `player_payments`, sincronizacion bidireccional con Caja Chica via `[pid:...]`, rentabilidad automatica (Bruto − Premios).

### Entrenamientos (TrainingHub)
Plan inteligente, Constructor y Catalogo unidos en **Crear rutina**.
**IA Personal Trainer multi-proveedor** (Groq → DeepSeek → Gemini). La IA recibe 14 fuentes de datos por jugador: atributos, tendencia historica, 1RM con ratios, partidos (tries, tackles, tarjetas), racha de entrenamiento, ejercicios saltados, wellness (sueno/dolor/estres 7d), lesiones activas y pasadas, fracturas, HIA, asistencia, penalizaciones. Genera: analisis, riesgos, metas a 30/90d, plan campo/gym/recuperacion, recomendaciones de sueno/nutricion/prevencion. **PlayersTab** auto-genera plan al seleccionar Guerrero.

### IA Coach
Chat multi-proveedor (Gemini/Groq/DeepSeek) con failover. 3 modos. Rate limit y cache.

---

## Credenciales de Prueba

| Rol | Usuario | Contrasena |
|-----|---------|-----------|
| Arquitecto del Reino | admin@orcosnegros.com | OrcosAdmin2026! |
| Señor de la Guerra | kennentdva@gmail.com | ******** |
| Guerrero | kennent.vergara@orcos.club | ******** |

---

## CodeGraph

El proyecto incluye **CodeGraph**, un knowledge graph basado en tree-sitter que indexa todos los simbolos, referencias y flujos del codigo. Util para analisis estructural en lugar de grep.

| Consulta | Herramienta |
|----------|------------|
| "Donde se define X?" | `codegraph_search` |
| "Que llama a la funcion Y?" | `codegraph_callers` |
| "Que llama Y?" | `codegraph_callees` |
| "Como llega X a Y?" | `codegraph_trace` |
| "Que romperia si cambio Z?" | `codegraph_impact` |
| "Dame el source de Y" | `codegraph_node` |

```bash
codegraph init -i
```

---

## Setup Local

```bash
git clone https://github.com/kentarodva/RugbyOrcos.git
cd "Rugby Orcos"
npm install
# Crear .env con:
#   VITE_SUPABASE_URL=https://qtvmqlbjcotvbzuwanjs.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJ...
#   SUPABASE_SERVICE_ROLE_KEY=eyJ...
npm run dev   # http://localhost:3000
```

### Setup Supabase (primera vez)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. SQL Editor > ejecutar en orden:
   - `supabase/migrations/00_reset_db.sql` (solo si hay que limpiar)
   - `supabase/migrations/01_schema_v4.sql`
   - `supabase/migrations/02_fix_user_profiles_rls.sql`
   - `supabase/migrations/03_admin_reset_staff_password.sql`
   - `supabase/migrations/04_match_invitations.sql`
   - `supabase/migrations/05_messages.sql`
   - `supabase/migrations/06_enhance_invitations.sql`
    - `supabase/migrations/15_fundraising.sql`
    - `supabase/migrations/16_club_config.sql`
    - `supabase/migrations/17_campaign_prizes.sql`
    - `supabase/migrations/18_fundraising_rls.sql`
3. `node seed/seed-csv.mjs "ruta/al/archivo.csv"`
4. Authentication > Providers > Email: habilitado

### Deploy (Vercel)

✅ **Ya conectado.** El repo `kentarodva/RugbyOrcos` está vinculado a Vercel.
Cada push a `main` dispara auto-deploy.

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://qtvmqlbjcotvbzuwanjs.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Configurada en Vercel |

**URL de producción:** `https://rugby-orcos.vercel.app`

---

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Dev server localhost:3000 |
| `npm run build` | Build produccion en dist/ |
| `npm run lint` | ESLint (0 warnings) |
| `npm run test` | Vitest (594 tests, 59 files) |
| `npm run cap:sync` | Sincronizar Android |
| `npm run cap:open-android` | Abrir Android Studio |
| `node seed/seed-csv.mjs ruta.csv` | Importar CSV a Supabase |
| `git push origin main` | Auto-deploy a Vercel |
| `node src/__tests__/validate_db_integrity.sql` | Validar integridad BD en Supabase |

---

## Estado del Proyecto

| Fase | Tarea | Estado |
|:----:|-------|:------:|
| 0 | Preparacion (Supabase, Vercel, Git) | ✅ |
| 1 | Schema SQL (27 tablas + RLS + funciones) | ✅ |
| 2 | Auth email/password + Login unificado | ✅ |
| 3 | Roles RPG + Permisos + UserManagement | ✅ |
| 4 | PlayerDashboard + Forjar Credenciales | ✅ |
| 5 | Salon de la Fama (35 premios + certificados) | ✅ |
| 6 | Mak'Gora (torneos, fixture, standings, prestamos) | ✅ |
| 7 | Invitacion a rivales + QR + recordatorio + H2H stats | ✅ |
| 8 | Segmentacion de eventos (division/makgora_team/todo el club) | ✅ |
| 9 | Mensajeria interna + reacciones + busqueda | ✅ |
| 10 | Arquitectura Supabase-First | ✅ |
| 11 | IA Personal Trainer multi-proveedor + sobreentreno | ✅ |
| 12 | Agenda: recurrencia, RSVP, vista mensual y semanal | ✅ |
| 13 | Deploy Vercel (GitHub auto-deploy) | ✅ |
| 14 | Build APK Android | ✅ |
| 15 | Recaudacion (rifas FIFO, premios, comidas) | ✅ |
| 16 | Finanzas: caja chica, membresias + categorias (hotel, prestamo, etc) | ✅ |
| 17 | RLS Fundraising + seguridad | ✅ |
| 18 | Avatares (40 SVGs + subir foto + Storage) | ✅ |
| 19 | Tema claro/oscuro | ✅ |
| 20 | Auto-deteccion sobreentrenamiento | ✅ |
| 21 | Historial de campeones Mak'Gora | ✅ |
| 22 | Comparativa de jugadores | ✅ |
| 23 | CI/CD + 546 tests | ✅ |
| 24 | Normalizacion BD: 133 FKs, 94 CHECKs, team_id UUID | ✅ |
| 25 | PlayerDashboard 7 tabs + wizard bienvenida | ✅ |
| 26 | Auto-creacion user_profiles (trigger + codigo) | ✅ |
| 27 | Tests: 594 tests, 59 archivos | ✅ |

---

*"En el scrum y en la vida, siempre juntos. Siempre Orcos."*
