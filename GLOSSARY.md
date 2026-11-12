# Glosario — Rugby Orcos Negros

El lenguaje del club: lo que significa cada palabra cuando la usan el staff, los jugadores y el código.
Si una palabra no está aquí o se usa con otro sentido, se discute y se anota antes de programar.

Las palabras de la columna _Evitar_ no se usan en pantallas, documentos ni nombres nuevos.

## Personas y permisos

**Guerrero**:
Un jugador inscrito en el club, tenga o no cuenta para entrar a la app.
_Evitar_: miembro, socio, deportista (en pantallas)

**Ficha**:
El registro completo de un guerrero: identidad, salud, perfil táctico, gimnasio e indumentaria. "Mi Ficha" es la ficha propia vista por el guerrero.
_Evitar_: perfil (ese es el del usuario), hoja de vida

**Usuario**:
Una cuenta que inicia sesión en la app. Un guerrero puede no tener usuario, y un usuario de staff puede no ser guerrero.
_Evitar_: cuenta de jugador

**Rango** (rol de sistema):
Lo que un usuario puede hacer en la app: desarrollador, presidente, promotor, entrenador, tesorero, árbitro o jugador. "Sin rango en el Reino" significa que no se pudo determinar.
_Evitar_: rol (a secas), permiso, cargo

**Nivel**:
La jerarquía numérica de los rangos: desarrollador 0, presidente 1, promotor 2, entrenador, tesorero y árbitro 3, jugador 4. Un número menor da más poder.
_Evitar_: tier (en documentos para el club)

**Staff**:
Cualquier usuario de nivel 3 o menor, es decir, todos menos los jugadores.
_Evitar_: admin, directiva

**Administrador**:
Un usuario desarrollador, presidente o promotor activo. Puede gestionar lo que el resto del staff no puede, como borrar registros de otros.
_Evitar_: admin (en pantallas), superusuario

**Rol en el equipo**:
El papel deportivo de un guerrero dentro del plantel: titular, capitán, subcapitán o suplente. No da permisos en la app.
_Evitar_: rango, rol (a secas)

**Estado del guerrero**:
Activo, inactivo, lesionado o suspendido.

**Guerrero archivado**:
Un guerrero retirado del plantel. Nunca se borra: se archiva y se puede recuperar.
_Evitar_: eliminar, borrar, dar de baja (ver **Baja**)

## Club y estructura

**Reino**:
El club entero visto desde la app (la app se llama Reino Manager).

**División**:
Uno de los cuatro planteles del club: masculina mayor, femenina mayor, juvenil masculina (M18) y juvenil femenina (M18).
_Evitar_: categoría, equipo (ver **Clan**)

**Orcas**:
Nombre de la división femenina mayor.

**Modalidad**:
Rugby XV (15 jugadores) o Sevens (7 jugadores). Cambia la formación, los puestos y la duración del partido.
_Evitar_: formato

## Calendario y partidos

**Evento**:
Cualquier cita del calendario. Tiene un tipo (entrenamiento, partido, evento o reunión) y un alcance: una división, todo el club, un clan o guerreros concretos.
_Evitar_: actividad, cita

**Entrenamiento**:
Un evento de práctica. En pantallas cortas puede decirse "Entreno".
_Evitar_: práctica, sesión (en pantallas)

**Partido programado**:
Un partido futuro contra un rival, con fecha, hora y cancha.
_Evitar_: fixture (en pantallas), batalla (fuera de textos de ambientación)

**Resultado**:
Un partido ya jugado, con marcador, tries y MVP.
_Evitar_: fixture, partido jugado

**Convocatoria**:
El llamado oficial a un partido programado, al que cada guerrero responde con su **Confirmación**.

**Confirmación**:
La respuesta de un guerrero a un evento o convocatoria: voy, duda o no voy.
_Evitar_: RSVP (en pantallas), disponibilidad

**Baja**:
En una confirmación, que el guerrero no asistirá. No significa archivar al guerrero.
_Evitar_: usar "baja" para retirar a alguien del plantel

**Asistencia**:
Lo que realmente pasó en un evento: presente, tarde, ausente justificado o ausente injustificado. Se distingue de la confirmación, que es lo que el guerrero dijo antes.

**Rival**:
Un club contra el que juegan los Orcos.
_Evitar_: oponente, contrincante

