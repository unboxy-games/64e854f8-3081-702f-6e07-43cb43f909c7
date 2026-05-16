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
  // TEMP debug: visualize arcade bodies (green rects). Remove when done.
  physics: { default: 'arcade', arcade: { debug: true } },
});
