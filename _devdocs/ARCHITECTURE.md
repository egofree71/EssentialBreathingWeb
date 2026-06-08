# Architecture — EssentialBreathingWeb

This document describes the small architecture of the lightweight Web version of **Essential Breathing**.

The project is intentionally kept very simple: no framework, no build step, and no external dependency. The page can be opened directly in a browser through `index.html`.

> Deployment note: this file is stored in `_devdocs/`. With classic GitHub Pages based on Jekyll, folders whose names start with `_` are normally not published. If another deployment system is used, make sure it only publishes the files required by the Web page.

## Goals

- keep the Web version very lightweight;
- stay close to the spirit and visual style of the original Godot app;
- work well on phones in portrait orientation;
- avoid any compilation or build chain;
- keep the code readable enough to be modified easily.

## Public files

```text
index.html
style.css
app.js
manifest.webmanifest
service-worker.js
assets/icons/icon-192.png
assets/icons/icon-512.png
README.md
```

### `index.html`

Contains the interface structure:

- main screen;
- SVG breathing gauge;
- start, pause, resume and stop buttons;
- settings screen;
- session-complete overlay.

The gauge is an inline SVG to avoid an external asset and to let JavaScript move the ball directly with the `cy` attribute.

### `style.css`

Contains all visual styling:

- mobile layout;
- gauge size and position;
- buttons;
- settings screen;
- theme CSS variables;
- phone safe-area handling.

Theme colors are exposed by `app.js` as CSS variables.

### `app.js`

Contains all application logic:

- session state;
- breathing animation;
- pause and resume handling;
- user settings;
- themes;
- simple translation system;
- persistence through `localStorage`;
- wake lock attempt during a session;
- service worker registration.

The code is wrapped in an immediately invoked function expression to avoid creating global variables.

### `manifest.webmanifest`

Defines the installable PWA metadata:

- application name;
- start URL and scope;
- portrait orientation;
- standalone display mode;
- theme and background colors;
- application icons.

The app uses `display: standalone` rather than `display: fullscreen`. This removes the browser address bar and browser navigation controls when the app is launched from the home screen, while avoiding a more aggressive immersive mode.

### `service-worker.js`

Pre-caches the small application shell so the app can open offline after the first successful online visit.

The service worker uses a versioned cache name. When cached files change, update the cache version so browsers install a fresh cache.

### `assets/icons/`

Contains PNG icons required by installable PWAs. The icons are deliberately simple and match the visual identity of the breathing gauge.

## State machine

The session uses four simple states:

```text
IDLE        screen is ready, no active session
RUNNING     animation is active
PAUSED      animation is suspended, stop/resume buttons are visible
COMPLETING  short end-of-session transition
```

The settings screen is intended for inactive sessions. If a session is active and the user opens the settings screen, the session is reset.

## Breathing cycle

The cycle alternates between two phases:

```text
INHALE
EXHALE
```

Each phase has its own duration. The animation is computed on every frame with `requestAnimationFrame`.

The raw phase progress is transformed with `smootherstep`, which creates a softer movement at the beginning and at the end of each breath.

During inhale, the ball moves up in the gauge. During exhale, the same movement is reversed so the ball moves down.

## End of session

When the total duration is reached, the application does not stop the breathing animation abruptly. It waits until the current exhale phase is complete, then displays the end overlay.

This avoids a visual or breathing cut that would feel too sudden.

## Persistence

Settings are saved in `localStorage` with the following key:

```text
essentialBreathingWeb.settings.v1
```

Loaded values are always normalized to avoid errors if local storage contains invalid or older data.

## Internationalization

Texts are stored in a small built-in JavaScript dictionary.

Currently planned languages:

- English;
- French;
- Spanish.

The language is selected automatically from the browser language. If it is not recognized, English is used.

## Themes

Themes are defined in `app.js` and applied to the document through CSS variables:

```text
--background-color
--text-color
--gauge-color
--ball-color
```

This keeps theme logic in JavaScript and rendering in CSS.

## Wake Lock

The application tries to use the `navigator.wakeLock` API during a session to keep the screen awake.

This API is not available everywhere and often requires HTTPS. If it fails, the application simply continues to work without wake lock.

## PWA and offline behavior

The app is installable as a Progressive Web App because it provides a Web App Manifest and registers a service worker.

The manifest uses `display: standalone`, which is the best match for the desired mobile behavior: the installed app opens without the browser address bar or browser navigation UI. Android system UI may still be visible depending on the browser and device.

The service worker caches the application shell:

```text
./
./index.html
./style.css
./app.js
./manifest.webmanifest
./assets/icons/icon-192.png
./assets/icons/icon-512.png
```

This makes offline startup deterministic after the first online load. Normal browser HTTP cache may sometimes allow a page to reload offline, but that behavior is not reliable enough to be considered real offline support.

## Technical choices

### Why not Godot Web export?

The Godot Web export embeds part of the engine and produces a larger result. For this very simple application, a native Web page is more than enough.

### Why not React, Vue or Svelte?

The interface is small, the state is simple, and there is no complex navigation. A framework would mostly add conceptual weight and an unnecessary tooling chain for now.

### Why SVG?

The gauge is a simple vector drawing that is easy to control. SVG avoids Canvas, stays sharp on mobile screens, and lets the app move the ball through a simple coordinate.

## Possible future improvements

- optionally experiment with `display: fullscreen` if a more immersive installed mode is desired;
- add subtle sound or vibration feedback;
- add more languages;
- split `app.js` into several modules if the file becomes too large;
- add a small minification step for a production build.

As long as the application stays small, it is better to avoid over-architecting the project.
