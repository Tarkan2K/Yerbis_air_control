# 📘 La Guía Definitiva: Parte 2 (The Masterclass)
> *De Aprendiz a Arquitecto.*

---

## 🏛️ Introducción: Más Allá de la Magia

En la Parte 1, usamos analogías: cajas mágicas, hechizos, robots. Eso es excelente para perder el miedo, pero insuficiente para construir sistemas profesionales.

Cuando construyes un rascacielos, no dices "pon ladrillos mágicos". Calculas cargas, tensiones y resistencias.
En esta segunda parte, dejaremos de lado la magia y hablaremos de **Ingeniería**.

No solo aprenderás *qué* hace el código, sino *cómo* lo hace la máquina. Entender esto es la diferencia entre un programador que "copia y pega" y uno que puede diseñar a **Yerbis** desde cero.

---

# CAPÍTULO 1: El Runtime de JavaScript (Bajo el Capó) ⚙️

JavaScript es un lenguaje "Single-Threaded" (de un solo hilo). Esto significa que, técnicamente, solo puede hacer **una cosa a la vez**.
Entonces, ¿cómo puede Yerbis escuchar tu voz, procesar video y hablar con Gemini al mismo tiempo?

Bienvenido al **Event Loop**.

## 1.1 El Event Loop (El Corazón del Navegador)
Imagina que JS es un chef en una cocina con una sola hornalla.

1.  **Call Stack (La Pila de Llamadas):** Es la hornalla. Aquí es donde se ejecuta el código. Solo cabe una sartén.
    *   Si ejecutas `console.log('Hola')`, entra a la pila, se ejecuta y sale.
2.  **Web APIs (Los Ayudantes):** Son cosas que el navegador hace por ti fuera del hilo principal (Timer, Fetch, DOM events).
    *   Cuando haces `setTimeout(..., 1000)`, JS le dice al navegador: "Avísame en 1 segundo". Y JS sigue cocinando otra cosa.
3.  **Callback Queue (La Cola de Pedidos):** Cuando el navegador termina (pasó 1 segundo), pone la función en esta cola. "Chef, ya está listo el timer".
4.  **El Event Loop (El Camarero):** Su único trabajo es mirar la Pila y la Cola.
    *   *Regla de Oro:* Si la Pila está vacía, mueve el primer ítem de la Cola a la Pila.

### ¿Por qué esto importa en Yerbis?
Si pones un bucle infinito (`while(true)`) en la Pila, bloqueas el Event Loop. El navegador se congela.
Por eso usamos **Asincronía** (`async/await`) para hablar con Gemini. No bloqueamos la cocina esperando la respuesta; dejamos el pedido y seguimos atendiendo la cámara.

## 1.2 Closures (Clausuras) y Scope
En JS, las funciones tienen memoria.

```javascript
function crearContador() {
  let cuenta = 0; // Variable local
  return function() {
    cuenta++; // ¡Accede a la variable de afuera!
    return cuenta;
  };
}

const contar = crearContador();
console.log(contar()); // 1
console.log(contar()); // 2
```

Esto se llama **Closure**. La función interna "recuerda" el entorno donde fue creada, incluso después de que la función externa haya terminado.
*   **En Yerbis:** Usamos esto todo el tiempo en React. Cuando usas `useEffect`, las funciones dentro de él "recuerdan" las variables del render anterior.

## 1.3 Prototipos (La Herencia Real)
JS no tiene clases reales (aunque usemos la palabra `class`). Tiene **Prototipos**.
Cada objeto tiene un enlace oculto a otro objeto (su padre).

*   Cuando pides `yerbis.toString()`, JS busca `toString` en `yerbis`.
*   Si no está, busca en el padre de `yerbis`.
*   Si no está, busca en el abuelo... hasta llegar a `Object.prototype`.

---

# CAPÍTULO 2: Arquitectura de React (El Motor) ⚛️

React no es magia. Es una librería que sincroniza el estado de tus datos con el DOM.

## 2.1 El Virtual DOM y la Reconciliación
Tocar el DOM real (`document.createElement`) es lento. Muy lento.
React crea una copia ligera en memoria (Virtual DOM).

1.  **Render:** React crea un nuevo árbol virtual basado en tus datos.
2.  **Diffing:** Compara el nuevo árbol con el anterior. "¿Qué cambió?"
3.  **Commit:** Solo actualiza en el DOM real lo que cambió.

**Optimización:** Si Yerbis actualiza el tiempo del video cada segundo, React solo cambia el texto de los números, no redibuja toda la barra lateral.

## 2.2 Hooks a Profundidad

### `useRef` vs `useState`
Esta es la fuente #1 de bugs en juniors.

*   **`useState`**: "Si esto cambia, **REDIBUJA** la pantalla".
    *   Úsalo para: Lo que el usuario ve (Icono de micrófono, texto de respuesta).
*   **`useRef`**: "Si esto cambia, **NO HAGAS NADA** (pero guarda el valor)".
    *   Úsalo para: Cosas internas (Instancia de reconocimiento de voz, conexión a Gemini, Timers).

**En Yerbis:**
```javascript
const recognitionRef = useRef(null); // No queremos re-renderizar cada vez que el objeto cambia internamente.
const [isListening, setIsListening] = useState(false); // Sí queremos cambiar el icono si escuchamos.
```

### `useEffect` y el Ciclo de Vida
`useEffect` no es solo "hacer cosas al inicio". Es para **sincronizar** con sistemas externos.

```javascript
useEffect(() => {
  // 1. Mount (Conectar)
  const socket = connectToServer();

  // 2. Cleanup (Desconectar)
  return () => {
    socket.disconnect();
  };
}, []); // Dependencias
```

