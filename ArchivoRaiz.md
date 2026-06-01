# Archivo Raíz — Rugby Orcos Negros: Reino Manager v4.0

> Documento generado automáticamente el 2026-06-01 mediante auditoría completa con CodeGraph.  
> 83 archivos · 574 nodos · 1,004 aristas · 274 tests.

---

## 1. Propósito

Aplicación web/móvil de gestión integral para un club de rugby con temática RPG (fantasía orca). Cubre: jugadores, agenda, finanzas, disciplina, tácticas, torneo interno Mak'Gora, entrenamientos, chat con IA multi-proveedor, mensajería, notificaciones push y panel de administración.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 4 |
| Lenguaje | JavaScript (JSX) + TypeScript (tipos) |
| Estilos | CSS puro con variables (dark theme glassmorphism) |
| Animaciones | Framer Motion |
| Gráficos | Recharts |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + OAuth) |
| IA | Groq · DeepSeek · Gemini (multi-proveedor con fallback) |
| Validación | Zod |
| Mobile | Capacitor (Android) |
| Tests | Vitest (274 unitarios) + Playwright (3 E2E) |
| CI/CD | GitHub Actions + Husky + lint-staged |
| Hosting | Vercel / Netlify (SPA) |

---

## 3. Estructura de Directorios

```
Rugby Orcos/
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Root component, routing, layout
│   ├── index.css                   # CSS design system (536 líneas)
│   ├── supabaseClient.js           # Cliente Supabase
│   ├── types.d.ts                  # 318 líneas de tipos TypeScript
│   │
│   ├── context/                    # State management central
│   │   ├── AuthContext.jsx         # Auth state (session, user, profile)
│   │   ├── ClubContext.jsx         # Orquestador central (50+ props en context)
│   │   ├── ToastContext.jsx        # Notificaciones toast efímeras
│   │   ├── constants.js           # Roles, clubes, divisiones, equipos
│   │   └── hooks/                  # 12 hooks de dominio
│   │       ├── usePermissions.js   # Sistema de permisos por rol/tier
│   │       ├── usePlayers.js       # CRUD jugadores + operaciones
│   │       ├── useSchedule.js      # Agenda / calendario
│   │       ├── useMatches.js       # Fixtures, rivales, próximos partidos
│   │       ├── useEntities.js      # Campeonatos, finanzas, inventario
│   │       ├── useSync.js          # Sincronización Supabase ↔ localStorage
│   │       ├── useClubs.js         # Gestión dinámica de clubes
│   │       ├── useActiveTeam.js    # Equipo activo seleccionado
│   │       ├── useNotifications.js # Notificaciones locales
│   │       ├── useInvitations.js   # Invitaciones a partidos
│   │       ├── useLoans.js         # Préstamos de jugadores
│   │       ├── useDataIO.js        # Import/export JSON
│   │       └── index.js            # Barrel de re-exportación
│   │
│   ├── components/                 # 60+ componentes React
│   │   ├── Admin/                  # AdminPanel, ImportCSVModal
│   │   ├── AIChat/                 # Chat IA (8 archivos)
│   │   ├── Calendario/             # Agenda/Fixture/Futuro/Rivales
│   │   ├── CanchaTactica/          # Pizarra táctica con drag & drop
│   │   ├── Dashboard/              # Métricas, gráficos, bienestar, lesiones
│   │   ├── Estadisticas/           # Stats, demografía, cobertura, KPI
│   │   ├── Finanzas/               # Finanzas e inventario
│   │   ├── MakgoraHub/             # Torneo interno
│   │   ├── Notifications/          # Push y botón de notificaciones
│   │   ├── Roster/                 # Plantilla de jugadores (CRUD completo)
│   │   ├── Skeletons/              # Esqueletos de carga
│   │   ├── TrainingHub/            # Planes de entrenamiento
│   │   └── Tribunal/               # Asistencia, faltas, rankings
│   │
│   ├── engine/                     # Motor de IA y lógica de negocio
│   │   ├── multiProviderCoach.js   # Fachada multi-proveedor IA
│   │   ├── aiProvider.js           # Orquestador de proveedores IA
│   │   ├── aiConfig.js            # Configuración de proveedores
│   │   ├── aiCache.js             # Caché LRU en localStorage
│   │   ├── promptBuilder.js       # Constructor de prompts (español)
│   │   ├── contentFilter.js       # Filtro de contenido rugby
│   │   ├── matchAnalyzer.js       # Análisis de partidos
│   │   ├── assignmentEngine.js    # Generador de planes de entrenamiento
│   │   ├── tacticAssignmentEngine.js # Auto-asignación (algoritmo húngaro)
│   │   └── providers/             # Proveedores IA
│   │       ├── providerFactory.js     # Fábrica OpenAI-compatible
│   │       ├── openaiCompatible.js    # Cliente HTTP base
│   │       ├── groqProvider.js        # Groq
│   │       ├── deepseekProvider.js    # DeepSeek
│   │       └── geminiProvider.js      # Gemini (API nativa)
│   │
│   ├── data/                      # Datos estáticos y acceso a DB
│   │   ├── supabaseApi.js         # Capa de acceso a Supabase (611 líneas)
│   │   ├── exerciseLibrary.js     # Catálogo de ejercicios (835 líneas)
│   │   └── faultExerciseMap.js    # Mapa faltas → ejercicios
│   │
│   ├── schemas/                   # Validación Zod
│   │   └── player.js              # Schemas para todas las entidades
│   │
│   ├── utils/                     # Utilidades
│   │   ├── csvImport.js           # Importación CSV con normalización
│   │   ├── dates.js               # Fechas timezone-safe (Colombia)
│   │   ├── errorHandler.js        # Manejo centralizado de errores
│   │   ├── exportPdf.js           # Impresión de roster/finanzas
│   │   ├── keyboardShortcuts.js   # Atajos de teclado (Ctrl+K, Ctrl+N)
│   │   ├── pushNotifications.js   # Notificaciones push (Capacitor)
│   │   └── useQueryParams.js      # Parámetros URL (búsqueda, filtro)
│   │
│   └── __tests__/                 # 29 archivos de test
│
├── supabase/
│   ├── migrations/                # 13 migraciones SQL
│   │   ├── 00_reset_db.sql
│   │   ├── 01_schema_v4.sql       # Schema principal (494 líneas)
│   │   ├── 02_fix_user_profiles_rls.sql
│   │   ├── 03_admin_reset_staff_password.sql
│   │   ├── 04_match_invitations.sql
│   │   ├── 05_messages.sql
│   │   ├── 06_enhance_invitations.sql
│   │   ├── 07_custom_tactics.sql
│   │   ├── 08_team_members_and_normalize.sql
│   │   ├── 09_fix_makgora_dupes.sql
│   │   ├── 10_push_tokens.sql
│   │   ├── 11_push_trigger.sql
│   │   └── 20250530_unique_constraint_name_birth.sql
│   └── functions/                 # Edge functions Supabase
│
├── android/                       # Proyecto Android (Capacitor)
├── tests/e2e/                     # Tests E2E Playwright
├── public/                        # Assets estáticos
├── package.json
├── vite.config.js
└── .github/workflows/             # CI/CD
```

