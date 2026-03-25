const STORAGE_KEY = "color-rush-best-score";
const SETTINGS_KEY = "color-rush-settings";
const SPLASH_MS = 2000;
const CORRECT_DELAY_MS = 450;
const COLOR_LIST = ["Red", "Blue", "Green", "Yellow"];
const LEVEL_CONFIG = [
    { minScore: 20, level: 5, timeLimit: 1 },
    { minScore: 15, level: 4, timeLimit: 2 },
    { minScore: 10, level: 3, timeLimit: 3 },
    { minScore: 8, level: 2, timeLimit: 4 },
    { minScore: 0, level: 1, timeLimit: 5 }
];

const splashScreen = document.getElementById("splash-screen");
const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const menuBestScore = document.getElementById("menu-best-score");
const menuBestLevel = document.getElementById("menu-best-level");
const playButton = document.getElementById("play-button");
const playAgainButton = document.getElementById("play-again-button");
const menuSettingsButton = document.getElementById("menu-settings-button");
const gameSettingsButton = document.getElementById("game-settings-button");
const backButton = document.getElementById("back-button");
const settingsModal = document.getElementById("settings-modal");
const settingsBackdrop = document.getElementById("settings-backdrop");
const closeSettingsButton = document.getElementById("close-settings-button");
const instructionLabel = document.getElementById("instruction-label");
const statusLabel = document.getElementById("status-label");
const scoreLabel = document.getElementById("score-label");
const bestScoreLabel = document.getElementById("best-score-label");
const levelLabel = document.getElementById("level-label");
const timeLeftLabel = document.getElementById("time-left-label");
const musicToggle = document.getElementById("music-toggle");
const soundToggle = document.getElementById("sound-toggle");
const themeToggle = document.getElementById("theme-toggle");
const colorGrid = document.querySelector(".color-grid");
const colorButtons = Array.from(document.querySelectorAll(".color-button"));

const game = {
    score: 0,
    bestScore: 0,
    level: 1,
    timeLimit: 5,
    timeLeft: 5,
    correctColor: "",
    status: "idle",
    gameTimerId: null,
    delayTimerId: null,
    musicEnabled: true,
    soundEnabled: true
};

const audioState = {
    context: null,
    musicIntervalId: null,
    masterGain: null,
    isUnlocked: false
};

initialize();

function initialize() {
    loadBestScore();
    loadSettings();
    updateScoreboard();
    updateMenuStats();
    installAudioUnlock();
    bindEvents();
    window.setTimeout(showMenuScreen, SPLASH_MS);
    registerServiceWorker();
}

function bindEvents() {
    playButton.addEventListener("click", startGameFromMenu);
    playAgainButton.addEventListener("click", playAgain);
    menuSettingsButton.addEventListener("click", openSettings);
    gameSettingsButton.addEventListener("click", openSettings);
    closeSettingsButton.addEventListener("click", closeSettings);
    settingsBackdrop.addEventListener("click", closeSettings);
    backButton.addEventListener("click", goBackToMenu);
    musicToggle.addEventListener("change", handleMusicToggle);
    soundToggle.addEventListener("change", handleSoundToggle);
    themeToggle.addEventListener("change", handleThemeToggle);

    colorButtons.forEach((button) => {
        button.addEventListener("click", () => handleColorTap(button.dataset.color));
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopMusic();
        } else if (game.musicEnabled && game.status === "running") {
            ensureAudioContext().then(() => {
                startMusic();
            });
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !settingsModal.hidden) {
            closeSettings();
        }
    });
}

function showMenuScreen() {
    switchScreen(menuScreen);
}

function switchScreen(nextScreen) {
    [splashScreen, menuScreen, gameScreen].forEach((screen) => {
        const isActive = screen === nextScreen;
        screen.hidden = !isActive;
        screen.classList.toggle("active", isActive);
    });
}

function loadBestScore() {
    const storedValue = parseInt(window.localStorage.getItem(STORAGE_KEY), 10);
    game.bestScore = Number.isFinite(storedValue) ? storedValue : 0;
}

function saveBestScore() {
    window.localStorage.setItem(STORAGE_KEY, String(game.bestScore));
}

function loadSettings() {
    const savedSettings = window.localStorage.getItem(SETTINGS_KEY);

    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            game.musicEnabled = parsedSettings.musicEnabled !== false;
            game.soundEnabled = parsedSettings.soundEnabled !== false;
            applyTheme(parsedSettings.theme === "light" ? "light" : "dark");
        } catch {
            applyTheme("dark");
        }
    } else {
        applyTheme("dark");
    }

    musicToggle.checked = game.musicEnabled;
    soundToggle.checked = game.soundEnabled;
}

