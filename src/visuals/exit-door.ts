import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export type ExitDoorParams = Record<string, unknown> & {
  glowColor?: string;
};

export const defaultParams: ExitDoorParams = {
  glowColor: '#00ff88',
};

export const render: RenderScriptModule<ExitDoorParams>['render'] = (g, _params) => {
  g.clear();

  // Stone frame shadow
  g.fillStyle(0x1a2530, 1);
  g.fillRect(-18, -25, 36, 52);

  // Stone frame
  g.fillStyle(0x3a5068, 1);
  g.fillRect(-17, -26, 36, 52);

  // Frame edge highlight
  g.lineStyle(2, 0x5a7a98, 1);
  g.strokeRect(-17, -26, 36, 52);

  // Door panel (wood/magic)
  g.fillStyle(0x1a8050, 1);
  g.fillRect(-13, -22, 26, 44);

  // Door glow fill
  g.fillStyle(0x00ff88, 0.15);
  g.fillRect(-13, -22, 26, 44);

  // Door arch (rounded top)
  g.fillStyle(0x00cc66, 0.9);
  g.fillCircle(0, -22, 13);

  // Light rays inside door
  g.fillStyle(0x44ffaa, 0.25);
  g.fillTriangle(0, -22, -13, 22, 13, 22);

  // Door panel lines
  g.lineStyle(1.5, 0x005533, 0.5);
  g.lineBetween(0, -10, 0, 20);
  g.lineBetween(-13, 4, 13, 4);

  // Outer frame
  g.lineStyle(2.5, 0x223344, 1);
  g.strokeRect(-17, -26, 36, 52);

  // Door handle (gold knob)
  g.fillStyle(0xffdd00, 1);
  g.fillCircle(9, 3, 3);
  g.lineStyle(1, 0xaa8800, 1);
  g.strokeCircle(9, 3, 3);

  // Beacon / exit star above frame
  g.fillStyle(0x00ff88, 1);
  g.fillCircle(0, -28, 5);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(0, -28, 2.5);
  g.fillStyle(0x00ff88, 0.4);
  g.fillCircle(0, -28, 8);
};
