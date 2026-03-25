# Color Rush

Color Rush is a mobile-first reflex game built with plain HTML, CSS, and JavaScript so it stays lightweight and easy to package for Android.

## Features

- 2-second splash screen and play menu
- Score, best score, level, and timer HUD
- Difficulty scaling from 5 seconds down to 1 second
- Correct, wrong, and timeout game flows
- Local storage persistence for best score
- Music and sound toggles
- Responsive layout for phones and tablets
- Installable PWA metadata and offline cache

## Run

Open [index.html](./index.html) directly in a browser, or serve the folder with a static server and open the app in a mobile browser.

## Gameplay

- Tap the color shown in the instruction label.
- Correct taps increase the score and may raise the level.
- A wrong tap ends the game immediately.
- If the countdown reaches zero, the round ends with a timeout.
- Use `Play Again` to restart a fresh run.

## Play Store Path

This project is ready as a lightweight web game shell. To publish it on Google Play:

1. Wrap it in an Android WebView, Trusted Web Activity, Capacitor, or Cordova container.
2. Export an Android App Bundle (`.aab`) from Android Studio.
3. Replace the included placeholder icons with final Play Store art and screenshots.

## Manual Check

- Splash screen shows for about 2 seconds, then the menu appears.
- Play starts a new round and enables the four color buttons.
- Correct taps show `✔ Correct`, increase score, and continue after a short delay.
- Wrong taps show `❌ Game Over` and reveal `Play Again`.
- Timeout shows `⏰ Time Over` and reveals `Play Again`.
- Best score stays after refresh because it is stored locally.
- Music and sound toggles affect audio behavior.