Si olvidas la función de limpieza (`return () => ...`), crearás **Memory Leaks**. En Yerbis, si no apagamos el micrófono al desmontar el componente, seguirá escuchando para siempre (o hasta que Chrome lo mate).

---

# CAPÍTULO 3: Arquitectura de Extensiones (Chrome V3) 🧩

Aquí es donde vive Yerbis. Manifest V3 cambió las reglas del juego.

## 3.1 Service Workers (Background)
En V2, tenías una "Background Page" que vivía siempre. En V3, tienes un **Service Worker**.
*   **Es efímero:** Nace cuando pasa algo (un evento), muere cuando termina.
*   **No tiene DOM:** No puede "ver" páginas ni tener ventanas.
*   **Su rol:** Orquestador. Recibe mensajes y despierta a otros componentes.

## 3.2 Content Scripts (La Mano Infiltrada)
Son scripts que inyectamos EN la página de YouTube.
*   **Mundo Aislado:** Comparten el DOM con YouTube, pero NO comparten las variables de JS.
    *   Si YouTube tiene una variable `window.player`, tu Content Script NO puede verla.
    *   Debes interactuar con el DOM (`document.querySelector('video')`).

## 3.3 Paso de Mensajes (El Telégrafo)
Como el Panel Lateral (React) y el Content Script (YouTube) están en mundos distintos, no pueden hablarse directamente.

1.  **Panel:** `chrome.tabs.sendMessage(tabId, { action: "PAUSE" })`
2.  **Content:** `chrome.runtime.onMessage.addListener(...)`

Este canal es asíncrono. No puedes esperar una respuesta inmediata síncrona.

---

# CAPÍTULO 4: Ingeniería de IA (El Cerebro) 🧠

Integrar un LLM (Large Language Model) como Gemini no es solo enviar texto.

## 4.1 Prompt Engineering Estructurado
Los LLMs son máquinas de completar texto. Si les das basura, te devuelven basura.

**La Técnica de Yerbis:**
1.  **Persona:** "Eres un asistente de control de video".
2.  **Contexto:** "El usuario está viendo un video de 10 minutos. Va por el minuto 2."
3.  **Restricción de Formato (JSON Mode):** "Responde SOLO en JSON".

```json
// Prompt del Sistema
"You are a JSON machine. You receive natural language and video state. You output structured commands."
```

## 4.2 Gestión de Latencia
Gemini tarda 1-3 segundos en responder. Para una interfaz de voz, eso es una eternidad.
*   **Feedback Optimista:** Mostramos "Procesando..." o un icono girando *antes* de que llegue la respuesta.
*   **Comandos Locales:** Si el usuario dice "Pausa", NO vamos a Gemini. Lo ejecutamos localmente en 10ms. Solo vamos a la IA para cosas complejas ("Busca videos de gatos").

---

# CAPÍTULO 5: Visión Computarizada y Matemáticas 📐

MediaPipe nos da coordenadas. Nosotros ponemos la lógica.

## 5.1 Vectores y Distancia
Cada punto de la mano es un vector $P(x, y)$.

Para detectar un "Pellizco" (Pinch):
Calculamos la **Distancia Euclidiana** entre la punta del índice ($P_8$) y la punta del pulgar ($P_4$).

$$d = \sqrt{(x_8 - x_4)^2 + (y_8 - y_4)^2}$$

Si $d < 0.05$, están tocándose.

## 5.2 Normalización
Las manos pueden estar cerca o lejos de la cámara.
*   Si estás lejos, $d$ será pequeño aunque no estés pellizcando.
*   **Solución:** Normalizar las distancias dividiendo por el tamaño de la palma de la mano. Así el gesto funciona igual a 1 metro o a 30cm.

## 5.3 Suavizado (Smoothing)
La detección de la mano "tiembla" (ruido del sensor).
Si usas las coordenadas crudas, el mouse saltará.
Usamos **Interpolación Lineal (Lerp)**:

$$Pos_{suave} = Pos_{anterior} * 0.8 + Pos_{nueva} * 0.2$$

Esto hace que el movimiento se sienta fluido y orgánico.

---

# CAPÍTULO 6: Reconstruyendo a Yerbis (Arquitectura Final) 🏗️

Ahora tienes todas las piezas. Así es como se ensambla el sistema completo.

## 6.1 La Máquina de Estados (State Machine)
No usamos `if/else` caóticos. Definimos estados claros.

*   **IDLE:** Micrófono abierto, esperando "Yerbis". (Consumo bajo de CPU).
*   **LISTENING:** "Yerbis" detectado. Grabando comando. (Icono Cyan).
*   **PROCESSING:** Enviando audio a Gemini. (Icono Girando).
*   **EXECUTING:** Recibido JSON, ejecutando acción.
*   **ERROR:** Fallo de red o no entendido. (Icono Rojo).

## 6.2 El Flujo de Datos (Data Pipeline)

1.  **Audio Input** -> **Web Speech API** -> **Texto ("Pausa")**
2.  **Router:**
    *   ¿Es comando simple? -> **Ejecutor Local**.
    *   ¿Es complejo? -> **Gemini Client**.
3.  **Gemini Client** -> **JSON (`{action: "PAUSE"}`)**
4.  **React SidePanel** -> **Chrome Message Bus** -> **Content Script**
5.  **Content Script** -> **DOM (`video.pause()`)**

## 6.3 Conclusión
Yerbis no es solo código. Es la orquestación cuidadosa de:
*   Eventos asíncronos (JS).
*   Gestión de estado eficiente (React).
*   Seguridad y aislamiento (Chrome).
*   Probabilidad e inferencia (AI).
*   Geometría (Visión).

Dominar esto te convierte en un **Ingeniero de Software Completo**.
