# RUGBY ORCOS NEGROS — ARQUITECTURA TÉCNICA & MANUAL MAESTRO DE LA APLICACIÓN

> **Versión:** 5.2.0  
> **Fecha de Actualización:** 2026-11-05  
> **Stack:** React 18 · Vite 8 · Supabase (PostgreSQL) · Tailwind/Custom CSS · PWA Workbox · Web Audio API · Vitest  

---

## 1. VISIÓN GENERAL Y FILOSOFÍA DEL SISTEMA

**Rugby Orcos Negros Club Manager** es una Progressive Web Application (PWA) de alto rendimiento diseñada para la administración integral, deportiva, táctica, médica, financiera y motivacional del club de rugby **Orcos Negros**.

El sistema combina el rigor de la gestión deportiva profesional (protocolos HIA de World Rugby, control de cargas, formaciones de XV y Sevens, finanzas de tesorería y actas arbitrales) con mecánicas de **gamificación RPG de fantasía épica (Makgora)**, convirtiendo cada entrenamiento, partido y métrica física en puntos de experiencia, rangos de combate y tarjetas coleccionables.

### Principios Arquitectónicos
1. **Supabase-First (Única Fuente de Verdad):** La base de datos PostgreSQL en Supabase almacena el estado definitivo. Las mutaciones se sincronizan de forma atómica y en tiempo real.
2. **Local-First Resilient Cache:** La aplicación cachea en memoria y almacenamiento local seguro para permitir visualización y operación en canchas sin cobertura de red (Modo Offline).
3. **Fail-Closed & Role-Based Access Control (RBAC):** Acceso restringido por roles (`desarrollador`, `presidente`, `entrenador`, `tesorero`, `promotor`, `arbitro`, `jugador`).
4. **Cero Dependencias Pesadas para Multimedia:** Generación nativa de PDFs en cliente (`window.print` con hojas de estilo CSS paged-media), renderizado de cromos en HTML5 Canvas 2D a 1200x1200px y síntesis de audio de silbato arbitral vía Web Audio API sin librerías externas.

---

## 2. STACK TECNOLÓGICO Y HERRAMIENTAS

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                     │
│  React 18 · Lucide Icons · Canvas 2D · Web Audio API · PWA  │
├─────────────────────────────────────────────────────────────┤
│                    ESTADO Y CONTEXTOS                       │
│     AuthContext · ClubContext (Hooks Modulares) · Toasts    │
├─────────────────────────────────────────────────────────────┤
│                    MOTORES DE DOMINIO                       │
│  attributeCalculator · trainingPlan · rugbyAudio · AI Coach │
├─────────────────────────────────────────────────────────────┤
│                    PERSISTENCIA Y NUBE                      │
│     Supabase Client (PostgreSQL, Auth, Realtime, RLS)       │
└─────────────────────────────────────────────────────────────┘
```

| Componente | Tecnología | Propósito |
|---|---|---|
| **Framework Base** | React 18.2 + Vite 8 | UI reactiva y empaquetado ultrarrápido con ESM |
| **Persistencia & Auth** | Supabase JS v2 (PostgreSQL) | Base de datos relacional, Auth JWT, Row Level Security |
| **Estilos & UI** | CSS3 Custom Properties + Glassmorphism | Tema oscuro neón (Verde Orcos `#00e676`, Dorado `#ffd740`, Fondo `#060d13`) |
| **Offline & PWA** | Vite PWA Plugin + Workbox | Service Worker con precaching de 90 assets para uso sin conexión |
| **Audio Sintetizado** | Web Audio API | Síntesis acústica de silbato arbitral Fox 40 Classic sin archivos MP3 |
| **Gráficos & Canvas** | HTML5 Canvas 2D API | Generación de cromos RPG coleccionables y banners en vivo |
| **Pruebas Automatizadas** | Vitest 4.1 + Happy-DOM | 67 suites de pruebas unitarias, de integración y regresión (626 tests) |
| **Calidad de Código** | ESLint + Pre-commit Git Hooks | Validación con cero advertencias permitidas (`--max-warnings 0`) |

