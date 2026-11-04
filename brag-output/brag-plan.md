# Brag Plan: Rugby Orcos Negros — Reino Manager v5.0

## What is this app?
Una PWA de gestión integral para el club de rugby **Orcos Negros** con arquitectura **Supabase-First** (53 tablas con RLS) que convierte la administración deportiva de 80+ jugadores en un sistema RPG de fantasía épica con rangos de Horda, Torneo Mak'Gora, Tribunal de penitencias y entrenador de IA.

## The angle
La mayoría de los clubes amateurs llevan la asistencia y las cuotas en un Excel roto; **Orcos Negros** gobierna su club como un Reino donde el presidente es *Señor de la Guerra*, el tesorero es *Guardián del Botín*, las faltas se pagan con burpees en el *Tribunal Disciplinario* y un *IA Personal Trainer* cruza **14 fuentes de datos** reales por Guerrero.

## Hook (first 2-3 seconds)
Sobre fondo negro abisal (`#07090e`) con destello esmeralda (`#00e676`), aparece el escudo de **RUGBY ORCOS NEGROS** y el titular:
**"¿Un Excel para gestionar tu club de rugby? Nosotros fundamos un Reino."**

## Key moments (the middle)
- **El Centro de Mando del Reino (3.0s–8.7s):** Se despliega el *Command Header v5.0* (`Señor de la Guerra · Online`) con 3 tarjetas secuenciales al ritmo del beat: **80+ Guerreros activos**, **53 tablas Supabase con RLS 100%** y **Caja del Botín + Rifas FIFO**.
- **Ficha RPG, Mak'Gora y Pizarra Táctica (8.7s–13.1s):** Tarjeta de Guerrero con barras animadas (**Fuerza · Velocidad · Resistencia · Técnica**), selector en vivo de **11 formaciones tácticas** y badge del torneo interno **Mak'Gora (6 clanes)** + **43 premios del Salón de la Fama**.
- **IA Personal Trainer de 14 Fuentes (13.1s–17.5s):** Simulación de clic en **"Generar Plan IA"** (`Groq · DeepSeek · Gemini`): el motor procesa **14 fuentes de datos** (1RM, Wellness 7d, protocolo HIA, tries, tackles, asistencia) y emite el plan de campo y gimnasio con alerta de sobrecarga cero.

## Outro / punchline
A los **17.5s** cae el golpe de campana épico con el escudo oficial, el lema real del club:
**"En el scrum y en la vida, siempre juntos. Siempre Orcos."**
y el badge final: **RUGBY ORCOS NEGROS · Reino Manager v5.0 — `rugby-orcos.vercel.app`**.

## User flow worth showing
1. **Entry:** Ingresar al Command Center como *Señor de la Guerra* con sincronización en tiempo real (`Supabase-First`) y estado de tropa activa.
2. **Key Action:** Inspeccionar los atributos RPG del Guerrero, alternar entre modo **Club** y **Mak'Gora**, y activar el **IA Personal Trainer**.
3. **Result:** Plan personalizado generado desde 14 fuentes de datos y listo en el dashboard de 7 tabs del Guerrero.

## Tone
- Preset: `cinematic`
- Creative direction: Epic dark-neon RPG sports command center launch
- Interpretation: Tipografía contundente en `Outfit`, cortes precisos sobre beats fuertes, estética oscura glassmorphism (`#07090e` + `#00e676` + `#ffb300`) y datos 100% reales extraídos del código del proyecto.

## Format: landscape — 1920x1080
## Duration: 20 seconds

## Visual identity (from the project)
- Background: `#07090e` (`--bg-dark`) y paneles `#0f1624` (`--bg-surface-solid`)
- Accent: `#00e676` (`--color-primary` neon green) y `#ffb300` (`--color-gold` RPG rank gold)
- Text: `#f5f6f9` (`--color-text`) y `#8fa0b5` (`--color-text-muted`)
- Display font: `Outfit` (700/800/900)
- Body font: `Inter` (400/500/600/700)
- Strongest visual element: Command Header v5.0 con insignia `Señor de la Guerra`, barras RPG de jugador y panel de IA Personal Trainer con las 14 fuentes de datos.

## Share copy (draft)
Construimos Rugby Orcos Negros — Reino Manager v5.0: una PWA Supabase-First donde 80+ jugadores tienen atributos RPG, torneos Mak'Gora, Tribunal Disciplinario, 43 premios automáticos y un IA Personal Trainer alimentado por 14 fuentes de datos. "En el scrum y en la vida, siempre juntos. Siempre Orcos."

## Audio direction
- Role: Cinematic support con pulso rítmico limpio
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (109.96 BPM)
- Music treatment: Inicia en `0.0s` a volumen `0.34`, mantiene pulso constante y hace fade suave en los últimos `1.8s` para dejar resonar la campana final.
- Music cue guidance: Preset `happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json` leído; strong cues en **8.74s**, **13.11s** y **17.47s**; ventana de beat-grid para tarjetas secuenciales en `3.82s`, `4.91s`, `6.00s` y atributos RPG en `9.29s`, `9.83s`, `10.37s`, `10.93s`.
- Audio-reactive treatment: subtle; el halo verde neón (`#00e676`) y el borde dorado de las tarjetas respiran suavemente con el pulso musical.
- SFX posture: moderate, sincronizado al inicio de cada transición y acción simulada.
- Audio-coupled moments:
  - Apertura del Hook (`0.2s`): `impactSoft_medium_001.ogg`
  - Aparición de las 3 métricas del Reino (`3.82s`, `4.91s`, `6.00s`): `card-slide-1.ogg` / `click_003.ogg`
  - Cambio a Ficha RPG & Mak'Gora (`8.74s` strong cue): `impactSoft_medium_004.ogg`
  - Clic simulado en IA Personal Trainer (`13.11s` strong cue): `click_002.ogg` + `bong_001.ogg`
  - Golpe de cierre con escudo Orcos (`17.47s` strong cue): `impactBell_heavy_000.ogg`
