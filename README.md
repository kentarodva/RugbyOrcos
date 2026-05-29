# Rugby Orcos Club Manager v3.0

<p align="center">
  <img src="assets/orcos_logo.png" alt="Rugby Orcos Shield" width="180" />
</p>

<p align="center">
  <strong>Aplicacion Web Progresiva (PWA) para la gestion integral de clubes de rugby amateur con tematica RPG de fantasia epica.</strong>
</p>

<p align="center">
  Fuerza, Honor y Tercer Tiempo.
</p>

---

## Stack Tecnologico

| Categoria | Tecnologia | Version |
|-----------|-----------|---------|
| Lenguaje | JavaScript (JSX, ES Modules) | ES2020+ |
| Framework UI | React | 18.2.0 |
| Build Tool | Vite | 4.4.5 |
| Mobile Bridge | Capacitor | 5.0.0 |
| Notificaciones | @capacitor/local-notifications | 5.0.0 |
| Estilos | CSS Puro (Custom Properties) | --- |
| Tipografia | Google Fonts (Inter + Outfit) | --- |
| Backend as a Service | **Supabase** | latest |
| Auth | **Supabase Auth (Magic Link)** | --- |
| Base de Datos | **Supabase PostgreSQL 15+** | --- |
| Cliente DB | @supabase/supabase-js | latest |
| IA | Gemini 2.0 Flash / Groq / DeepSeek | API |
| PWA | Service Worker + Web Manifest | --- |
| Persistencia Local | localStorage | --- |
| Lint | ESLint 8 + plugin React | --- |

## Setup Rapido

```bash
git clone <repo-url>
cd "Rugby Orcos"
npm install
```

### 1. Crear proyecto en Supabase

Registrate en [supabase.com](https://supabase.com), crea un nuevo proyecto y:

1. Ve a **SQL Editor** > ejecuta `supabase/migrations/001_schema.sql`
2. Ve a **Authentication** > **Providers** > deshabilita "Email/Password", habilita "Magic Link"
3. Ve a **Settings** > **API** > copia la URL y la `anon` key

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 3. Configurar redirect URL en Supabase

En **Authentication** > **URL Configuration**, agrega el Site URL de tu app:
- Desarrollo: `http://localhost:3000`
- Produccion: la URL de tu dominio

### 4. Iniciar

```bash
npm run dev     # http://localhost:3000
```

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Dev server en localhost:3000 con HMR |
| `npm run build` | Build produccion en dist/ |
| `npm run lint` | ESLint (max 0 warnings) |
| `npm run cap:sync` | Sincronizar assets con Android |
| `npm run cap:open-android` | Abrir en Android Studio |

## Arquitectura

```
main.jsx
  └── ErrorBoundary
       └── AuthProvider (Supabase Auth - magic link)
            └── ClubProvider (Context - estado global + sync Supabase)
                 └── ToastProvider
                      └── App.jsx
```

### Flujo de Datos

1. **AuthProvider** maneja la sesion via Supabase Auth (magic link sin contrasena)
2. Al autenticarse, **ClubContext** sincroniza desde Supabase → localStorage
3. Toda escritura se persiste en localStorage (offline-first) y se sincroniza en background con Supabase
4. Si no hay internet, la app funciona completamente con datos locales
5. **RLS (Row Level Security)** en Supabase asegura que cada usuario solo ve sus datos

### Entidades (18 tablas en Supabase)

| Tabla | Funcion |
|-------|---------|
| players | Jugadores con atributos RPG, fisicos, medicos |
| attribute_history | Progresion de atributos |
| injury_log | Lesiones con 4 fases de rehab |
| attendance | Asistencias individuales |
| player_attendance_summary | Resumen denormalizado |
| penalties | Penitencias (burpees, conos) |
| infractions | Infracciones de partido |
| match_stats | Stats por jugador por partido |
| wellness_logs | Check-ins de bienestar |
| hia_assessments | Protocolo HIA conmociones |
| workout_logs | Rutinas de entrenamiento |
| schedule_events | Agenda y convocatorias |
| championships | Campeonatos e hitos |
| finances | Caja chica y transacciones |
| inventory | Inventario de implementos |
| fixtures | Resultados de partidos |
| rivals | Equipos rivales |
| future_fixtures | Proximos partidos |
| lineups | Alineaciones tacticas |

## Modulos Principales

### Dashboard
Panel de control con metricas, protocolo HIA, temporizador Sin-Bin, wellness check-in, proximos eventos, partidos recientes.

### Roster
CRUD de jugadores con atributos RPG (Fuerza, Velocidad, Resistencia, Tecnica), historial fisico con grafico SVG, lesiones con 4 fases de kinesiologia, gimnasio 1RM, tallas de uniforme, insignias automaticas.

### Pizarra Tactica
Cancha interactiva con 11 formaciones, nodos arrastrables, asignacion de jugadores, banco de suplentes, 3 tamanos y orientacion horizontal/vertical.

### Tribunal Disciplinario
Control de asistencia con penitencias automaticas, infracciones de partido, redencion de deudas fisicas, rankings (Honor, MVPs, Tries, Tackles, Penitencias).

### Agenda
Eventos con recurrencia, WhatsApp formatter, fixtures/resultados, Match Center con stats por jugador.

### Finanzas
Caja chica (ingresos/egresos), membresias con abonos parciales, inventario con custodios y estados.

### Entrenamientos
Plan inteligente (motor de reglas + IA), rutinas por posicion, catalogo general con 13 rutinas y 44 ejercicios.

### IA
Chat tactico multi-proveedor (Gemini/Groq/DeepSeek) con failover, 3 modos de conversacion, analisis de partidos, rate limit diario y cache local.

## Compatibilidad

| Plataforma | Soporte |
|-----------|---------|
| Chrome / Firefox / Edge / Safari (Desktop) | Completo |
| Chrome Android / Safari iOS (PWA) | Completo |
| Android Nativo (Capacitor) | Completo |
| iOS Nativo | No configurado |

---

Rugby Orcos Negros 2026. Fuerza, Honor y Tercer Tiempo.
