# 📘 La Guía Definitiva de JavaScript y la Leyenda de Yerbis
> *Para el niño que llevamos dentro y el ingeniero que queremos ser.*

---

## 🗺️ Introducción: El Arte de Hablar con las Máquinas

Imagina que tienes un robot súper fuerte y rápido, pero que no sabe hacer nada por sí mismo. Es como un genio en una lámpara, pero un poco tonto: solo hace **exactamente** lo que le dices.

Ese robot es tu computadora (o el navegador Chrome).
El idioma que habla se llama **JavaScript**.

Esta guía te enseñará a hablar ese idioma, desde las palabras más simples hasta los hechizos más poderosos, para que al final puedas crear a **Yerbis**, tu propio asistente con Inteligencia Artificial.

---

# PARTE 1: Los Hechizos Básicos (JavaScript) 🪄

Antes de construir un castillo, necesitas saber cómo usar los ladrillos.

## 1. Variables: Las Cajas Mágicas 📦
Imagina que tienes muchas cajas. Para no perder tus cosas, le pones una etiqueta a cada una.

*   **`const` (La Caja Fuerte):** Guardas algo aquí y **nunca más** lo puedes cambiar. Es para cosas importantes que deben ser siempre iguales.
    *   *Ejemplo:* Tu fecha de nacimiento.
*   **`let` (La Mochila):** Guardas algo aquí, pero puedes sacarlo y meter otra cosa después.
    *   *Ejemplo:* Tu edad (cambia cada año) o tu puntaje en un juego.

```javascript
const miNombre = "Matías"; // Nunca cambiará
let miEdad = 5;            // El próximo año será 6
```

## 2. Tipos de Datos: ¿Qué hay en la caja? 🧸
No puedes meter un elefante en una caja de fósforos. En JS, hay diferentes tipos de cosas:

*   **String (Texto):** Palabras. Siempre van entre comillas `" "`.
    *   `"Hola mundo"`
*   **Number (Número):** Para contar. Sin comillas.
    *   `10`, `3.14`, `-5`
*   **Boolean (Interruptor):** Solo puede ser `true` (Verdad/Encendido) o `false` (Mentira/Apagado).
    *   `true`, `false`

## 3. Funciones: Los Hechizos ✨
Una función es un hechizo que guardas para usarlo después. Le das un nombre y le dices qué hacer.

Usamos la "Flecha Mágica" (`=>`) para crearlas.

```javascript
// Creamos el hechizo "saludar"
const saludar = (nombre) => {
  return "Hola " + nombre + "!";
};

// ¡Lanzamos el hechizo!
saludar("Mamá"); // El robot responde: "Hola Mamá!"
```

## 4. Objetos: La Mochila del Explorador 🎒
Un objeto es una colección de cosas relacionadas. En lugar de tener 10 cajas sueltas, tienes una mochila con bolsillos etiquetados.

```javascript
const yerbis = {
  nombre: "Yerbis",
  color: "Azul",
  encendido: true,
  nivelDePoder: 9000
};

// Para ver el color:
console.log(yerbis.color); // "Azul"
```

## 5. Arrays (Arreglos): La Lista de Compras 📜
Es una lista ordenada de cosas.

```javascript
const misAmigos = ["R2D2", "C3PO", "BB8"];

// El primero es el número 0 (¡Los robots cuentan desde cero!)
console.log(misAmigos[0]); // "R2D2"
```

## 6. If / Else: El Camino Dividido 🛤️
El robot necesita tomar decisiones. "Si pasa esto, haz aquello. Si no, haz lo otro".

```javascript
if (tengoHambre) {
  comer("Pizza");
} else {
  jugar("Videojuegos");
}
```

---

# PARTE 2: El Patio de Juegos (El Navegador) 🛝

JavaScript vive dentro de tu navegador (Chrome). Chrome es como una casa gigante, y JS es el dueño de casa.

## 1. El DOM: El Árbol de la Vida 🌳
Cada página web (como YouTube) es un árbol gigante de elementos.
*   **HTML:** Es el esqueleto (Huesos).
*   **CSS:** Es la ropa y el maquillaje (Estilo).
*   **JS:** Son los músculos (Movimiento).

Cuando usas JS, puedes tocar cualquier parte de la página y cambiarla.

```javascript
// Hechizo para buscar un video
const video = document.querySelector('video');

// ¡Hechizo para pausarlo!
video.pause();
```

## 2. Eventos: Escuchando Secretos 👂
El navegador siempre está "escuchando". Escucha cuando haces clic, cuando mueves el mouse, cuando escribes.
Tú puedes decirle a tu robot qué hacer cuando escuche algo.

```javascript
// Cuando alguien haga "click" en el botón...
boton.addEventListener('click', () => {
  lanzarFuegosArtificiales();
});
```

---

# PARTE 3: Los Superpoderes (Avanzado) 🦸

Aquí es donde la magia se vuelve poderosa de verdad.

## 1. Async / Await: Esperando la Pizza 🍕
A veces, las cosas tardan. Si pides una pizza, no te la comes al instante. Tienes que **esperar** (`await`).
Si el robot no espera, intentará comerse la pizza antes de que llegue (y morderá el aire).

