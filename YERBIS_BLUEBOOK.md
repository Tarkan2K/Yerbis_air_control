# 📘 YERBIS AIR CONTROL: El Libro Azul (The Bluebook)

**Versión:** 2.1.0 (Voice-First + Wake Word Session)  
**Estado:** Producción  
**Autor:** Matías García Castillo  
**Modelo AI:** Gemini 2.0 Flash Lite

---

## 📑 Índice de Contenidos

1.  [Manifiesto del Proyecto](#1-manifiesto-del-proyecto-)
2.  [Arquitectura del Sistema](#2-arquitectura-del-sistema-)
3.  [Módulos del Sistema](#3-módulos-del-sistema-)
4.  [Lógica de Activación (Wake Word)](#4-lógica-de-activación-wake-word-)
5.  [Guía de Instalación y Despliegue](#5-guía-de-instalación-y-despliegue-)
6.  [Manual de Usuario](#6-manual-de-usuario-)
7.  [Solución de Problemas](#7-solución-de-problemas-)

---

## 1. Manifiesto del Proyecto 🚀

**Yerbis Air Control** es una interfaz híbrida Voz-Gesto diseñada para ser invisible, eficiente y respetuosa con la privacidad. Su filosofía es **"Voice-First"** (Primero Voz), utilizando la cámara solo cuando es estrictamente necesario.

El sistema integra inteligencia artificial avanzada (Gemini 2.0 Flash Lite) para entender lenguaje natural, pero protege los recursos y la privacidad del usuario mediante un estricto **"Wake Word Gatekeeper"** que filtra todo audio que no esté dirigido al asistente.

---

## 2. Arquitectura del Sistema 🏗️

El sistema opera como una Extensión de Chrome (Manifest V3) con una arquitectura reactiva basada en estados.

*   **Core:** React.js + Vite.
*   **Motor de Visión:** Google MediaPipe Hands (Solo en modo Manual).
*   **Motor de Voz:** Web Speech API (`webkitSpeechRecognition`) + Lógica de Sesión.
*   **Cerebro AI:** Google Gemini 2.0 Flash Lite.
*   **Plataforma:** Google Chrome Extension (SidePanel API).

### Flujo de Estados (State Machine)

1.  **LOADING:** Carga inicial.
2.  **SETUP:** Configuración de API Key.
3.  **VOICE_ONLY (Default):**
    *   Micrófono: ACTIVO (Escucha pasiva).
    *   Cámara: APAGADA.
    *   AI: Inactiva hasta detectar Wake Word.
4.  **MANUAL_CONTROL:**
    *   Micrófono: ACTIVO (Escucha comando de salida).
    *   Cámara: ENCENDIDA (MediaPipe activo).
    *   Gestos: Habilitados.

---

## 3. Módulos del Sistema 🧩

### Módulo 1: El Oído (Gatekeeper & Session) 👂
El componente más crítico. Procesa el audio en tiempo real en el navegador.
*   **Wake Word:** Detecta variaciones de "Yerbis", "Jarvis", "Hierbies".
*   **Sesión Activa:** Al detectar el nombre, abre una ventana de **5 segundos** donde acepta cualquier comando sin necesidad de repetir el nombre.
*   **Comandos Locales:** Ejecuta acciones críticas ("Pausa", "Activa control") instantáneamente sin consultar a la AI.

### Módulo 2: El Cerebro (Gemini AI) 🧠
Interpreta intenciones complejas cuando el Gatekeeper lo permite.
*   **Modelo:** `gemini-2.0-flash-lite`.
*   **Entrada:** Transcripción del usuario + Estado actual del video (Tiempo, Volumen, Pausa).
*   **Salida:** JSON estructurado con acción (`PLAY`, `SEEK`, `VOL`) y respuesta hablada.

### Módulo 3: La Visión (MediaPipe) 👁️
Control gestual de alta precisión.
*   **Puño Cerrado:** Play/Pause (con debounce de seguridad).
*   **Dedo Índice (Joystick):**
    *   Movimiento Horizontal: Adelantar/Retroceder video.
    *   Movimiento Vertical: Subir/Bajar volumen.

### Módulo 4: La Mano (Content Script) ✋
Ejecuta las órdenes en el DOM de YouTube.
*   Manipula directamente el elemento `<video>`.
*   Muestra un **HUD (Heads-Up Display)** visual en pantalla para confirmar acciones (Iconos grandes de Play, Volumen, etc.).

---

## 4. Lógica de Activación (Wake Word) 🔑

Para proteger la privacidad y la cuota de API, Yerbis usa un sistema de tres niveles:

1.  **Nivel 1: Comandos Locales (Prioridad Absoluta)**
    *   Frases: "Activa control manual", "Pausa", "Play", "Silencio".
    *   Acción: Ejecución inmediata local. No requiere "Yerbis".

2.  **Nivel 2: Wake Word (El Portero)**
    *   Palabras: "Yerbis", "Jarvis", etc.
    *   Acción: Si se detecta, activa el modo **"Escuchando Comando"** (Icono Cyan).

3.  **Nivel 3: Sesión Activa (La Ventana)**
    *   Duración: 5 segundos tras el último comando o Wake Word.
    *   Acción: Todo lo que se diga en esta ventana se envía a Gemini. Permite hablar pausado o desde lejos.

---

## 5. Guía de Instalación y Despliegue 🛠️

### Requisitos
*   Node.js (v18+).
*   Google Chrome.
*   Gemini API Key.

### Instalación
1.  **Instalar Dependencias:** `npm install`
2.  **Compilar:** `npm run build`
3.  **Cargar en Chrome:**
    *   `chrome://extensions` -> Developer Mode -> Load Unpacked -> Carpeta `dist`.

---

## 6. Manual de Usuario 🎮

### Comandos de Voz
*   **Activación:** "Yerbis..." (Espera a que el icono se ponga Cyan) "...busca videos de gatos".
*   **Control:** "Pausa", "Play", "Silencio" (Funcionan siempre).
*   **Navegación:** "Adelanta 30 segundos", "Ponlo al principio", "Sube el volumen un poco".
*   **Modos:** "Activa control manual", "Desactiva control manual".

### Gestos (Modo Manual)
*   **Play/Pause:** Cierra el puño (✊) por 0.3s y ábrelo (✋).
*   **Volumen:** Levanta el índice (☝️) y muévelo arriba/abajo.
*   **Buscar:** Levanta el índice (☝️) y muévelo izquierda/derecha.

---

## 7. Solución de Problemas 🔧

*   **Error 404 Gemini:** Verifica que el modelo en el código sea `gemini-2.0-flash-lite`.
*   **No escucha de lejos:** Di "Yerbis", espera a ver el indicador visual, y luego di tu comando.
*   **Falsos positivos:** El sistema filtra fonéticamente, pero en ambientes ruidosos puede activarse. Usa "Desactiva control manual" para volver a modo reposo.
