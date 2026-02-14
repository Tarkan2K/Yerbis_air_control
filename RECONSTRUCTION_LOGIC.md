# 🎓 Masterclass: Construyendo Yerbis desde Cero

**Tiempo Estimado:** 4 Horas  
**Nivel:** Intermedio/Avanzado  
**Objetivo:** Construir una IA local que controle YouTube con voz y gestos, sin depender de librerías externas innecesarias.

---

## 🧠 Introducción: La Filosofía del Arquitecto

Antes de escribir una línea de código, debes entender **por qué** estamos construyendo esto así.

### ❓ Pregunta 1: ¿Por qué una Extensión de Chrome y no una App de Escritorio?
*   **Lógica:** Queremos controlar YouTube. YouTube vive en el navegador. Una extensión tiene acceso directo al DOM (`<video>`) de la página. Una app de escritorio tendría que "hackear" el control del mouse o usar APIs complejas.
*   **Decisión:** Usaremos **Manifest V3**, el estándar moderno de extensiones.

### ❓ Pregunta 2: ¿Por qué "Voice First" (Primero Voz)?
*   **Lógica:** Mantener la cámara encendida consume mucha CPU y batería. Además, es invasivo. La voz es pasiva y barata.
*   **Decisión:** El sistema escuchará siempre, pero solo encenderá la cámara ("los ojos") cuando se lo pidamos.

### ❓ Pregunta 3: ¿Por qué Gemini Flash Lite?
*   **Lógica:** Necesitamos velocidad. El usuario no quiere esperar 2 segundos para pausar un video. Flash Lite es rápido y barato.
*   **Decisión:** Usaremos `gemini-2.0-flash-lite`.

---

## 🛠️ Fase 1: Los Cimientos (30 Minutos)

### ¿Qué necesito?
Solo necesitas **Node.js** instalado. Nada más.

### Paso 1.1: Estructura del Proyecto
No uses `create-react-app`, es muy pesado. Usaremos **Vite** por su velocidad.

**Acción:** Ejecuta esto en tu terminal:
```bash
npm init -y
npm install react react-dom react-webcam @google/generative-ai lucide-react
npm install -D vite @vitejs/plugin-react
```

**Estructura de Carpetas:**
Crea esto manualmente. Es vital para el orden.
```text
yerbis/
├── public/
│   ├── manifest.json   <-- El DNI de la extensión
│   └── mediapipe/      <-- Los archivos de IA visual (descárgalos de Google)
├── src/
│   ├── content/        <-- El "Músculo" (vive en la página web)
│   ├── services/       <-- Lógica pura (matemáticas)
│   └── sidepanel/      <-- El "Cerebro" (React UI)
└── vite.config.js      <-- El compilador
```

### Paso 1.2: El Manifiesto (`public/manifest.json`)
Este archivo le dice a Chrome: "Hola, soy una extensión y necesito estos permisos".

**¿Por qué `sidePanel`?** Porque queremos una UI persistente que no se cierre al cambiar de pestaña.
**¿Por qué `scripting`?** Para inyectar código en YouTube.

```json
{
    "manifest_version": 3,
    "name": "Yerbis Youtube controller",
    "version": "1.0",
    "description": "Control YouTube with gestures and voice using Gemini AI",
    "permissions": [
        "sidePanel",
        "activeTab",
        "scripting",
        "storage"
    ],
    "host_permissions": [
        "*://*.youtube.com/*"
    ],
    "action": {
        "default_title": "Open Yerbis Controller"
    },
    "background": {
        "service_worker": "service-worker.js"
    },
    "side_panel": {
        "default_path": "src/sidepanel/index.html"
    },
    "content_scripts": [
        {
            "matches": [
                "*://*.youtube.com/*"
            ],
            "js": [
                "assets/content.js"
            ]
        }
    ],
    "web_accessible_resources": [
        {
            "resources": [
                "mediapipe/*",
                "assets/*"
            ],
            "matches": [
                "<all_urls>"
            ]
        }
    ],
    "content_security_policy": {
        "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
    }
}
```

