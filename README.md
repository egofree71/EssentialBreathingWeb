# EssentialBreathingWeb

A lightweight web version of **Essential Breathing**.

This version is built with plain HTML, CSS and JavaScript. It uses an inline SVG breathing gauge, browser `localStorage` for settings, and no framework or build step.

## Live version

The web app is available here:

https://egofree71.github.io/EssentialBreathingWeb/

## Features

- Simple visual breathing guide
- Smooth SVG ball movement inside a vertical gauge
- Adjustable inhale duration
- Adjustable exhale duration
- Adjustable session duration
- Start, pause, resume and stop controls
- Several visual themes
- Automatic language selection: English, French or Spanish
- Settings saved locally in the browser
- Mobile-friendly portrait layout
- Installable Progressive Web App
- Offline support after the first successful online load
- Standalone display mode when launched from the home screen

## Run locally

For a normal browser test, open `index.html` directly in a browser.

For a realistic PWA test, serve the folder with a small HTTP server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

The service worker requires HTTPS or `localhost`, so it will not register from a `file://` URL.

## PWA notes

The PWA uses:

- `manifest.webmanifest` for install metadata, icons, portrait orientation and standalone display;
- `service-worker.js` to cache the application shell for offline use.

On Android, install the app from the browser menu. When launched from the home screen, it should open without the browser address bar and browser navigation controls. The Android system navigation bar can still remain visible, depending on the device and browser.

When files are changed, the service worker cache version in `service-worker.js` may need to be updated so installed copies refresh cleanly.

## Notes

This project is intentionally separate from the Godot/Android version. The goal is to keep the web version very small and easy to host, for example with GitHub Pages.
