(() => {
  "use strict";

  /**
   * Essential Breathing Web.
   *
   * This file intentionally avoids frameworks and build tools. The goal is to
   * keep the web version small, readable and close to the spirit of the Godot
   * application: one calm screen, one breathing guide, a few settings.
   */

  const STORAGE_KEY = "essentialBreathingWeb.settings.v1";

  const DURATION_STEP = 0.5;
  const MINIMUM_DURATION = 1.0;
  const MAXIMUM_DURATION = 20.0;
  const MINIMUM_SESSION_DURATION_MINUTES = 1;
  const MAXIMUM_SESSION_DURATION_MINUTES = 60;

  const GAUGE_TOP_Y = 50;
  const GAUGE_BOTTOM_Y = 470;

  const SessionState = Object.freeze({
    IDLE: "idle",
    RUNNING: "running",
    PAUSED: "paused",
    COMPLETING: "completing",
  });

  const BreathingPhase = Object.freeze({
    INHALE: "inhale",
    EXHALE: "exhale",
  });

  const themes = [
    {
      nameKey: "THEME_OCEAN",
      backgroundColor: "#00122e",
      textColor: "#dbf5ff",
      gaugeColor: "#003d7a",
      ballColor: "#00c7ff",
      themeColor: "#00122e",
    },
    {
      nameKey: "THEME_JUNGLE",
      backgroundColor: "#056917",
      textColor: "#f2ffeb",
      gaugeColor: "#008c03",
      ballColor: "#63ff00",
      themeColor: "#056917",
    },
    {
      nameKey: "THEME_VOLCANO",
      backgroundColor: "#380517",
      textColor: "#ffba08",
      gaugeColor: "#9e0308",
      ballColor: "#ffba08",
      themeColor: "#380517",
    },
    {
      nameKey: "THEME_SKY",
      backgroundColor: "#c7ebff",
      textColor: "#0a2952",
      gaugeColor: "#f5fcff",
      ballColor: "#2e9eff",
      themeColor: "#c7ebff",
    },
  ];

  const translations = {
    en: {
      SETTINGS_TITLE: "Settings",
      BREATHING_SECTION: "Breathing",
      INHALE: "Inhale",
      EXHALE: "Exhale",
      SESSION_DURATION: "Session duration",
      THEMES_SECTION: "Themes",
      SESSION_COMPLETED: "Session completed",
      SESSION_DURATION_MINUTES_FORMAT: "{0} min",
      THEME_OCEAN: "Ocean",
      THEME_JUNGLE: "Jungle",
      THEME_VOLCANO: "Volcano",
      THEME_SKY: "Sky",
    },
    fr: {
      SETTINGS_TITLE: "Réglages",
      BREATHING_SECTION: "Respiration",
      INHALE: "Inspiration",
      EXHALE: "Expiration",
      SESSION_DURATION: "Durée de la session",
      THEMES_SECTION: "Thèmes",
      SESSION_COMPLETED: "Session terminée",
      SESSION_DURATION_MINUTES_FORMAT: "{0} min",
      THEME_OCEAN: "Océan",
      THEME_JUNGLE: "Jungle",
      THEME_VOLCANO: "Volcan",
      THEME_SKY: "Ciel",
    },
    es: {
      SETTINGS_TITLE: "Ajustes",
      BREATHING_SECTION: "Respiración",
      INHALE: "Inspiración",
      EXHALE: "Exhalación",
      SESSION_DURATION: "Duración de la sesión",
      THEMES_SECTION: "Temas",
      SESSION_COMPLETED: "Sesión terminada",
      SESSION_DURATION_MINUTES_FORMAT: "{0} min",
      THEME_OCEAN: "Océano",
      THEME_JUNGLE: "Jungla",
      THEME_VOLCANO: "Volcán",
      THEME_SKY: "Cielo",
    },
  };

  const elements = {
    mainScreen: document.querySelector("#main-screen"),
    settingsScreen: document.querySelector("#settings-screen"),
    settingsButton: document.querySelector("#settings-button"),
    backButton: document.querySelector("#back-button"),
    startButton: document.querySelector("#start-button"),
    stopButton: document.querySelector("#stop-button"),
    runningTouchArea: document.querySelector("#running-touch-area"),
    pausePanel: document.querySelector("#pause-panel"),
    pauseProgressLabel: document.querySelector("#pause-progress-label"),
    sessionProgressFill: document.querySelector("#session-progress-fill"),
    breathingBall: document.querySelector("#breathing-ball"),
    completionOverlay: document.querySelector("#completion-overlay"),
    completionMessage: document.querySelector("#completion-message"),
    settingsTitle: document.querySelector("#settings-title"),
    breathingSectionTitle: document.querySelector("#breathing-section-title"),
    inhaleLabel: document.querySelector("#inhale-label"),
    exhaleLabel: document.querySelector("#exhale-label"),
    sessionDurationLabel: document.querySelector("#session-duration-label"),
    themesSectionTitle: document.querySelector("#themes-section-title"),
    inhaleMinus: document.querySelector("#inhale-minus"),
    inhalePlus: document.querySelector("#inhale-plus"),
    inhaleValue: document.querySelector("#inhale-value"),
    exhaleMinus: document.querySelector("#exhale-minus"),
    exhalePlus: document.querySelector("#exhale-plus"),
    exhaleValue: document.querySelector("#exhale-value"),
    sessionDurationSlider: document.querySelector("#session-duration-slider"),
    sessionDurationValue: document.querySelector("#session-duration-value"),
    previousThemeButton: document.querySelector("#previous-theme-button"),
    nextThemeButton: document.querySelector("#next-theme-button"),
    themeName: document.querySelector("#theme-name"),
    themeColorMeta: document.querySelector('meta[name="theme-color"]'),
  };

  const language = detectLanguage();

  let settings = loadSettings();
  let sessionState = SessionState.IDLE;
  let breathingPhase = BreathingPhase.INHALE;
  let phaseElapsed = 0;
  let sessionElapsed = 0;
  let isFinishingSession = false;
  let animationFrameId = 0;
  let lastFrameTimestamp = null;
  let wakeLock = null;

  initialize();

  function initialize() {
    applyLocalization();
    applyTheme();
    updateSettingsScreen();
    resetSession();
    bindEvents();
  }

  function bindEvents() {
    elements.settingsButton.addEventListener("click", showSettingsScreen);
    elements.backButton.addEventListener("click", showMainScreen);
    elements.startButton.addEventListener("click", startOrResumeSession);
    elements.stopButton.addEventListener("click", stopSession);
    elements.runningTouchArea.addEventListener("click", pauseSession);

    elements.inhaleMinus.addEventListener("click", () => changeDuration("inhaleDuration", -DURATION_STEP));
    elements.inhalePlus.addEventListener("click", () => changeDuration("inhaleDuration", DURATION_STEP));
    elements.exhaleMinus.addEventListener("click", () => changeDuration("exhaleDuration", -DURATION_STEP));
    elements.exhalePlus.addEventListener("click", () => changeDuration("exhaleDuration", DURATION_STEP));

    elements.sessionDurationSlider.addEventListener("input", () => {
      settings.sessionDurationMinutes = clampInteger(
        Number(elements.sessionDurationSlider.value),
        MINIMUM_SESSION_DURATION_MINUTES,
        MAXIMUM_SESSION_DURATION_MINUTES,
      );
      persistSettingsAndRefresh();
    });

    elements.previousThemeButton.addEventListener("click", () => changeTheme(-1));
    elements.nextThemeButton.addEventListener("click", () => changeTheme(1));

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && sessionState !== SessionState.IDLE) {
        requestWakeLock();
      }
    });
  }

  function startOrResumeSession() {
    if (sessionState === SessionState.IDLE) {
      breathingPhase = BreathingPhase.INHALE;
      phaseElapsed = 0;
      sessionElapsed = 0;
      isFinishingSession = false;
      setGaugeProgress(0);
    }

    if (sessionState === SessionState.PAUSED || sessionState === SessionState.IDLE) {
      sessionState = SessionState.RUNNING;
      lastFrameTimestamp = null;
      updateMainControls();
      requestWakeLock();
      animationFrameId = window.requestAnimationFrame(updateSessionFrame);
    }
  }

  function pauseSession() {
    if (sessionState !== SessionState.RUNNING) {
      return;
    }

    sessionState = SessionState.PAUSED;
    lastFrameTimestamp = null;
    cancelAnimationFrameIfNeeded();
    updatePauseDisplay();
    updateMainControls();
  }

  function stopSession() {
    releaseWakeLock();
    resetSession();
  }

  function resetSession() {
    cancelAnimationFrameIfNeeded();
    sessionState = SessionState.IDLE;
    breathingPhase = BreathingPhase.INHALE;
    phaseElapsed = 0;
    sessionElapsed = 0;
    isFinishingSession = false;
    lastFrameTimestamp = null;
    setGaugeProgress(0);
    updatePauseDisplay();
    updateMainControls();
  }

  function updateSessionFrame(timestamp) {
    if (sessionState !== SessionState.RUNNING) {
      return;
    }

    if (lastFrameTimestamp === null) {
      lastFrameTimestamp = timestamp;
      animationFrameId = window.requestAnimationFrame(updateSessionFrame);
      return;
    }

    const deltaSeconds = Math.min((timestamp - lastFrameTimestamp) / 1000, 0.1);
    lastFrameTimestamp = timestamp;

    sessionElapsed += deltaSeconds;
    phaseElapsed += deltaSeconds;

    if (sessionElapsed >= getSessionDurationSeconds()) {
      isFinishingSession = true;
    }

    advanceBreathingCycleIfNeeded();
    updateGaugeForCurrentPhase();

    if (sessionState === SessionState.RUNNING) {
      animationFrameId = window.requestAnimationFrame(updateSessionFrame);
    }
  }

  function advanceBreathingCycleIfNeeded() {
    let currentPhaseDuration = getCurrentPhaseDuration();

    while (phaseElapsed >= currentPhaseDuration && sessionState === SessionState.RUNNING) {
      phaseElapsed -= currentPhaseDuration;

      if (breathingPhase === BreathingPhase.INHALE) {
        breathingPhase = BreathingPhase.EXHALE;
      } else if (isFinishingSession) {
        completeSession();
        return;
      } else {
        breathingPhase = BreathingPhase.INHALE;
      }

      currentPhaseDuration = getCurrentPhaseDuration();
    }
  }

  function updateGaugeForCurrentPhase() {
    const rawProgress = clampNumber(phaseElapsed / getCurrentPhaseDuration(), 0, 1);
    const easedProgress = smootherstep(rawProgress);
    const visualProgress = breathingPhase === BreathingPhase.INHALE
      ? easedProgress
      : 1 - easedProgress;

    setGaugeProgress(visualProgress);
  }

  async function completeSession() {
    sessionState = SessionState.COMPLETING;
    cancelAnimationFrameIfNeeded();
    releaseWakeLock();
    setGaugeProgress(0);

    elements.completionOverlay.classList.add("is-visible");
    elements.completionOverlay.setAttribute("aria-hidden", "false");
    await sleep(450);

    // Reset while the themed overlay hides the gauge, avoiding a visual jump.
    resetSession();

    elements.completionOverlay.classList.add("show-message");
    await sleep(2350);

    elements.completionOverlay.classList.remove("show-message");
    elements.completionOverlay.classList.remove("is-visible");
    elements.completionOverlay.setAttribute("aria-hidden", "true");
  }

  function updateMainControls() {
    const isIdle = sessionState === SessionState.IDLE;
    const isRunning = sessionState === SessionState.RUNNING;
    const isPaused = sessionState === SessionState.PAUSED;

    elements.settingsButton.hidden = !isIdle;
    elements.startButton.hidden = isRunning;
    elements.stopButton.hidden = !isPaused;
    elements.pausePanel.hidden = !isPaused;
    elements.runningTouchArea.hidden = !isRunning;
  }

  function updatePauseDisplay() {
    const totalSeconds = getSessionDurationSeconds();
    const displayedElapsed = clampNumber(sessionElapsed, 0, totalSeconds);
    const progressPercent = totalSeconds > 0 ? (displayedElapsed / totalSeconds) * 100 : 0;

    elements.pauseProgressLabel.textContent = `${formatClock(displayedElapsed)} / ${formatClock(totalSeconds)}`;
    elements.sessionProgressFill.style.width = `${clampNumber(progressPercent, 0, 100)}%`;
  }

  function showSettingsScreen() {
    if (sessionState !== SessionState.IDLE) {
      releaseWakeLock();
      resetSession();
    }

    elements.mainScreen.hidden = true;
    elements.settingsScreen.hidden = false;
    updateSettingsScreen();
  }

  function showMainScreen() {
    elements.settingsScreen.hidden = true;
    elements.mainScreen.hidden = false;
    applyTheme();
    updateMainControls();
  }

  function changeDuration(key, delta) {
    settings[key] = clampNumber(settings[key] + delta, MINIMUM_DURATION, MAXIMUM_DURATION);
    persistSettingsAndRefresh();
  }

  function changeTheme(delta) {
    settings.themeIndex = wrapIndex(settings.themeIndex + delta, themes.length);
    persistSettingsAndRefresh();
  }

  function persistSettingsAndRefresh() {
    saveSettings(settings);
    applyTheme();
    updateSettingsScreen();
    updatePauseDisplay();
  }

  function updateSettingsScreen() {
    elements.inhaleValue.textContent = `${settings.inhaleDuration.toFixed(1)}s`;
    elements.exhaleValue.textContent = `${settings.exhaleDuration.toFixed(1)}s`;
    elements.sessionDurationSlider.value = String(settings.sessionDurationMinutes);
    elements.sessionDurationValue.textContent = formatSessionDurationMinutes(settings.sessionDurationMinutes);
    elements.themeName.textContent = translate(themes[settings.themeIndex].nameKey);
  }

  function applyTheme() {
    const theme = themes[settings.themeIndex];
    const root = document.documentElement;

    root.style.setProperty("--background-color", theme.backgroundColor);
    root.style.setProperty("--text-color", theme.textColor);
    root.style.setProperty("--gauge-color", theme.gaugeColor);
    root.style.setProperty("--ball-color", theme.ballColor);

    if (elements.themeColorMeta) {
      elements.themeColorMeta.setAttribute("content", theme.themeColor);
    }
  }

  function applyLocalization() {
    document.documentElement.lang = language;

    elements.settingsButton.setAttribute("aria-label", translate("SETTINGS_TITLE"));
    elements.settingsTitle.textContent = translate("SETTINGS_TITLE");
    elements.breathingSectionTitle.textContent = translate("BREATHING_SECTION");
    elements.inhaleLabel.textContent = translate("INHALE");
    elements.exhaleLabel.textContent = translate("EXHALE");
    elements.sessionDurationLabel.textContent = translate("SESSION_DURATION");
    elements.themesSectionTitle.textContent = translate("THEMES_SECTION");
    elements.completionMessage.textContent = translate("SESSION_COMPLETED");
  }

  function setGaugeProgress(progress) {
    const clampedProgress = clampNumber(progress, 0, 1);
    const y = interpolate(GAUGE_BOTTOM_Y, GAUGE_TOP_Y, clampedProgress);
    elements.breathingBall.setAttribute("cy", String(y));
  }

  function getCurrentPhaseDuration() {
    return breathingPhase === BreathingPhase.INHALE
      ? settings.inhaleDuration
      : settings.exhaleDuration;
  }

  function getSessionDurationSeconds() {
    return settings.sessionDurationMinutes * 60;
  }

  function loadSettings() {
    const defaults = {
      inhaleDuration: 4.0,
      exhaleDuration: 4.0,
      sessionDurationMinutes: 5,
      themeIndex: 0,
    };

    try {
      const rawSettings = window.localStorage.getItem(STORAGE_KEY);
      if (!rawSettings) {
        return defaults;
      }

      const parsed = JSON.parse(rawSettings);
      return normalizeSettings({ ...defaults, ...parsed });
    } catch (error) {
      console.warn("Unable to load saved settings. Defaults will be used.", error);
      return defaults;
    }
  }

  function normalizeSettings(value) {
    return {
      inhaleDuration: clampNumber(Number(value.inhaleDuration), MINIMUM_DURATION, MAXIMUM_DURATION),
      exhaleDuration: clampNumber(Number(value.exhaleDuration), MINIMUM_DURATION, MAXIMUM_DURATION),
      sessionDurationMinutes: clampInteger(
        Number(value.sessionDurationMinutes),
        MINIMUM_SESSION_DURATION_MINUTES,
        MAXIMUM_SESSION_DURATION_MINUTES,
      ),
      themeIndex: wrapIndex(Number(value.themeIndex) || 0, themes.length),
    };
  }

  function saveSettings(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSettings(value)));
    } catch (error) {
      console.warn("Unable to save settings.", error);
    }
  }

  async function requestWakeLock() {
    if (!("wakeLock" in navigator) || wakeLock !== null) {
      return;
    }

    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    } catch (error) {
      // Some browsers require HTTPS or deny the permission. The app still works.
      wakeLock = null;
    }
  }

  async function releaseWakeLock() {
    if (!wakeLock) {
      return;
    }

    const lock = wakeLock;
    wakeLock = null;

    try {
      await lock.release();
    } catch (error) {
      // Nothing to do: the browser may already have released it.
    }
  }

  function cancelAnimationFrameIfNeeded() {
    if (animationFrameId !== 0) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }
  }

  function translate(key) {
    return translations[language]?.[key] ?? translations.en[key] ?? key;
  }

  function formatSessionDurationMinutes(minutes) {
    return translate("SESSION_DURATION_MINUTES_FORMAT").replace("{0}", String(minutes));
  }

  function formatClock(seconds) {
    const roundedSeconds = Math.floor(seconds);
    const minutesPart = Math.floor(roundedSeconds / 60);
    const secondsPart = roundedSeconds % 60;
    return `${minutesPart}:${String(secondsPart).padStart(2, "0")}`;
  }

  function detectLanguage() {
    const locale = (navigator.languages?.[0] ?? navigator.language ?? "en").toLowerCase();

    if (locale.startsWith("fr")) {
      return "fr";
    }

    if (locale.startsWith("es")) {
      return "es";
    }

    return "en";
  }

  function smootherstep(value) {
    const t = clampNumber(value, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function interpolate(from, to, progress) {
    return from + (to - from) * progress;
  }

  function clampNumber(value, min, max) {
    if (!Number.isFinite(value)) {
      return min;
    }

    return Math.min(Math.max(value, min), max);
  }

  function clampInteger(value, min, max) {
    return Math.round(clampNumber(value, min, max));
  }

  function wrapIndex(value, length) {
    if (length <= 0) {
      return 0;
    }

    const integerValue = Math.trunc(value);
    return ((integerValue % length) + length) % length;
  }

  function sleep(milliseconds) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, milliseconds);
    });
  }
})();