---

## 4. Arquitectura General

```
┌──────────────────────────────────────────────────────────┐
│  main.jsx → ErrorBoundary                                │
│    └─ AuthProvider (AuthContext.jsx)                     │
│         └─ ClubProvider (ClubContext.jsx)                 │
│              └─ ToastProvider (ToastContext.jsx)          │
│                   └─ App.jsx                             │
│                        ├─ [no auth] → Login              │
│                        ├─ [jugador] → PlayerDashboard    │
│                        └─ [staff]  → Layout completo      │
│                             ├─ Header + NavBar + Sidebar │
│                             ├─ AdminPanel (condicional)  │
│                             ├─ Main tabs (14 paneles)    │
│                             └─ Footer + Modales          │
└──────────────────────────────────────────────────────────┘
```

### Diagrama de Flujo de Datos

```
┌─────────────┐    ┌──────────────────────────────────────┐
│  Supabase   │◄──►│  useSync (pull/push)                  │
│  PostgreSQL │    │  syncStatus: idle|syncing|online|off  │
└─────────────┘    └──────────┬───────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  localStorage       │
                    │  10 keys persistidos│
                    └─────────┬──────────┘
                              │
              ┌───────────────▼────────────────┐
              │  ClubContext (Orquestador)       │
              │  ┌───────────────────────────┐  │
              │  │ usePermissions → hasPerm   │  │
              │  │ usePlayers    → players    │  │
              │  │ useSchedule   → schedule   │  │
              │  │ useMatches    → fixtures   │  │
              │  │ useEntities   → finances   │  │
              │  │ useSync       → syncStatus │  │
              │  │ (+ 7 hooks más)           │  │
              │  └───────────────────────────┘  │
              └───────────────┬────────────────┘
                              │
              ┌───────────────▼────────────────┐
              │  Componentes UI (60+)           │
              │  useContext(ClubContext)         │
              └────────────────────────────────┘
```

### Estrategia Offline-First

1. **Escribe local primero**: cada mutación (add/update/delete) actualiza el state React + localStorage inmediatamente.
2. **Push a Supabase**: cada mutación llama a `pushPlayerToSupabase()` o `pushEntityToSupabase()` para persistir en la nube.
3. **Pull en carga/auth change**: `useSync` descarga todos los datos de Supabase al iniciar sesión o cambiar de usuario, sobrescribiendo localStorage.
4. **Backup atómico**: antes de cada pull, se respaldan las 10 claves de localStorage. Si el pull falla, se hace rollback completo.
5. **Scoping por tier**: Tier 4 (jugador) solo ve sus datos. Tier 2+ con `club_scope` ve datos de su club. Tier 0-1 ve todo.

---

## 5. Sistema de Roles y Permisos

### Jerarquía RPG (7 roles)

| Tier | System Role | RPG Title | Icono | Color |
|---|---|---|---|---|
| 0 | `desarrollador` | Arquitecto del Reino | 🏰 | `#e040fb` |
| 1 | `presidente` | Señor de la Guerra | ⚔️ | `#ffb300` |
| 2 | `promotor` | Comandante de Horda | 🛡️ | `#ff6d00` |
| 3 | `entrenador` | Maestro de Armas | 🏋️ | `#00e676` |
| 3 | `tesorero` | Guardian del Botín | 💰 | `#00b0ff` |
| 3 | `arbitro` | Juez del Coliseo | ⚖️ | `#ffea00` |
| 4 | `jugador` | Guerrero | 👹 | `#9e9e9e` |

### Matriz de Permisos

| Acción | Roles Permitidos |
|---|---|
| `view_all` | desarrollador, presidente |
| `create_users` | desarrollador, presidente, promotor |
| `manage_players` | desarrollador, presidente, promotor, entrenador |
| `manage_finances` | desarrollador, presidente, promotor, tesorero |
| `manage_discipline` | desarrollador, presidente, promotor, entrenador, arbitro |
| `manage_training` | desarrollador, presidente, promotor, entrenador |
| `manage_schedule` | desarrollador, presidente, promotor, entrenador |
| `manage_inventory` | desarrollador, presidente, promotor, entrenador, tesorero |
| `manage_tactics` | desarrollador, presidente, promotor, entrenador |
| `export_import` | desarrollador, presidente, promotor |
| `config_ai` | desarrollador, presidente |
| `admin_panel` | desarrollador, presidente |