---

## 3. MAPA DE MÓDULOS Y FUNCIONALIDADES

### 3.1. Panel Principal (Dashboard)
- **Métricas Clave:** Indicadores de guerreros activos por categoría, balance de tesorería, porcentaje de asistencia y próximos encuentros.
- **Ticker de Partido en Vivo:** Barra flotante en tiempo real que avisa cuando hay un partido en disputa o a punto de iniciar, con botón de acceso directo al marcador.
- **Protocolo HIA (Head Injury Assessment):** Registro y seguimiento de conmociones cerebrales conforme al protocolo de World Rugby con alertas de reposo obligatorio.
- **Radar de Bienestar (Wellness):** Monitoreo de fatiga, dolor muscular, sueño y estrés de los jugadores.

### 3.2. Roster de Guerreros (Gestión de Plantilla)
- **Categorías Oficiales:**
  - `masculina_mayor` (Orcos Mayor Masculino)
  - `femenina_mayor` (Orcas Mayor Femenino)
  - `juveniles_masculina` (Orcos M18 / Juvenil)
  - `juveniles_femenin` (Orcas M18 / Juvenil)
- **Ficha Integral de Jugador:** Datos personales, contacto de emergencia, EPS/seguro médico, posición primaria/secundaria, medidas de indumentaria, tallas y marcas de gimnasio (1RM Press Banca, Sentadilla, Peso Muerto).

### 3.3. Mi Ficha (Portal del Guerrero)
- Vista individual para el jugador autenticado.
- **Ficha Coleccionable RPG (Trading Card):** Generador en alta definición (1200x1200px) que renderiza el avatar, dorsal, rango Makgora, barra de estadísticas (Fuerza, Placaje, Resistencia, Velocidad, Pases) y valoración general (OVR). Exportable a PNG o copiable al portapapeles.
- **Paz y Salvo / Certificado de Afiliación PDF:** Generación de documento oficial con membrete del club, estado disciplinario, financiero y firma de presidencia.

### 3.4. Estadísticas del Club
- **Demografía:** Distribución por edades, ocupaciones y tiempo en el club.
- **Físico y Biometría:** Alturas, pesos y cálculo automático de IMC y percentiles.
- **Salud:** Jugadores aptos, en recuperación, con lesiones activas y monitoreo de HIA.
- **Asistencia & Rendimiento:** Promedios de asistencia a prácticas por categoría.

### 3.5. Cancha Táctica & Pizarra Virtual
- **Formatos:** Rugby XV (15 vs 15) y Rugby Sevens (7 vs 7).
- **11 Formaciones Estratégicas:** Melé/Scrum defensivo y ofensivo, Lineout (completo, reducido y rápido), Ruck defensivo, Salida de 22m, Juego desplegado, etc.
- **Drag & Drop Inteligente:** Asignación de dorsales con verificación de afinidad por posición y desgaste de energía.
- **Pizarra TV (Broadcast Animation):** Simulación animada por fases con transiciones suaves y retardos tácticos (Pick & Go en 6 fases, Up & Under con presión aérea, Maul Dinámico y Ataque Desplegado).
- **Acta Oficial de Partido en PDF:** Generación de la planilla oficial de alineación (Titulares, Suplentes, Staff Técnico y firma arbitral) lista para imprimir.

