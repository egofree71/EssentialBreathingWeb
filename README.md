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

## Run locally

Open `index.html` directly in a browser.

For a slightly more realistic local test, you can also serve the folder with a small HTTP server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Notes

This project is intentionally separate from the Godot/Android version. The goal is to keep the web version very small and easy to host, for example with GitHub Pages.