---

## 🧠 Paso 2: El Cerebro (SidePanel)

### `src/sidepanel/index.html`
Punto de entrada del panel lateral.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Yerbis</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f0f0f; color: white; font-family: sans-serif; }
  </style>
</head>
<body>
  <!-- MediaPipe Dependencies (Deben estar en public/mediapipe) -->
  <script src="/mediapipe/camera_utils.js" crossorigin="anonymous"></script>
  <script src="/mediapipe/drawing_utils.js" crossorigin="anonymous"></script>
  <script src="/mediapipe/hands.js" crossorigin="anonymous"></script>
  <div id="root"></div>
  <script type="module" src="/src/sidepanel/SidePanel.jsx"></script>
</body>
</html>
```

### `src/services/gesture.js`
Lógica matemática para detectar gestos.

```javascript
export const isFist = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return false;

    const fingers = [
        { tip: 8, pip: 6 },   // Index
        { tip: 12, pip: 10 }, // Middle
        { tip: 16, pip: 14 }, // Ring
        { tip: 20, pip: 18 }  // Pinky
    ];

    const areFingersClosed = fingers.every(finger => {
        return landmarks[finger.tip].y > landmarks[finger.pip].y;
    });

    return areFingersClosed;
};

export const isPointing = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return false;

    // Index Open (Tip ABOVE Pip)
    const indexOpen = landmarks[8].y < landmarks[6].y;

    // Others Closed (Tip BELOW Pip)
    const middleClosed = landmarks[12].y > landmarks[10].y;
    const ringClosed = landmarks[16].y > landmarks[14].y;
    const pinkyClosed = landmarks[20].y > landmarks[18].y;

    return indexOpen && middleClosed && ringClosed && pinkyClosed;
};
```

### `src/sidepanel/SidePanel.jsx` (Lógica Principal - CÓDIGO COMPLETO)
Este es el archivo más importante. Cópialo entero.

```javascript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import Webcam from 'react-webcam';
import { Mic, MicOff, Save } from 'lucide-react';
import { isFist, isPointing } from '../services/gesture';
import './SidePanel.css';
import { GoogleGenerativeAI } from "@google/generative-ai";

const WAKE_WORDS = ["yerbis", "ierbis", "hierbies", "yerbies", "jarvis", "yarbis", "larvis", "darvis", "dervis", "jervies", "jervi", "derbi", "llervi", "llevi"];

