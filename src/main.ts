import { createUnboxyGame } from '@unboxy/phaser-sdk';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { renderScripts } from './visuals';

createUnboxyGame({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scenes: [BootScene, GameScene, UIScene],
  renderScripts,
  // Debug overlay: draws every arcade body as a green rect, with velocity
  // arrows. Temporary — flip back to omit / false once we confirm the
  // bullet-vs-player collision body alignment.
  physics: { default: 'arcade', arcade: { debug: true } },
});
