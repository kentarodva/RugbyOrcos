# 🏉 Rugby Orcos Negros — Análisis Completo del Reino Manager v4.0

> **Fecha:** 31 Mayo 2026  
> **App:** Rugby Orcos Negros — Club Manager & RPG  
> **Stack:** React 18 + Vite + Supabase + Recharts + Capacitor  
> **Base de datos:** PostgreSQL (Supabase) — 27 tablas  
> **IA:** Multi-proveedor (Groq, DeepSeek, Gemini)

---

## 📋 Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Base de Datos — Estructura Completa](#3-base-de-datos)
4. [Features Actuales](#4-features-actuales)
5. [Checklist de Bugs y Deuda Técnica](#5-checklist-bugs)
6. [Mejoras Propuestas](#6-mejoras-propuestas)
7. [Nuevas Features Propuestas](#7-nuevas-features)
8. [Tabla Comparativa vs Competencia](#8-tabla-comparativa)
9. [Roadmap Sugerido](#9-roadmap-sugerido)

---

## 1. Resumen Ejecutivo

Orcos Negros es una **app de gestión integral de club de rugby** con temática RPG. Cubre desde roster y estadísticas hasta finanzas, tácticas, torneos internos (Mak'Gora) y un coach de IA multi-proveedor. 

**Fortalezas clave:**
- Sistema RPG de roles y permisos (7 roles con jerarquía)
- Offline-first con sync a Supabase
- Multi-proveedor de IA (Groq, DeepSeek, Gemini)
- Pizarra táctica interactiva con 15 posiciones
- Torneo interno Mak'Gora con sistema de préstamos
- Dashboard con métricas y bienestar
- Notificaciones locales push (Capacitor)
- Login de jugadores con credenciales individuales
- Integración completa con Supabase (RLS, funciones, triggers)

**Áreas de mejora:**
- Sin tests E2E configurados
- Varios bugs críticos de sincronía resueltos recientemente
- Sin PWA (pero tiene Capacitor para Android)
- Falta onboarding/tutorial
- Sin caché inteligente de datos

---

## 2. Arquitectura del Sistema

### 2.1 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 |
| Build | Vite 4 |
| Estilos | CSS + Glassmorphism |
| Charts | Recharts 3 |
| Base de datos | PostgreSQL (Supabase) |
| Autenticación | Supabase Auth |
| Sincronización | Offline-first con sync bidireccional |
| IA | Groq, DeepSeek, Gemini (multi-proveedor) |
| Mobile | Capacitor 5 (Android) |
| Tests | Vitest + Playwright |
| Linting | ESLint 8 |

### 2.2 Estructura de Directorios

```
src/
├── components/       # 20+ módulos (Roster, Dashboard, CanchaTactica, etc.)
│   ├── Admin/        # Import CSV, UserManagement
│   ├── AIChat/       # Chat con IA (8 sub-componentes)
│   ├── Calendario/   # Agenda, Fixture, Future tabs
│   ├── CanchaTactica/# Pizarra táctica (10 sub-componentes)
│   ├── Dashboard/    # 12 sub-componentes (métricas, bienestar, etc.)
│   ├── Estadisticas/ # Charts y filtros
│   ├── Finanzas/     # 10 sub-componentes
│   ├── MakgoraHub/   # Torneos internos
│   ├── Roster/       # CRUD jugadores, modales
│   ├── TrainingHub/  # Planes de entrenamiento
│   └── Tribunal/     # Asistencia, faltas, sanciones
├── context/          # React Context (Auth, Club, Toast)
│   └── hooks/        # 13 hooks personalizados
├── data/             # API bridge, exercise library
├── engine/           # IA, análisis, asignación táctica
├── utils/            # CSV import, dates, PDF export
├── __tests__/        # 25 archivos de test
└── supabaseClient.js # Cliente Supabase
```

### 2.3 Flujo de Datos

```
[Google Form CSV] ──> seed/seed-csv.mjs ──> SUPABASE
[Manual CSV] ──> ImportCSVModal ──> Supabase API
[UI (Roster, etc.)] ──> usePlayers ──> Estado Local (React) ──> pushPlayerToSupabase() ──> SUPABASE
SUPABASE ──> useSyncPull ──> Estado Local ──> localStorage (offline)
```

---

## 3. Base de Datos

### 3.1 Tablas Principales (27 total)

| Grupo | Tablas | Propósito |
|---|---|---|
| **Core** | `players`, `user_profiles`, `player_attendance_summary` | Jugadores, perfiles, resumen |
| **Jugador child** | `attribute_history`, `injury_log`, `attendance`, `penalties`, `infractions`, `match_stats`, `wellness_logs`, `hia_assessments`, `workout_logs` | Datos por jugador |
| **App** | `schedule_events`, `championships`, `finances`, `inventory`, `fixtures`, `rivals`, `future_fixtures`, `lineups`, `messages`, `match_invitations`, `guest_players` | Gestión del club |
| **Mak'Gora** | `makgora_teams`, `tournaments`, `tournament_teams`, `tournament_matches`, `tournament_standings`, `tournament_player_stats`, `player_loans` | Torneo interno RPG |

### 3.2 Seguridad (RLS)

- Políticas por `user_id` para tablas de aplicación
- Políticas child via `player_id` → `players.user_id`
- Políticas Mak'Gora: solo admins escriben, usuarios autenticados leen
- Función `is_admin()` SECURITY DEFINER
- Función `admin_create_player_credentials()` para crear usuarios

---

## 4. Features Actuales

### 4.1 Módulos por Tab

| # | Módulo | Features |
|---|---|---|
| 1 | **Dashboard** | KPIs, métricas, cumpleaños, bienestar, lesiones, próximos partidos, comparativa divisiones, forward/backs balance, sin bin |
| 2 | **Roster** | CRUD jugadores, búsqueda, filtros, tarjetas RPG, detalle con pestañas (atributos, lesiones, estadísticas, gimnasio, HIA, vestimenta, historial batalla) |
| 3 | **Estadísticas** | Edad, categoría, estado, experiencia, posición (gráfico barras), edad por posición (tabla), físico (peso/altura/IMC), salud (EPS, fracturas, alergias), cobertura (teléfono, contacto), equipos Mak'Gora |
| 4 | **Pizarra Táctica** | Campo interactivo drag & drop, 15 posiciones (union 15s, 7s, league), selección automática por atributos, estrategias, filtros tácticos, línea de beneficio |
| 5 | **Tribunal** | Asistencia (marcar presente/tarde/ausente), control de disciplina, faltas, sanciones (burpees, conos), rankings, libro de faltas |
| 6 | **Salón de la Fama** | Logros, estadísticas históricas |
| 7 | **Mak'Gora** | Torneos internos, equipos RPG, fixture, standings, estadísticas jugadores, préstamos entre equipos |
| 8 | **Agenda** | Eventos, fixtures, partidos futuros, match center, records de temporada, invitaciones con guest players |
| 9 | **Invitaciones** | Invitaciones a partidos con token, guest players |
| 10 | **Finanzas** | Ingresos/egresos, categorías, inventario, membresías, resumen financiero |
| 11 | **Entrenamientos** | Catálogo de ejercicios, planes de entrenamiento, asignación a jugadores |
| 12 | **Mensajes** | Chat interno |

### 4.2 Sistema RPG

- 7 roles con jerarquía (desarrollador → jugador)
- Títulos, íconos y colores únicos por rol
- Permisos granulares (admin_panel, edit_all, etc.)
- Sistema de penalidades: burpees, conos
- Torneo Mak'Gora con ambientación RPG

### 4.3 Inteligencia Artificial

- Multi-proveedor: Groq, DeepSeek, Gemini
- Cache de respuestas
- Rate limiting por proveedor
- Content filtering para contenido no relacionado con rugby
- Funcionalidades: análisis de partidos, enriquecimiento de planes, chat táctico

---

## 5. Checklist de Bugs y Deuda Técnica

### 🔴 Críticos

- [x] **BUG: pushPlayerToSupabase no conectado** (RESUELTO) — `ClubContext.jsx` no destructure `pushPlayerToSupabase` de `useSync` → ahora se llama `useSyncPush` antes de `usePlayers`
- [ ] **BUG: camiseta null crash en Roster filter** — `p.camiseta.toString()` explota si es null. (FIX: `p.camiseta?.toString() || ''`)
- [x] **BUG: camiseta 0 se borra** (RESUELTO) — `player.camiseta || ''` trata 0 como falsy → ahora `player.camiseta ?? ''`
- [x] **BUG: campos required en modal** (RESUELTO) — Apodo y camiseta ya no son obligatorios

### 🟡 Altos

- [ ] **Sin typescript estricto** — `types.d.ts` existe pero no se usa en compilación. Muchos componentes sin tipos
- [ ] **Sin typecheck en CI** — `npm run typecheck` existe pero no se ejecuta automáticamente
- [ ] **Tests E2E no configurados** — Playwright instalado pero sin tests
- [ ] **25 archivos test pero sin cobertura mínima** — Muchos módulos sin test
- [ ] **Sin validación de schemas** — Datos de Supabase se mapean manualmente sin validación (zod, yup)
- [ ] **Manejo de errores inconsistente** — Algunos catch son silenciosos, otros muestran alerts

### 🟢 Medios

- [ ] **Sin PWA manifest** — La app no es instalable como PWA (aunque tiene Capacitor)
- [ ] **Sin service worker** — Sin caché de assets ni soporte offline completo
- [ ] **Código duplicado** — `seed-csv.mjs` y `csvImport.js` tienen lógica duplicada de parsing
- [ ] **Constantes duplicadas** — `POSICIONES_RUGBY` definido en 3 lugares (EditPlayerModal, AddPlayerModal, CanchaTactica/constants)
- [ ] **Sin i18n** — Todo en español pero mezclado con inglés en algunas partes
- [ ] **Sin lazy loading** en varios componentes grandes (Entrenamientos, Finanzas)
- [ ] **Sin paginación** en roster (podría ser problema con 100+ jugadores)
- [ ] **Sin límite de rate en UI** — Las llamadas a Supabase no tienen debounce

### 🔵 Bajos

- [ ] **Console.warn en DEV** — Algunos errores de Supabase se tragan silenciosamente
- [ ] **Sin animaciones de carga** — Algunas transiciones son abruptas
- [ ] **Sin tooltips explicativos** — Muchos íconos sin descripción
- [ ] **Logo hardcodeado** — `/assets/orcos_logo.png` referenciado directamente
- [ ] **Tema oscuro forzado** — Sin soporte para tema claro

---

## 6. Mejoras Propuestas

### 6.1 Rendimiento

| Mejora | Impacto | Esfuerzo |
|---|---|---|
| Virtual scrolling en roster (react-window) | Alto con 100+ jugadores | 2-3 días |
| Lazy loading en todos los tabs | Medio | 1 día |
| Memoizar cálculos pesados (Estadísticas) | Medio | 0.5 día |
| Agregar React.memo en componentes de lista | Bajo | 0.5 día |
| Compresión de imágenes de jugadores | Bajo | 0.5 día |

### 6.2 UX/UI

| Mejora | Impacto | Esfuerzo |
|---|---|---|
| Tutorial interactivo de onboarding | Alto | 3-4 días |
| Modo oscuro/claro configurable | Medio | 2 días |
| Tooltips en todos los íconos y botones | Medio | 1 día |
| Skeletons / loading states en todos los módulos | Medio | 2 días |
| Feedback visual en operaciones CRUD | Alto | 1 día |
| Confirmaciones destructivas con estilo (no confirm nativo) | Medio | 1 día |
| Responsive mejorado para móvil | Alto | 3-4 días |

### 6.3 Calidad de Código

| Mejora | Impacto | Esfuerzo |
|---|---|---|
| Migrar a TypeScript progresivamente | Alto | 2-3 semanas |
| Agregar validación de schemas (Zod) | Alto | 3-4 días |
| Tests unitarios para hooks críticos | Alto | 3-4 días |
| Tests E2E para flujos principales | Alto | 5-7 días |
| Storybook para componentes compartidos | Medio | 3-4 días |
| Husky + lint-staged (ya configurado) | ✅ Listo | — |
| Agregar changelog automático | Bajo | 0.5 día |
| Documentación de API interna | Medio | 2 días |

### 6.4 Datos y Sincronía

| Mejora | Impacto | Esfuerzo |
|---|---|---|
| Cache offline con IndexedDB | Alto | 5-7 días |
| Conflicto de sync: UI para resolver merges | Alto | 3-4 días |
| Backup automático periódico | Medio | 2 días |
| Export a Excel/PDF con formato | Medio | 2 días |
| Historial de cambios (audit log) | Medio | 2 días |

---

## 7. Nuevas Features Propuestas

### 🏆 Competitivas (Alta Prioridad)

| Feature | Descripción | Esfuerzo |
|---|---|---|
| **Notificaciones Push Reales** | No solo locales, usar Supabase Realtime + push nativo | 5-7 días |
| **Match Day Live** | Scores en tiempo real, lineups, eventos del partido | 7-10 días |
| **Perfil Público de Jugador** | Resumen digital con logros, estadísticas, historial (compartible) | 3-4 días |
| **Reportes PDF Automáticos** | Generar PDF de roster, estadísticas, finanzas con IA | 3-4 días |
| **Comparación de Jugadores** | Side-by-side de atributos, estadísticas, progreso | 2-3 días |
| **Scouting / Reclutamiento** | Seguimiento de prospectos, notas, comparativas | 4-5 días |

### 🧠 IA y Automatización

| Feature | Descripción | Esfuerzo |
|---|---|---|
| **Resumen Automático de Partido** | Post-partido: estadísticas, MVP, análisis táctico con IA | 2-3 días |
| **Predicción de Lesiones** | Basado en carga de entrenamiento, bienestar, historial | 4-5 días |
| **Generación de Planes de Entrenamiento** | IA crea planes personalizados por posición y nivel | 3-4 días |
| **Chat de Voz** | Comandos de voz para el asistente IA | 3-4 días |
| **Recomendación de Alineación** | IA sugiere el mejor XV según atributos, condición, rival | 2-3 días |

### 👥 Social y Comunidad

| Feature | Descripción | Esfuerzo |
|---|---|---|
| **Muro Social del Club** | Fotos, videos, celebraciones, tercer tiempo | 3-4 días |
| **Encuestas y Votaciones** | MVP del partido, mejor entrenamiento, etc. | 2 días |
| **Streaming / Integración con YouTube** | Links a videos de partidos, highlights | 1-2 días |
| **Calendario de Cumpleaños** | Vista mensual de cumples con recordatorio | 1 día |
| **Foro / Tablón de Anuncios** | Comunicaciones formales del club | 2-3 días |

### 📊 Datos y Analytics

| Feature | Descripción | Esfuerzo |
|---|---|---|
| **Evolución de Atributos en el Tiempo** | Línea de tiempo de force/speed/stamina/technique | 2-3 días |
| **Heatmap de Asistencia** | Visual de quién viene y quién no por mes | 2 días |
| **Análisis de Rendimiento por Oposición** | Stats vs cada rival histórico | 3-4 días |
| **Dashboard Financiero Anual** | Proyecciones, gastos vs presupuesto, tendencias | 3-4 días |
| **Mapa de Calor del Campo** | Dónde juega cada jugador en ataque/defensa | 4-5 días |

### 🛠️ Técnicas y Operativas

| Feature | Descripción | Esfuerzo |
|---|---|---|
| **PWA (Progressive Web App)** | Service worker, manifest, instalable en homescreen | 3-4 días |
| **WebSockets en Tiempo Real** | Sync instantánea entre dispositivos vía Supabase Realtime | 3-4 días |
| **Modo Oscuro / Claro** | Toggle de tema | 2 días |
| **Múltiples Clubes** | Soporte para gestionar más de un club desde la misma cuenta | 5-7 días |
| **Templates de CSV** | Descargar plantilla con formato para bulk import | 1 día |
| **Roles Personalizados** | Crear roles con permisos a medida | 3-4 días |
| **Importación desde otras apps** | Migrar desde Pitchero, Spond, etc. (CSV mapping) | 3-5 días |

---

## 8. Tabla Comparativa vs Competencia

### 8.1 Comparación Directa

| Feature | 🏉 **Orcos Negros** | **Koach Rugby** | **SportEasy** | **STRIVE** | **SquadDeck** | **ClubZap** | **Pitchero** | **YourZown** |
|---|---|---|---|---|---|---|---|---|
| **Roster Management** | ✅ Completo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Match Stats** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Training Plans** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Tactical Whiteboard** | ✅ **Drag & Drop 15 pos** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Financial Management** | ✅ Ingresos/Egresos | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Inventory** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Attendance/Discipline** | ✅ Tribunal completo | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Injury Tracking** | ✅ Fases HIA | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Wellness Monitoring** | ✅ Sueño, dolor, estrés | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **AI Coach Assistant** | ✅ **Multi-proveedor** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (Kananas sí) |
| **Match Analysis (IA)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Internal Tournament** | ✅ **Mak'Gora RPG** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Loan System** | ✅ Entre equipos | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Player Credentials/Login** | ✅ **Con login propio** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **RPG System** | ✅ **Roles, títulos, permisos** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Championships** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Rivals DB** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Match Invitations** | ✅ Con guest players | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Calendar/Schedule** | ✅ Agenda + Fixtures | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Messaging/Chat** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Mobile App** | ⚠️ Capacitor (Android) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PWA** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Payment Collection** | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Online Registration** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Club Website** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Offline-first** | ✅ **localStorage + sync** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Multi-club** | ⚠️ Parcial (división) | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **E2E Tests** | ⚠️ Instalados sin usar | — | — | — | — | — | — | — |
| **Open Source** | ✅ **Código completo** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 8.2 Fortalezas Únicas de Orcos Negros

1. **Pizarra Táctica Interactiva** — Ninguna app de rugby tiene drag & drop táctico con 15 posiciones y selección automática por atributos
2. **Sistema RPG Completo** — Roles, títulos, permisos, penalidades temáticas. Engagement vía gamificación
3. **IA Multi-proveedor** — No depende de un solo proveedor; fallback automático entre Groq, DeepSeek y Gemini
4. **Torneo Interno Mak'Gora** — Sistema de torneo con equipos RPG, préstamos, estadísticas. Único en su tipo
5. **Offline-first** — Funciona sin conexión, sync cuando vuelve
6. **Open Source** — Control total de datos, sin límites de planes pagados

### 8.3 Debilidades vs Competencia

1. **Sin cobros/pagos online** — Stripe, PayPal no integrados
2. **Sin PWA** — No instalable desde el navegador
3. **Sin registro online** — Los jugadores no pueden auto-registrarse
4. **Sin app nativa iOS** — Solo Android vía Capacitor
5. **Sin notificaciones push reales** — Solo locales
6. **Sin website público del club** — Mientras que Pitchero, SquadDeck y ClubZap ofrecen sitio web integrado
7. **Sin multi-club completo** — Soporta una división a la vez
8. **Sin store/e-commerce** — No vende merch, entradas, etc.

---

## 9. Roadmap Sugerido

### 🚀 Fase 1 — Estabilización (1-2 semanas)

- [ ] Corregir bug `camiseta.toString()` en Roster filter
- [ ] Agregar validación de schemas con Zod para datos de Supabase
- [ ] Tests unitarios para hooks: `usePlayers`, `useSync`, `useSchedule`
- [ ] Manejo de errores consistente en todos los catch
- [ ] TypeScript progresivo en módulos core (Player, Roster)

### 📱 Fase 2 — Mobile & Offline (2-3 semanas)

- [ ] PWA: service worker + manifest
- [ ] IndexedDB como backend de offline (reemplazar localStorage)
- [ ] UI de resolución de conflictos de sync
- [ ] Responsive: overhaul de componentes para móvil
- [ ] Notificaciones push con Supabase Realtime

### 💰 Fase 3 — Pagos & Registro (3-4 semanas)

- [ ] Integración Stripe para pagos de membresías
- [ ] Portal de autoregistro para jugadores
- [ ] Website público del club basado en datos de la app
- [ ] Gestión de cuotas y match fees automatizada

### 🤖 Fase 4 — IA Avanzada (2-3 semanas)

- [ ] Predicción de lesiones basada en carga + bienestar
- [ ] Recomendación de alineación óptima del XV
- [ ] Generación automática de planes de entrenamiento
- [ ] Análisis post-partido enriquecido con video

### 🌟 Fase 5 — Comunidad & Social (3-4 semanas)

- [ ] Muro social del club (fotos, celebraciones)
- [ ] Perfiles públicos de jugadores (compartibles)
- [ ] Encuestas y votaciones (MVP, mejor ejercicio)
- [ ] Streaming / integración YouTube
- [ ] App iOS nativa (Swift)

### 🏗️ Fase 6 — Escalabilidad (4-6 semanas)

- [ ] Multi-club completo con switching
- [ ] Roles personalizados por club
- [ ] Marketplace de ejercicios y plantillas
- [ ] API pública para integraciones externas
- [ ] Dashboard de analytics global para federaciones

---

## 📊 Métricas Clave del Proyecto

| Métrica | Valor |
|---|---|
| Archivos fuente | ~120 |
| Componentes React | ~70 |
| Hooks personalizados | 13 |
| Tablas BD | 27 |
| Tests | 25 archivos |
| Proveedores IA | 3 (Groq, DeepSeek, Gemini) |
| Dependencias | ~15 producción + ~10 dev |
| Versión actual | 4.0 |
| Año inicio | 2026 |

---

> *"Fuerza, Honor y Tercer Tiempo."* — Rugby Orcos Negros 2026
