# RULES.md — Rugby Orcos Negros — Reglas Arquitectónicas

> **Última actualización:** 2026-07-28  
> **Versión:** v1.0  
> **Reglas definidas durante la refactorización completa de la app.**

---

## Tabla de Contenidos

1. [Base de Datos](#1-base-de-datos)
2. [Capa de Servicios](#2-capa-de-servicios)
3. [Filtro de Jugadores](#3-filtro-de-jugadores)
4. [Event Bus](#4-event-bus)
5. [Frontend](#5-frontend)
6. [Seguridad](#6-seguridad)
7. [Performance](#7-performance)

---

## 1. Base de Datos

### R1.1 — Soft-delete obligatorio para jugadores

**NUNCA** se ejecuta `DELETE FROM players`. Los jugadores son entidades permanentes.

```sql
-- Hard-delete está BLOQUEADO por trigger:
CREATE TRIGGER trg_prevent_player_delete
  BEFORE DELETE ON players
  FOR EACH ROW EXECUTE FUNCTION prevent_player_hard_delete();
```

**"Eliminar" = soft-delete:**
```js
await supabase.from('players')
  .update({ status: 'inactivo', deleted_at: new Date().toISOString() })
  .eq('id', playerId);
```

**Recuperar:**
```sql
UPDATE players SET status = 'activo', deleted_at = NULL WHERE id = '...';
```

**RLS:** `players_hide_deleted` filtra `WHERE deleted_at IS NULL` en todas las queries.

📁 **Migración:** `seed/migrations/phase_02_soft_delete_rule.sql`

### R1.2 — Foreign Keys con CASCADE

Todas las 18 tablas hijas de `players` tienen `ON DELETE CASCADE`. Como los hard-deletes están bloqueados (R1.1), estos CASCADE solo se activan si alguien fuerza un DELETE desde SQL con permisos elevados.

**Tablas hijas:**
`attribute_history`, `injury_log`, `attendance`, `penalties`, `infractions`, `match_stats`, `wellness_logs`, `hia_assessments`, `workout_logs`, `push_tokens`, `event_rsvp`, `training_plans`, `gym_history`, `player_payments`, `player_loans`, `tournament_player_stats`, `fundraising_assignments`, `player_attendance_summary`

📁 **Migración:** `seed/migrations/phase_01_foreign_keys_and_views.sql`

### R1.3 — `payment_id` en finances (NO texto mágico)

El campo `finances.payment_id` (UUID) referencia `player_payments(id)` con `ON DELETE SET NULL`. **Reemplaza** el viejo sistema de `[pid:UUID]` en el campo `desc`.

```js
// dataService.recordMembershipPayment():
await supabase.from('finances').insert({
  payment_id: payment.id,  // ← FK real, no string mágico
  ...
});
```

📁 **Migración:** `seed/migrations/phase_01_foreign_keys_and_views.sql`

### R1.4 — Vistas materializadas

Existen 3 vistas para consultas agregadas. Deben refrescarse periódicamente:

| Vista | Datos |
|-------|-------|
| `player_training_summary` | Planes totales, última fecha, AI vs custom |
| `player_rsvp_summary` | RSVPs confirmados, maybe, declined por jugador |
| `player_payment_summary` | Total pagado, cantidad de pagos, último pago |

```sql
REFRESH MATERIALIZED VIEW player_training_summary;
REFRESH MATERIALIZED VIEW player_rsvp_summary;
REFRESH MATERIALIZED VIEW player_payment_summary;
```

📁 **Migración:** `seed/migrations/phase_01_foreign_keys_and_views.sql`

### R1.5 — UNIQUE constraints para evitar duplicados

| Tabla | Constraint |
|-------|-----------|
| `gym_history` | `UNIQUE(player_id, recorded_date)` |
| `match_stats` | `UNIQUE(player_id, match_date, opponent)` |
| `attendance` | `UNIQUE(player_id, event_id)` |
| `training_plans` | `UNIQUE(player_id, week_start)` |
| `event_rsvp` | `UNIQUE(event_id, player_id)` |

### R1.6 — Índices obligatorios

Todo FK debe tener índice. Verificar antes de crear nuevas tablas.

### R1.7 — PlayerRol CHECK

```sql
CONSTRAINT players_role_check CHECK (
  role IN ('Titular','Capitan','Subcapitan','Suplente','Entrenador')
);
```

Si se agrega un nuevo rol en el frontend, **actualizar este CHECK también**.

---

## 2. Capa de Servicios

### R2.1 — Single Source of Truth

`src/services/dataService.js` es la **única** capa de acceso a Supabase.

```js
// ✅ CORRECTO
import { upsertRsvp, fetchEventRsvps } from '../services/dataService';

// ❌ INCORRECTO — no usar supabase.from() directo en componentes
const { data } = await supabase.from('event_rsvp').select('*');
```

**Excepciones permitidas** (usan supabase directamente):
- `useSync.js` — sync core
- `usePlayers.js`, `useEntities.js`, `useFundraising.js`, `useSchedule.js` — context hooks
- `AuthContext.jsx` — auth
- `clubSettings.js` — config
- `supabaseClient.js` — cliente base

📁 **Archivo:** `src/services/dataService.js`

### R2.2 — Toda escritura EMITE un evento

Cada función de escritura en `dataService.js` debe llamar a `emit()`:

```js
const emit = (table, action, payload = {}) => {
  window.dispatchEvent(new CustomEvent('data:changed', {
    detail: { table, action, payload, timestamp: Date.now() }
  }));
};
```

**Tablas que actualmente emiten:**
`event_rsvp`, `training_plans`, `attendance`, `player_payments`, `player_loans`, `fundraising_campaigns`, `tournaments`, `tournament_matches`, `messages`

### R2.3 — `supabase.raw()` solo con valores validados

```js
// ✅ CORRECTO — amount es Number, validado antes
supabase.raw(`COALESCE(memberships_paid, 0) + ${Number(amount)}`)

// ❌ INCORRECTO — string sin sanitizar
supabase.raw(`WHERE name = '${userInput}'`)
```

---

## 3. Filtro de Jugadores

### R3.1 — `useTeamPlayers()` es canónico

**UN solo hook** para filtrar jugadores por equipo/división/makgora. Todos los componentes lo usan.

```js
// ✅ CORRECTO
import { useTeamPlayers } from '../../context/hooks/useFilterByView';
const teamPlayers = useTeamPlayers();

// ❌ INCORRECTO — no duplicar esta lógica
const teamPlayers = useMemo(() => {
  if (viewMode === 'general' && divisionView === 'all') { ... }
}, [players, viewMode, divisionView]);
```

**Componentes que lo usan:** `Roster`, `TrainingHub`, `Tribunal`, `AwardsHall`, `Estadisticas`, `CanchaTactica`, `Rivales`, `Dashboard`, `Calendario`

📁 **Archivo:** `src/context/hooks/useFilterByView.js`

### R3.2 — `useViewFilter()` para arrays no-player

Para filtrar fixtures, schedule, finances, etc.:

```js
import { useViewFilter } from '../../context/hooks/useFilterByView';
const filter = useViewFilter();
const teamFixtures = filter(fixtures);
```

---

## 4. Event Bus

### R4.1 — `useDataListener()` para consumir cambios

Cualquier componente que necesite reaccionar a cambios de otros módulos:

```js
import { useDataListener } from '../../context/hooks/useDataListener';

useDataListener('event_rsvp', () => {
  loadRsvps(); // se ejecuta cuando OTRO módulo modifica event_rsvp
});
```

**Componentes que escuchan:**
`Calendario`, `PlayerDashboard`, `Tribunal`, `Roster`, `FundraisingTab`, `MakgoraHub`

📁 **Archivo:** `src/context/hooks/useDataListener.js`

### R4.2 — Nuevos módulos: emit + listen

Al crear un nuevo módulo que modifica datos compartidos:

1. **Emitir** en `dataService.js` (o en el módulo si no está en dataService)
2. **Escuchar** en los consumidores con `useDataListener()`

---

## 5. Frontend

### R5.1 — Lazy-load para componentes pesados

Todos los componentes de feature se cargan con `React.lazy()`:

```js
const Roster = lazy(() => import('./components/Roster'));
const Calendario = lazy(() => import('./components/Calendario'));
```

**Excepciones (eager, siempre visibles):**
`Login`, `Dashboard`, `Header`, `Footer`, `Sidebar`, `Settings`

📁 **Archivo:** `src/App.jsx`

### R5.2 — Dynamic import para librerías pesadas

```js
// ✅ CORRECTO — solo carga cuando se usa
const { removeBackground } = await import('@imgly/background-removal');

// ❌ INCORRECTO — 762 KB en bundle principal
import { removeBackground } from '@imgly/background-removal';
```

📁 **Archivo:** `src/components/PhotoEditor.jsx`

### R5.3 — Dark mode instantáneo

El tema oscuro se aplica con un **script bloqueante en `<head>`** antes de que React renderice:

```html
<script>
  (function() {
    var t = localStorage.getItem('orcos_theme') || 'dark';
    document.documentElement.style.backgroundColor = '#0a0c10';
  })();
</script>
```

📁 **Archivo:** `index.html`

### R5.4 — Sin prompt de instalación PWA

El `manifest.json` no se vincula en `index.html`. El service worker solo se usa para caching offline.

---

## 6. Seguridad

### R6.1 — Sin SQL arbitrario

`exec_sql_batch` fue **dropeado**. No deben existir funciones RPC que acepten SQL crudo desde el frontend.

### R6.2 — Sin API keys en el código

- `seed/gemini-translate.mjs` contiene una key (⚠️ requiere limpieza)
- Las keys de AI providers van en `localStorage`, seteables desde Settings UI
- Las credenciales de Supabase van en `.env` (nunca commitear)

### R6.3 — RLS en todas las tablas

Verificar que cada tabla nueva tenga `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` y al menos una policy.

**Tablas que requieren verificación manual (sin CREATE TABLE en migrations):**
`message_reactions`, `notification_history`, `notification_templates`, `treasurer_deliveries`

### R6.4 — Errores nunca crudos al usuario

```js
// ✅ CORRECTO
catch (err) {
  showToast(parseSupabaseError(err).message, 'error');
}

// ❌ INCORRECTO
catch (err) {
  alert('Error: ' + err.message);
}
```

📁 **Archivo:** `src/utils/errorHandler.js`

---

## 7. Performance

### R7.1 — Catálogo de ejercicios usa RPC ligero

`getExerciseCatalog()` llama a `get_exercise_catalog_light()` (RPC) que devuelve solo campos livianos. Las instrucciones y GIFs se cargan perezosamente al abrir el modal.

📁 **Archivo:** `src/services/trainingService.js`

### R7.2 — Paginación en catálogos

Todos los listados grandes deben tener paginación. El catálogo de ejercicios usa 50 por página.

---

## Violaciones conocidas (⚠️ pendientes de corregir)

| # | Archivo | Problema | Severidad |
|---|---------|----------|-----------|
| 1 | `seed/gemini-translate.mjs:3` | API key de Google hardcodeada | CRÍTICA |
| 2 | `Messages.jsx` | `showToast('Error: ' + error.message)` sin `parseSupabaseError` | MEDIA |
| 3 | `activityFeed.jsx` | No escucha `messages` — no muestra mensajes nuevos | MEDIA |
| 4 | `makgoraTeams.is_active` | Sin filtro RLS — equipos inactivos visibles | BAJA |

---

## Cómo aplicar estas reglas

1. **Nuevo componente** → ¿necesita datos de otro módulo? → `useDataListener()`
2. **Nueva tabla en DB** → ¿FK? → Índice + RLS + ON DELETE CASCADE?
3. **Nueva escritura** → ¿va en `dataService.js`? → `emit()` al final
4. **Nuevo filtro de jugadores** → usar `useTeamPlayers()`, no duplicar lógica
5. **Nueva librería pesada** → `import()` dinámico, no estático
6. **¿Borrar un jugador?** → NUNCA. Soft-delete.
