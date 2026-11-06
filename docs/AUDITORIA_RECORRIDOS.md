# Auditoría de recorridos — 2026-11-06

Qué pasa con un dato desde que alguien lo crea hasta que los demás lo ven, recorrido por recorrido.
Cada hallazgo indica cómo se comprobó:

- **[Prod]**: conteos en la base de producción (solo totales, sin leer datos personales).
- **[API]**: probado con usuarios reales de prueba contra el Supabase local, que tiene el mismo esquema que producción.
- **[Navegador]**: visto en la app local.
- **[Código]**: leído en el código, con archivo y línea.

## Resumen

| # | Problema | Gravedad | A quién afecta |
|---|---|---|---|
| 1 | El staff que no es presidente solo ve lo que creó él mismo | Crítica | Entrenadores, tesorero, árbitro, promotor |
| 2 | Entrenador, tesorero y árbitro no pueden registrar asistencia, castigos, infracciones, estadísticas ni lesiones | Crítica | Todo el cuerpo técnico |
| 3 | El % de asistencia y los castigos por faltar no se guardan | Crítica | Todos los jugadores |
| 4 | Un partido nunca llega a ser resultado ni a dar estadísticas | Crítica | Partidos, estadísticas, premios |
| 5 | Los ingresos de pro-fondos no llegan al libro de caja | Crítica | Tesorería |
| 6 | Lo que cambia otro usuario no se ve hasta recargar | Alta | Todos |
| 7 | La columna `players.user_id` tiene dos significados | Alta | "Mi Ficha" del staff, cuentas de jugadores |
| 8 | Confirmación, disponibilidad y asistencia son tres sistemas separados | Alta | Entrenos y partidos |
| 9 | Las notificaciones no llegan a nadie | Alta | Todos |
| 10 | El estado de cuotas no entiende de meses | Alta | Tesorería, Paz y salvo |
| 11 | Fechas calculadas en UTC | Media | Todo lo que dice "hoy" |
| 12 | Datos inventados cuando falta un dato | Media | Fichas, agenda, convocatorias |
| 13 | La documentación promete funciones que no existen | Media | Expectativas del club |
| 14 | La vista Club/Mak'Gora no se recuerda | Baja | Staff |

---

## 1. El staff que no es presidente solo ve lo que creó él mismo — Crítica

**Recorrido:** el presidente crea entrenos, partidos y jugadores → el entrenador abre la app → no ve nada de eso.

- [Código] `src/data/supabaseApi.js:42-51` (`fetchAll`) y `src/context/hooks/useSync.js:180-190`. Para los rangos de nivel 2 y 3, si el perfil no tiene `team_id` ni `club_scope`, la consulta se filtra por `user_id = <yo>`. Eso significa que el usuario solo recibe los eventos, partidos, resultados, finanzas y jugadores **que él mismo creó**.
- [Prod] Los 5 perfiles afectados (2 entrenadores, tesorero, árbitro y promotor) no tienen ni `team_id` ni `club_scope`. Solo los perfiles del presidente y de un desarrollador los tienen.
- [Prod] Los 16 eventos de producción los creó una sola persona.

**Consecuencia:** a cada uno de esos usuarios la app le muestra un club vacío o incompleto, sin ningún error que lo explique. Encaja con lo que reportaste: "lo que aparece en un sitio no sale en otro".

**Arreglo propuesto:** el staff (nivel 3 o menos) carga todo el club. Las reglas de acceso de la base de datos ya protegen los datos, y el filtro por creador sobra. Como alternativa inmediata, sin tocar código, se puede asignar `club_scope` a esos 5 perfiles.

## 2. El cuerpo técnico no puede registrar nada sobre los jugadores — Crítica

**Recorrido:** el entrenador toma asistencia, registra una lesión o carga estadísticas → la app dice que se guardó → no se guardó.

