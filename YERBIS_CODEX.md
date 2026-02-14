# 📜 YERBIS CODEX: El Compendio Teórico

**Uso:** Este libro debe leerse junto con la *Guía de Reconstrucción*. Mientras la guía te dice *qué escribir*, este Códice te explica *qué significa* y *por qué funciona*.

---

## 🧬 Capítulo 1: Anatomía de una Extensión (Chrome Manifest V3)

Para construir Yerbis, primero debes entender dónde vive.

### 1.1 El Manifiesto (`manifest.json`)
Es el ADN de la extensión. Define sus capacidades.
*   **`manifest_version: 3`**: El estándar actual. Más seguro y performante que V2. Prohíbe ejecutar código remoto arbitrario.
*   **`permissions`**:
    *   `sidePanel`: Permite abrir una barra lateral persistente.
    *   `activeTab`: Da acceso temporal a la pestaña que el usuario está mirando.
    *   `scripting`: Permite inyectar código (el "Músculo") en la página web.
*   **`content_scripts`**: Scripts que viven *dentro* de la página web (YouTube). Tienen acceso al DOM (el video), pero están aislados del resto de la extensión.
*   **`background` (Service Worker)**: Un script invisible que maneja eventos del navegador. En Yerbis es mínimo, pero esencial para orquestar.

### 1.2 Arquitectura de Mensajería
Las partes de una extensión no pueden hablarse directamente (están en "mundos" distintos). Usan un sistema de mensajería asíncrono.

*   **`chrome.runtime.sendMessage(mensaje)`**: Grita un mensaje al vacío.
*   **`chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {})`**: Escucha esos gritos.
*   **El Puente:** El SidePanel (React) envía órdenes (`PLAY`, `PAUSE`) y el Content Script (YouTube) las escucha y ejecuta.

---

## ⚛️ Capítulo 2: React y el Estado (El Cerebro)

Yerbis usa React para su interfaz. Aquí están los conceptos clave para entender `SidePanel.jsx`.

### 2.1 Hooks Fundamentales
*   **`useState`**: La memoria a corto plazo. Si cambia, la pantalla se redibuja.
    *   *Ejemplo:* `const [mode, setMode] = useState('LOADING');`
*   **`useRef`**: La memoria persistente que NO redibuja la pantalla. Vital para guardar cosas que cambian rápido (como el video de la cámara o el reconocimiento de voz) sin causar parpadeos visuales.
    *   *Uso en Yerbis:* `recognitionRef` guarda la instancia del micrófono para poder detenerla/iniciarla sin perderla.
*   **`useEffect`**: Efectos secundarios. "Cuando nazca este componente, haz esto".
    *   *Uso en Yerbis:* Al cargar el panel, iniciamos el reconocimiento de voz (`useEffect(..., [])`).
*   **`useCallback`**: Memoriza una función para que no se re-cree en cada render. Optimización pura.

---

## 🗣️ Capítulo 3: Teoría de Voz (Web Speech API)

No usamos IA para escuchar, usamos el navegador. Es gratis y rápido.

### 3.1 `webkitSpeechRecognition`
Es una API nativa de Chrome.
*   **`continuous = true`**: No te detengas cuando el usuario deje de hablar. Sigue escuchando indefinidamente.
*   **`interimResults = true`**: Dame lo que crees que el usuario está diciendo *mientras* lo dice. Vital para la velocidad.

### 3.2 Eventos Clave
*   **`onresult`**: Se dispara cada vez que hay texto nuevo.
    *   **`event.results[i].isFinal`**: Booleano. ¿El usuario terminó la frase?
        *   *True:* Ya no va a cambiar. Envíalo a la IA.
        *   *False:* Es provisional. Úsalo para comandos rápidos ("Pausa") pero no lo envíes a la IA aún.
*   **`onend`**: El micrófono se apagó (por silencio o error).
    *   *Truco de Yerbis:* En `onend`, lo volvemos a encender (`recognition.start()`) inmediatamente. Esto crea la ilusión de "escucha siempre activa".

---

## 👁️ Capítulo 4: Visión Computarizada (MediaPipe)