**Torneo**:
Una competición con varios partidos y una tabla de posiciones.
_Evitar_: campeonato (salvo en el nombre oficial de uno), liga

**Partido en vivo**:
El marcador que se lleva en tiempo real durante un partido y se ve en los teléfonos de todos.
_Evitar_: Match Center (como nombre de la cosa; es el nombre de la pantalla)

**Anotador designado**:
El guerrero al que el staff autoriza a llevar el marcador de un partido en vivo.

**Tercer tiempo**:
El encuentro social después del partido.

## Táctica

**Pizarra**:
La cancha táctica donde el entrenador arma la alineación.
_Evitar_: cancha táctica (en pantallas), tablero

**Alineación**:
Qué guerrero ocupa cada puesto en un partido, incluidos los suplentes.
_Evitar_: lineup, once, quince

**Puesto**:
Una posición numerada de la formación (1 a 15 en XV). Cada guerrero tiene una posición principal y puede tener una secundaria.
_Evitar_: slot

## Disciplina

**Tribunal**:
El módulo y la comisión que revisan infracciones y deciden sanciones.

**Infracción**:
Una falta registrada a un guerrero, en partido, en entrenamiento o fuera de la cancha.
_Evitar_: falta (a secas), multa

**Castigo físico**:
Los burpees y conos que un guerrero debe pagar por sus infracciones.
_Evitar_: Sin-Bin (ver abajo), penalidad

**Sin-Bin**:
La exclusión temporal de 10 minutos por tarjeta amarilla durante un partido.
_Evitar_: usar "Sin-Bin" para los castigos físicos

## Salud

**HIA**:
La evaluación de conmoción cerebral del protocolo de World Rugby. Un guerrero en reposo por HIA no puede entrar en una alineación.

**Lesión**:
Una lesión registrada a un guerrero, con su fase de recuperación (1 a 4).

**Bienestar**:
El registro diario del guerrero sobre sueño, fatiga, dolor, estrés y ánimo.
_Evitar_: wellness (en pantallas)

**Datos médicos**:
Tipo de sangre, EPS, alergias, condiciones médicas y contactos de emergencia. Solo los ven el staff y el propio guerrero.

## Makgora

**Makgora**:
La competición interna del club, en la que los guerreros se reparten en clanes que juegan entre sí. Sus eventos, partidos e infracciones son aparte de los del club.
_Evitar_: liga interna

**Clan**:
Un equipo de la Makgora. Puede ser externo (invitado de fuera del club).
_Evitar_: equipo, team (equipo se confunde con división)

**Jefe de clan**:
El usuario que administra un clan: su escudo, lema y plantilla.
_Evitar_: chief (en pantallas), capitán (ese es un rol en el equipo)

**Préstamo**:
La cesión temporal de un guerrero de un clan a otro por un número de días. Vuelve solo al vencer.
_Evitar_: traspaso, fichaje

**Atributos**:
Las estadísticas de juego de un guerrero (fuerza, placaje, resistencia, velocidad, técnica), de 10 a 99. **OVR** es su valoración general.

## Finanzas

**Movimiento**:
Una entrada del libro de caja: un ingreso o un egreso.
_Evitar_: transacción, registro

**Cuota**:
El pago periódico de un guerrero al club.
_Evitar_: membresía, mensualidad (en pantallas, escoger una: cuota)

**Actividad pro-fondos**:
Una campaña para recaudar dinero: rifa, venta de comida u otra.
_Evitar_: fundraising, colecta

**Al día / Moroso**:
Si el guerrero tiene sus cuotas pagadas o lleva más de 30 días de retraso.

**Paz y salvo**:
La constancia de que un guerrero no debe nada al club. No se emite a morosos.

## Ambigüedades abiertas

- **Préstamo**: el documento 03 lo describe como préstamo entre clubes, pero la app lo hace entre clanes de la Makgora. Este glosario sigue a la app hasta que el club decida.
- **"Baja"** se usa hoy en la app con tres sentidos: no asistir a un evento, retirar del plantel ("Dar de Baja al Orco") y el tiempo fuera por lesión ("Semanas de baja"). El segundo se llama ahora **Guerrero archivado**; para el tercero se propone "tiempo de recuperación".
- **Sin-Bin**: la tarjeta de Inicio "Disciplina / Sin-Bin" muestra castigos físicos (burpees). Según este glosario debería decir "Castigo físico".