### 3.6. Calendario, Fixtures & Match Center en Vivo
- **Agenda y Fixture:** Programación de entrenamientos, amistosos, torneos y eventos sociales.
- **Sincronización iCalendar (.ics):** Exportación de eventos al calendario de Google, Apple o Outlook conforme al estándar RFC 5545.
- **Historial Cara a Cara (Head-to-Head):** Registro histórico automático de victorias, empates y derrotas frente al rival seleccionado.
- **Match Center en Vivo:**
  - Cronómetro de juego con periodos reglamentarios (40 min / 7 min).
  - Silbato Arbitral Digital: Sonido sintetizado en tiempo real (Fox40 Classic) para Inicio, Try, Pausa y Final.
  - Anotador de eventos: Tries (5 pts), Conversiones (2 pts), Penales (3 pts), Drops (3 pts), Tarjetas Amarillas y Rojas.
  - Generador de Banner de Partido & WhatsApp: Creación de imagen oficial del resultado y resumen textual formateado para difusión instantánea en grupos de WhatsApp.

### 3.7. Finanzas & Tesorería
- Libro diario de ingresos y egresos clasificados por categoría.
- Control de mensualidades y cuotas por jugador con estado de deuda.
- Generación de reportes financieros y estados de cuenta en PDF.

### 3.8. Tribunal de Disciplina & Makgora Hub
- **Tribunal:** Registro de infracciones en cancha y entrenamientos, sanciones en multas o trabajo comunitario, y tabla de conducta.
- **Makgora Hub:** Sistema de desafíos individuales de honor, registro de duelos (fuerza, técnica, resistencia), otorgamiento de puntos de experiencia (XP) y ascensos de rango.

### 3.9. Entrenamientos & Coach IA
- **Training Hub:** Catálogo de ejercicios periodizados, control de intensidad (RPE) y chequeo de asistencia.
- **Coach IA Multi-Provider:** Asesor táctico con arquitectura resiliente de fallback (Groq → DeepSeek → Gemini → OpenRouter) con filtros de seguridad y contexto del club.

---

## 4. MOTOR DE ATRIBUTOS RPG (`attributeCalculator.js`)

El motor de atributos traduce las mediciones físicas y de rendimiento de los jugadores a estadísticas RPG equilibradas (rango 10–99) y una valoración global (OVR):

### Fórmulas y Calibración
1. **Normalización de Posición:**
   - Soporta acentos y mayúsculas (`'Segunda Línea'` → `'segunda_linea'`).
   - Mapea alias en inglés y español (`'Hooker'` → `'talonador'`, `'Wing'` → `'wing'`, `'Fullback'` → `'zaguero'`, `'Scrum-half'` → `'medio_scrum'`).
2. **Normalización de Estatura:**
   - Detecta si la estatura está en centímetros (> 3) y la convierte automáticamente a metros (`185` → `1.85 m`), evitando distorsiones en los coeficientes.
3. **Escala de Fuerza (1RM):**
   - Ratios sobre el peso corporal en Press de Banca, Sentadilla y Peso Muerto.
4. **Resistencia Aeróbica y Velocidad:**
   - Integración de tiempos de Sprint de 40m y niveles en test Yo-Yo / Bronco.
5. **Valoración General (OVR):**
   - Media ponderada ajustada por la importancia de cada atributo según la posición (Forward vs Back).

---

## 5. POLÍTICAS DE SEGURIDAD Y HARDENING

- **Cabeceras HTTP en Producción (`vercel.json` y `netlify.toml`):**
  - `Content-Security-Policy`: Restricción estricta de orígenes autorizados para scripts, estilos, fuentes, imágenes y conexiones WebSocket con Supabase.
  - `X-Frame-Options: DENY`: Prevención contra ataques de Clickjacking.
  - `X-Content-Type-Options: nosniff`: Protección contra MIME-sniffing.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- **Cero Fugas de Datos en Pruebas:** Los entornos de test operan con mocks y simulaciones de red que impiden cualquier mutación no deseada en producción.

---

## 6. GUÍA DE EJECUCIÓN Y PRUEBAS

```bash
# Instalar dependencias
npm install

# Modo desarrollo local
npm run dev

# Ejecutar suite de pruebas unitarias y de integración (67 suites / 626 tests)
npx vitest run

# Auditoría de linter con cero tolerancia a advertencias
npm run lint

# Compilación de producción
npm run build

# Previsualización del build de producción
npm run preview
```
