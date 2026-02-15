# Yerbis: AI AirControl

**Yerbis** is a futuristic Chrome Extension that transforms how users interact with YouTube. Living in the Side Panel, it uses **Google Gemini AI** and **MediaPipe** to enable hands-free control via **Gestures** and **Voice Commands**.

![Yerbis Banner](https://via.placeholder.com/800x200?text=Yerbis+AirControl)

## Features

-   **Gesture Control**: Control video playback interactions with hand gestures.
    -   **Closed Fist**: Toggle Play/Pause.
-   **Voice Command**: Say "Yerbis" followed by a command.
    -   "Yerbis, pause the video"
    -   "Yerbis, volume up"
    -   "Yerbis, speed up to 2x"
-   **AI-Powered**: Meaningful interactions powered by Google's Gemini Pro.
-   **Privacy Focused**: Runs locally in the browser's Side Panel.

## Documentation

-   [User Manual](./USER_MANUAL.md): Instructions for end-users on how to use voice and gesture controls.
-   [Technical Reference](./TECHNICAL_REFERENCE.md): System architecture, module breakdown, and internal logic.
-   [Engineering Fundamentals](./ENGINEERING_FUNDAMENTALS.md): Theoretical background on JavaScript, AI, and Computer Science concepts used in this project.

## Tech Stack

-   **Framework**: React + Vite
-   **AI Model**: Google Gemini Pro
-   **Computer Vision**: MediaPipe Hands
-   **Platform**: Chrome Extension (Manifest V3)

## Prerequisites

-   **Node.js** (v18 or higher)
-   **npm** or **yarn**
-   A **Google Gemini API Key**.

## Installation & Build

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Tarkan2K/Yerbis_AirControl.git
    cd Yerbis_AirControl
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build the extension**:
    ```bash
    npm run build
    ```
    This will create a `dist` folder containing the production-ready extension.

## Load into Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer Mode** (toggle in the top right corner).
3.  Click **Load unpacked**.
4.  Select the `dist` folder generated in the previous step.

## Usage Guide

1.  Open any YouTube video.
2.  Click the **Yerbis icon** in the Chrome toolbar to open the Side Panel.
3.  **Setup**: Enter your **Gemini API Key** in the settings area and save it.
4.  **Activate**:
    -   Show your hand to the camera. A **Red Dot** indicates tracking is active.
    -   **Play/Pause**: Show a **Closed Fist** for a moment.
    -   **Voice**: Ensure microphone permission is granted. Check the log for "Listening...".

## Contributing

Contributions are welcome. Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
