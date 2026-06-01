# RUGBY ORCOS NEGROS — Reino Manager v4.0

## CHECKLIST DE EJECUCION

---

### FASE 0: Preparacion

| #  | Tarea                                     | Estado      |
|----|-------------------------------------------|-------------|
| 0.1 | Supabase: proyecto creado                 | Hecho       |
| 0.2 | Supabase: migracion 001 ejecutada         | Hecho       |
| 0.3 | Frontend: migrado a Supabase              | Hecho       |
| 0.4 | Vercel: deploy inicial                    | Hecho       |
| 0.5 | `.env` local con credenciales correctas   | Hecho       |
| 0.6 | Git: repo conectado a GitHub              | Hecho       |

---

### FASE 1: Esquema Supabase — Roles, Torneos, Permisos

| #  | Tarea                                     | Archivo                        | Estado |
|----|-------------------------------------------|--------------------------------|--------|
| 1.1 | Crear `002_users_roles.sql`               | `supabase/migrations/`         |        |
|     | ├─ Tabla `user_profiles` (roles RPG)      |                                |        |
|     | ├─ Tabla `makgora_teams` (6 equipos base) |                                |        |
|     | ├─ Tabla `tournaments`                    |                                |        |
|     | ├─ Tabla `tournament_teams`               |                                |        |
|     | ├─ Tabla `tournament_matches`             |                                |        |
|     | ├─ Tabla `tournament_standings`           |                                |        |
|     | ├─ Tabla `tournament_player_stats`        |                                |        |
|     | ├─ Tabla `player_loans`                   |                                |        |
|     | ├─ Funcion RLS `get_user_role()`          |                                |        |
|     | ├─ Seed: admin inicial + 6 equipos        |                                |        |
|     | ├─ Campo `makgora_team_id` en `players`   |                                |        |
|     | └─ Campo `context` en `match_stats`       |                                |        |
| 1.2 | Ejecutar migracion en Supabase SQL Editor |                                |        |
| 1.3 | Verificar tablas creadas en Table Editor  |                                |        |
| 1.4 | Supabase Auth: deshabilitar magic link    | Auth > Providers               |        |
| 1.5 | Supabase Auth: habilitar email/password   | Auth > Providers               |        |

---

### FASE 2: Sistema de Autenticacion

| #  | Tarea                                     | Archivo                        | Estado |
|----|-------------------------------------------|--------------------------------|--------|
| 2.1 | Cambiar AuthContext a email/password      | `src/context/AuthContext.jsx`  |        |
|     | ├─ `signInWithPassword`                   |                                |        |
|     | ├─ `signUp` para Fundar Reino             |                                |        |
|     | ├─ Fetch `user_profile` al login          |                                |        |
|     | └─ Guardar perfil (rol, club, division)   |                                |        |
| 2.2 | Nuevo Login.jsx                           | `src/components/Login.jsx`     |        |
|     | ├─ Campo email + password                 |                                |        |
|     | ├─ Boton "Entrar al Reino"                |                                |        |
|     | └─ Boton "Fundar el Reino" (1er uso)      |                                |        |
| 2.3 | Primer uso: crear admin automáticamente   |                                |        |
| 2.4 | Probar local: login admin + Fundar Reino  |                                |        |

---

### FASE 3: Roles RPG y Permisos

| #  | Tarea                                     | Archivo                        | Estado |
|----|-------------------------------------------|--------------------------------|--------|
| 3.1 | Definir RPG_ROLES con nombres e iconos    | `src/context/ClubContext.jsx`  |        |
|     | ├─ Desarrollador / Arquitecto del Reino   |                                |        |
|     | ├─ Presidente / Señor de la Guerra        |                                |        |
|     | ├─ Promotor / Comandante de Horda         |                                |        |
|     | ├─ Entrenador / Maestro de Armas          |                                |        |
|     | ├─ Tesorero / Guardian del Botin          |                                |        |
|     | ├─ Arbitro / Juez del Coliseo             |                                |        |
|     | └─ Jugador / Guerrero                     |                                |        |
| 3.2 | Implementar `hasPermission(accion)`       | `src/context/ClubContext.jsx`  |        |
| 3.3 | Ocultar/mostrar botones segun rol         | Todos los componentes          |        |
| 3.4 | Componente UserManagement                 | `src/components/UserManagement.jsx` |   |
|     | ├─ Crear usuario (email, pass, nombre)    |                                |        |
|     | ├─ Asignar rol + club + division          |                                |        |
|     | ├─ Lista de usuarios con badge RPG        |                                |        |
|     | └─ Editar / desactivar usuario            |                                |        |
| 3.5 | Mostrar nombre RPG en header              | `src/App.jsx`                  |        |

