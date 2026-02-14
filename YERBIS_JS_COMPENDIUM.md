# 📜 YERBIS JS COMPENDIUM: El Libro de Hechizos JavaScript

**Uso:** Este es el tercer pilar. Si la *Guía* es el mapa y el *Códice* es la teoría, este *Compendio* es el diccionario del lenguaje que hablamos. Aquí está **solo el JavaScript que necesitas** para Yerbis.

---

## ⚡ Capítulo 1: Sintaxis Moderna (ES6+)

Yerbis está escrito en JavaScript moderno. Olvida `var` y `function`.

### 1.1 Variables: `const` vs `let`
*   **`const`**: Úsalo para el 95% de las cosas. Significa que la referencia no cambiará.
    *   *En Yerbis:* `const recognition = ...` (La herramienta de reconocimiento no va a cambiar por otra).
*   **`let`**: Úsalo solo si el valor va a cambiar.
    *   *En Yerbis:* `let rawQuery = '';` (Empieza vacía, luego le ponemos texto).
*   **`var`**: 🚫 Prohibido. Causa errores difíciles de rastrear.

### 1.2 Funciones Flecha (`=>`)
Son más cortas y manejan mejor el contexto (`this`).
*   **Clásica:** `function sumar(a, b) { return a + b; }`
*   **Flecha:** `const sumar = (a, b) => a + b;`
*   *En Yerbis:* `const setMode = (newMode) => { ... }`

### 1.3 Destructuring (Desempaquetado)
Extraer valores de objetos rápidamente.
*   **Objeto:** `const video = { volume: 0.5, paused: true };`
*   **Sin Destructuring:** `const vol = video.volume;`
*   **Con Destructuring:** `const { volume, paused } = video;`
*   *En Yerbis:* `const { x, y } = landmarks[8];` (Sacamos coordenadas del dedo).

### 1.4 Template Literals (Comillas invertidas `` ` ``)
Para mezclar texto y variables sin dolor.
*   **Antes:** `"Hola " + nombre + ", son las " + hora;`
*   **Ahora:** `` `Hola ${nombre}, son las ${hora}` ``
*   *En Yerbis:* `` `Heard: ${transcript}` ``

---

## ⏳ Capítulo 2: Asincronía (El Tiempo)

JavaScript no espera a nadie... a menos que se lo pidas.

### 2.1 `async` / `await`
Yerbis habla con Gemini (Nube). Eso tarda tiempo.
*   **`async`**: Marca una función que va a tardar.
*   **`await`**: "Pausa la ejecución AQUÍ hasta que esto termine".
*   *En Yerbis:*
    ```javascript
    const askGemini = async (text) => {
        // Espera a que la IA piense...
        const result = await model.generateContent(text);
        // ...ya pensó. Seguimos.
        return result;
    }
    ```

### 2.2 Promesas (`Promise`)
Es un "vale por un valor futuro". `await` desenvuelve ese vale.
*   `fetch()` devuelve una Promesa.
*   `model.generateContent()` devuelve una Promesa.

---

## 📦 Capítulo 3: Arreglos y Objetos (Los Datos)

Cómo manejamos la información de la mano y los comandos.

### 3.1 Métodos de Array (Sin bucles `for`)
Yerbis procesa 21 puntos de la mano 30 veces por segundo. Los bucles `for` son feos.
*   **`find`**: Busca el primer elemento que cumpla una condición.
    *   *En Yerbis:* `WAKE_WORDS.find(word => transcript.includes(word))` (¿Dijo alguna de estas palabras?).
*   **`every`**: ¿TODOS cumplen la condición?
    *   *En Yerbis:* `fingers.every(f => f.isClosed)` (¿Están los 4 dedos cerrados? -> Es un puño).
*   **`map`**: Transforma cada elemento.
    *   *Ejemplo:* `[1, 2, 3].map(n => n * 2)` -> `[2, 4, 6]`.

### 3.2 JSON (JavaScript Object Notation)
El idioma universal para hablar con IAs y Servidores.
*   **`JSON.stringify(obj)`**: Convierte objeto JS a Texto.
    *   *En Yerbis:* Le enviamos el estado a Gemini: `Current State: ${JSON.stringify(currentState)}`.
*   **`JSON.parse(texto)`**: Convierte Texto a objeto JS.
    *   *En Yerbis:* Gemini nos responde texto, lo convertimos a objeto para usarlo: `const action = JSON.parse(response).action;`

---

## 🌐 Capítulo 4: El Navegador (DOM & APIs)

JavaScript vive en el navegador.

### 4.1 Selectores
*   **`document.querySelector('video')`**: "Búscame la primera etiqueta `<video>` que encuentres".
*   **`document.getElementById('root')`**: "Búscame el elemento con ID 'root'".

### 4.2 Event Listeners
*   **`video.addEventListener('play', ...)`**: "Avísame cuando empiece a reproducir".
*   **`chrome.runtime.onMessage.addListener(...)`**: "Avísame cuando llegue un mensaje de la extensión".

### 4.3 Callbacks
Funciones que se pasan como argumentos para ejecutarse después.
*   *En Yerbis:* `setTimeout(() => { ... }, 1000)` ("Ejecuta esta función flecha dentro de 1000ms").

---

## 🎯 Resumen para Yerbis

Si dominas estos 4 conceptos, entiendes el 100% del código de Yerbis:
1.  **Flechas y Constantes** para escribir limpio.
2.  **Async/Await** para hablar con Gemini.
3.  **Array.every/find** para detectar gestos y palabras clave.
4.  **JSON** para empaquetar y desempaquetar órdenes.