function saveSettings() {
    const theme = document.body.dataset.theme === "light" ? "light" : "dark";

    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        musicEnabled: game.musicEnabled,
        soundEnabled: game.soundEnabled,
        theme
    }));
}

async function startGameFromMenu() {
    await ensureAudioContext();
    switchScreen(gameScreen);
    startRound();
}

async function playAgain() {
    await ensureAudioContext();
    startRound();
}

function goBackToMenu() {
    clearTimers();
    stopMusic();
    game.status = "idle";
    playAgainButton.hidden = true;
    switchScreen(menuScreen);
    updateMenuStats();
}

function startRound() {
    clearTimers();
    game.score = 0;
    updateLevelFromScore();
    game.timeLeft = game.timeLimit;
    game.correctColor = "";
    game.status = "running";

    playAgainButton.hidden = true;
    instructionLabel.classList.remove("hidden-visibility");
    statusLabel.textContent = "Ready? Go!";

    setColorButtonsEnabled(true);
    updateScoreboard();
    updateMenuStats();
    shuffleColorButtons();
    pickNextColor();
    startMusic();
    startGameTimer();
}

function handleColorTap(tappedColor) {
    if (game.status !== "running") {
        return;
    }

    if (tappedColor === game.correctColor) {
        handleCorrectTap();
        return;
    }

    endGame("wrong");
}

function handleCorrectTap() {
    window.clearInterval(game.gameTimerId);
    game.gameTimerId = null;
    game.status = "transition";
    setColorButtonsEnabled(false);

    playCorrectSound();
    game.score += 1;
    updateBestScore();
    updateLevelFromScore();
    game.timeLeft = game.timeLimit;
    statusLabel.textContent = "\u2714 Correct";
    updateScoreboard();

    game.delayTimerId = window.setTimeout(() => {
        game.delayTimerId = null;
        statusLabel.textContent = "";
        shuffleColorButtons();
        pickNextColor();
        setColorButtonsEnabled(true);
        startGameTimer();
    }, CORRECT_DELAY_MS);
}

function endGame(reason) {
    clearTimers();
    game.status = "gameover";
    setColorButtonsEnabled(false);
    playAgainButton.hidden = false;
    instructionLabel.classList.add("hidden-visibility");

    if (reason === "wrong" && "vibrate" in navigator) {
        navigator.vibrate(180);
    }

    stopMusic();

    if (reason === "wrong") {
        playWrongSound();
        statusLabel.textContent = "\u274C Game Over";
        return;
    }

    statusLabel.textContent = "\u23F0 Time Over";
}

function pickNextColor() {
    game.correctColor = COLOR_LIST[Math.floor(Math.random() * COLOR_LIST.length)];
    instructionLabel.textContent = `Tap ${game.correctColor}`;
    instructionLabel.classList.remove("hidden-visibility");
    timeLeftLabel.textContent = String(game.timeLeft);
}

function shuffleColorButtons() {
    const shuffledButtons = [...colorButtons];

    for (let index = shuffledButtons.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        const currentButton = shuffledButtons[index];
        shuffledButtons[index] = shuffledButtons[randomIndex];
        shuffledButtons[randomIndex] = currentButton;
    }

    shuffledButtons.forEach((button) => {
        colorGrid.appendChild(button);
    });
}

function startGameTimer() {
    game.status = "running";
    game.gameTimerId = window.setInterval(() => {
        game.timeLeft -= 1;
        timeLeftLabel.textContent = String(Math.max(game.timeLeft, 0));

        if (game.timeLeft <= 0) {
            endGame("timeout");
        }
    }, 1000);
}

function clearTimers() {
    if (game.gameTimerId !== null) {
        window.clearInterval(game.gameTimerId);
        game.gameTimerId = null;
    }

    if (game.delayTimerId !== null) {
        window.clearTimeout(game.delayTimerId);
        game.delayTimerId = null;
    }
}

function updateLevelFromScore() {
    const nextLevel = LEVEL_CONFIG.find((item) => game.score >= item.minScore) || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
    game.level = nextLevel.level;
    game.timeLimit = nextLevel.timeLimit;
}

function updateBestScore() {
    if (game.score > game.bestScore) {
        game.bestScore = game.score;
        saveBestScore();
    }
}