---

### FASE 4: Modo Mak'Gora

| #  | Tarea                                     | Archivo                        | Estado |
|----|-------------------------------------------|--------------------------------|--------|
| 4.1 | Toggle General / Mak'Gora en header       | `src/App.jsx`                  |        |
| 4.2 | Selector de equipo Mak'Gora               | `src/App.jsx`                  |        |
| 4.3 | Roster: asignar equipo Mak'Gora           | `src/components/Roster.jsx`    |        |
| 4.4 | Filtrar datos por contexto activo         | `src/context/ClubContext.jsx`  |        |
| 4.5 | Crear/Gestionar torneos Mak'Gora          | `src/components/MakgoraTournament.jsx` | |
|     | ├─ Nombre, fechas, equipos participantes  |                                |        |
|     | ├─ Generar fixture automático (round-robin)|                               |        |
|     | └─ Agregar partidos manuales              |                                |        |
| 4.6 | Dashboard Mak'Gora                        | `src/components/MakgoraDashboard.jsx` |   |
|     | ├─ Torneo activo + fechas                 |                                |        |
|     | ├─ Próximos partidos                      |                                |        |
|     | └─ Goleadores del torneo                  |                                |        |
| 4.7 | Fixture + Tabla de Posiciones             | `src/components/MakgoraFixture.jsx` |     |
|     | ├─ Calendario de partidos por fase        |                                |        |
|     | ├─ Registrar resultado                    |                                |        |
|     | └─ Tabla: PJ, PG, PE, PP, puntos, bonus   |                                |        |
| 4.8 | Match Center Mak'Gora                     | `src/components/MakgoraMatchCenter.jsx` | |
|     | ├─ Registro de stats por jugador          |                                |        |
|     | └─ MVP del partido                        |                                |        |
| 4.9 | Historial de torneos                      | `src/components/TournamentHistory.jsx` |   |
|     | ├─ Lista de torneos pasados               |                                |        |
|     | ├─ Campeon de cada edicion                |                                |        |
|     | └─ Estadisticas historicas                |                                |        |
| 4.10| Prestamos de jugadores entre equipos      | `src/components/MakgoraHub.jsx` | Hecho  |
|     | ├─ Solicitar prestamo                      |                                |        |
|     | ├─ Aprobar / rechazar                      |                                |        |
|     | ├─ Badge "Prestamo" en jugador (Roster)    |                                |        |
|     | ├─ Devolucion automatica al terminar       |                                |        |
|     | └─ Asignacion Mak'Gora en ficha jugador    | `src/components/Roster.jsx`    |        |
| 4.11| Integracion prestamos con ClubContext      | `src/context/ClubContext.jsx`  | Hecho  |
|     | ├─ Estado loans[] + sync Supabase          |                                |        |
|     | ├─ Suscripcion real-time player_loans      |                                |        |
|     | └─ Metodos requestLoan, updateLoanStatus   |                                |        |

---

### FASE 5: Invitacion a Equipos Rivales