- `hasPermission(action)` es la función memoizada expuesta vía ClubContext.
- Si `userTier <= 0` (desarrollador), **bypassea todos los checks** automáticamente.
- `isSuperRole = userTier <= 1` (desarrollador o presidente).

### Roles Súper (SUPER_ROLES)

`['desarrollador', 'presidente']` — pueden acceder al panel de administración, gestionar clubes, configurar IA.

### Botón de Respaldo "Reparar Admin"

Existe un botón oculto en `Header.jsx` (`⚠️ Reparar Admin`) que llama a `forceAdmin()` en `AuthContext.jsx:145` para hacer upsert del perfil del usuario actual como `system_role = 'desarrollador'`. Está desactivado con `{false && (...)}` — para reactivarlo, cambiar la condición según el comentario en el código.

---

## 6. Gestión de Estado (Hooks Principales)

Todos los hooks son inicializados dentro de `ClubProvider` y sus valores se exponen vía `ClubContext`.

### 6.1 AuthContext (`src/context/AuthContext.jsx`)

| Elemento | Descripción |
|---|---|
| `session`, `user` | Sesión y usuario de Supabase Auth |
| `profile` | Fila de `user_profiles` (system_role, club_scope, display_name, is_active) |
| `loading` | `true` hasta que la sesión inicial se resuelve |
| `signIn(email, pass)` | Inicia sesión con Supabase Auth |
| `signUp(email, pass, name, role)` | Registra en Auth + crea perfil en `user_profiles` |
| `signOut()` | Cierra sesión y limpia profile |
| `checkFirstRun()` | `true` si la tabla `user_profiles` está vacía |
| `fetchProfile(userId)` | Carga el perfil desde `user_profiles`, con fallback a `repairProfile` |
| `repairProfile(email, userId)` | Intenta reparar perfil huérfano buscando por display_name |
| `forceAdmin()` | Fuerza upsert del perfil como `desarrollador` |

### 6.2 usePermissions (`src/context/hooks/usePermissions.js`)

Recibe `user` y `profile` de AuthContext. Calcula `userTier` desde `RPG_ROLES`. Retorna `hasPermission(action)`.

### 6.3 usePlayers (`src/context/hooks/usePlayers.js`)

Operaciones CRUD y de dominio sobre jugadores:

| Operación | Descripción |
|---|---|
| `addPlayer(data)` | Crea jugador con ID único, defaults, push a Supabase |
| `updatePlayer(data)` | Actualiza jugador, sanitiza XSS |
| `deletePlayer(id)` | Elimina jugador local y en Supabase |
| `recordAttendance(date, list)` | Procesa asistencia: burpees, conteos, estados |
| `recordMatchInfractions(date, list)` | Penalizaciones post-partido: burpees, tarjetas, suspensiones |
| `redeemPenalty(id, type)` | Redime burpees o conos |
| `recordPhysicalTest(id, date, attrs)` | Registra test físico e historial |
| `recordInjury(id, diagnosis, weeks)` | Marca lesión con fases de recuperación (1-4) |
| `updateInjuryPhase(id, phase)` | Avanza fase de lesión; fase 4 = alta |
| `recordMatchStats(id, stats)` | Registra estadísticas de partido |
| `recordWellness(id, data)` | Registra bienestar diario (últimos 30) |
| `runHiaProtocol(id, symptoms)` | Protocolo de conmoción cerebral (HIA) |
| `updateClothingSizes(id, sizes)` | Actualiza tallas de camiseta/short/medias |
| `updateGymStats(id, stats)` | Actualiza marcas de gimnasio (RM) |
| `logWorkout(id, data)` | Registra sesión de entrenamiento |
| `recordMembershipPayment(id, amount)` | Registra pago de membresía |
| `createPlayerCredentials(id, pass)` | Crea credenciales auth para jugador (RPC) |
| `resetPlayerPassword(id, pass)` | Resetea contraseña de jugador (RPC) |
| `bulkUpdatePosition(ids, posId, posName)` | Asigna posición en lote |

**Seguridad**: `sanitize()` escapa `<` y `>` para prevenir XSS. Los IDs usan UUID v4 con prefijo.

### 6.4 useSchedule (`src/context/hooks/useSchedule.js`)

| Operación | Descripción |
|---|---|
| `addScheduleEvent(event)` | Crea evento(s) con recurrencia (semanal/quincenal/none) |
| `deleteScheduleEvent(id)` | Elimina evento |
| `generateWhatsAppMessage(event)` | Genera texto formateado para compartir por WhatsApp |

### 6.5 useMatches (`src/context/hooks/useMatches.js`)

Tres hooks en un archivo:

| Hook | Entidades | Operaciones |
|---|---|---|
| `useFixtures` | Resultados de partidos pasados | add, delete |
| `useRivals` | Clubes rivales | add, update, delete |
| `useFutureFixtures` | Partidos próximos | add, delete |

### 6.6 useEntities (`src/context/hooks/useEntities.js`)

| Hook | Entidades | Operaciones |
|---|---|---|
| `useChampionships` | Campeonatos | add, delete |
| `useFinances` | Registros financieros | add |
| `useInventory` | Items de inventario | add, update |

### 6.7 useSync (`src/context/hooks/useSync.js`)

**El puente Supabase ↔ localStorage**. Dos hooks:

| Hook | Responsabilidad |
|---|---|
| `useSyncPush(user)` | Convierte datos React → Supabase y hace upsert |
| `useSyncPull(user, tier, profile, ...setters)` | Descarga datos de Supabase → React state |

**useSyncPush**:
- `convertPlayerToSupabase(p)` — mapea camelCase → snake_case, expande anidados.
- `pushPlayerToSupabase(p)` — valida con Zod, convierte, upsert.
- `pushEntityToSupabase(type, record)` — pusher genérico con diccionario de mappers por tipo (schedule, championships, finances, inventory, fixtures, rivals, futureFixtures).

**useSyncPull**:
- Se dispara en mount y cuando cambia `user.id` o `profile.system_role`.
- Backup atómico de 10 keys de localStorage antes del pull.
- Filtra jugadores por tier y club_scope.
- Convierte snake_case → camelCase vía `supabasePlayerToReact()`.
- Transiciones de estado: `idle → syncing → online/offline`.

### 6.8 Otros Hooks

| Hook | Función |
|---|---|
| `useClubs(isSuperRole)` | CRUD de clubes dinámicos (solo super roles) |
| `useActiveTeam()` | Equipo activo persistido en localStorage |
| `useNotifications()` | `sendLocalNotification`, `scheduleReminder` |
| `useInvitations(user)` | CRUD de invitaciones a partidos |
| `useLoans(user)` | CRUD de préstamos de jugadores (Mak'Gora) |
| `useDataIO(allData, ...setters)` | `exportData()` y funciones `importData*()` |

---

## 7. Componentes Principales

### 7.1 App.jsx — Layout y Routing

- **Sin router externo**: navegación por `activeTab` (string), controlado desde `Sidebar`.
- **Auth gate**: si no autenticado → `Login`. Si es `jugador` → `PlayerDashboard`. Staff → layout completo.
- **14 pestañas**: Dashboard, Roster, Estadísticas, CanchaTactica, Tribunal, AwardsHall, MakgoraHub, Calendario, Invitaciones, Finanzas, TrainingHub, Messages, AIChat, Rivales.
- **Modales globales**: Settings (config IA), ImportCSV, Announcements.
- **Atajos**: `Ctrl+K` → buscar jugador, `Ctrl+N` → añadir jugador.
- **Push navigation**: listener `orcos:navigate` para deep-linking desde notificaciones.

### 7.2 Header.jsx

Barra superior glass-panel con:
- Logo, título, subtítulo con nombre + rol RPG del usuario.
- Indicador de conexión: ⏳ Conectando / 🔄 Sincronizando / ☁️ Online / 📱 Offline.
- Botón "⚠️ Reparar Admin" (oculto, respaldo).
- Selector de vista (General / Mak'Gora).
- Selector de división o equipo Mak'Gora.
- Botones: Admin, Notificaciones, IA, Respaldar, Cargar, +CSV, Salir.

### 7.3 Sidebar.jsx

Drawer lateral (270px) con 4 grupos colapsables:
- **JUGADORES**: Dashboard, Roster, Estadísticas
- **CLUB**: Agenda, Finanzas, Entrenamientos, Tribunal
- **COMPETICIÓN**: Mak'Gora, Pizarra Táctica, Salón de la Fama
- **COMUNICACIÓN**: Invitaciones, Mensajes, IA

### 7.4 Login.jsx

Login/registro con:
- Soporte para email o username (busca en `players` por username).
- Modo "first run" cuando `user_profiles` está vacío.
- Registro crea cuenta en Supabase Auth + perfil en `user_profiles`.

### 7.5 Roster (Plantilla)

Componente más complejo. Sub-componentes:
- `RosterControls`: búsqueda, filtro Mak'Gora, añadir, imprimir, modo bulk.
- `PlayerCard`: tarjeta visual con nombre, posición, dorsal, estado, badges.
- `PlayerDetail`: modal con pestañas de atributos, historial, lesiones, gimnasio, tallas.
- `AddPlayerModal`, `EditPlayerModal`: formularios de creación/edición.
- `DeleteConfirmModal`: confirmación de eliminación.
- `CredentialModal`: crear credenciales de acceso para jugador.
- `ResetPasswordModal`: resetear contraseña.

### 7.6 Dashboard

Panel principal con 13 sub-componentes:
- `MetricsCards`: totales de jugadores (activos, lesionados, suspendidos, inactivos).
- `RadarChart`, `DivisionComparison`: gráficos de composición.
- `ForwardsBacksBalance`: balance forwards/backs.
- `ChampionshipCountdown`: cuenta regresiva a campeonatos (actualización cada 60s).
- `SinBinConsole`: consola de disciplina.
- `WellnessForm`: formulario de bienestar.
- `InjuryReport`: reporte de lesiones.
- `AttendanceTimeline`: línea de tiempo de asistencia.
- `UpcomingEvents`, `RecentMatches`: eventos y partidos recientes.
- `AddChampionshipModal`: crear campeonato.

### 7.7 Calendario

4 tabs: Agenda, Fixture, Próximos, Rivales.
- `AgendaTab`: eventos con recurrencia (semanal/quincenal), recordatorios, vista semanal.
- `FixtureTab`: resultados de partidos, centro de partido (MatchCenter), récords de temporada.
- `FutureTab`: partidos programados.
- `Rivales`: gestión de clubes rivales.

### 7.8 Tribunal

3 tabs:
- `ControlTab`: pase de lista con estados (presente, tarde, ausente justificado/injustificado).
- `FaultBookTab`: registro de infracciones con penalizaciones automáticas.
- `RankingsTab`: rankings del clan (MVP, tries, tackles, mazmorra, honor).

### 7.9 CanchaTactica

Pizarra táctica interactiva con drag & drop:
- 3 formaciones: Union 15s, Seven, League 13s.
- `PitchField`: campo visual con nodos de posición arrastrables.
- `BenchPanel`: banca de suplentes.
- `StrategyNotes`: notas tácticas.
- `PlayerSelectModal`: selector de jugador por posición.
- Auto-asignación: algoritmo húngaro para asignación óptima global.
- `SaveTacticModal`: guardar/cargar tácticas personalizadas.

### 7.10 MakgoraHub

Torneo interno con:
- `TeamsGrid`: 6 equipos Mak'Gora (Orcos, Cuervos, Trolls, Gárgolas, Pitbull, Búffalos).
- `TournamentList`: CRUD de torneos con generación automática de fixture.
- `FixtureList`, `StandingsTable`: partidos y tabla de posiciones.
- `LoanList`: préstamos de jugadores entre equipos.

### 7.11 TrainingHub

3 tabs:
- `PlanTab`: genera plan inteligente basado en posición + faltas de partido.
- `PlayersTab`: rutinas por jugador, vinculables a eventos de agenda.
- `CatalogTab`: catálogo completo de 30+ ejercicios (campo, gimnasio, recuperación, prevención).

### 7.12 Finanzas

2 tabs:
- `FinanceTab`: ledger de ingresos/gastos, resumen por categoría, membresías.
- `InventoryTab`: inventario de equipamiento con custodio y estado.

### 7.13 AIChat

Chat con IA multi-proveedor:
- `ModeTabs`: modos General, Táctico, Reglas, Árbitro.
- `MessageList`: historial de chat con streaming de tokens en tiempo real.
- `AnalysisPanel`: análisis de partido (usa `matchAnalyzer.js`).
- `ConfigWarning`: aviso si no hay proveedor configurado.
- `ChatInput`: entrada de texto con preguntas rápidas predefinidas.

### 7.14 Messages

Chat en tiempo real (Supabase Realtime):
- Lista de conversaciones con badges de no leídos.
- Envío de texto + archivos adjuntos (WebP auto-comprimido, 5MB max).
- Canal especial `announcement` para anuncios broadcast a todos.

### 7.15 PlayerDashboard

Vista simplificada para rol `jugador`:
- Tarjeta de identidad con atributos RPG.
- Barras de progreso (Fuerza, Velocidad, Resistencia, Técnica).
- Badges de batalla (Iron Orc, Green Wall, Demolisher, Gladiator MVP).
- Estadísticas de combate.
- Membresía del clan.
- Check-in de bienestar (sueño, dolor, estrés 1-5).

### 7.16 Otros Componentes

| Componente | Función |
|---|---|
| `AdminPanel` | Panel admin (gestión de usuarios + clubes dinámicos) |
| `UserManagement` | CRUD de usuarios staff (crear, cambiar rol, activar/desactivar, reset password) |
| `AwardsHall` | Salón de la fama con 36 premios (15 de honor + 21 de taberna), top 3 por premio |
| `Invitaciones` | Gestión de invitaciones a rivales, compartir link/cancelar |
| `MatchInvitation` | Página pública para que rivales respondan invitación y registren jugadores |
| `Settings` | Configuración multi-proveedor IA (API keys, streaming, caché) |
| `AnnouncementModal` | Modal de anuncios no leídos (paginado) |
| `BirthdayCelebration` | Detección de cumpleaños + confetti + anuncio automático |
| `ErrorBoundary` | Class component que captura errores y muestra pantalla de recuperación |
| `Toast` | Contenedor de notificaciones toast (éxito, error, warning, info) |
| `AnimatedModal` | Wrapper reutilizable con framer-motion |
| `AuthCallback` | Maneja redirect OAuth de Supabase |
| `NavBar` | Botón hamburguesa |
| `Footer` | Footer simple |

---

## 8. Base de Datos (Supabase PostgreSQL)

### 8.1 Tablas Principales

| Tabla | Descripción | Columnas clave |
|---|---|---|
| `players` | Jugadores (core) | 50+ columnas: atributos, lesiones, gym, tallas, posición, estado, rol |
| `user_profiles` | Perfiles de usuario staff | user_id (FK auth.users), system_role, club_scope, display_name, is_active |
| `schedule_events` | Eventos de agenda | título, fecha, hora, ubicación, tipo, recurrencia |
| `fixtures` | Resultados de partidos | rival, marcador, fecha, trys, conversiones, tackles |
| `future_fixtures` | Partidos programados | rival, fecha, hora, ubicación |
| `rivals` | Clubes rivales | nombre, colores, contacto, notas |
| `championships` | Campeonatos | nombre, fecha, días restantes |
| `finances` | Registros financieros | tipo (ingreso/gasto), monto, categoría, descripción |
| `inventory` | Inventario | item, cantidad, custodio, estado |
| `messages` | Mensajería | sender_id, receiver_id, contenido, channel, attachments |
| `match_invitations` | Invitaciones a partidos | token, status, respuesta, future_fixture_id |
| `guest_players` | Jugadores invitados | nombre, dorsal, posición |
| `custom_tactics` | Tácticas guardadas | lineup JSONB, notas, formación |
| `push_tokens` | Tokens push (FCM/APNs) | token, plataforma |
| `announcement_views` | Vistas de anuncios | user_id, message_id |

### 8.2 Tablas Mak'Gora

| Tabla | Descripción |
|---|---|
| `makgora_teams` | 6 equipos del torneo interno |
| `tournaments` | Torneos con fechas y estado |
| `tournament_teams` | Equipos participantes por torneo |
| `tournament_matches` | Partidos del torneo con resultados |
| `tournament_standings` | Tabla de posiciones |
| `tournament_player_stats` | Estadísticas individuales |
| `player_loans` | Préstamos de jugadores entre equipos |

### 8.3 Tablas Hijas de players

| Tabla | FK | Propósito |
|---|---|---|
| `attribute_history` | player_id | Historial de tests físicos |
| `injury_log` | player_id | Registro de lesiones con fases |
| `attendance` | player_id | Asistencia diaria |
| `player_attendance_summary` | player_id | Resumen agregado |
| `penalties` | player_id | Penalizaciones (burpees, conos) |
| `infractions` | player_id | Infracciones disciplinarias |
| `match_stats` | player_id | Estadísticas por partido |
| `wellness_logs` | player_id | Registros de bienestar |
| `hia_assessments` | player_id | Evaluaciones HIA (conmoción) |
| `workout_logs` | player_id | Sesiones de entrenamiento |

### 8.4 Funciones PostgreSQL (RPC)

| Función | Propósito |
|---|---|
| `is_admin(user_id)` | Verifica si un usuario es admin |
| `generate_player_username()` | Genera username único para jugador |
| `admin_create_player_credentials()` | Crea auth.users + credenciales |
| `admin_reset_player_password()` | Resetea contraseña de jugador |
| `admin_reset_staff_password()` | Resetea contraseña de staff |
| `update_standing()` | Actualiza tabla de posiciones |

### 8.5 Row Level Security (RLS)

- `user_profiles` tiene RLS **deshabilitado** (migración `02_fix_user_profiles_rls.sql`).
- Resto de tablas: SELECT público, INSERT/UPDATE/DELETE requiere ownership o admin.
- Funciones helper: `apply_rls_with_user_id()`, `apply_rls_child()`, `apply_rls_makgora()`.

---

## 9. Motor de IA

### 9.1 Proveedores

| Proveedor | Implementación | Modelo |
|---|---|---|
| **Groq** | `providerFactory.js` → `openaiCompatible.js` | LLaMA 3 70B |
| **DeepSeek** | `providerFactory.js` → `openaiCompatible.js` | DeepSeek Chat |
| **Gemini** | `geminiProvider.js` (API nativa Google) | Gemini 1.5 Flash |

### 9.2 Flujo de Chat

```
User Input → contentFilter.isRugbyRelated()
  → aiCache.getCachedResponse() (cache hit?)
  → aiProvider.chat()
      → Itera PROVEEDORES en orden (Groq → DeepSeek → Gemini)
      → Verifica rate limits (localStorage por provider/model/día)
      → promptBuilder.buildSystemPrompt(mode) + buildChatContext()
      → provider.call() → respuesta
      → aiCache.setCachedResponse()
      → sanitizeAndFormatAI() → HTML
```

### 9.3 Funcionalidades IA

| Funcionalidad | Archivo | Descripción |
|---|---|---|
| Chat general/táctico/reglas | `aiProvider.js` | Conversación con contexto del equipo |
| Enriquecimiento de plan | `aiProvider.js:enrichPlan()` | Sugiere ejercicios adicionales vía IA |
| Análisis de partido | `matchAnalyzer.js` | Analiza fixture con IA → fortalezas, áreas de mejora, jugador destacado |
| Filtro de contenido | `contentFilter.js` | Puntaje ponderado de keywords rugby, bloqueo de temas prohibidos |

### 9.4 Configuración

- API keys se almacenan en `localStorage` (clave `orcos_settings_keys`).
- Rate limits diarios por proveedor.
- Caché LRU: 50 entradas, TTL 60 minutos.
- Streaming de tokens: toggle on/off en Settings.
- BroadcastChannel para sincronizar rate limits entre pestañas.

---

## 10. Sistema de Sincronización

### 10.1 Flujo de Escritura (Push)

```
Componente → hook (usePlayers/useSchedule/etc.)
  → setState + localStorage.setItem()
  → pushPlayerToSupabase() o pushEntityToSupabase()
      → convertPlayerToSupabase() (mapeo camelCase → snake_case)
      → playerSchema.parse() (validación Zod)
      → apisupabase.upsertPlayer()
```

### 10.2 Flujo de Lectura (Pull)

```
useSync() mount / user.id cambia
  → backup localStorage (10 keys)
  → apisupabase.fetchAll()
      → Filtra por tier (jugador solo ve sus datos)
      → supabasePlayerToReact() (snake_case → camelCase + JSONB expand)
  → setPlayers(), setSchedule(), setFixtures(), ...
  → syncStatus → 'online' | 'offline' (si falla, rollback)
```

### 10.3 Claves de localStorage

| Clave | Entidad |
|---|---|
| `orcos_players` | Jugadores |
| `orcos_schedule` | Agenda |
| `orcos_championships` | Campeonatos |
| `orcos_finances` | Finanzas |
| `orcos_inventory` | Inventario |
| `orcos_fixtures` | Fixtures |
| `orcos_rivals` | Rivales |
| `orcos_future_fixtures` | Próximos partidos |
| `orcos_view_mode` | Modo de vista |
| `orcos_division_view` | División seleccionada |

---

## 11. Lógica de Negocio Destacada

### 11.1 Penalizaciones Automáticas

- **Tarde**: 15 burpees.
- **Falta injustificada**: 50 burpees + sanción de conos.
- **Falta leve en partido**: 10 burpees.
- **Tarjeta amarilla**: 50 burpees.
- **Tarjeta roja**: 100 burpees + suspensión automática (`activo = false`).
- **Redención**: jugador puede redimir burpees (se resetean a 0) y conos; si estaba suspendido, se reactiva.

### 11.2 Protocolo HIA (Head Injury Assessment)

1. Staff ejecuta `runHiaProtocol(playerId, symptomsDetected)`.
2. Si hay síntomas → `lesionado`, 14 días de recuperación, notificación.
3. Siempre se registra la evaluación en `hiaAssessments`.

### 11.3 Sistema de Lesiones con Fases

- Fase 1-4: progresión de recuperación.
- `updateInjuryPhase(id, phase)`: avanza fase.
- Fase 4 = alta médica: limpia `injuryLog`, restaura `activo`.

### 11.4 Membresías

- Cada jugador tiene `memberships` con tracking de pagos.
- `recordMembershipPayment(playerId, amount)`: registra pago, actualiza saldo.
- Monto por defecto: 10,000 COP.
- Cross-cutting: actualiza también el ledger financiero.

### 11.5 Recurrencia de Eventos

- `none`: evento único.
- `semanal`: 4 ocurrencias semanales.
- `quincenal`: 2 ocurrencias con 14 días de intervalo.
- Cada ocurrencia tiene su propio ID, agrupadas por `recurrenceGroup`.

### 11.6 Algoritmo Húngaro (Táctica)

`tacticAssignmentEngine.js`:
1. Define requisitos por posición con pesos (fuerza, velocidad, resistencia, técnica).
2. `scorePlayerForPosition()`: score 0-100 combinando atributos base + bonus posición + rendimiento reciente.
3. Convierte scores a matriz de costos.
4. Ejecuta algoritmo húngaro para asignación óptima global (mínimo costo).

### 11.7 Generación de Plan de Entrenamiento

`assignmentEngine.js`:
1. Analiza posición del jugador (forward/back/capitán/entrenador).
2. `analyzeMatchFaults()`: examina últimos 3 partidos buscando 12 tipos de faltas.
3. Mapea faltas → ejercicios correctivos (vía `faultExerciseMap.js`).
4. Calcula pesos de gimnasio basados en 1RM.
5. Excluye ejercicios completados en últimos 14 días.
6. Ajusta por fase de lesión.

---

## 12. Esquemas de Validación (Zod)

`src/schemas/player.js` define schemas para todas las entidades:

| Schema | Entidad |
|---|---|
| `playerSchema` | Jugador (116 líneas, el más complejo) |
| `scheduleEventSchema` | Evento de agenda |
| `financeRecordSchema` | Registro financiero |
| `fixtureSchema` | Resultado de partido |
| `futureFixtureSchema` | Partido programado |
| `rivalSchema` | Club rival |
| `championshipSchema` | Campeonato |
| `inventoryItemSchema` | Item de inventario |

`playerSchema` incluye schemas anidados para: `attributes`, `attendance`, `penalties`, `contact`, `clothingSizes`, `gymStats`, `injuryLog`, `matchStats`, `wellnessLogs`, `workoutLogs`, `memberships`, `meta`.

---

## 13. Utilidades

| Utilidad | Función |
|---|---|
| `csvImport.js` | Parseo CSV con normalización inteligente (categorías, EPS, docs, roles, dedup) |
| `dates.js` | Fechas timezone-safe con locale `es-CO`, timezone `America/Bogota` |
| `errorHandler.js` | `handleError(context, error, options)` con soporte para toast, silent, rethrow |
| `exportPdf.js` | `printRoster()` y `printFinances()` — abre ventana e imprime en HTML |
| `keyboardShortcuts.js` | `Ctrl+K` buscar jugador, `Ctrl+N` añadir jugador |
| `pushNotifications.js` | Integración Capacitor: registra token FCM/APNs, maneja tap navigation |
| `useQueryParams.js` | Sincroniza `?q=` y `?makgora=` con URL sin recargar |

---

## 14. Testing

### 14.1 Unit Tests (Vitest — 274 tests, 28 archivos)

| Categoría | Archivos |
|---|---|
| Componentes (14) | App, Dashboard, Login, Roster, Calendario, Finanzas, TrainingHub, AIChat, Tribunal, AwardsHall, MakgoraHub, PlayerDashboard, Components, MatchInvitation, CanchaTactica |
| Contexto (5) | ClubContext, ClubContextCRUD, AuthContext, ToastContext |
| Hooks (3) | usePlayers, useSchedule, useSync |
| Engine (3) | multiProviderCoach, contentFilter, providerFactory |
| Utilidades (3) | supabaseApi, env, exportPdf |

### 14.2 E2E Tests (Playwright — 3 archivos)

| Archivo | Flujo |
|---|---|
| `navigation.spec.ts` | Navegación por tabs |
| `login.spec.ts` | Flujo de login/registro |
| `invitation.spec.ts` | Página pública de invitación |

### 14.3 Cobertura

Configurada en vite.config.js: V8 provider, umbrales bajos (líneas 4%, ramas 2%, funciones 3%, statements 4%).

---

## 15. Mobile (Capacitor)

- Proyecto Android en `android/`.
- Plugins: `@capacitor/push-notifications`, `@capacitor/local-notifications`.
- `pushNotifications.js` maneja registro de token y navegación deep-link.
- Service worker (`/sw.js`) para soporte PWA.

---

## 16. CI/CD

- **Husky** + **lint-staged**: ESLint + Vitest related en pre-commit.
- **GitHub Actions** (`.github/workflows/`): CI pipeline.
- **Vite build**: output en `dist/`.

---

## 17. CSS Design System

536 líneas en `src/index.css`:

- **Tema**: dark glassmorphism (fondo `#07090e` con grid pattern).
- **Variables CSS**: colores primarios (verde, dorado, rojo, azul) con variantes glow.
- **Componentes**: `.glass-panel` (backdrop-blur + borde sutil), `.btn-neon` (gradiente verde + glow), `.btn-outline` (transparente con borde), `.badge-*` (estados).
- **Barras RPG**: `.rpg-stat` / `.rpg-stat-bar` con gradientes por atributo.
- **Animaciones**: `slideUp`, `fadeIn`, `pulseGlow`, `shimmer` (skeleton), `fadeOut`, `slideDown`.
- **Layout**: `.grid-cards` (auto-fill responsive), `.modal-overlay`, `.tabs-navigation`.
- **Tipografía**: Inter (cuerpo), Outfit (títulos, neón).

---

## 18. Flujos Clave

### 18.1 Login / Registro

```
Login.jsx
  ├─ email → signIn(email, pass) → Supabase Auth
  └─ username → busca en players → obtiene email → signIn
       └─ onAuthStateChange → fetchProfile(userId)
            ├─ user_profiles encontrado → setProfile
            └─ no encontrado → repairProfile (busca por display_name)
                 └─ falla → profile = null → "Sin rango" en header
```

### 18.2 Registro (First Run)

```
Login.jsx (isFirstRun = true)
  → signUp(email, pass, name) → Supabase Auth
  → upsert user_profiles (system_role = 'desarrollador')
  → signIn(email, pass)
```

### 18.3 CRUD de Jugador

```
Roster → AddPlayerModal → addPlayer(data)
  → setPlayers([...players, newPlayer])
  → localStorage.setItem('orcos_players', ...)
  → pushPlayerToSupabase(newPlayer)
      → convertPlayerToSupabase()
      → playerSchema.parse()
      → apisupabase.upsertPlayer()
```

### 18.4 Sincronización

```
App carga → AuthProvider monta → fetchProfile
  → ClubProvider monta → useSync(user, userTier, profile, ...setters)
      → syncStatus = 'syncing'
      → apisupabase.fetchAll(userTier, profile)
      → setPlayers(data.players)
      → setSchedule(data.schedule)
      → ...
      → syncStatus = 'online'
```

### 18.5 Chat IA

```
AIChat → handleSend(message)
  → contentFilter.isRugbyRelated(message)
  → aiCache.getCachedResponse(model, mode, message)
  → aiProvider.chat(message, mode, activeProvider)
      → promptBuilder.buildSystemPrompt(mode)
      → promptBuilder.buildChatContext(fixtures, players, ...)
      → provider.call(systemPrompt + context + message)
  → sanitizeAndFormatAI(response)
  → aiCache.setCachedResponse(model, mode, message, response)
```

---

## 19. Migraciones de Base de Datos

13 migraciones en `supabase/migrations/`:

| # | Archivo | Propósito |
|---|---|---|
| 00 | `reset_db.sql` | Limpieza total |
| 01 | `schema_v4.sql` | Schema completo (494 líneas) |
| 02 | `fix_user_profiles_rls.sql` | Deshabilita RLS en user_profiles |
| 03 | `admin_reset_staff_password.sql` | RPC para reset de password staff |
| 04 | `match_invitations.sql` | Tablas de invitaciones + guest_players |
| 05 | `messages.sql` | Tabla de mensajería + announcement_views |
| 06 | `enhance_invitations.sql` | Mejoras a invitaciones |
| 07 | `custom_tactics.sql` | Tácticas personalizadas + posiciones rugby |
| 08 | `team_members_and_normalize.sql` | Normalización de equipos |
| 09 | `fix_makgora_dupes.sql` | Corrección de duplicados Mak'Gora |
| 10 | `push_tokens.sql` | Tokens de notificaciones push |
| 11 | `push_trigger.sql` | Trigger para notificaciones |
| 12 | `20250530_unique_constraint_name_birth.sql` | Constraints de unicidad |

---

## 20. Resumen de Archivos por Capa

| Capa | Archivos | Líneas (aprox) |
|---|---|---|
| Entry/App | 4 | 400 |
| Context/Hooks | 12 | 1,800 |
| Components | 60+ | 8,000 |
| Engine IA | 14 | 1,500 |
| Data | 3 | 1,600 |
| Schemas | 1 | 200 |
| Utils | 8 | 800 |
| CSS | 1 | 536 |
| Types | 1 | 318 |
| Tests | 29 | 3,000 |
| Migrations | 13 | 1,200 |
| **Total** | **~150** | **~19,000** |

---

## 21. Puntos de Atención

### Seguridad
- `sanitize()` en `usePlayers.js` escapa `<` y `>` para XSS básico.
- Roles y permisos aplicados en frontend vía `hasPermission()`. RLS en Supabase como segunda capa.
- API keys de IA almacenadas en `localStorage` (cliente), no en servidor.
- `forceAdmin()` podría considerarse un riesgo si se reactiva sin control.

### Deuda Técnica Potencial
- localStorage como fuente de verdad puede causar divergencia con Supabase si hay múltiples dispositivos.
- No hay router (React Router), navegación por string `activeTab` — no soporta deep-linking nativo.
- `ClubContext` expone 50+ propiedades, acoplado a todos los hooks.
- `useEffect` en `useSync` se dispara frecuentemente — posible sobre-sincronización.

### Testing
- 274 tests unitarios pasan. Cobertura baja configurada (4% umbral) — cobertura real probablemente mayor.
- 3 tests E2E cubren flujos críticos (login, navegación, invitación).
- No hay tests de integración Supabase.

---

*Documento generado por auditoría automática con CodeGraph.*  
*Última actualización: 2026-06-01 · Commit: `e53c52e`*