- [API] Con la cuenta de entrenador y la de tesorero, escribir en `attendance`, `player_attendance_summary`, `penalties`, `infractions`, `match_stats` e `injury_log` sobre una ficha creada por la presidenta devuelve **403** (permiso denegado). La presidenta sí puede.
- [Código] Las reglas de esas tablas (y de `hia_assessments`, `wellness_logs`, `workout_logs` y `attribute_history`) solo dejan escribir a `is_admin()`, que es desarrollador, presidente o promotor, o al "dueño" de la ficha. El dueño resulta ser quien la creó (ver el punto 7).
- [Código] La app sí les da esos permisos: `manage_discipline` incluye al árbitro y al entrenador, y `manage_training` al entrenador (`src/context/hooks/usePermissions.js`).
- La migración 79 arregló esto en otras tablas (eventos, partidos, finanzas), pero no en estas.

**Arreglo propuesto:** una migración que dé escritura en esas tablas a los rangos que la app ya autoriza. Por ejemplo, disciplina para entrenador y árbitro, y salud y asistencia para el entrenador.

## 3. El % de asistencia y los castigos por faltar no se guardan — Crítica

**Recorrido:** se toma asistencia → el jugador debería ver su % en "Asistencia al clan" y sus burpees en Disciplina → ve 0 %.

- [Prod] Hay **119 registros de asistencia y 0 resúmenes de asistencia**.
- [Código] `src/context/hooks/usePlayers.js:158-217`. El resumen y los burpees se calculan **dentro** de una actualización de estado de React (`setPlayers(prev => …)`). React la ejecuta más tarde, así que en la línea 212 las listas a guardar todavía están vacías. Además:
  - el guardado ignora errores: `.then(() => {}, () => {})`;
  - el cálculo solo considera jugadores de `activeTeam`, así que con "Todas las divisiones" se salta a los demás.
- [Navegador] El jugador de prueba ve "0 % · 0/0 prácticas".
- El mismo patrón está en `recordMembershipPayment` (`usePlayers.js:385-407`): el nombre del jugador puede quedar vacío y salir "Abono Membresía - Jugador".

**Arreglo propuesto:** que la base de datos calcule el resumen a partir de `attendance`, con una vista o un trigger. Así no depende de la pantalla y no puede desincronizarse.

## 4. Un partido nunca llega a ser resultado ni a dar estadísticas — Crítica

**Recorrido esperado:** partido programado → convocatoria → partido en vivo → resultado → estadísticas por jugador → premios y Estadísticas.

- [Código] "Iniciar en vivo" solo existe en las tarjetas de **resultados** (`FixtureTab/FixtureCard.jsx:48-50`), es decir, de partidos ya jugados. En "Próximos Partidos" no hay botón. Además, `live_matches.fixture_id` apunta a la tabla de resultados, no a la de partidos programados.
- [Código] Al terminar (`FixtureTab/LiveMatch/index.jsx:97-123`):
  - si se inició desde un resultado, crea **otro resultado nuevo** en vez de completar ese, y queda duplicado;
  - si se inició sin partido asociado, **no guarda nada**;
  - el marcador del rival se toma de un valor que no se actualiza con los eventos;
  - no se generan estadísticas por jugador (tries de cada uno, tarjetas);
  - el partido programado nunca se marca como jugado.
- [Código] Llevar el partido en vivo solo lo permiten `admin_panel`, `profile.role === 'coach'` o `'capitan'` (`Calendario/index.jsx:369`). `profile.role` no existe (el campo es `system_role`), así que **solo pueden presidente y desarrollador**. La documentación dice que el entrenador y el árbitro también.
- [Prod] Hay 1 partido programado, **0 resultados** y **0 estadísticas de partido**.
- Además, un partido puede crearse como evento del calendario de tipo "partido", como partido programado o como resultado, sin enlace entre ellos (ver el glosario).

**Arreglo propuesto:**
- Un solo partido con estados: programado → en vivo → jugado. El partido en vivo se inicia desde el partido programado.
- Al terminar, se completa ese mismo partido y se generan las estadísticas por jugador a partir de los eventos del partido en vivo.
- Pueden llevar el marcador el entrenador, el árbitro y el anotador designado.

