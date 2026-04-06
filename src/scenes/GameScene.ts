import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { Enemy, ENEMY_TYPES, EnemyConfig } from '../objects/Enemy';
import { Tower, TOWER_TYPES } from '../objects/Tower';

const CELL = 40;
const COLS = 20;
const ROWS = 15;

// Path waypoints in grid coords
const PATH_GRID: { x: number; y: number }[] = [
  { x: -1, y: 7 },
  { x: 3, y: 7 },
  { x: 3, y: 2 },
  { x: 9, y: 2 },
  { x: 9, y: 12 },
  { x: 15, y: 12 },
  { x: 15, y: 5 },
  { x: 20, y: 5 },
];

function gridToPixel(gx: number, gy: number): { x: number; y: number } {
  return { x: gx * CELL + CELL / 2, y: gy * CELL + CELL / 2 };
}

function getPathCells(): Set<string> {
  const cells = new Set<string>();
  for (let i = 0; i < PATH_GRID.length - 1; i++) {
    const a = PATH_GRID[i];
    const b = PATH_GRID[i + 1];
    if (a.x === b.x) {
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      for (let y = minY; y <= maxY; y++) {
        if (a.x >= 0 && a.x < COLS) cells.add(`${a.x},${y}`);
      }
    } else {
      const minX = Math.max(0, Math.min(a.x, b.x));
      const maxX = Math.min(COLS - 1, Math.max(a.x, b.x));
      for (let x = minX; x <= maxX; x++) {
        cells.add(`${x},${a.y}`);
      }
    }
  }
  return cells;
}

interface WaveEntry {
  type: string;
  count: number;
  delay: number;
}

function generateWave(waveNum: number): WaveEntry[] {
  const entries: WaveEntry[] = [];
  // Base mice
  entries.push({ type: 'mouse', count: 3 + waveNum * 2, delay: 800 });
  // Add rats from wave 3
  if (waveNum >= 3) {
    entries.push({ type: 'rat', count: Math.floor(waveNum / 2), delay: 1200 });
  }
  // Add big rats from wave 5
  if (waveNum >= 5) {
    entries.push({ type: 'bigrat', count: Math.floor(waveNum / 3), delay: 1500 });
  }
  // Add raccoons from wave 8
  if (waveNum >= 8) {
    entries.push({ type: 'raccoon', count: Math.floor(waveNum / 4), delay: 2000 });
  }
  return entries;
}

export class GameScene extends Phaser.Scene {
  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private pathCells!: Set<string>;
  private pathPixels!: Phaser.Math.Vector2[];

  // Game state
  public gold = 50;
  public lives = 20;
  public wave = 0;
  public waveActive = false;
  public selectedTowerType = 'basic';

  // Grid highlight
  private hoverGraphics!: Phaser.GameObjects.Graphics;
  private placementPreview!: Phaser.GameObjects.Sprite | null;

  // Decorations
  private treePositions: { x: number; y: number }[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.towers = [];
    this.enemies = [];
    this.gold = 50;
    this.lives = 20;
    this.wave = 0;
    this.waveActive = false;
    this.selectedTowerType = 'basic';
    this.placementPreview = null;

    this.pathCells = getPathCells();
    this.pathPixels = PATH_GRID.map((p) => {
      const px = gridToPixel(p.x, p.y);
      return new Phaser.Math.Vector2(px.x, px.y);
    });

    this.drawBackground();
    this.drawMap();
    this.addDecorations();
    this.setupInput();

    this.hoverGraphics = this.add.graphics();
    this.hoverGraphics.setDepth(5);

    // Listen for enemy events
    this.events.on('enemyKilled', (enemy: Enemy) => {
      this.gold += enemy.reward;
      this.events.emit('goldChanged', this.gold);
      this.events.emit('score', enemy.reward);
      this.enemies = this.enemies.filter((e) => e !== enemy);
      this.checkWaveComplete();
    });

    this.events.on('enemyReachedEnd', (enemy: Enemy) => {
      this.lives -= 1;
      this.events.emit('livesChanged', this.lives);
      this.enemies = this.enemies.filter((e) => e !== enemy);
      if (this.lives <= 0) {
        this.gameOver();
      }
      this.checkWaveComplete();
    });

    // Start UI overlay
    this.scene.launch('UIScene');
  }

