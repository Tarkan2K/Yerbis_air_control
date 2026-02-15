# Yerbis Air Control: Technical Reference Manual

**Version:** 2.1.0 (Voice-First + Wake Word Session)
**Status:** Production
**Author:** Antigravity AI
**AI Model:** Gemini 2.0 Flash Lite

---

## 1. System Manifesto

**Yerbis Air Control** is a hybrid Voice-Gesture interface designed for privacy, efficiency, and seamless interaction. The core philosophy is **"Voice-First"**, utilizing the camera only when strictly necessary.

The system integrates advanced artificial intelligence (Gemini 2.0 Flash Lite) to understand natural language while protecting system resources and user privacy through a strict **"Wake Word Gatekeeper"** that filters audio not directed at the assistant.

---

## 2. System Architecture

The system operates as a Chrome Extension (Manifest V3) with a reactive architecture based on states.

*   **Core:** React.js + Vite.
*   **Vision Engine:** Google MediaPipe Hands (Manual Mode only).
*   **Voice Engine:** Web Speech API (`webkitSpeechRecognition`) + Session Logic.
*   **AI Brain:** Google Gemini 2.0 Flash Lite.
*   **Platform:** Google Chrome Extension (SidePanel API).

### State Flow (Finite State Machine)

1.  **LOADING:** Initial load.
2.  **SETUP:** API Key configuration.
3.  **VOICE_ONLY (Default):**
    *   Microphone: ACTIVE (Passive listening).
    *   Camera: OFF.
    *   AI: Inactive until Wake Word detection.
4.  **MANUAL_CONTROL:**
    *   Microphone: ACTIVE (Listening for exit command).
    *   Camera: ON (MediaPipe active).
    *   Gestures: Enabled.

---

## 3. System Modules

### Module 1: The Ear (Gatekeeper & Session)
The most critical component. Processes audio in real-time within the browser.
*   **Wake Word:** Detects variations of "Yerbis", "Jarvis", "Hierbies".
*   **Active Session:** Upon name detection, opens a **5-second window** accepting commands without requiring the name repetition.
*   **Local Commands:** Executes critical actions ("Pause", "Activate control") instantly without AI consultation.

### Module 2: The Brain (Gemini AI)
Interprets complex intentions when permitted by the Gatekeeper.
*   **Model:** `gemini-2.0-flash-lite`.
*   **Input:** User transcription + Current video state (Time, Volume, Pause status).
*   **Output:** Structured JSON containing action (`PLAY`, `SEEK`, `VOL`) and spoken response.

### Module 3: The Vision (MediaPipe)
High-precision gesture control.
*   **Closed Fist:** Play/Pause (with safety debounce).
*   **Index Finger (Joystick):**
    *   Horizontal Movement: Seek Forward/Backward.
    *   Vertical Movement: Volume Up/Down.

### Module 4: The Hand (Content Script)
Executes commands on the YouTube DOM.
*   Directly manipulates the `<video>` element.
*   Displays a **HUD (Heads-Up Display)** to visually confirm actions.

---

## 4. Activation Logic (Wake Word)

To protect privacy and API quotas, Yerbis uses a three-tier system:

1.  **Tier 1: Local Commands (Absolute Priority)**
    *   Phrases: "Activate manual control", "Pause", "Play", "Silence".
    *   Action: Immediate local execution. Does not require "Yerbis".

2.  **Tier 2: Wake Word (The Gatekeeper)**
    *   Words: "Yerbis", "Jarvis", etc.
    *   Action: If detected, activates **"Listening Command"** mode.

3.  **Tier 3: Active Session (The Window)**
    *   Duration: 5 seconds after the last command or Wake Word.
    *   Action: All speech within this window is sent to Gemini. Allows for natural, paused speech.

---

## 5. Chrome Extension Anatomy (Manifest V3)

