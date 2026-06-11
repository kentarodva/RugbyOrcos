-- Exercise Catalog
-- Catálogo de ejercicios con nombres técnicos + locales (Colombia)
-- Los jugadores pueden crear ejercicios personalizados si no encuentran el que buscan

CREATE TABLE IF NOT EXISTS exercise_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name_technical VARCHAR(300) NOT NULL,
  name_local VARCHAR(300) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('campo','gym','recuperacion','prevencion')),
  subcategory VARCHAR(50) DEFAULT 'general',
  icon VARCHAR(10) DEFAULT '🏋️',
  difficulty INTEGER DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 5),
  description TEXT DEFAULT '',
  target_positions TEXT DEFAULT 'TODOS',
  equipment TEXT DEFAULT '',
  is_system BOOLEAN DEFAULT true,
  created_by UUID REFERENCES players(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE exercise_catalog ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Todos pueden leer el catálogo"
  ON exercise_catalog FOR SELECT
  TO authenticated
  USING (true);

-- Staff can insert/update system exercises; anyone can insert their own
CREATE POLICY "Staff puede gestionar ejercicios"
  ON exercise_catalog FOR INSERT
  TO authenticated
  WITH CHECK (get_user_tier() <= 3 OR NOT is_system);

CREATE POLICY "Staff puede actualizar ejercicios"
  ON exercise_catalog FOR UPDATE
  TO authenticated
  USING (get_user_tier() <= 3 OR created_by = auth.uid())
  WITH CHECK (get_user_tier() <= 3 OR (NOT is_system AND created_by = auth.uid()));

CREATE POLICY "Creador o staff pueden eliminar"
  ON exercise_catalog FOR DELETE
  TO authenticated
  USING (get_user_tier() <= 1 OR (NOT is_system AND created_by = auth.uid()));

-- Insert system exercises from the existing library
INSERT INTO exercise_catalog (code, name_technical, name_local, category, subcategory, icon, difficulty, description, target_positions, equipment) VALUES
('tackle_tecnico','Tackle Técnico Frontal (Hombro-Cadera)','Tackle Frontal','campo','tackle','🤼',2,'Entrada frontal con hombro derecho, cabeza detrás del oponente (10 repeticiones) | Tackle con impulso de cadera y cierre de brazos (10 repeticiones) | Tackle en movimiento de 5 metros con defensor pasivo (8 repeticiones)','TODOS','escudo'),
('tackle_lateral','Tackle Lateral y Canalización','Tackle Lateral','campo','tackle','🤼',3,'Canalizar al atacante hacia la banda en espacio de 5m (8 repeticiones) | Tackle lateral con barrido de piernas a velocidad (6 repeticiones) | 1 vs 1 en espacio abierto: defensor debe forzar el error (10 repeticiones)','Ala,Zaguero,Flanker','conos,escudo'),
('tackle_doble','Tackle Doble y Limpieza Inmediata','Doble Tackle','campo','tackle','🤼',3,'Tackle simultáneo de dos defensores al escudo (5 repeticiones) | Primer tackler sujeta, segundo busca el balón (5 repeticiones) | Simulación 3 vs 2 con tackle doble + clean out (8 repeticiones)','Pilar,Talonador,Segunda Línea,Flanker,Octavo','escudo'),
('tackle_persecucion','Tackle en Persecución (Cover Tackle)','Tackle Persecución','campo','tackle','🤼',4,'Sprint 20m en diagonal para tacklear al atacante antes del ensayo (8 repeticiones) | Lectura de línea de carrera: anticipar trayectoria del portador (6 repeticiones) | Tackle deslizante controlado en carrera (5 repeticiones)','Zaguero,Ala,Apertura','balon,conos'),
('pase_base','Pase Básico Estático y en Carrera','Pase Básico','campo','pase','🤲',1,'Pase estático a 5m con ambas manos (20 repeticiones) | Pase en movimiento lateral con recepción (15 repeticiones por lado) | Pase pop (corto) de descarga en contacto (10 repeticiones)','TODOS','balon'),
('pase_largo','Pase Largo (Skip Pass) 15-20 Metros','Pase Largo','campo','pase','🤲',3,'Pase en espiral de 15m hacia ambos lados (15 repeticiones) | Pase salteando un jugador intermedio a 20m (10 repeticiones) | Contraataque con pase largo desde zona de 22m (8 repeticiones)','Apertura,Centro,Medio Melé','balon,conos'),
('pase_presion','Pase Bajo Presión Defensiva','Pase Bajo Presión','campo','pase','🤲',4,'Medio melé saca balón con defensor presionando (15 repeticiones) | Apertura recibe y suelta pase plano con línea defensiva encima (12 repeticiones) | Descarga en el tackle: pasar antes de caer (10 repeticiones)','Medio Melé,Apertura,Centro','balon,escudo'),
('handling_alto','Manejo de Balón Alto (High Ball)','Recepción de Bombas','campo','pase','🤲',3,'Recepción de patada alta (bomba) con salto vertical (12 repeticiones) | Captura en carrera sin detenerse (10 repeticiones) | Recepción bajo presión de un defensor que carga (8 repeticiones)','Zaguero,Ala,Centro','balon'),
('scrum_empuje','Técnica de Empuje en Scrum (Crouch-Bind-Set)','Empuje de Scrum','campo','scrum','🏉',3,'Empuje controlado con pausas: mantener postura 5s (8 series) | Hit inicial explosivo al "set" con coordinación octal (10 repeticiones) | Simulación de scrum con oposición activa de 8 jugadores (6 series de 10s)','Pilar,Talonador,Segunda Línea,Flanker,Octavo','maquina_scrum'),
('lineout_salto','Salto y Levantamiento en Lineout','Salto de Lineout','campo','scrum','🏉',3,'Levantadores: técnica de carga con manos entrelazadas (10 repeticiones) | Saltador: salto vertical con captura en punto más alto (8 repeticiones) | Lineout completo con lanzador a 7m, 10m y 15m (5 repeticiones cada distancia)','Segunda Línea,Flanker,Octavo,Talonador','balon,conos'),
('ruck_cleanout','Limpieza de Ruck (Cleanout)','Limpieza de Ruck','campo','scrum','🏉',3,'Entrada baja al ruck: hombro a la cadera del oponente (12 repeticiones) | Limpiar ruck y asegurar posesión en menos de 3s (10 repeticiones) | Ruck 3 vs 2 con balón disputado (8 series)','Pilar,Talonador,Segunda Línea,Flanker,Octavo','escudo,balon'),
('maul_defensivo','Defensa de Maul y Contramaul','Defensa de Maul','campo','scrum','🏉',3,'Formación rápida de maul defensivo en 2 segundos (8 repeticiones) | Contramaul: empuje para detener el avance y robar balón (6 repeticiones) | Salida explosiva del maul con balón hacia el medio melé (5 repeticiones)','Pilar,Talonador,Segunda Línea,Flanker,Octavo','balon'),
('patada_cajon','Patada de Cajón (Box Kick)','Box Kick','campo','patada','🦵',3,'Box kick desde la base del scrum a 25-30m de altura (15 repeticiones) | Box kick con persecución del ala para presionar recepción (10 repeticiones) | Variación: box kick corto para auto-recuperación (8 repeticiones)','Medio Melé','balon,conos'),
('patada_tactica','Patada Táctica al Espacio (Territorial)','Patada Táctica','campo','patada','🦵',4,'Patada al touch desde campo propio buscando la banda a 30m (12 repeticiones) | Grubber kick (patada rasa) para superar la línea defensiva (10 repeticiones) | Patada cruzada (cross-field kick) al ala opuesto a 30m (8 repeticiones)','Apertura,Zaguero,Centro','balon,conos'),
('patada_palos','Conversión a Palos','Patada a Palos','campo','patada','🦵',2,'Conversiones desde 15m frontal con tee (12 repeticiones) | Penales desde ángulo cerrado (22m, 30°) (10 repeticiones) | Drop goal desde 25m con defensor cargando (8 repeticiones)','Apertura,Zaguero,Centro','balon,tee'),
('evasion_sidestep','Evasión con Cambio de Dirección (Side-Step)','Side-Step','campo','evasion','🏃',3,'Side-step explosivo con cambio de ritmo en 5m (10 repeticiones) | Evasión 1 vs 2 en espacio reducido (8 repeticiones) | Finta de pase + aceleración al hueco defensivo (6 repeticiones)','Centro,Ala,Zaguero,Apertura','conos,balon'),
('ataque_profundo','Ataque en Profundidad (Línea de Tres Cuartos)','Ataque Tres Cuartos','campo','evasion','🏃',3,'Línea de backs corriendo desde profundidad a toda velocidad (10 repeticiones) | Loop (lazo) del apertura alrededor del primer centro (8 repeticiones) | Switch (cruce) entre centros para romper la línea (8 repeticiones)','Apertura,Centro,Ala,Zaguero','balon,conos'),
('contraataque','Contraataque desde Patada Recibida','Contraataque','campo','evasion','🏃',4,'Recepción de patada + arranque explosivo hacia espacio libre (10 repeticiones) | Contraataque coordinado con pase de apoyo al ala opuesto (8 repeticiones) | Contraataque roto: identificar hueco en defensa desorganizada (6 repeticiones)','Zaguero,Ala','balon,conos'),
('defensa_linea','Defensa en Línea Organizada (Drift Defense)','Línea Defensiva','campo','defensa','🛡️',3,'Línea defensiva de 15m: subir y bajar al unísono con el medio melé (10 repeticiones) | Drift defense: deslizamiento lateral cubriendo el espacio exterior (8 repeticiones) | Blitz defense: presión rápida sobre el apertura rival (6 repeticiones)','TODOS','conos,balon'),
('defensa_tryline','Defensa de Última Línea (Try-Line)','Defensa Tryline','campo','defensa','🛡️',3,'Defensa a 5m del in-goal: mantener la línea y no ceder metros (8 repeticiones) | Defensa numérica 14 vs 15 tras tarjeta amarilla (6 repeticiones) | Goal-line stand: 5 fases defensivas consecutivas sin conceder ensayo (4 series)','TODOS','balon,escudo'),
('defensa_pantalla','Pantalla Defensiva sobre el Apertura','Presión al Apertura','campo','defensa','🛡️',3,'Presión al apertura rival en recepción de pase (12 repeticiones) | Pantalla doble: flanker + centro cierran opciones de pase (8 repeticiones) | Carga al pateador: bloquear patada táctica rival (6 repeticiones)','Flanker,Octavo,Centro','balon,conos'),
('gym_sentadilla','Sentadilla Trasera con Barra (Back Squat)','Sentadilla con Barra','gym','fuerza_inferior','🦵',3,'4 series x 6 repeticiones al 80% 1RM | Control excéntrico: bajar en 3 segundos, subir explosivo | Descanso 2 minutos entre series','TODOS','barra,rack'),
('gym_peso_muerto','Peso Muerto Convencional','Peso Muerto','gym','fuerza_inferior','🦵',3,'3 series x 5 repeticiones al 80% 1RM | Mantener espalda neutra, empuje de cadera al bloquear | Descanso 2:30 entre series','TODOS','barra'),
('gym_prensa','Prensa de Piernas 45°','Prensa de Piernas','gym','fuerza_inferior','🦵',2,'4 series x 10 repeticiones (carga moderada-alta) | Énfasis en profundidad y empuje explosivo | Descanso 90 segundos entre series','Pilar,Talonador,Segunda Línea','maquina_prensa'),
('gym_sentadilla_frontal','Sentadilla Frontal (Front Squat)','Sentadilla Frontal','gym','fuerza_inferior','🦵',3,'3 series x 8 repeticiones al 65% 1RM | Barra en posición de rack frontal, codos altos | Descanso 2 minutos entre series','Flanker,Octavo,Pilar','barra,rack'),
('gym_press_banca','Press de Banca con Barra','Press de Banca','gym','fuerza_superior','💪',2,'4 series x 6 repeticiones al 75% 1RM | Retracción escapular, arco lumbar controlado | Descanso 2 minutos entre series','TODOS','barra,banco'),
('gym_dominadas','Dominadas (Pull-Ups)','Dominadas','gym','fuerza_superior','💪',3,'3 series al fallo (mínimo 8 repeticiones) | Agarre prono, ancho de hombros | Descanso 90 segundos entre series','TODOS','barra_dominadas'),
('gym_remo','Remo con Barra (Barbell Row)','Remo con Barra','gym','fuerza_superior','💪',2,'4 series x 8 repeticiones | Torso a 45°, tirar de la barra hacia el abdomen inferior | Descanso 90 segundos entre series','TODOS','barra'),
('gym_press_militar','Press Militar de Pie (Overhead Press)','Press Militar','gym','fuerza_superior','💪',3,'3 series x 5 repeticiones al 70% del peso corporal | Core activado, evitar arquear la espalda | Descanso 2 minutos entre series','TODOS','barra,rack'),
('gym_power_clean','Power Clean (Cargada de Potencia)','Cargada de Potencia','gym','potencia','⚡',4,'4 series x 3 repeticiones al 70% 1RM | Triple extensión: tobillos, rodillas, cadera | Descanso 2:30 entre series','Flanker,Octavo,Centro,Ala','barra'),
('gym_salto_cajon','Salto al Cajón (Box Jump)','Salto al Cajón','gym','potencia','⚡',2,'4 series x 6 saltos a cajón de 60-75cm | Aterrizaje suave con flexión de rodillas | Descanso 60 segundos entre series','TODOS','cajon'),
('gym_arranque','Arranque con Mancuerna (DB Snatch)','Arranque con Mancuerna','gym','potencia','⚡',3,'3 series x 6 repeticiones por brazo | Movimiento fluido desde el suelo hasta arriba en un solo gesto | Descanso 90 segundos entre series','Flanker,Octavo,Ala','mancuerna'),
('gym_empuje_trineo','Empuje de Trineo Pesado','Trineo Pesado','gym','potencia','⚡',3,'5 pasadas de 15m con carga pesada (80-120kg) | Posición baja de empuje, pasos cortos y potentes | Descanso 2 minutos entre pasadas','Pilar,Talonador,Segunda Línea,Flanker,Octavo','trineo'),
('gym_plancha','Plancha Frontal con Peso','Plancha Abdominal','gym','core','🌀',2,'3 series x 60 segundos con disco de 10-20kg en la espalda | Caderas alineadas, abdomen contraído | Descanso 60 segundos entre series','TODOS','disco'),
('gym_rueda','Rueda Abdominal (Ab Wheel Rollout)','Rueda Abdominal','gym','core','🌀',3,'3 series x 10 repeticiones | Extensión controlada hasta posición horizontal | Descanso 60 segundos entre series','TODOS','rueda_abdominal'),
('gym_pallof','Press Pallof Anti-Rotación','Pallof Press','gym','core','🌀',2,'3 series x 12 repeticiones por lado | Resistir la rotación: brazos extendidos, core firme | Descanso 45 segundos entre series','TODOS','polea,banda'),
('gym_sprint_resistido','Sprint con Trineo Ligero (Aceleración)','Sprint con Trineo','gym','velocidad','🏃‍♂️',3,'6 pasadas de 10m con carga ligera (20-30kg) | Énfasis en aceleración de los primeros 5 metros | Descanso 90 segundos entre pasadas','Ala,Zaguero,Centro','trineo'),
('gym_escalera','Escalera de Agilidad y Coordinación','Escalera de Agilidad','gym','velocidad','🏃‍♂️',2,'Single leg: un pie por cuadro a máxima velocidad (4 pasadas) | Two feet in: dos pies por cuadro (4 pasadas) | Icky shuffle: patrón lateral avanzado (4 pasadas por lado)','TODOS','escalera_agilidad'),
('gym_cambio_direccion','Cambios de Dirección con Conos (Pro-Agility)','Cambios de Dirección','gym','velocidad','🏃‍♂️',3,'5-10-5 drill: sprint 5m, cambio, 10m, cambio, 5m (6 series) | L-Drill: tres conos en L, tocar cada uno a máxima velocidad (4 series) | Descanso 60 segundos entre series','TODOS','conos'),
('rec_foam_roller','Liberación Miofascial con Foam Roller','Foam Roller','recuperacion','movilidad','🩹',1,'Rodillo en cuádriceps: 2 minutos por pierna | Rodillo en isquiotibiales: 2 minutos por pierna | Rodillo en espalda alta (torácica): 3 minutos | Rodillo en glúteos y piriforme: 2 minutos por lado | Rodillo en pantorrillas: 1 minuto por pierna','TODOS','foam_roller'),
('rec_estiramiento','Rutina de Estiramientos Post-Partido','Estiramientos','recuperacion','movilidad','🩹',1,'Estiramiento de isquiotibiales sentado: 30s x 2 | Estiramiento de cuádriceps de pie: 30s x 2 por pierna | Estiramiento de aductores (mariposa): 30s x 2 | Rotación de columna torácica sentado: 10 repeticiones por lado | Estiramiento de hombro cruzado: 30s x 2 por brazo','TODOS',''),
('rec_hielo','Protocolo de Recuperación con Hielo','Hielo','recuperacion','movilidad','🩹',1,'Baño de hielo en piernas: 10 minutos a 10-12°C | Compresas frías en hombros y cuello: 15 minutos | Alternar 2 min frío / 2 min tibio en articulaciones cargadas (3 ciclos)','TODOS','hielo'),
('prev_hombros','Fortalecimiento Preventivo de Hombros','Hombros Preventivo','prevencion','hombros','🛡️',2,'Rotación externa con banda elástica: 3 x 15 por brazo | Elevaciones laterales con mancuerna ligera: 3 x 12 | Y-T-W-L en el suelo: 3 series de 8 repeticiones cada letra | Face pulls con banda: 3 x 15','TODOS','banda,mancuerna_ligera'),
('prev_cuello','Fortalecimiento Isométrico de Cuello','Cuello Isométrico','prevencion','cuello','🧣',2,'Isométrico frontal: empujar contra la mano en la frente 10s x 3 | Isométrico lateral: empujar contra la mano en el lado 10s x 3 por lado | Isométrico trasero: empujar contra la mano en la nuca 10s x 3 | Puente de cuello (wrestler bridge) modificado: 15s x 3','Pilar,Talonador,Segunda Línea,Flanker,Octavo','toalla'),
('prev_rodillas','Prevención de Lesiones de Rodilla (LCA)','Rodilla Preventivo','prevencion','rodillas','🦵',2,'Sentadilla a una pierna controlada: 3 x 8 por pierna | Puente de glúteo con banda: 3 x 15 | Caída y estabilización unilateral desde cajón bajo: 3 x 6 por pierna | Caminata lateral con banda en rodillas: 3 x 12 pasos por lado','TODOS','banda'),
('prev_tobillos','Propiocepción y Fortalecimiento de Tobillos','Tobillos Preventivo','prevencion','tobillos','🦶',1,'Equilibrio monopodal en bosu: 30s x 3 por pierna | Alfabeto con el pie: dibujar letras A-Z en el aire con el tobillo x 2 | Dorsiflexión con banda de resistencia: 3 x 15 por tobillo','TODOS','bosu,banda'),
('cond_bronco','Test Bronco (Resistencia Intermitente)','Test Bronco','campo','resistencia','💨',5,'Ida y vuelta: 20m, 40m, 60m. Repetir 5 veces sin pausa. | Meta forwards: < 5:15 | Meta backs: < 4:45 | Descanso completo entre intentos si se repite','TODOS','conos'),
('cond_intervalos','Intervalos de Alta Intensidad (HIIT Rugby)','HIIT Rugby','campo','resistencia','💨',4,'Sprint 30m + trote recuperación 30m x 10 | Sprint 60m + 10 burpees + trote 60m x 6 | Descanso 3 minutos y repetir el bloque completo','TODOS','conos'),
('cond_ida_vuelta','Yo-Yo Intermittent Recovery Test Nivel 1','Test Yo-Yo','campo','resistencia','💨',4,'Carrera ida y vuelta 20m al ritmo de los pitidos | 10 segundos de recuperación entre cada ida/vuelta | El test termina cuando el jugador no llega a la línea en 2 pitidos consecutivos','TODOS','conos,audio'),
('liderazgo_comunicacion','Comunicación y Liderazgo en Juego Abierto','Liderazgo Comunicación','campo','liderazgo','👑',2,'Llamadas de línea defensiva: comunicar deriva y blitz en tiempo real (10 min) | Organización de la salida de 22m: comunicar opción de patada o carrera (5 min) | Simulación de arenga de medio tiempo: motivar al equipo con instrucciones claras (5 min)','Entrenador,Capitán,Subcapitán','balon'),
('liderazgo_decisiones','Toma de Decisiones bajo Fatiga','Decisiones Bajo Fatiga','campo','liderazgo','👑',4,'Tras 3 sprints de 40m: decidir entre patada a palos, touch o scrum en <5 segundos (8 series) | Lectura de superioridad numérica: identificar el 3 vs 2 y organizar el ataque (6 series) | Simulación de últimos 2 minutos con resultado ajustado (4 series)','Capitán,Subcapitán,Medio Melé,Apertura','balon,conos')
ON CONFLICT (code) DO NOTHING;