## 5. Los ingresos de pro-fondos no llegan al libro de caja — Crítica

**Recorrido:** un jugador paga su rifa → la tesorería lo registra → debería aparecer como ingreso en el libro de caja.

- [Prod] Hay **3 pagos de pro-fondos y 0 movimientos** de pro-fondos en el libro de caja. Ningún movimiento usa el enlace `payment_id`, aunque `RULES.md` (R1.3) dice que se usa.
- [Código] `src/context/hooks/useEntities.js:34-38`: el libro de caja se guarda con `.then(() => {})`. Ese patrón no detecta el `{ error }` que devuelve Supabase, así que si el guardado falla nadie se entera.
- [Código] Los ingresos de pro-fondos se guardan siempre con categoría "general" (`RegisterPaymentModal.jsx:41` y otros). Por eso todas las categorías salían "General" en la prueba.
- [Código] Borrar un movimiento de cuota busca el texto `[pid:…]` en la descripción (`ClubContext.jsx:242`) en vez del enlace real.

**Arreglo propuesto:** que el pago y su movimiento se creen juntos en la base de datos, en una sola función. Así uno no puede existir sin el otro.

## 6. Lo que cambia otro usuario no se ve hasta recargar — Alta

- [Código] Los datos se cargan **una sola vez** al iniciar sesión (`useSync.js:171-449`). Solo hay actualización en vivo para mensajes, partido en vivo, invitaciones y préstamos.
- Ejemplos: el jugador confirma y el entrenador no lo ve; el entrenador crea un entreno y el jugador que ya tenía la app abierta no lo ve.
- El "bus de eventos" de `RULES.md` (R2.2) solo avisa dentro del mismo teléfono.

## 7. `players.user_id` tiene dos significados — Alta

- [Código] Al crear una ficha se guarda en `user_id` el id de **quien la crea** (`supabaseApi.js:125`). Cuando se generan las credenciales del jugador, se reemplaza por la cuenta del jugador (migración 78).
- [Prod] De 60 fichas activas, **58 tienen como `user_id` a un usuario de staff**. Esos 58 jugadores todavía no tienen cuenta propia.
- Consecuencias:
  - [Código] "Mi Ficha" busca "la ficha cuyo `user_id` soy yo" (`PlayerDashboard.jsx:70`). Al staff que creó fichas le muestra **la primera ficha que creó** como si fuera la suya.
  - Las reglas de acceso tratan al creador como dueño (punto 2).
  - Otras pantallas identifican al jugador por coincidencia de nombre o de email (`Calendario/index.jsx:38`, `Finanzas/index.jsx:24`, `AIChat`).

**Arreglo propuesto:** separar `created_by` (quién la creó) de `user_id` (cuenta del jugador), y una sola función "jugador actual" para todas las pantallas.

## 8. Confirmación, disponibilidad y asistencia: tres sistemas — Alta

- Para entrenos y eventos, la confirmación del jugador va a `event_rsvp`.
- Para partidos, la disponibilidad va a un JSON dentro del partido programado (`set_match_availability`).
- La asistencia real va a `attendance` y se toma desde el **Tribunal**.
- [Código] Al tomar asistencia no se muestra quién dijo que no iba. La pizarra sí usa la disponibilidad del partido, pero no las confirmaciones de los entrenos.
- [Prod] Hay 1 confirmación y 119 asistencias.

## 9. Las notificaciones no llegan a nadie — Alta

- [Prod] **0 dispositivos registrados** en `push_tokens`.
- [Código] Hay dos sistemas: `send-push` (Firebase, para la app Android) y `web-push` (para navegador). El aviso automático de eventos (migración 85) usa solo `send-push`, así que los usuarios de navegador no lo recibirían. El envío manual usa `web-push`.
- [Código] Para registrar el teléfono se busca la ficha por `user_id` (`pushNotifications.js:143`), así que un jugador sin cuenta propia no puede activarlas (punto 7).
- [Prod] Crear un partido programado no avisa a nadie: no hay trigger en `future_fixtures`.

