# Seguridad de Rugby Orcos

Revisión del 2026-11-12. Todo lo que dice "probado" se verificó con sesiones reales de cada rol contra un Supabase local con el esquema de producción (`scripts/security/role-matrix.mjs`, 78 comprobaciones), no leyendo el código.

## Cómo se protege la información

- **Toda tabla tiene RLS** (seguridad por fila en la base de datos). El linter de Supabase en producción no reporta ninguna tabla abierta. Aunque alguien salte la app y llame la API directamente, la base de datos decide qué puede ver y cambiar.
- **Los roles los asigna la presidencia.** Un usuario no puede subirse de rango: lo impiden las guardas `guard_user_profile_privileges` y `guard_player_sensitive_fields` (migración 77). Probado con jugador y entrenador.
- **El dinero lo calcula la base de datos**: movimientos de caja (88), cuotas (92) y resumen de asistencia y penitencias (87). El teléfono no suma totales que otro pueda pisar.
- **Sin cuenta no se ve nada** del club: ni fichas, ni salud, ni dinero, ni cuentas.

## Matriz de permisos

Columnas de anónimo y jugador: probadas en todas las filas. Staff: probado en lecturas, cobro de mensualidades, subir de rol, crear cuentas y cambiar claves. Las demás celdas de staff salen de las reglas RLS (los recorridos E2E del entrenador las ejercitan: asistencia, partido en vivo, anuncios).

| Qué | Anónimo | Jugador | Entrenador | Tesorero | Presidente |
|---|---|---|---|---|---|
| Ver fichas de todo el club | ✗ | solo la suya | ✓ | ✓ | ✓ |
| Ver lesiones, bienestar y conmociones de otros | ✗ | ✗ (solo las suyas) | ✓ | ✓ | ✓ |
| Ver pagos de otros / libro de caja | ✗ | ✗ (solo los suyos) | ✓ | ✓ | ✓ |
| Editar la ficha o el progreso de otro jugador | ✗ | ✗ | ✓ | — | ✓ |
| Marcarse la cuota pagada / registrarse pagos | ✗ | ✗ | — | ✓ (pagos) | ✓ |
| Marcarse presente / borrarse burpees | ✗ | ✗ | ✓ (staff) | — | ✓ |
| Publicar anuncios oficiales | ✗ | ✗ | ✓ | ✓ | ✓ |
| Cobrar mensualidades | ✗ | ✗ | ✗ | ✓ | ✓ |
| Subirse de rol a presidente | ✗ | ✗ | ✗ | ✗ | — |
| Crear cuentas de staff / cambiar sus claves | ✗ | ✗ | ✗ | ✗ | ✓ |
| Alterar la tabla de posiciones | ✗ | ✗ | ✗ | ✗ | ✓ |
| Sacar emails desde el login | ✗ (solo el de un usuario exacto) | — | — | — | — |

## Fallas encontradas y corregidas (migración 95)

| # | Falla | Gravedad | Estado |
|---|---|---|---|
| 1 | Cualquier jugador leía lesiones, bienestar (sueño, estrés, dolor) y evaluaciones de conmoción de todos | Alta (datos de salud, Ley 1581) | Corregida y probada |
| 2 | Un jugador podía marcarse presente y borrarse sus burpees | Media | Corregida y probada |
| 3 | Un jugador podía cambiar el peso y los levantamientos de otro (`player_record_progress_snapshot`); el anónimo podía llamar la función | Media | Corregida y probada |
| 4 | Sin cuenta se sacaban emails de jugadores buscando una letra en el login | Media (fuga de datos personales) | Corregida y probada; el login con usuario exacto sigue funcionando |
| 5 | `admin_reset_staff_password` no revisaba quién llamaba. En producción hoy falla siempre por `search_path`, así que tampoco funcionaba el cambio de clave del staff | Crítica en cuanto alguien la "arreglara" | Corregida: solo presidencia, nunca sobre un rango superior, y ya funciona |
| 6 | `update_standing`: cualquier usuario podía alterar la tabla de posiciones | Media | Corregida (solo admin) |
| 7 | `gym_history`: cualquier usuario podía inventar historial de otra ficha | Baja | Corregida |
| 8 | `role_tier` sin `search_path` fijo (aviso del linter) | Baja | Corregida |

## Lo que depende del dueño del proyecto (panel de Supabase)

1. **Activar "Leaked password protection"** (Auth → Passwords): rechaza contraseñas filtradas en internet. El linter de Supabase lo marca como desactivado.
2. **Subir el mínimo de contraseña a 8 caracteres** (hoy es 6).
3. **Llaves de notificaciones** (Firebase y VAPID) en los secretos de las Edge Functions, si se quieren avisos con la app cerrada.
4. **Copias de seguridad**: confirmar que el plan tiene backups diarios o PITR.

## Avisos del linter que se aceptan

Unas 40 funciones `SECURITY DEFINER` se pueden llamar con sesión iniciada. Se revisó una por una: las que cambian datos validan rol o dueño por dentro, salvo las 4 corregidas arriba. Las de solo lectura de permisos (`is_admin`, `get_user_tier`, `has_club_role`…) no exponen datos. `respond_match_invitation` y `delete_invitation_guest` exigen el token secreto de la invitación. `makgora_return_expired_loans` solo devuelve préstamos ya vencidos.

## Repetir la revisión

```bash
ANON=<anon key local> CREDS=<archivo con PASSWORD=...> node scripts/security/role-matrix.mjs
```
Solo contra el entorno local (escribe datos de prueba). Sale con código 1 si alguna regla falla.