  private drawBackground(): void {
    // Gradient sky background
    const bg = this.add.graphics();
    bg.setDepth(0);
    for (let y = 0; y < GAME_HEIGHT; y++) {
      const t = y / GAME_HEIGHT;
      const r = Phaser.Math.Linear(0x56, 0x7e, t);
      const g = Phaser.Math.Linear(0xab, 0xc8, t);
      const b = Phaser.Math.Linear(0x2f, 0x59, t);
      const color = (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
      bg.fillStyle(color, 1);
      bg.fillRect(0, y, GAME_WIDTH, 1);
    }
  }

  private drawMap(): void {
    const mapGfx = this.add.graphics();
    mapGfx.setDepth(1);

    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        const px = gx * CELL;
        const py = gy * CELL;
        const isPath = this.pathCells.has(`${gx},${gy}`);

        if (isPath) {
          // Sandy path
          mapGfx.fillStyle(0xd4a574, 1);
          mapGfx.fillRect(px, py, CELL, CELL);
          mapGfx.fillStyle(0xc49664, 1);
          mapGfx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
          // Dotted path details
          mapGfx.fillStyle(0xb8865a, 0.4);
          if ((gx + gy) % 2 === 0) {
            mapGfx.fillCircle(px + CELL / 2, py + CELL / 2, 3);
          }
        } else {
          // Grass tile with variation
          const shade = ((gx + gy) % 2 === 0) ? 0x6abf4b : 0x5fb043;
          mapGfx.fillStyle(shade, 1);
          mapGfx.fillRect(px, py, CELL, CELL);
          // Subtle border
          mapGfx.fillStyle(0x4a9f33, 0.3);
          mapGfx.fillRect(px, py, CELL, 1);
          mapGfx.fillRect(px, py, 1, CELL);
        }
      }
    }

    // Path entry/exit arrows
    const entryY = PATH_GRID[0].y * CELL + CELL / 2;
    const exitP = PATH_GRID[PATH_GRID.length - 1];
    const exitY = exitP.y * CELL + CELL / 2;

    const entryArrow = this.add.text(4, entryY, '▶', { fontSize: '20px', color: '#ff6666' }).setOrigin(0, 0.5).setDepth(5);
    this.tweens.add({ targets: entryArrow, x: 10, duration: 500, yoyo: true, repeat: -1 });

