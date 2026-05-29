# RUGBY ORCOS NEGROS — Reino Manager v4.0

<p align="center">
  <img src="assets/orcos_logo.png" alt="Rugby Orcos Shield" width="180" />
</p>

Aplicacion Web Progresiva (PWA) para la gestion integral del club de rugby **Orcos Negros**. Tematica RPG de fantasia epica con roles, torneos, entrenamientos, finanzas y mas.

---

## Stack Tecnologico

| Categoria | Tecnologia |
|-----------|-----------|
| Frontend | React 18 + Vite 4 |
| Backend | **Supabase** (PostgreSQL, Auth, API, RLS) |
| Auth | Email/Password + Username para Guerreros |
| Mobile | Capacitor (Android APK) + PWA (iOS Safari) |
| IA | Gemini / Groq / DeepSeek (multi-provider) |
| Estilos | CSS puro con Custom Properties (glassmorphism + neon) |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) |

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
│   │   ├── Dashboard.jsx        # Panel principal (metricas, HIA, Sin-Bin, wellness)
│   │   ├── Roster.jsx           # CRUD jugadores, atributos RPG, insignias, credenciales
│   │   ├── CanchaTactica.jsx    # Pizarra con 11 formaciones + drag-and-drop
│   │   ├── Tribunal.jsx         # Asistencia, infracciones, rankings
│   │   ├── Calendario.jsx       # Agenda, fixtures, match center, rivals
│   │   ├── Finanzas.jsx         # Caja chica, membresias, inventario
│   │   ├── TrainingHub.jsx      # Plan inteligente, rutinas, catalogo
│   │   ├── AIChat.jsx           # Chat tactico multi-proveedor IA
│   │   ├── Login.jsx            # Login unificado (email/username + password)
│   │   ├── PlayerDashboard.jsx  # Vista personal del Guerrero
│   │   ├── UserManagement.jsx   # Admin de usuarios y roles
│   │   ├── Settings.jsx         # Configuracion IA
│   │   ├── Rivales.jsx          # Gestion de equipos rivales
│   │   ├── AuthCallback.jsx     # Callback de autenticacion
│   │   ├── ErrorBoundary.jsx    # Captura de errores React
│   │   └── Toast.jsx            # Componente toast
│   ├── data/
│   │   ├── supabaseApi.js       # Capa API Supabase + conversor de datos
│   │   ├── exerciseLibrary.js   # 44 ejercicios de rugby
│   │   └── faultExerciseMap.js  # Mapa fallos → ejercicios correctivos
│   └── engine/
│       ├── assignmentEngine.js  # Motor de reglas para planes de entrenamiento
│       ├── geminiCoach.js       # Integracion IA (Gemini/Groq/DeepSeek)
│       ├── aiProvider.js        # Router multi-proveedor IA
│       ├── aiConfig.js          # Configuracion de proveedores IA
│       ├── aiCache.js           # Cache de respuestas IA
│       ├── contentFilter.js     # Filtro rugby-only
│       ├── matchAnalyzer.js     # Analisis tactico de partidos
│       ├── promptBuilder.js     # Constructor de prompts con contexto
│       └── providers/           # Gemini, Groq, DeepSeek, OpenAI Compatible
├── supabase/migrations/         # Migraciones SQL
│   ├── 001_schema.sql           # 18 tablas base + RLS
│   ├── 002_users_roles.sql      # user_profiles, makgora_teams, tournaments, loans
│   ├── 003_fix_rls.sql          # Fix recursion infinita en politicas RLS
│   ├── 004_fix_create_user.sql  # (DEPRECATED) Funcion admin_create_user
│   ├── 005_auto_profile_trigger.sql # Trigger auto-perfil al crear usuario
│   ├── 006_player_auth.sql      # Username + auto-generacion para guerreros
│   └── 007_player_auth_functions.sql # RPC para credenciales y reset password
├── seed/
│   └── seed-csv.mjs             # Importador CSV → Supabase (62 jugadores)
├── public/
│   ├── manifest.json            # PWA manifest
│   └── sw.js                    # Service Worker (offline)
├── checklist.md                 # Plan de ejecucion detallado
├── vercel.json                  # Config SPA fallback para Vercel
├── vite.config.js               # Config Vite (puerto 3000)
├── capacitor.config.json        # Config Capacitor Android
└── .env                         # Variables de entorno (NO COMMITEAR)
```

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

## Modulos

### Dashboard
Panel de control con metricas del squad, protocolo HIA (conmociones), temporizador Sin-Bin, wellness check-in, proximos eventos, partidos recientes, cuenta regresiva de campeonatos, lesionados.

### Roster
CRUD completo de jugadores con atributos RPG (Fuerza, Velocidad, Resistencia, Tecnica) en escala 0-100. Historial fisico con grafico SVG. Lesiones con 4 fases de kinesiologia. Gimnasio con 1RM. Insignias automaticas. Tallas de uniforme. Protocolo HIA. **Forjar Credenciales** para dar acceso al Guerrero a su perfil.

### Pizarra Tactica
Campo de rugby interactivo con 11 formaciones. Nodos arrastrables con posiciones tacticas. Asignacion de jugadores del roster. Banco de suplentes. Orientacion horizontal/vertical. 3 tamanos. Notas tacticas con auto-guardado.

### Tribunal Disciplinario
Control de asistencia con penitencias automaticas (burpees + conos). Infracciones de partido. Redencion de deudas fisicas. Rankings: Honor, MVPs, Tries, Tackles, Penitencias.

### Agenda
Eventos con recurrencia semanal/quincenal. WhatsApp formatter para convocatorias. Fixture y resultados. Match Center con stats por jugador. Gestion de equipos rivales. Proximos partidos.

### Finanzas
Caja chica (ingresos/egresos). Membresias con abonos parciales ($10,000 COP base). Inventario de implementos con custodios y estados.

### Entrenamientos
Plan inteligente generado por motor de reglas + IA. Rutinas por posicion (13 predefinidas). Catalogo de 44 ejercicios. Checkboxes de completado. Calculo de cargas basado en 1RM.

### IA Coach
Chat tactico multi-proveedor (Gemini 2.0 Flash, Groq, DeepSeek) con failover automatico. 3 modos: General, Tactico, Reglas. Rate limit diario. Cache de respuestas. Analisis de partidos.

---

## Flujo de Login

### Staff (Arquitecto, Senor, Comandante, Maestro, Guardian, Juez)
1. Ingresa su **email** + contrasena
2. Supabase Auth valida credenciales
3. Se carga su `user_profile` con el rol RPG
4. Accede al panel completo segun sus permisos

### Guerrero (Jugador)
1. Ingresa su **nombre de usuario** (ej: `freyder.andres`) + contrasena
2. La app busca el username en `players`, obtiene su email interno
3. Supabase Auth valida con ese email
4. Accede a su **PlayerDashboard** personal (solo lectura + wellness)

### Fundar Reino (primer uso)
1. Si `user_profiles` esta vacio, aparece el boton "Fundar un Nuevo Reino"
2. Email + password + nombre → se crea el primer Arquitecto del Reino
3. Los demas usuarios los crea el Arquitecto desde Admin > Miembros

---

## PlayerDashboard — Vista del Guerrero

Cuando un jugador inicia sesion, ve su panel personal con:

- **Atributos RPG**: barras de Fuerza, Velocidad, Resistencia, Tecnica
- **Insignias**: Orco de Hierro, Muralla Verde, Demoledor, Gladiador MVP
- **Estadisticas**: Tries, Conversiones, Tackles, Recuperaciones, MVPs, Partidos jugados
- **Membresia**: barra de progreso de pagos
- **Wellness Check-in**: puede registrar sueno, dolor muscular y estres (escala 1-5)
- **Ultimas Rutinas**: ejercicios asignados por el Maestro de Armas

---

## Seguridad

### Row Level Security (RLS)
Todas las tablas en Supabase tienen politicas RLS. Cada usuario solo ve sus propios datos mediante `user_id = auth.uid()`.

### Autenticacion
- Staff: email + password via Supabase Auth
- Guerreros: username → email interno → Supabase Auth
- Sin magic link, sin OTP — contraseña tradicional

### Manejo de Contraseñas
- Staff: puede restablecer via email (Supabase reset flow)
- Guerrero sin email: el Admin restablece desde Roster > "Restablecer Pass"
- El Admin puede forjar credenciales para cualquier jugador

---

## Base de Datos — 18 Tablas

| Tabla | Funcion |
|-------|---------|
| `players` | Jugadores con atributos RPG, username, datos personales |
| `user_profiles` | Roles RPG, scopes de club/division |
| `makgora_teams` | Equipos del torneo Mak'Gora (6 base) |
| `tournaments` | Ediciones de torneo Mak'Gora |
| `tournament_teams` | Equipos participantes por edicion |
| `tournament_matches` | Partidos del torneo |
| `tournament_standings` | Tabla de posiciones |
| `tournament_player_stats` | Stats individuales Mak'Gora |
| `player_loans` | Prestamos entre equipos |
| `attribute_history` | Progresion de atributos RPG |
| `injury_log` | Lesiones (4 fases kinesiologia) |
| `attendance` | Asistencias individuales |
| `player_attendance_summary` | Resumen denormalizado |
| `penalties` | Penitencias (burpees, conos) |
| `infractions` | Infracciones de partido |
| `match_stats` | Stats por jugador por partido |
| `wellness_logs` | Check-ins de bienestar |
| `hia_assessments` | Protocolo HIA conmociones |
| `workout_logs` | Rutinas de entrenamiento |
| `schedule_events` | Agenda y convocatorias |
| `championships` | Campeonatos e hitos |
| `finances` | Caja chica y transacciones |
| `inventory` | Inventario de implementos |
| `fixtures` | Resultados de partidos |
| `rivals` | Equipos rivales |
| `future_fixtures` | Proximos partidos |
| `lineups` | Alineaciones tacticas |

---

## App Movil

### Android (APK nativo)
```bash
npm run build
npm run cap:sync
npm run cap:open-android   # Android Studio > Build APK
```
Gratis, sin Google Play (APK directo). Para Play Store: $25 unico.

### iOS (PWA gratuita)
Abrir Safari > ir a la URL > Compartir > "Agregar a pantalla de inicio". Funciona como app nativa sin App Store ni $99 anual.

---

## Setup Local

```bash
git clone https://github.com/kentarodva/RugbyOrcos.git
cd RugbyOrcos
npm install
cp .env.example .env
# Editar .env con credenciales de Supabase
npm run dev   # http://localhost:3000
```

### Credenciales de Prueba
| Rol | Usuario | Contrasena |
|-----|---------|-----------|
| Arquitecto del Reino | admin@orcosnegros.com | OrcosAdmin2026! |

---

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Dev server localhost:3000 |
| `npm run build` | Build produccion en dist/ |
| `npm run lint` | ESLint (0 warnings) |
| `npm run cap:sync` | Sincronizar Android |
| `npm run cap:open-android` | Abrir Android Studio |
| `node seed/seed-csv.mjs ruta.csv` | Importar CSV a Supabase |

---

## Estado del Proyecto

| Fase | Tarea | Estado |
|:----:|-------|:------:|
| 0 | Preparacion (Supabase, Vercel, Git) | ✅ |
| 1 | Esquema SQL (18 tablas + RLS) | ✅ |
| 2 | Auth email/password + Login + Fundar Reino | ✅ |
| 3 | Roles RPG + Permisos + UserManagement | ✅ |
| 4 | Acceso Guerreros + PlayerDashboard | ✅ |
| 5 | Salon de la Fama + Premios + Certificados | ⬜ |
| 6 | Modo Mak'Gora (torneos, fixture, standings, prestamos) | ⬜ |
| 7 | Deploy final + APK Android | ⬜ |

---

*"En el scrum y en la vida, siempre juntos. Siempre Orcos."*
