import { createUnboxyGame } from '@unboxy/phaser-sdk';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { renderScripts } from './visuals';

createUnboxyGame({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 900 }, debug: false },
  },
  scenes: [BootScene, GameScene, UIScene],
  renderScripts,
});
