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
- wake lock attempt during a session.

The code is wrapped in an immediately invoked function expression to avoid creating global variables.

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

## Technical choices

### Why not Godot Web export?

The Godot Web export embeds part of the engine and produces a larger result. For this very simple application, a native Web page is more than enough.

### Why not React, Vue or Svelte?

The interface is small, the state is simple, and there is no complex navigation. A framework would mostly add conceptual weight and an unnecessary tooling chain for now.

### Why SVG?

The gauge is a simple vector drawing that is easy to control. SVG avoids Canvas, stays sharp on mobile screens, and lets the app move the ball through a simple coordinate.

## Possible future improvements

- add fullscreen mode;
- add PWA installation;
- add subtle sound or vibration feedback;
- add more languages;
- split `app.js` into several modules if the file becomes too large;
- add a small minification step for a production build.

As long as the application stays small, it is better to avoid over-architecting the project.