- Restraint rule: No usar efectos estridentes de alta frecuencia repetidos ni tapar la lectura de los titulares.

## Storyboard

### Scene 1 — El Llamado de la Horda (Hook) — 3.2s (0.0s–3.2s)
Escudo oficial de `orcos_logo.png` emergiendo con halo verde neón `#00e676` sobre `#07090e`. Badge superior: `REINO MANAGER v5.0 · SUPABASE-FIRST`. Titular gigante en `Outfit`: **"¿Un Excel para tu club de rugby? Nosotros fundamos un Reino."**
Sequential/interaction: none (slam-in rápido en 0.35s y hold limpio durante 2.6s para lectura completa).
Audio intent: Entrada épica e inmediata que captura la atención en el primer segundo.
Audio-coupled idea: `impactSoft_medium_001.ogg` en `0.15s`.
Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
Transition mood: clean wipe → Scene 2

### Scene 2 — Command Center del Reino — 5.5s (3.2s–8.7s)
Recreación fiel del **Command Header v5.0** (`RUGBY ORCOS NEGROS`, rango `⚔️ Señor de la Guerra`, estado `● Online · 53 Tablas RLS`, toggle `🏰 Club / ⚔️ Mak'Gora`). Debajo entran secuencialmente 3 tarjetas de métricas reales:
1. **80+ Guerreros** (Roster activo, HIA & Sin-Bin en vivo)
2. **Guardián del Botín** (Caja chica, Membresías y Rifas FIFO)
3. **Tribunal y Salón de la Fama** (Penitencias de burpees + **43 premios automáticos**)
Sequential/interaction: yes — las 3 tarjetas entran escalonadas en beats (`3.82s`, `4.91s`, `6.00s`) y quedan fijas en pantalla más de 2.5s.
Audio intent: Sensación de control total y precisión táctica.
Audio-coupled idea: `card-slide-1.ogg` al entrar la primera tarjeta y `click_003.ogg` al conmutar el pill de navegación rápida.
Transition mood: dramatic wipe en strong cue `8.74s` → Scene 3

### Scene 3 — Atributos RPG, Pizarra de 11 Formaciones y Mak'Gora — 4.4s (8.7s–13.1s)
Izquierda: Ficha del **Guerrero** con avatar mitológico y 4 barras de atributos RPG animándose (`Fuerza 94`, `Velocidad 88`, `Resistencia 91`, `Técnica 86`) + badge `Forjar Credenciales`.
Derecha: Mini-vista de la **Pizarra Táctica (11 formaciones drag-and-drop)** junto a la tabla del **Torneo Mak'Gora (6 equipos internos con préstamos)**.
Sequential/interaction: yes — las 4 barras de atributos RPG crecen en cascada (`9.29s` a `10.93s`).
Audio intent: Energía competitiva de videojuego aplicada al deporte real.
Audio-coupled idea: `impactSoft_medium_004.ogg` en el corte de `8.74s`.
Transition mood: clean slide en strong cue `13.11s` → Scene 4

### Scene 4 — IA Personal Trainer (14 Fuentes de Datos) — 4.4s (13.1s–17.5s)
Panel de **TrainingHub · IA Multi-Proveedor (Groq · DeepSeek · Gemini)**. Un cursor simulado hace clic en **"Generar Plan del Guerrero"**. Se iluminan chips con las **14 fuentes de datos reales** (`Gimnasio 1RM`, `Wellness 7d`, `Protocolo HIA`, `Tries & Tackles`, `Racha y Asistencia`, `Detector de Sobreentreno`) y aparece el plan de Campo + Gym listo con `594 Tests Verificados`.
Sequential/interaction: yes — clic simulado en `13.2s` y aparición del panel de resultado con check verde `#00e676`.
Audio intent: Confirmación inteligente y tecnológica.
Audio-coupled idea: `click_002.ogg` en el clic + `bong_001.ogg` al completarse el plan IA.
Transition mood: dramatic reveal en strong cue `17.47s` → Scene 5

### Scene 5 — Siempre Orcos (Outro & Payoff) — 2.5s (17.5s–20.0s)
Escudo central de **Rugby Orcos Negros** rodeado de resplandor esmeralda y dorado. Cita oficial del proyecto:
**"En el scrum y en la vida, siempre juntos. Siempre Orcos."**
Subtítulo inferior: `RUGBY ORCOS NEGROS · REINO MANAGER v5.0 · WEB & ANDROID APK`.
Sequential/interaction: none — impacto sólido en `17.47s` y hold estable hasta `20.0s`.
Audio intent: Cierre memorable de tráiler con campana grave.
Audio-coupled idea: `impactBell_heavy_000.ogg` en `17.47s`.

**Music mood for this video:** cinematic
**Audio summary:** Pulso electrónico firme a 110 BPM con golpes graves en las 3 transiciones clave (`8.74s`, `13.11s`, `17.47s`), clics táctiles sutiles en la UI y campana épica en el cierre.
