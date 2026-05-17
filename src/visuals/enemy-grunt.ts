import Phaser from 'phaser';
import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface EnemyGruntParams extends Record<string, unknown> {
  bodyColor?: string;
  highlightColor?: string;
  darkColor?: string;
  eyeGlowColor?: string;
}

export const defaultParams: EnemyGruntParams = {
  bodyColor: '#ff2244',
  highlightColor: '#ff88aa',
  darkColor: '#aa0022',
  eyeGlowColor: '#ff99bb',
};

function hex(s: string): number {
  return parseInt(s.replace(/^#/, ''), 16);
}

export const render: RenderScriptModule<EnemyGruntParams>['render'] = (g, params) => {
  g.clear();

  const body      = hex(params.bodyColor      ?? '#ff2244');
  const highlight = hex(params.highlightColor ?? '#ff88aa');
  const dark      = hex(params.darkColor      ?? '#aa0022');
  const eyeGlow   = hex(params.eyeGlowColor   ?? '#ff99bb');

  // Drop shadow
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(0, 20, 40, 10);

  // Main body
  g.fillStyle(body, 1);
  g.fillRoundedRect(-20, -16, 40, 32, 9);

  // Body sheen
  g.fillStyle(highlight, 0.28);
  g.fillRoundedRect(-15, -14, 18, 11, 4);

  // Eyes — sockets
  g.fillStyle(0x110000, 1);
  g.fillEllipse(-8, -4, 12, 11);
  g.fillEllipse(8, -4, 12, 11);
  // Eye glow
  g.fillStyle(eyeGlow, 1);
  g.fillEllipse(-8, -5, 7, 7);
  g.fillEllipse(8, -5, 7, 7);
  // Specular
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(-5, -7, 2);
  g.fillCircle(11, -7, 2);

  // Mouth slot
  g.fillStyle(dark, 1);
  g.fillRect(-10, 7, 20, 5);
  // Teeth
  g.fillStyle(0xffffff, 1);
  for (let t = 0; t < 3; t++) {
    g.fillRect(-9 + t * 7, 7, 5, 5);
  }

  // Antennae stems
  g.lineStyle(2, body, 1);
  g.strokeLineShape(new Phaser.Geom.Line(-9, -16, -13, -28));
  g.strokeLineShape(new Phaser.Geom.Line(9, -16, 13, -28));
  // Antenna tips
  g.fillStyle(highlight, 1);
  g.fillCircle(-13, -28, 4);
  g.fillCircle(13, -28, 4);

  // Legs / tentacles
  g.lineStyle(3, dark, 1);
  g.strokeLineShape(new Phaser.Geom.Line(-14, 16, -20, 30));
  g.strokeLineShape(new Phaser.Geom.Line(-5,  16, -5,  30));
  g.strokeLineShape(new Phaser.Geom.Line(5,   16,  5,  30));
  g.strokeLineShape(new Phaser.Geom.Line(14,  16, 20,  30));
};
