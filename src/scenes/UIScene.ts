import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';
import { TOWER_TYPES } from '../objects/Tower';
import { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;
  private startWaveBtn!: Phaser.GameObjects.Container;
  private towerButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.score = 0;
    const gameScene = this.scene.get('GameScene') as GameScene;

    const panelStyle = {
      fontFamily: 'Kenney Pixel',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    };

    // Top bar background
    const topBar = this.add.rectangle(GAME_WIDTH / 2, 0, GAME_WIDTH, 36, 0x000000, 0.5);
    topBar.setOrigin(0.5, 0).setDepth(10);

    // Gold
    this.goldText = this.add.text(16, 8, `Gold: ${gameScene.gold}`, {
      ...panelStyle,
      color: '#ffdd44',
    }).setDepth(10);

    // Lives
    this.livesText = this.add.text(160, 8, `Lives: ${gameScene.lives}`, {
      ...panelStyle,
      color: '#ff6666',
    }).setDepth(10);

    // Wave
    this.waveText = this.add.text(310, 8, `Wave: ${gameScene.wave}`, {
      ...panelStyle,
      color: '#88ccff',
    }).setDepth(10);

    // Score
    this.scoreText = this.add.text(450, 8, `Score: 0`, {
      ...panelStyle,
      color: '#ffffff',
    }).setDepth(10);

    // Tower selection buttons (bottom)
    this.createTowerPanel(gameScene);

    // Start wave button
    this.createStartButton(gameScene);

    // Listen for game events
    gameScene.events.on('goldChanged', (gold: number) => {
      this.goldText.setText(`Gold: ${gold}`);
      this.tweens.add({
        targets: this.goldText,
        scale: 1.2,
        duration: 100,
        yoyo: true,
      });
    });

    gameScene.events.on('livesChanged', (lives: number) => {
      this.livesText.setText(`Lives: ${lives}`);
      this.tweens.add({
        targets: this.livesText,
        scale: 1.3,
        duration: 150,
        yoyo: true,
      });
    });

    gameScene.events.on('waveChanged', (wave: number) => {
      this.waveText.setText(`Wave: ${wave}`);
    });

    gameScene.events.on('score', (points: number) => {
      this.score += points;
      this.scoreText.setText(`Score: ${this.score}`);
    });

    gameScene.events.on('waveComplete', () => {
      this.showStartButton(true);
    });
  }

  private createTowerPanel(gameScene: GameScene): void {
    const types = Object.values(TOWER_TYPES);
    const panelW = types.length * 100 + 20;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = 560;

    // Panel bg
    const panelBg = this.add.rectangle(GAME_WIDTH / 2, panelY + 16, panelW, 44, 0x000000, 0.6);
    panelBg.setDepth(10);
    panelBg.setStrokeStyle(1, 0x666666, 0.5);

    types.forEach((cfg, i) => {
      const bx = panelX + 20 + i * 100 + 40;
      const by = panelY + 16;

      const container = this.add.container(bx, by);
      container.setDepth(10);

      // Background rect
      const isSelected = cfg.type === gameScene.selectedTowerType;
      const bg = this.add.rectangle(0, 0, 90, 36, isSelected ? 0x446644 : 0x333333, 0.9);
      bg.setStrokeStyle(isSelected ? 2 : 1, isSelected ? 0x88ff88 : 0x666666);

      // Tower icon
      const icon = this.add.sprite(-30, 0, 'tiles1bit', cfg.frame);
      icon.setTint(cfg.tint);
      icon.setScale(1.5);

      // Name + cost
      const label = this.add.text(5, -8, cfg.name, {
        fontFamily: 'Kenney Pixel',
        fontSize: '11px',
        color: '#ffffff',
      });

      const cost = this.add.text(5, 4, `${cfg.cost}g`, {
        fontFamily: 'Kenney Pixel',
        fontSize: '12px',
        color: '#ffdd44',
      });

      container.add([bg, icon, label, cost]);

      // Make interactive
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        gameScene.selectedTowerType = cfg.type;
        this.updateTowerSelection(gameScene);
      });

      this.towerButtons.push(container);
    });
  }

  private updateTowerSelection(gameScene: GameScene): void {
    const types = Object.values(TOWER_TYPES);
    this.towerButtons.forEach((container, i) => {
      const bg = container.list[0] as Phaser.GameObjects.Rectangle;
      const isSelected = types[i].type === gameScene.selectedTowerType;
      bg.setFillStyle(isSelected ? 0x446644 : 0x333333, 0.9);
      bg.setStrokeStyle(isSelected ? 2 : 1, isSelected ? 0x88ff88 : 0x666666);

      // Bounce selected
      if (isSelected) {
        this.tweens.add({
          targets: container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100,
          yoyo: true,
        });
      }
    });
  }

  private createStartButton(gameScene: GameScene): void {
    const bx = GAME_WIDTH - 80;
    const by = 12;

    this.startWaveBtn = this.add.container(bx, by);
    this.startWaveBtn.setDepth(10);

    const bg = this.add.rectangle(0, 8, 120, 28, 0x44aa44, 1);
    bg.setStrokeStyle(2, 0x66dd66);

    const label = this.add.text(0, 8, 'Start Wave!', {
      fontFamily: 'Kenney Pixel',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.startWaveBtn.add([bg, label]);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      if (!gameScene.waveActive) {
        gameScene.startWave();
        this.showStartButton(false);
      }
    });

    bg.on('pointerover', () => {
      bg.setFillStyle(0x55cc55, 1);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x44aa44, 1);
    });

    // Pulse animation
    this.tweens.add({
      targets: this.startWaveBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private showStartButton(show: boolean): void {
    this.startWaveBtn.setVisible(show);
  }
}