### The Manifest (`manifest.json`)
Defines the extension capabilities.
*   `manifest_version: 3`: Current standard. Secure and performant. prohibits arbitrary remote code execution.
*   `permissions`:
    *   `sidePanel`: Allows persistent sidebar.
    *   `activeTab`: Temporary access to the user's current tab.
    *   `scripting`: Allows code injection into the web page.
*   `content_scripts`: Scripts living *inside* the web page (YouTube). They access the DOM but are isolated from the extension context.
*   `background` (Service Worker): Invisible script handling browser events. Essential for orchestration.

### Messaging Architecture
Extension components cannot communicate directly as they exist in different contexts. They use an asynchronous messaging system.
*   `chrome.runtime.sendMessage(message)`: Broadcasts a message.
*   `chrome.runtime.onMessage.addListener`: Listens for messages.
*   **The Bridge:** The SidePanel (React) sends orders (`PLAY`, `PAUSE`) and the Content Script (YouTube) executes them.

---

## 6. React and State Management

### Fundamental Hooks
*   `useState`: Short-term memory. Triggers re-renders on change.
*   `useRef`: Persistent memory that does **not** trigger re-renders. Vital for mutable objects like the microphone instance or video elements.
*   `useEffect`: Side effects. Primarily used for initialization and cleanup (e.g., starting speech recognition).
*   `useCallback`: Memoizes functions to prevent unnecessary re-creations during renders.

---

## 7. Voice Theory (Web Speech API)

### `webkitSpeechRecognition`
Native Chrome API.
*   `continuous = true`: Keeps listening indefinitely.
*   `interimResults = true`: Provides real-time transcriptions before the final result is confirmed.

### Key Events
*   `onresult`: Fired when new text is detected.
    *   `isFinal`: Boolean indicating if the phrase is complete.
        *   True: Send to AI.
        *   False: Use for rapid local commands.
*   `onend`: Microphone stopped. We restart it immediately (`recognition.start()`) to create an "always-on" illusion.

---

## 8. Computer Vision (MediaPipe)

### Landmarks
MediaPipe detects 21 points on the hand. Each point has `{x, y, z}` coordinates.
*   `x, y`: Screen position (0.0 to 1.0).
*   `z`: Depth relative to the wrist.

### Detection Logic
*   **Fist Detection:** Measures the vertical position of finger tips relative to their PIP joints. If tips are below PIPs (in screen coordinates where Y grows downwards), the finger is closed.
*   **Virtual Joystick:**
    1.  **Origin ($O$):** Position where the index finger first appears.
    2.  **Current ($P$):** Current finger position.
    3.  **Delta ($\Delta$):** $P - O$.
    4.  **Deadzone:** Movements smaller than 0.05 units are ignored to prevent jitter.

---

## 9. Prompt Engineering

### JSON Determinism
Instructions to the AI must be strict to ensure parseable output.
*   **Instruction:** "Your output MUST be valid JSON and NOTHING ELSE."

### Context Injection
The AI requires knowledge of the current system state.
*   **Prompt:** `Current State: { volume: 0.5, time: 120s }`
*   **User:** "Turn it up a little."
*   **AI Interpretation:** "Current volume is 0.5. 'A little' implies +0.1. New volume: 0.6."
*   **Output:** `{ "action": "SET_VOLUME", "value": 0.6 }`

---

## 10. Development & Troubleshooting

### Installation
1.  **Install Dependencies:** `npm install`
2.  **Build:** `npm run build`
3.  **Load in Chrome:** `chrome://extensions` -> Developer Mode -> Load Unpacked -> `dist` folder.

### Common Issues
*   **Error 404 Gemini:** Verify the model name in the code is `gemini-2.0-flash-lite`.
*   **Distant Voice Detection:** Say "Yerbis", wait for the visual indicator, then speak the command.
*   **False Positives:** Use the "Disable manual control" command in noisy environments.
*   **Layout Thrashing:** Avoid reading layout properties (`offsetWidth`) immediately after writing style properties to prevent forced synchronous reflows.