| #  | Tarea                                     | Archivo                        | Estado |
|----|-------------------------------------------|--------------------------------|--------|
| 5.1 | Tablas `match_invitations` + `guest_players` | `supabase/migrations/04_match_invitations.sql` | Hecho |
| 5.2 | Generar link unico de invitacion          | `src/components/Calendario.jsx` | Hecho  |
| 5.3 | Pagina publica registro rival             | `src/components/MatchInvitation.jsx` | Hecho |
| 5.4 | Mostrar jugadores rivales en Match Center | `src/components/Calendario.jsx` | Hecho  |
| 5.5 | Expirar link al terminar partido          |                                | Hecho  |
| 5.6 | Dashboard centralizado de invitaciones    | `src/components/Invitaciones.jsx` | Hecho |
|     | ├─ Tab "📨 Invitaciones" en navegacion     | `src/App.jsx`                  |        |
|     | ├─ Filtros activas/historial/todas         |                                |        |
|     | ├─ Contador de guerreros registrados       |                                |        |
|     | ├─ Badge de respuesta (pendiente/aceptada) |                                |        |
|     | ├─ Lista expandible de jugadores rivales   |                                |        |
|     | └─ Acciones: copiar link, WhatsApp, cancelar |                              |        |
| 5.7 | Mejora schema: rival_id FKs + guest_count  | `supabase/migrations/06_enhance_invitations.sql` | Hecho |
|     | ├─ FK rival_id en future_fixtures, fixtures |                               |        |
|     | ├─ FK rival_id en match_invitations        |                                |        |
|     | ├─ Columnas response, guest_count, trigger |                                |        |
|     | └─ Trigger auto-contador guest_players     |                                |        |
| 5.8 | Botones Aceptar/Rechazar en pagina publica | `src/components/MatchInvitation.jsx` | Hecho |
| 5.9 | GuestRoster visible en proximos partidos   | `src/components/Calendario.jsx` | Hecho  |
| 5.10| Badge de invitaciones activas en Rivales   | `src/components/Rivales.jsx`   | Hecho  |
| 5.11| Suscripcion real-time guest_players        | `src/context/ClubContext.jsx`  | Hecho  |

---

### FASE 6: Aplicacion Movil Nativa

| #  | Tarea                                     | Archivo                        | Estado |
|----|-------------------------------------------|--------------------------------|--------|
| 6.1 | Android: build APK con Capacitor          | `capacitor.config.json`        |        |
| 6.2 | Android: probar en dispositivo real       |                                |        |
| 6.3 | iOS: PWA (gratis, via Safari)             | `public/manifest.json`         | Hecho   |
|     | ├─ "Agregar a pantalla de inicio"         |                                |        |
|     | ├─ Pantalla completa sin barra Safari     |                                |        |
|     | ├─ Icono en home screen                   |                                |        |
|     | └─ Funciona offline con service worker    |                                |        |

---

### FASE 7: Deploy Final

| #  | Tarea                                     | Archivo                        | Estado |
|----|-------------------------------------------|--------------------------------|--------|
| 7.1 | Commit + push a GitHub                    |                                |        |
| 7.2 | Vercel: redeploy automatico               |                                |        |
| 7.3 | Supabase: actualizar redirect URLs        | Auth > URL Configuration       |        |
| 7.4 | Probar flujo completo en produccion       |                                |        |
| 7.5 | Probar PWA iOS: instalar desde Safari     |                                |        |
| 7.6 | Probar APK Android: instalar APK          |                                |        |

---

## APP PARA iOS — Gratis (SIN Apple Developer $99)

La app **YA funciona como PWA en iOS** sin pagar nada. Lo que el usuario hace:

```
1. Abre Safari en iPhone/iPad
2. Va a https://rugby-orcos.vercel.app
3. Toca el boton Compartir (📤)
4. "Agregar a pantalla de inicio"
5. Le pone nombre: "Orcos"
6. Aparece un icono como app nativa

Resultado:
✅ Pantalla completa (sin barra de Safari)
✅ Icono en home screen
✅ Funciona offline
✅ Notificaciones (limitadas pero funcionales)
✅ Gratis, sin App Store, sin certificados
```

**Diferencia vs App Store nativa:**

| Funcionalidad | PWA (gratis) | App Store ($99/año) |
|---------------|:------------:|:-------------------:|
| Fullscreen sin barra | Si | Si |
| Icono en home | Si | Si |
| Offline | Si | Si |
| Notificaciones push | Limitado | Si |
| Acceso a camara/contactos | Parcial | Si |
| App Store badge | No | Si |
| Actualizaciones automaticas | Si | Si |

---

### ESTADO GENERAL

| Fase | Progreso |
|------|----------|
| Fase 0 | ✅ 100% |
| Fase 1 | ✅ 100% |
| Fase 2 | ✅ 100% |
| Fase 3 | ✅ 100% |
| Fase 4 | ✅ 100% (incluye prestamos + asignacion equipos) |
| Fase 5 | ✅ 100% (dashboard, real-time, aceptar/rechazar) |
| Fase 6 | 🟡 80% (APK pendiente) |
| Fase 7 | 🟡 50% (Vercel env vars pendiente) |

---

*"En el scrum y en la vida, siempre juntos. Siempre Orcos."*
