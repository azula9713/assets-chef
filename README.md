# Assets Chef

Every time you start a new app, you have to go find your icon file, export it in 30 different sizes, figure out which ones iOS wants vs Android, look up what an "adaptive icon foreground" is, do the whole thing again for dark mode, and then repeat for the splash screen. It's the same busywork every time.

Assets Chef fixes that. Upload your icon once (and a dark mode version if you have one), pick your background colors, and get a ZIP with every asset your app needs — ready to drop into your project.

## What it generates

- **Expo source files** — Expo/EAS-ready images, including Android adaptive foreground, background, and monochrome layers, plus a ready-to-paste `app.json` snippet
- **iOS icons** — every size from 20px to 1024px, all the `@2x` and `@3x` variants
- **Android icons** — all mipmap densities (mdpi through xxxhdpi), plus the adaptive icon foreground and the monochrome variant for Android 13+ themed icons
- **Web/PWA** — favicons, apple-touch-icon, and a `site.webmanifest`
- **Splash screens** — your icon centered on a background color you choose, with separate light and dark mode backgrounds

## Dark mode support

Upload a light and dark version of your icon. If you only have one, it'll be used for both. The tinted icon (iOS 18) and Android monochrome icon (Material You) are generated automatically from your light icon — no extra design work needed.

## How it works

Everything runs in your browser. Your images never leave your machine — no account, no upload, no server.

## What it doesn't support (yet)

- **SVG input** — use PNG, JPG, or WebP (1024×1024 or larger recommended)
- **Splash screen image for web/PWA** — web splash screens aren't a real standard, so they're not included
- **Notification icons** — Android notification icons have their own sizing rules and aren't generated here
- **App Store / Play Store screenshots** — different tool for that
- **Custom icon padding or background removal** — what you upload is what gets used
- **Older Expo SDK (< 50)** — the generated `app.json` snippet uses the `expo-splash-screen` plugin format from SDK 50+. If you're on an older SDK, you'll need to manually adapt the splash config.
- **Dark splash screen on iOS (known Expo bug)** — Assets Chef generates the correct config, but Expo SDK 52–53 has known issues where the dark splash screen may not render correctly on iOS. That's an Expo bug, not ours.
