# Cat Defense — Tower Defense Game

## Overview
- **Genre**: Tower Defense (survival waves)
- **Theme**: Cute cats defending against waves of mice, rats, and raccoons
- **Style**: Bright, playful, bouncy animations
- **Canvas**: 800×600

## Features Implemented
- **Grid-based map** (20×15 cells, 40px each) with winding S-shaped path
- **3 cat tower types**:
  - Tabby Cat (basic): fast attack, short range, 15 gold
  - Siamese Cat (sniper): high damage, long range, 30 gold
  - Black Cat (splash): area damage, medium range, 40 gold
- **4 enemy types**:
  - Mouse: fast, low HP (wave 1+)
  - Rat: medium speed/HP (wave 3+)
  - Big Rat: slow, high HP (wave 5+)
  - Raccoon: tanky boss-type (wave 8+)
- **Wave system**: escalating difficulty, bonus gold between waves
- **Gold economy**: earn by killing enemies, spend to place towers
- **Lives system**: 20 lives, lose 1 per enemy reaching the end
- **Game over screen** with restart
- **Visual polish**: gradient background, bouncy tweens, recoil animations, death particles, screen shake, HP bars, hover highlights, range circles

## Controls
- **Click** on grass tiles to place selected tower
- **Bottom panel** to select tower type
- **Start Wave** button (top right) to begin each wave

## Key Files
- `src/scenes/BootScene.ts` — loads 1-bit tilesheet and UI assets
- `src/scenes/GameScene.ts` — main game logic (grid, path, waves, placement)
- `src/scenes/UIScene.ts` — HUD overlay (gold, lives, wave, tower selector)
- `src/objects/Tower.ts` — Tower class with targeting, shooting, projectiles
- `src/objects/Enemy.ts` — Enemy class with pathfinding, HP, death effects
- `src/config.ts` — 800×600 game dimensions
- `src/main.ts` — Phaser config, no gravity

## What Changed This Turn
- Built the entire game from scratch
- Created Tower and Enemy object classes
- Implemented grid map with S-shaped path
- Added wave spawning system with 4 enemy types
- Added 3 tower types with unique stats
- Full UI with tower selector, gold/lives/wave display
- Visual polish: particles, tweens, screen shake, gradient background