Cómo Yerbis "ve" tu mano sin enviar video a la nube.

### 4.1 Landmarks (Puntos de Referencia)
MediaPipe detecta 21 puntos en la mano. Cada punto tiene coordenadas `{x, y, z}`.
*   **x, y**: Posición en pantalla (0.0 a 1.0).
*   **z**: Profundidad (relativa a la muñeca).

### 4.2 Mapa de la Mano
Para programar gestos, necesitas saber qué número es cada dedo:
*   **0**: Muñeca.
*   **4**: Punta del Pulgar.
*   **8**: Punta del Índice.
*   **12**: Punta del Medio.
*   **16**: Punta del Anular.
*   **20**: Punta del Meñique.

### 4.3 Geometría del Puño (`isFist`)
¿Cómo sabe la matemática que es un puño?
*   **Concepto:** Un dedo está "cerrado" si su punta (Tip) está más abajo que su nudillo (Pip).
*   **Algoritmo:**
    1.  Toma el Índice: Punta (8) vs Nudillo (6). Si `y[8] > y[6]`, está cerrado (recuerda: en computación, Y crece hacia abajo).
    2.  Repite para Medio, Anular y Meñique.
    3.  Si los 4 están cerrados -> Es un Puño.

### 4.4 Vector Math para el Joystick
Para mover el video con el dedo, usamos vectores simples.
1.  **Origen ($O$):** Guardamos la posición `{x, y}` donde apareció el dedo por primera vez.
2.  **Posición Actual ($P$):** Donde está el dedo ahora.
3.  **Delta ($\Delta$):** La diferencia. $\Delta = P - O$.
    *   Si $\Delta x > 0.05$ (positivo), te moviste a la derecha.
    *   Si $\Delta x < -0.05$ (negativo), te moviste a la izquierda.
    *   *Nota:* El 0.05 es la "Zona Muerta" (Deadzone) para evitar que el video tiemble si tu pulso no es perfecto.

---

## 🧠 Capítulo 5: Prompt Engineering (El Susurrador de IA)

Cómo hablamos con Gemini para que no alucine.

### 5.1 Determinismo JSON
Las IAs aman hablar. Nosotros necesitamos datos.
*   **Instrucción:** "Tu salida DEBE ser un objeto JSON válido y NADA MÁS."
*   **Efecto:** Obliga al modelo a suprimir su "charla" ("Claro, aquí tienes...") y devolver solo `{ "action": "PLAY" }`.

### 5.2 Inyección de Contexto
La IA no sabe qué está pasando en tu pantalla. Tú debes decírselo.
*   **Prompt:** `Estado Actual: { volumen: 0.5, tiempo: 120s }`
*   **Usuario:** "Sube un poco".
*   **IA (Pensamiento):** "Veo que el volumen es 0.5. 'Un poco' suele ser +0.1. Nuevo volumen: 0.6."
*   **Salida:** `{ "action": "SET_VOLUME", "value": 0.6 }`

---

## 🌐 Capítulo 6: El DOM (Document Object Model)

Cómo Yerbis toca YouTube.

### 6.1 El Elemento `<video>`
HTML5 estandarizó el video. YouTube usa una etiqueta `<video>` estándar.
*   **`video.play()` / `video.pause()`**: Métodos nativos.
*   **`video.currentTime`**: Propiedad de lectura/escritura (en segundos). Sumarle 10 adelanta el video.
*   **`video.volume`**: Flotante de 0.0 (mudo) a 1.0 (máximo).

### 6.2 Inyección de HUD
Para mostrar iconos sobre el video, creamos un `div` fantasma.
*   `document.createElement('div')`: Crea un elemento en el aire.
*   `document.body.appendChild(hud)`: Lo pega en la página real.
*   `pointer-events: none`: CSS vital. Hace que el HUD sea "transparente" a los clics, para que puedas seguir clicando en el video a través del icono.

---

Este Códice contiene toda la teoría necesaria. Si dominas estos 6 capítulos, puedes reescribir Yerbis en cualquier lenguaje o framework.