```javascript
const pedirPizza = async () => {
  console.log("Llamando a la pizzería...");
  const pizza = await repartidor.traerPizza(); // ¡ESPERA AQUÍ!
  console.log("¡A comer " + pizza + "!");
};
```

## 2. APIs: Cartas a los Magos ✉️
Una API es como un servicio de mensajería. Puedes enviarle una carta a un Mago Poderoso (como Google Gemini) pidiéndole ayuda.

*   Tú envías: "Hola Gemini, ¿qué significa 'ser o no ser'?"
*   Esperas (`await`)...
*   Gemini responde: "Es una duda existencial..."

## 3. Web Speech API: Oídos de Robot 🎤
El navegador tiene un oído gratis. Puede convertir tu voz en texto.
*   Tú dices: "Hola Yerbis".
*   El navegador escribe: `"Hola Yerbis"`.

## 4. MediaPipe: Ojos de Robot 👁️
Google creó una tecnología llamada MediaPipe que permite al navegador "ver" tus manos, tu cara y tu cuerpo, sin enviar el video a ninguna parte. ¡Todo pasa en tu computadora!

---

# PARTE 4: CÓMO CREAR A YERBIS (Paso a Paso) 🤖

Ahora que eres un mago de nivel 1, vamos a crear la obra maestra: **Yerbis, el Asistente de YouTube**.

## 🛠️ Paso 1: Los Cimientos (manifest.json)
Todo empieza con un archivo llamado `manifest.json`. Es el DNI de tu extensión. Le dice a Chrome: "Hola, soy Yerbis y necesito permiso para ver YouTube".

```json
{
  "manifest_version": 3,
  "name": "Yerbis Air Control",
  "permissions": ["sidePanel", "scripting", "activeTab"],
  "host_permissions": ["https://www.youtube.com/*"]
}
```

## 👂 Paso 2: El Oído (Reconocimiento de Voz)
Vamos a hacer que escuche. Usaremos `webkitSpeechRecognition`.

**El Truco:** Queremos que escuche *siempre*, pero que solo obedezca cuando digamos su nombre.

1.  **Crear el Oído:** `const reconocimiento = new webkitSpeechRecognition();`
2.  **Configurarlo:** `reconocimiento.continuous = true;` (No pares de escuchar).
3.  **El Portero (Wake Word):**
    ```javascript
    reconocimiento.onresult = (evento) => {
      const loQueEscuche = evento.results[0][0].transcript;
      
      if (loQueEscuche.includes("Yerbis")) {
        despertar(); // ¡Se activa!
      }
    };
    ```

## 🧠 Paso 3: El Cerebro (Conectando a Gemini)
Cuando Yerbis despierta, necesita entender qué quieres.
Usaremos la librería de Google Generative AI.

1.  **El Prompt (La Instrucción):** No basta con enviarle lo que dijiste. Hay que darle contexto.
    *   *Usuario:* "Ponlo al principio".
    *   *Prompt a Gemini:* "El usuario dijo 'Ponlo al principio'. El video está en el minuto 5:00. Traduce esto a una acción JSON."
2.  **La Respuesta de Gemini:**
    ```json
    { "action": "SEEK", "time": 0 }
    ```

## 👁️ Paso 4: Los Ojos (Control Gestual)
Para cuando no quieres hablar. Usaremos MediaPipe Hands.

1.  **Detectar la Mano:** MediaPipe nos da 21 puntos (nudillos y puntas de dedos).
2.  **El Puño (Pausa):**
    *   Si la punta del dedo índice está *abajo* del nudillo... el dedo está doblado.
    *   Si los 4 dedos están doblados... ¡Es un puño! -> **PAUSA**.
3.  **El Dedo Índice (Volumen):**
    *   Si el dedo sube (coordenada Y disminuye)... -> **SUBIR VOLUMEN**.
    *   Si el dedo baja... -> **BAJAR VOLUMEN**.

## ✋ Paso 5: Las Manos (Content Script)
Yerbis vive en una barra lateral, pero necesita tocar el video de YouTube.
Para eso, envía mensajes.

1.  **Yerbis (Cerebro):** "¡Gemini dijo que pausemos!" -> `chrome.tabs.sendMessage(tabId, { action: "PAUSE" });`
2.  **YouTube (Cuerpo):**
    ```javascript
    chrome.runtime.onMessage.addListener((mensaje) => {
      const video = document.querySelector('video');
      if (mensaje.action === "PAUSE") {
        video.pause();
      }
    });
    ```

## 🚀 Paso 6: ¡El Ensamblaje Final!
1.  Juntamos el **Oído** y los **Ojos** en el Panel Lateral (`SidePanel.jsx`).
2.  Ponemos las **Manos** en YouTube (`content.js`).
3.  Usamos a **Gemini** para traducir tus deseos en órdenes.

**¡Felicidades!** Has creado vida digital. Yerbis ahora puede ver, escuchar y obedecerte. Eres oficialmente un Programador Mago. 🧙‍♂️✨

---
*Fin de la Guía. Ahora ve y crea.*