    const exitArrow = this.add.text(GAME_WIDTH - 4, exitY, '▶', { fontSize: '20px', color: '#ff6666' }).setOrigin(1, 0.5).setDepth(5);
    this.tweens.add({ targets: exitArrow, x: GAME_WIDTH - 10, duration: 500, yoyo: true, repeat: -1 });
  }

  private addDecorations(): void {
    // Add small trees/bushes on some grass cells
    const rng = new Phaser.Math.RandomDataGenerator(['catdefense']);
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        if (this.pathCells.has(`${gx},${gy}`)) continue;
        if (rng.frac() < 0.08) {
          const px = gridToPixel(gx, gy);
          const tree = this.add.sprite(px.x, px.y, 'tiles1bit', 294);
          tree.setTint(0x2d8f2d);
          tree.setScale(2.0);
          tree.setDepth(1);
          tree.setAlpha(0.5);
          this.treePositions.push({ x: gx, y: gy });
        }
      }
    }
  }

  private setupInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const gx = Math.floor(pointer.x / CELL);
      const gy = Math.floor(pointer.y / CELL);

      this.hoverGraphics.clear();

      if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return;

      const isPath = this.pathCells.has(`${gx},${gy}`);
      const hasTower = this.towers.some((t) => t.gridX === gx && t.gridY === gy);
      const hasTree = this.treePositions.some((t) => t.x === gx && t.y === gy);
      const canPlace = !isPath && !hasTower && !hasTree;

      this.hoverGraphics.lineStyle(2, canPlace ? 0x00ff00 : 0xff0000, 0.8);
      this.hoverGraphics.strokeRect(gx * CELL, gy * CELL, CELL, CELL);

      if (canPlace) {
        const cfg = TOWER_TYPES[this.selectedTowerType];
        if (cfg) {
          this.hoverGraphics.lineStyle(1, 0xffffff, 0.2);
          this.hoverGraphics.strokeCircle(gx * CELL + CELL / 2, gy * CELL + CELL / 2, cfg.range);
        }
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const gx = Math.floor(pointer.x / CELL);
      const gy = Math.floor(pointer.y / CELL);

      if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return;

      const isPath = this.pathCells.has(`${gx},${gy}`);
      const hasTower = this.towers.some((t) => t.gridX === gx && t.gridY === gy);
      const hasTree = this.treePositions.some((t) => t.x === gx && t.y === gy);

      if (isPath || hasTower || hasTree) return;

      this.placeTower(gx, gy);
    });
  }

  private placeTower(gx: number, gy: number): void {
    const cfg = TOWER_TYPES[this.selectedTowerType];
    if (!cfg) return;
    if (this.gold < cfg.cost) {
      // Flash "not enough gold" feedback
      this.cameras.main.flash(200, 255, 50, 50, false);
      return;
    }

    this.gold -= cfg.cost;
    this.events.emit('goldChanged', this.gold);

    const px = gridToPixel(gx, gy);
    const tower = new Tower(this, px.x, px.y, cfg, gx, gy);
    this.towers.push(tower);

    // Placement dust particles
    const dust = this.add.particles(px.x, px.y, 'tiles1bit', {
      frame: 0,
      tint: 0xddcc88,
      speed: { min: 20, max: 50 },
      scale: { start: 1.5, end: 0 },
      lifespan: 300,
      quantity: 8,
      emitting: false,
    });
    dust.setDepth(4);
    dust.explode(8);
    this.time.delayedCall(400, () => dust.destroy());
  }

  startWave(): void {
    if (this.waveActive) return;
    this.wave++;
    this.waveActive = true;
    this.events.emit('waveChanged', this.wave);

    const entries = generateWave(this.wave);
    let totalDelay = 0;

    for (const entry of entries) {
      for (let i = 0; i < entry.count; i++) {
        this.time.delayedCall(totalDelay, () => {
          this.spawnEnemy(entry.type);
        });
        totalDelay += entry.delay;
      }
    }
  }

  private spawnEnemy(type: string): void {
    const cfg = ENEMY_TYPES[type];
    if (!cfg) return;

    const start = this.pathPixels[0];
    const enemy = new Enemy(this, start.x, start.y, { type, ...cfg });
    enemy.setPath([...this.pathPixels.slice(1)]);
    this.enemies.push(enemy);
  }

  private checkWaveComplete(): void {
    if (!this.waveActive) return;
    const alive = this.enemies.filter((e) => e.active);
    if (alive.length === 0) {
      this.waveActive = false;
      this.events.emit('waveComplete', this.wave);

      // Bonus gold
      const bonus = 5 + this.wave * 2;
      this.gold += bonus;
      this.events.emit('goldChanged', this.gold);

      // Show bonus text
      const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `Wave ${this.wave} Complete!\n+${bonus} gold`, {
        fontFamily: 'Kenney Pixel',
        fontSize: '28px',
        color: '#ffdd44',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(10);

      this.tweens.add({
        targets: txt,
        y: GAME_HEIGHT / 2 - 40,
        alpha: 0,
        duration: 1500,
        ease: 'Cubic.easeOut',
        onComplete: () => txt.destroy(),
      });
    }
  }

  private gameOver(): void {
    this.waveActive = false;
    // Stop all enemy tweens
    for (const e of this.enemies) {
      if (e.active) {
        this.tweens.killTweensOf(e);
      }
    }

    // Dark overlay
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    overlay.setDepth(9);

    const goText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'GAME OVER', {
      fontFamily: 'Kenney Pixel',
      fontSize: '48px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    const waveText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, `Survived ${this.wave} waves`, {
      fontFamily: 'Kenney Pixel',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(10);

    const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, 'Click to Restart', {
      fontFamily: 'Kenney Pixel',
      fontSize: '20px',
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Bounce in game over text
    goText.setScale(0);
    this.tweens.add({
      targets: goText,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    this.cameras.main.shake(500, 0.02);

    this.time.delayedCall(1000, () => {
      this.input.once('pointerdown', () => {
        this.scene.stop('UIScene');
        this.scene.restart();
      });
    });
  }

  update(time: number, _delta: number): void {
    // Update towers — shoot at enemies
    for (const tower of this.towers) {
      if (tower.active) {
        tower.tryShoot(this.enemies.filter((e) => e.active), time);
      }
    }

    // Update enemy HP bars
    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.update();
      }
    }

    // Clean up destroyed enemies
    this.enemies = this.enemies.filter((e) => e.active);
  }
}