function updateScoreboard() {
    scoreLabel.textContent = String(game.score);
    bestScoreLabel.textContent = String(game.bestScore);
    levelLabel.textContent = String(game.level);
    timeLeftLabel.textContent = String(game.timeLeft);
}

function updateMenuStats() {
    menuBestScore.textContent = String(game.bestScore);
    menuBestLevel.textContent = String(getLevelForScore(game.bestScore).level);
}

function getLevelForScore(score) {
    return LEVEL_CONFIG.find((item) => score >= item.minScore) || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
}

function setColorButtonsEnabled(isEnabled) {
    colorButtons.forEach((button) => {
        button.disabled = !isEnabled;
    });
}

async function handleMusicToggle() {
    game.musicEnabled = musicToggle.checked;
    saveSettings();

    if (!game.musicEnabled) {
        stopMusic();
        return;
    }

    if (game.status === "running") {
        await ensureAudioContext();
        startMusic();
    }
}

async function handleSoundToggle() {
    game.soundEnabled = soundToggle.checked;
    await ensureAudioContext();
    saveSettings();
}

function handleThemeToggle() {
    applyTheme(themeToggle.checked ? "dark" : "light");
    saveSettings();
}

function applyTheme(themeName) {
    const normalizedTheme = themeName === "light" ? "light" : "dark";
    document.body.dataset.theme = normalizedTheme;
    themeToggle.checked = normalizedTheme === "dark";
}

function installAudioUnlock() {
    ["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
        document.addEventListener(eventName, unlockAudioFromGesture, { passive: true });
    });
}

function removeAudioUnlockListeners() {
    ["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
        document.removeEventListener(eventName, unlockAudioFromGesture, { passive: true });
    });
}

async function unlockAudioFromGesture() {
    await ensureAudioContext();

    if (!audioState.context || audioState.isUnlocked) {
        return;
    }

    const context = audioState.context;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    gainNode.gain.value = 0.0001;
    oscillator.frequency.value = 440;
    oscillator.connect(gainNode);
    gainNode.connect(audioState.masterGain || context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.01);

    audioState.isUnlocked = true;
    removeAudioUnlockListeners();
}

async function ensureAudioContext() {
    if (!audioState.context) {
        const AudioContextRef = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextRef) {
            return;
        }

        audioState.context = new AudioContextRef();
        audioState.masterGain = audioState.context.createGain();
        audioState.masterGain.gain.value = 0.9;
        audioState.masterGain.connect(audioState.context.destination);
    }

    if (audioState.context.state === "suspended") {
        await audioState.context.resume();
    }
}

function playTone({ frequency, duration, type = "sine", volume = 0.06, when = 0 }) {
    if (!audioState.context || audioState.context.state !== "running") {
        return;
    }

    const context = audioState.context;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startAt = context.currentTime + when;
    const endAt = startAt + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(audioState.masterGain || context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt);
}

function playCorrectSound() {
    if (!game.soundEnabled) {
        return;
    }

    playTone({ frequency: 660, duration: 0.12, type: "triangle", volume: 0.12 });
    playTone({ frequency: 880, duration: 0.14, type: "triangle", volume: 0.09, when: 0.08 });
}

function playWrongSound() {
    if (!game.soundEnabled) {
        return;
    }

    playTone({ frequency: 220, duration: 0.2, type: "sawtooth", volume: 0.1 });
    playTone({ frequency: 140, duration: 0.24, type: "square", volume: 0.08, when: 0.04 });
}

function startMusic() {
    if (!game.musicEnabled) {
        return;
    }

    if (!audioState.context || audioState.context.state !== "running" || audioState.musicIntervalId !== null) {
        return;
    }

    const pattern = [261.63, 329.63, 392.0, 329.63];
    let step = 0;

    const playBeat = () => {
        playTone({
            frequency: pattern[step % pattern.length],
            duration: 0.24,
            type: "sine",
            volume: 0.04
        });
        step += 1;
    };

    playBeat();
    audioState.musicIntervalId = window.setInterval(playBeat, 420);
}

function stopMusic() {
    if (audioState.musicIntervalId !== null) {
        window.clearInterval(audioState.musicIntervalId);
        audioState.musicIntervalId = null;
    }
}

function openSettings() {
    settingsModal.hidden = false;
}

function closeSettings() {
    settingsModal.hidden = true;
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js").catch(() => {
        });
    });
}