const SidePanel = () => {
    // Modes: 'LOADING', 'SETUP', 'VOICE_ONLY', 'MANUAL_CONTROL'
    const [mode, setModeState] = useState('LOADING');
    const modeRef = useRef('LOADING'); // Ref to access mode inside callbacks without re-running effect

    const setMode = (newMode) => {
        setModeState(newMode);
        modeRef.current = newMode;
    };

    const [apiKey, setApiKeyState] = useState('');
    const apiKeyRef = useRef(''); // Ref for accessing key in closures

    const setApiKey = (key) => {
        setApiKeyState(key);
        apiKeyRef.current = key;
    };

    const [lastHeard, setLastHeard] = useState(''); // Debug state
    const [isListening, setIsListening] = useState(false); // Debug state
    const [isProcessing, setIsProcessing] = useState(false); // AI Processing state
    const [isWakeWordActive, setIsWakeWordActive] = useState(false); // Session state

    // Logic Refs
    const recognitionRef = useRef(null);
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const stopTimeoutRef = useRef(null); // To debounce the "Stopped" status
    const wakeWordTimeoutRef = useRef(null); // For the 5s active session

    // Gesture Logic Refs
    const gestureStateRef = useRef('libre');
    const fistHoldStart = useRef(0);
    const lastTriggerTime = useRef(0);
    const historyRef = useRef([]);
    const HISTORY_SIZE = 3;

    // Joystick Refs
    const joystickOrigin = useRef(null);
    const lastJoystickAction = useRef(0);

    // --- GEMINI INTEGRATION ---
    const askGemini = async (userRequest, currentState) => {
        try {
            const key = apiKeyRef.current;
            if (!key) {
                console.error("No API Key found in ref");
                return null;
            }

            const genAI = new GoogleGenerativeAI(key);
            // Using specific version from available models list
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

            const prompt = `
            Eres un controlador de video. Tu salida DEBE ser un objeto JSON válido y NADA MÁS.
            
            Recibirás:
            1. 'User Request': "${userRequest}"
            2. 'Current State': ${JSON.stringify(currentState)}
            
            Tu misión es interpretar la intención y devolver un JSON con la acción:
            {
              "action": "SET_VOLUME" | "SEEK_RELATIVE" | "PLAY" | "PAUSE",
              "value": (float o int, opcional),
              "speech": "Frase corta para responder al usuario"
            }
            
            Reglas de Interpretación:
            - 'Sube un poco' -> volume + 0.1
            - 'Sube harto' -> volume + 0.3
            - 'Ponlo a la mitad' -> volume = 0.5
            - 'Retrocede' -> time - 10
            - 'Adelanta harto' -> time + 60
            - 'Silencio' -> volume = 0
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean JSON (remove markdown code blocks if present)
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);

        } catch (error) {
            console.error("Gemini Error:", error);
            return null;
        }
    };

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
    };

    // --- 1. INITIALIZATION & API KEY CHECK ---
    useEffect(() => {
        chrome.storage.local.get(['geminiApiKey'], (result) => {
            if (result.geminiApiKey) {
                setMode('VOICE_ONLY');
                setApiKey(result.geminiApiKey);

                // DEBUG: List available models
                fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${result.geminiApiKey}`)
                    .then(res => res.json())
                    .then(data => {
                        console.log("--- AVAILABLE GEMINI MODELS ---");
                        if (data.models) {
                            data.models.forEach(m => console.log(m.name));
                        } else {
                            console.log("No models found or error:", data);
                        }
                        console.log("-------------------------------");
                    })
                    .catch(err => console.error("ListModels Failed:", err));

            } else {
                setMode('SETUP');
            }
        });
    }, []);

    // --- 2. VOICE RECOGNITION SETUP ---
    useEffect(() => {
        // Only run this effect ONCE. 
        // We use modeRef to check state inside callbacks.

        // Initialize Speech Recognition
        if (!('webkitSpeechRecognition' in window)) {
            console.error("Speech recognition not supported");
            setLastHeard("Error: API no soportada");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognition.onstart = () => {
            console.log("Recognition started");
            if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
            setIsListening(true);
        };

        recognition.onresult = async (event) => {
            // We only process the FINAL result for the AI to avoid spamming the API
            // But we keep interim for the "Local Router" (Instant Commands)

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const result = event.results[i];
                const transcript = result[0].transcript.toLowerCase().trim();
                const isFinal = result.isFinal;

                console.log(`Heard (${isFinal ? 'Final' : 'Interim'}):`, transcript);
                setLastHeard(transcript);

                // --- PASO 1: ROUTER LOCAL (Velocidad 0.1s) ---
                // Regex simple para comandos críticos
                if (transcript.includes('apagar') && transcript.includes('control')) {
                    if (modeRef.current !== 'VOICE_ONLY') {
                        setMode('VOICE_ONLY');
                        recognition.stop();
                    }
                    return;
                }
                if (transcript.includes('activa') && transcript.includes('control')) {
                    if (modeRef.current !== 'MANUAL_CONTROL') {
                        setMode('MANUAL_CONTROL');
                        recognition.stop();
                    }
                    return;
                }

                // Instant Media Commands
                if (transcript.match(/\b(pausa|pausar)\b/)) {
                    sendMessageToContent('PAUSE');
                    return;
                }
                if (transcript.match(/\b(play|reproducir|continuar)\b/)) {
                    sendMessageToContent('PLAY');
                    return;
                }
                if (transcript.match(/\b(silencio|mute)\b/)) {
                    sendMessageToContent('SET_VOLUME', 0);
                    return;
                }

                // --- PASO 2: EL FILTRO DE ACTIVACIÓN (Gatekeeper & Session) ---
                if (isFinal) {
                    let rawQuery = '';
                    let shouldProcess = false;

                    // 1. Check for Wake Word
                    const foundWakeWord = WAKE_WORDS.find(word => transcript.includes(word));

                    if (foundWakeWord) {
                        // WAKE WORD DETECTED -> START/EXTEND SESSION
                        console.log(`Wake Word "${foundWakeWord}" detected.`);
                        setIsWakeWordActive(true);
                        
                        // Reset Timeout (5 seconds)
                        if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
                        wakeWordTimeoutRef.current = setTimeout(() => {
                            setIsWakeWordActive(false);
                            console.log("Wake Word Session Expired");
                        }, 5000);

                        // Extract Query (if any)
                        const index = transcript.indexOf(foundWakeWord);
                        rawQuery = transcript.substring(index + foundWakeWord.length).trim();
                        
                        if (rawQuery) shouldProcess = true;

                    } else if (isWakeWordActive) {
                        // ACTIVE SESSION -> ACCEPT EVERYTHING
                        console.log("Session Active: Accepting command without wake word.");
                        rawQuery = transcript;
                        shouldProcess = true;

                        // Extend Timeout
                        if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
                        wakeWordTimeoutRef.current = setTimeout(() => {
                            setIsWakeWordActive(false);
                            console.log("Wake Word Session Expired");
                        }, 5000);
                    } else {
                        // IGNORE
                        console.log("Ignored (No Wake Word & No Active Session):", transcript);
                        return;
                    }

                    if (shouldProcess && rawQuery) {
                        console.log(`Processing Query: "${rawQuery}"`);
                        setIsProcessing(true); // UI Feedback

                        // Get State first
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            if (tabs[0]?.id) {
                                chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATE' }, async (currentState) => {
                                    if (chrome.runtime.lastError || !currentState) {
                                        console.log("Could not get state");
                                        currentState = { volume: 0.5, currentTime: 0 }; // Fallback
                                    }

                                    console.log("Asking Gemini with state:", currentState);
                                    const aiResponse = await askGemini(rawQuery, currentState);
                                    setIsProcessing(false); // Done

                                    if (aiResponse) {
                                        console.log("Gemini Action:", aiResponse);
                                        if (aiResponse.speech) speak(aiResponse.speech);
                                        if (aiResponse.action) {
                                            sendMessageToContent(aiResponse.action, aiResponse.value);
                                        }
                                    }
                                });
                            } else {
                                setIsProcessing(false);
                            }
                        });
                    }
                }
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech error:", event.error);
            if (event.error !== 'no-speech') {
                setLastHeard(`Error: ${event.error}`);
            }
            if (event.error === 'not-allowed') {
                setIsListening(false);
                return;
            }
        };

        recognition.onend = () => {
            console.log("Recognition ended");

            stopTimeoutRef.current = setTimeout(() => {
                setIsListening(false);
            }, 1000);

            // Always restart unless we are in SETUP/LOADING (checked via ref)
            if (modeRef.current !== 'SETUP' && modeRef.current !== 'LOADING') {
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (e) { }
                }, 50);
            }
        };

        recognitionRef.current = recognition;
        // Initial start
        setTimeout(() => {
            if (modeRef.current !== 'SETUP' && modeRef.current !== 'LOADING') {
                try { recognition.start(); } catch (e) { }
            }
        }, 1000);

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []); // Empty dependency = Persistent across mode changes

    const restartMic = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                setTimeout(() => recognitionRef.current.start(), 100);
            } catch (e) {
                console.error(e);
            }
        }
    }; 

    // --- 3. GESTURE LOGIC (Only active in MANUAL_CONTROL) ---
    const sendMessageToContent = useCallback((type, payload) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { type, payload }).catch(() => { });
            }
        });
    }, []);

    const onResults = useCallback((results) => {
        if (modeRef.current !== 'MANUAL_CONTROL') return;

        const canvas = canvasRef.current;
        const video = webcamRef.current?.video;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Draw
            window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            window.drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1 });

            // --- JOYSTICK LOGIC (Index Finger) ---
            if (isPointing(landmarks)) {
                const indexTip = landmarks[8]; // {x, y, z}

                // 1. Capture Origin if new
                if (!joystickOrigin.current) {
                    joystickOrigin.current = { x: indexTip.x, y: indexTip.y };
                    // Visual feedback for origin?
                    return;
                }

                // 2. Calculate Delta
                // Note: x increases to the left (mirror), y increases downwards
                const deltaX = indexTip.x - joystickOrigin.current.x;
                const deltaY = indexTip.y - joystickOrigin.current.y;
                const now = Date.now();

                // 3. Deadzone & Direction
                const DEADZONE = 0.05;

                // Draw Joystick Line
                ctx.beginPath();
                ctx.moveTo(joystickOrigin.current.x * canvas.width, joystickOrigin.current.y * canvas.height);
                ctx.lineTo(indexTip.x * canvas.width, indexTip.y * canvas.height);
                ctx.strokeStyle = "yellow";
                ctx.lineWidth = 3;
                ctx.stroke();

                // X Axis (Seek)
                if (Math.abs(deltaX) > DEADZONE) {
                    if (now - lastJoystickAction.current > 500) { // 500ms for Seek
                        sendMessageToContent(deltaX < 0 ? 'SEEK_FORWARD' : 'SEEK_BACKWARD');
                        lastJoystickAction.current = now;
                    }
                }

                // Y Axis (Volume)
                if (Math.abs(deltaY) > DEADZONE) {
                    if (now - lastJoystickAction.current > 60) { // 60ms for Volume
                        // deltaY > 0 means Down (y increases downwards)
                        // deltaY < 0 means Up
                        const action = deltaY < 0 ? 'VOL_UP' : 'VOL_DOWN';
                        sendMessageToContent(action);
                        lastJoystickAction.current = now;
                    }
                }

            } else {
                // Reset Joystick if not pointing
                joystickOrigin.current = null;
            }

            // --- FIST LOGIC (Play/Pause) ---
            // Only if NOT using joystick (priority)
            if (!joystickOrigin.current) {
                const isFistFrame = isFist(landmarks);
                historyRef.current.push(isFistFrame);
                if (historyRef.current.length > HISTORY_SIZE) historyRef.current.shift();

                const allFist = historyRef.current.every(v => v === true);
                const allOpen = historyRef.current.every(v => v === false);
                const now = Date.now();

                if (now - lastTriggerTime.current < 1000) return; // 1s Debounce

                if (allFist) {
                    if (gestureStateRef.current === 'libre') {
                        gestureStateRef.current = 'preparado';
                        fistHoldStart.current = now;
                    }
                } else if (allOpen) {
                    if (gestureStateRef.current === 'preparado') {
                        const holdDuration = now - fistHoldStart.current;
                        if (holdDuration > 200) { // Quick fist is enough
                            sendMessageToContent('TOGGLE_PLAY');
                            lastTriggerTime.current = now;
                            gestureStateRef.current = 'libre';
                        }
                    } else {
                        gestureStateRef.current = 'libre';
                    }
                }
            }
        } else {
            gestureStateRef.current = 'libre';
            joystickOrigin.current = null;
        }
    }, [sendMessageToContent]);

    // --- 4. MEDIAPIPE SETUP (Only in MANUAL_CONTROL) ---
    useEffect(() => {
        if (mode !== 'MANUAL_CONTROL') return;

        let camera = null;
        let hands = null;

        const init = async () => {
            hands = new window.Hands({
                locateFile: (file) => chrome.runtime.getURL(`mediapipe/${file}`)
            });
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 0,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            hands.onResults(onResults);

            if (webcamRef.current && webcamRef.current.video) {
                camera = new window.Camera(webcamRef.current.video, {
                    onFrame: async () => {
                        if (webcamRef.current?.video) {
                            await hands.send({ image: webcamRef.current.video });
                        }
                    },
                    width: 320,
                    height: 240
                });
                await camera.start();
            }
        };

        init();

        return () => {
            if (camera) camera.stop();
            if (hands) hands.close();
        };
    }, [mode, onResults]);

    // --- HANDLERS ---
    const handleSaveKey = () => {
        if (apiKey.trim()) {
            chrome.storage.local.set({ geminiApiKey: apiKey.trim() }, () => {
                setMode('VOICE_ONLY');
            });
        }
    };

    // --- RENDER ---
    if (mode === 'LOADING') return <div className="container center">Cargando...</div>;

    if (mode === 'SETUP') {
        return (
            <div className="container center">
                <h2>Configuración Inicial</h2>
                <p>Ingresa tu Gemini API Key:</p>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="API Key"
                    style={{ width: '90%', padding: '8px', margin: '10px 0' }}
                />
                <button onClick={handleSaveKey} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                    <Save size={16} style={{ marginRight: '5px' }} /> Guardar
                </button>
            </div>
        );
    }

    return (
        <div className="container" style={{ background: '#000', minHeight: '100vh', padding: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '10px', color: '#888', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>
                Yerbis
            </div>

            {/* Content based on Mode */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                {mode === 'VOICE_ONLY' && (
                    <div className="voice-mode-minimal">
                        <div className="mic-pulse" style={{ opacity: isListening ? 1 : 0.3, marginBottom: '10px' }}>
                            <Mic size={32} color={isWakeWordActive ? "#00FFFF" : (isListening ? "#00ff00" : "#ff0000")} />
                        </div>
                        <p style={{ color: '#fff', fontSize: '12px', textAlign: 'center', margin: 0 }}>
                            {isWakeWordActive ? "ESCUCHANDO COMANDO..." : '"Activa control manual"'}
                        </p>
                        <div style={{ marginTop: '5px', textAlign: 'center' }}>
                            <p style={{ color: '#666', fontSize: '10px', margin: 0 }}>
                                {isProcessing ? 'Procesando...' : (isListening ? 'Escuchando' : '...')}
                            </p>
                        </div>
                    </div>
                )}

                {mode === 'MANUAL_CONTROL' && (
                    <div className="manual-mode" style={{ position: 'relative', width: '100%' }}>
                        <div className="webcam-container">
                            <Webcam
                                ref={webcamRef}
                                className="webcam-video"
                                videoConstraints={{ facingMode: "user" }}
                            />
                            <canvas ref={canvasRef} className="webcam-canvas" />
                        </div>
                        <p style={{ color: '#888', marginTop: '10px', fontSize: '12px', textAlign: 'center' }}>
                            Dí: "Apagar control manual"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Yerbis Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, color: 'red' }}>
                    <h2>Algo salió mal.</h2>
                    <p>{this.state.error && this.state.error.toString()}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ErrorBoundary>
        <SidePanel />
    </ErrorBoundary>
);
```

---

## ✋ Fase 4: El Músculo (Content Script)

### `src/content/content.js`
Manipula el DOM de YouTube.

```javascript
console.log("Yerbis: Content Script Cargado 🚀");
// Handles direct DOM manipulation on YouTube

let hudTimeout;

const createHUD = () => {
    let hud = document.getElementById('yerbis-hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'yerbis-hud';
        hud.style.position = 'fixed';
        hud.style.top = '50%';
        hud.style.left = '50%';
        hud.style.transform = 'translate(-50%, -50%)';
        hud.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        hud.style.color = 'white';
        hud.style.padding = '20px';
        hud.style.borderRadius = '16px';
        hud.style.fontSize = '48px';
        hud.style.zIndex = '9999';
        hud.style.pointerEvents = 'none';
        hud.style.opacity = '0';
        hud.style.transition = 'opacity 0.2s';
        hud.style.display = 'flex';
        hud.style.alignItems = 'center';
        hud.style.justifyContent = 'center';
        document.body.appendChild(hud);
    }
    return hud;
};

const showHUD = (icon, text) => {
    const hud = createHUD();
    hud.innerHTML = `<div>${icon}</div><div style="font-size: 16px; margin-top: 5px;">${text || ''}</div>`;
    hud.style.opacity = '1';

    if (hudTimeout) clearTimeout(hudTimeout);
    hudTimeout = setTimeout(() => {
        hud.style.opacity = '0';
    }, 1000);
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const video = document.querySelector('video');

    // 1. Handle State Request (Synchronous)
    if (message.type === 'GET_STATE') {
        if (video) {
            sendResponse({
                volume: video.volume,
                currentTime: video.currentTime,
                duration: video.duration,
                paused: video.paused
            });
        } else {
            sendResponse(null);
        }
        return true; // Keep channel open
    }

    if (!video) return;

    // 2. Handle Actions
    if (message.type === 'TOGGLE_PLAY') {
        if (video.paused) {
            video.play();
            showHUD('▶️', 'Play');
        } else {
            video.pause();
            showHUD('⏸️', 'Pause');
        }
    } else if (message.type === 'PLAY') {
        video.play();
        showHUD('▶️', 'Play');
    } else if (message.type === 'PAUSE') {
        video.pause();
        showHUD('⏸️', 'Pause');
    } else if (message.type === 'VOL_UP') {
        video.volume = Math.min(1, video.volume + 0.01);
        showHUD('🔊', Math.round(video.volume * 100) + '%');
    } else if (message.type === 'VOL_DOWN') {
        video.volume = Math.max(0, video.volume - 0.01);
        showHUD('🔉', Math.round(video.volume * 100) + '%');
    } else if (message.type === 'SET_VOLUME') {
        // message.payload is target volume (0.0 - 1.0)
        const target = Math.max(0, Math.min(1, message.payload));
        video.volume = target;
        showHUD('🔊', Math.round(target * 100) + '%');
    } else if (message.type === 'SEEK_FORWARD') {
        video.currentTime += 5;
        showHUD('⏩', '+5s');
    } else if (message.type === 'SEEK_BACKWARD') {
        video.currentTime -= 5;
        showHUD('⏪', '-5s');
    } else if (message.type === 'SEEK_RELATIVE') {
        // message.payload is seconds to add/subtract (e.g. +60 or -10)
        video.currentTime += message.payload;
        const icon = message.payload > 0 ? '⏩' : '⏪';
        showHUD(icon, (message.payload > 0 ? '+' : '') + message.payload + 's');
    }
});
```

---

## 🚀 Fase 5: Ensamblaje Final

1.  **Compilar:** `npm run build` (Vite empaquetará todo en la carpeta `dist`).
2.  **Instalar:** Ve a `chrome://extensions`, activa "Developer Mode", y carga la carpeta `dist`.

### Reflexión Final
Has construido un sistema complejo:
1.  **Voz Local** para velocidad.
2.  **IA en la Nube** para inteligencia.
3.  **Visión Local** para control gestual.
4.  **Inyección de Scripts** para control del DOM.

Todo esto orquestado en una extensión de menos de 500KB (sin contar node_modules). ¡Felicidades!
