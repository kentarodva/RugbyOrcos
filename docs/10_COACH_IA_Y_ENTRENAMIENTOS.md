---
title: "10 — Entrenamientos, Training Hub y Coach IA Asesor"
aliases: ["Coach IA", "Entrenamientos", "Training Hub", "Drills", "Inteligencia Artificial"]
tags:
  - "orcos/ia"
  - "orcos/entrenamientos"
  - "orcos/coach"
updated: "2026-11-05"
---

# 10 — Entrenamientos, Training Hub y Coach IA Asesor

Volver a: [[00_INDICE_MAESTRO]] | Anterior: [[09_TRIBUNAL_DE_DISCIPLINA]] | Siguiente: [[11_TESTING_Y_CALIDAD]]

---

## 1. Centro de Entrenamiento (Training Hub)

El módulo [`TrainingHub/index.jsx`](file:///C:/Users/KennentDVA/Documents/Proyectos_Code/Rugby%20Orcos/src/components/TrainingHub/index.jsx) organiza las sesiones técnicas y físicas del club:

```mermaid
graph LR
    TH["Training Hub"] --> CAT["Biblioteca de Drills & Ejercicios"]
    TH --> PER["Periodización (Pretemporada / Competencia / Descanso)"]
    TH --> RPE["Escala RPE de Percepción de Esfuerzo (1 a 10)"]
    TH --> ASIS["Asistencia Digital por Código QR o Lista Rápida"]
    TH --> COACH["Coach IA Asesor Táctico"]
```

* **Biblioteca de Ejercicios:** Descompuestos por destreza (Tackle seguro, Ruck cleanout, Maul, Lineout, Pases en velocidad, Patada de despeje).
* **Control de Cargas:** Cálculo de la carga semanal del equipo (`Volumen = Duración (min) x Intensidad RPE`).

---

## 2. Asistente Táctico: Coach IA Multi-Provider

El club dispone de un asistente táctico integrado en [`AIChat.jsx`](file:///C:/Users/KennentDVA/Documents/Proyectos_Code/Rugby%20Orcos/src/components/AIChat.jsx) con un motor de contingencia de 4 niveles ([`multiProviderCoach.js`](file:///C:/Users/KennentDVA/Documents/Proyectos_Code/Rugby%20Orcos/src/engine/multiProviderCoach.js)):

```mermaid
flowchart TD
    REQ["Consulta del Entrenador / Jugador"] --> PROV1{"1. Groq (Llama 3 70B)"}
    PROV1 -- Falla / Cuota Agotada --> PROV2{"2. DeepSeek (DeepSeek V3)"}
    PROV2 -- Falla / Error 500 --> PROV3{"3. Google Gemini (1.5 Flash)"}
    PROV3 -- Falla --> PROV4{"4. OpenRouter (Fallback Global)"}
    PROV4 -- Falla --> CACHE["Respuesta en Memoria Caché Local"]
    PROV1 -- Éxito --> RESP["Respuesta Validada por Filtro de Seguridad"]
    PROV2 -- Éxito --> RESP
    PROV3 -- Éxito --> RESP
    PROV4 -- Éxito --> RESP
```

### Prompt Engineering y Contexto del Club (`promptBuilder.js`)
El motor inyecta automáticamente en el contexto del modelo:
* El glosario de términos del club (Orcos Negros, Makgora, Pack de Forwards, In-Goal).
* La plantilla activa y las lesiones actuales para sugerir rotaciones realistas.
* El perfil del próximo rival según el calendario.

---

## 3. Filtro de Contenido y Guardrails de Seguridad (`contentFilter.js`)

Para asegurar un entorno seguro y deportivo:
* El motor escanea tanto las consultas como las respuestas generadas.
* Bloquea contenido ofensivo, consejos médicos imprudentes o incitaciones al dopaje.
* Si se detecta una consulta sobre conmociones o traumatismos graves, el sistema interrumpe la respuesta con una advertencia roja: *"Consulte inmediatamente a un médico profesional y aplique el protocolo HIA"*.

Ver siguiente: [[11_TESTING_Y_CALIDAD]]
