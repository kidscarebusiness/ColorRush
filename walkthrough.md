# Color Rush Game Walkthrough

## Overview

- Game Name: Color Rush
- Category: Reflex / Reaction Game
- Concept: Tap the correct color before time runs out. The speed increases as the player scores higher.

## Core Gameplay Flow

1. App launch
2. Splash screen for 2 seconds
3. Play button
4. Game starts
5. Show instruction: `Tap <Color>`
6. Player taps a color
7. Correct tap: score increases and next round loads
8. Wrong tap: game over
9. Timeout: game over
10. Play again restarts the game

## Variables

- `Score = 0`
- `BestScore = localStorage`
- `Level = 1`
- `TimeLimit = 5`
- `TimeLeft = 5`
- `CorrectColor = ""`
- `ColorList = ["Red", "Blue", "Green", "Yellow"]`
- `SoundEnabled = true`
- `MusicEnabled = true`

## Difficulty System

| Score Range | Level | Time Limit |
| --- | --- | --- |
| 0-7 | 1 | 5 sec |
| 8-9 | 2 | 4 sec |
| 10-14 | 3 | 3 sec |
| 15-19 | 4 | 2 sec |
| 20+ | 5 | 1 sec |

## UI Mapping

- `Instruction Label`: shows `Tap Red`, `Tap Blue`, and so on
- `Status Label`: shows `✔ Correct`, `❌ Game Over`, or `⏰ Time Over`
- `Score`: current score
- `Best Score`: saved locally
- `Level`: current difficulty
- `Play`: start the game
- `Play Again`: restart after game over
- Color buttons: Red, Blue, Green, Yellow
- Music toggle
- Sound toggle

## Timers

- `Game Timer`: 1000 ms countdown interval
- `Delay Timer`: 450 ms pause before showing the next color after a correct tap

## Storage

- `localStorage` stores the best score on the device

## Deployment Notes

- Use the included manifest and service worker for installable web behavior
- Add final 512x512 Play Store icon art before publishing
- Wrap the project in an Android container and export an `.aab`
