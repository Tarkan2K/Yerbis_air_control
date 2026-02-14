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
