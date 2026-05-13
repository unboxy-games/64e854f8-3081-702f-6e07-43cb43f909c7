import Phaser from 'phaser';

/**
 * Enemy Boss — massive red armoured battlecruiser. HP 15, 2000 pts.
 * Visual bounds: width 140 x height 100  →  x: -70..70, y: -50..50
 */
export function render(g: Phaser.GameObjects.Graphics, _params: Record<string, unknown>): void {
  // Outer wing flanges
  g.fillStyle(0x550008);
  g.fillTriangle(-65, -36, -70, -6, -60, 28);
  g.fillTriangle(65, -36, 70, -6, 60, 28);

  // Main hull body
  g.fillStyle(0x880011);
  g.fillRoundedRect(-62, -38, 124, 76, 8);

  // Armour plate — left section
  g.fillStyle(0x660010);
  g.fillRoundedRect(-60, -34, 46, 28, 4);

  // Armour plate — right section
  g.fillStyle(0x660010);
  g.fillRoundedRect(14, -34, 46, 28, 4);

  // Central command core
  g.fillStyle(0xaa1122);
  g.fillRoundedRect(-28, -34, 56, 62, 6);

  // Core energy reactor glow
  g.fillStyle(0xff3300, 0.9);
  g.fillEllipse(0, -2, 46, 22);
  g.fillStyle(0xff7700, 0.75);
  g.fillEllipse(0, -2, 28, 14);
  g.fillStyle(0xffcc00, 0.6);
  g.fillCircle(0, -2, 8);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(0, -2, 3);

  // Vent slots — top
  g.fillStyle(0x330006);
  for (let i = -3; i <= 3; i++) {
    g.fillRect(i * 16 - 4, -42, 8, 5);
  }

  // Left cannon pod
  g.fillStyle(0x440008);
  g.fillRoundedRect(-54, 26, 22, 18, 3);
  g.fillStyle(0x220005);
  g.fillRect(-52, 40, 18, 7);
  // Left cannon muzzle glow
  g.fillStyle(0xff2200, 0.75);
  g.fillRect(-50, 45, 14, 4);

  // Center cannon pod
  g.fillStyle(0x550008);
  g.fillRoundedRect(-14, 28, 28, 20, 3);
  g.fillStyle(0x330006);
  g.fillRect(-12, 44, 24, 6);
  // Center cannon muzzle glow
  g.fillStyle(0xff4400, 0.85);
  g.fillRect(-10, 48, 20, 4);

  // Right cannon pod
  g.fillStyle(0x440008);
  g.fillRoundedRect(32, 26, 22, 18, 3);
  g.fillStyle(0x220005);
  g.fillRect(34, 40, 18, 7);
  // Right cannon muzzle glow
  g.fillStyle(0xff2200, 0.75);
  g.fillRect(36, 45, 14, 4);

  // Detail lines — panel rivets
  g.lineStyle(1, 0xff4400, 0.35);
  g.lineBetween(-62, 0, 62, 0);
  g.lineBetween(0, -38, 0, 28);

  // Side navigation lights
  g.fillStyle(0x00ffff, 0.7);
  g.fillCircle(-60, 10, 3);
  g.fillStyle(0xff0000, 0.7);
  g.fillCircle(60, 10, 3);

  // Armour highlights
  g.lineStyle(1, 0xff6644, 0.3);
  g.lineBetween(-60, -34, -14, -34);
  g.lineBetween(14, -34, 60, -34);
}