## 10. El estado de cuotas no entiende de meses — Alta

- [Código] "Al día" compara **todo lo pagado en la historia** con **una cuota mensual** (`Finanzas/useFinanzasState.js:62-71`). Quien pagó una vez queda al día para siempre.
- [Código] Ese cálculo usa la constante fija de 10.000 (`Finanzas/constants.js`) y no la cuota configurada del club (`club_config.mensualidad_base`).
- Paz y salvo y morosos dependen de este cálculo.

## 11. Fechas calculadas en UTC — Media

- [Código] 27 archivos calculan "hoy" con `toISOString().split('T')[0]`, que da la fecha en UTC. En Colombia, desde las 19:00 "hoy" pasa a ser mañana. Afecta a la fecha de pagos, asistencias, resultados del partido en vivo, recordatorios, etc.
- Corregido solo en la Agenda (PR #3), con `localDateKey` en `src/utils/agendaItems.js`.

## 12. Datos inventados — Media

- [Código] Unos 20 valores por defecto se muestran como si fueran reales: peso 85 kg, tallas M y 40-42, "San Francisco", "19:00", "15:30", "Estadio San Francisco", `Apodo: ""`.
- [Navegador] En el formulario de primer ingreso, la EPS aparece como "No tiene EPS" y al guardar sobrescribe la EPS real.
- Corregido solo en la agenda del jugador (PR #3).

## 13. La documentación promete funciones que no existen — Media

- `docs/07`: rangos y XP de la Makgora (Recluta → Cacique). [Código] No hay sistema de XP; solo una etiqueta en el ranking.
- `docs/09`: cada infracción resta XP. [Código] No existe.
- `docs/06`: el bienestar registra 5 variables. [API] La tabla guarda 3 (sueño, dolor, estrés).
- `docs/03`: préstamos entre clubes. [Código] Son entre clanes de la Makgora.
- `docs/02`: el árbitro registra el marcador en vivo. [Código] No puede (punto 4).
- `RULES.md` R6.3 dice que `user_profiles` debe ser público, y R1.1 nombra la regla `players_hide_deleted`. Ambas quedaron desactualizadas con la migración 83.

## 14. La vista Club/Mak'Gora no se recuerda — Baja

- [Código] `ClubContext.jsx:97-103`: dos guardados de preferencias se pisan entre sí. `view_mode` nunca queda guardado [Local: el perfil de la presidenta de prueba solo tiene `division_view`].

---

## Ya corregido hoy

- Producción, migraciones 82–85: acceso anónimo cerrado, privacidad de fichas, fotos, tablas del partido en vivo y aviso de eventos.
- PR #3 (sin merge): la Agenda incluye los partidos programados y no muestra fechas pasadas; la vista semanal usa fecha local; horas sin segundos; el filtro de Mak'Gora reconoce los eventos del clan.

## Orden propuesto

Primero lo que se arregla sin rediseño y desbloquea el uso diario:

1. **Punto 1.** El staff ve todo el club. Es un cambio pequeño de código; también se puede resolver al momento asignando el club a los 5 perfiles.
2. **Punto 2.** Una migración de permisos para el cuerpo técnico.
3. **Punto 3.** El resumen de asistencia lo calcula la base de datos.
4. **Punto 5.** Pago y movimiento se crean juntos; nada de errores ocultos (`.then(() => {})`).

Después, con especificación y pruebas de recorrido completo:

5. **Punto 4.** Un solo partido: programado → en vivo → jugado → estadísticas.
6. **Puntos 7 y 8.** `created_by` separado de `user_id`, jugador actual único y una sola forma de confirmar asistencia.
7. **Puntos 6, 9, 10 y 11.** Tiempo real, notificaciones, cuotas por mes y fechas locales.

Cada punto lleva un test que recorre el flujo completo, para que no vuelva a romperse en silencio.
