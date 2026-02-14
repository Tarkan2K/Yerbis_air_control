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
    }; // Re-run if mode changes? No, we want it persistent. 
    // Actually, we want it to run once we leave SETUP. 
    // But if we switch modes, we don't need to restart recognition, just keep it running.
    // So dependency should be just []. But we need to check mode inside. 
    // Let's refine: The effect runs once. Inside onend, we check current mode ref? 
    // React state in callbacks can be stale. 
    // For simplicity in this "Lite" version, let's restart it if mode changes to ensure clean state?
    // No, continuous is better. Let's stick to the effect running when we enter a valid mode.

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
                        // Mirror mode: Moving hand RIGHT (screen right) means x decreases? 
                        // Let's test: If I move hand right, in mirror view, it moves right. 
                        // MediaPipe x: 0 is left, 1 is right. 
                        // Wait, transform: scaleX(-1) mirrors the visual, but landmarks are original?
                        // Usually landmarks are normalized 0..1. 
                        // If I move right, x increases. 
                        // Let's assume standard: deltaX > 0 is Right, deltaX < 0 is Left.

                        // BUT, we want "Right" to be "Forward".
                        const action = deltaX < 0 ? 'SEEK_FORWARD' : 'SEEK_BACKWARD'; // Inverted due to mirror feel? 
                        // Let's stick to: Hand Right -> Forward. 
                        // If mirrored, Hand Right on screen is X decreasing? No, X is 0..1.
                        // Let's try: deltaX > 0 (Right) -> Forward.
                        // Actually, let's assume deltaX > 0 is LEFT in mirrored view? 
                        // Let's just map it: 
                        // deltaX > 0.05 -> SEEK_BACKWARD (Left)
                        // deltaX < -0.05 -> SEEK_FORWARD (Right)
                        // (Assuming 0 is Left of image, 1 is Right. If I move Right, x increases. So deltaX > 0)

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
