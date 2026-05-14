import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface EnemyParams {
  bodyColor?: string;
  eyeColor?: string;
}

export const render: RenderScriptModule['render'] = (g, params) => {
  g.clear();
  const bodyCol = parseInt(((params?.bodyColor as string) ?? '#cc2222').replace('#', ''), 16);
  const eyeCol  = parseInt(((params?.eyeColor  as string) ?? '#ffee00').replace('#', ''), 16);

  // --- shadow/base oval ---
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(0, 13, 22, 6);

  // --- horns ---
  g.fillStyle(0x880000, 1);
  // left horn
  g.fillTriangle(-10, -12, -6, -12, -8, -20);
  // right horn
  g.fillTriangle(6, -12, 10, -12, 8, -20);

  // --- body ---
  g.fillStyle(bodyCol, 1);
  g.fillCircle(0, 0, 13);

  // --- underbelly ---
  g.fillStyle(0xff6666, 1);
  g.fillEllipse(0, 4, 14, 10);

  // --- eyes (white) ---
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(-5, -4, 8, 7);
  g.fillEllipse( 5, -4, 8, 7);

  // --- pupils ---
  g.fillStyle(eyeCol, 1);
  g.fillCircle(-5, -3, 2.5);
  g.fillCircle( 5, -3, 2.5);
  g.fillStyle(0x000000, 1);
  g.fillCircle(-5, -3, 1.2);
  g.fillCircle( 5, -3, 1.2);

  // --- angry brows ---
  g.lineStyle(2.5, 0x660000, 1);
  g.lineBetween(-8, -8, -2, -6);
  g.lineBetween(2, -6, 8, -8);

  // --- mouth / teeth ---
  g.fillStyle(0x000000, 1);
  g.fillRect(-6, 4, 12, 5);
  g.fillStyle(0xffffff, 1);
  g.fillRect(-5, 4, 3, 3);
  g.fillRect(-1, 4, 3, 3);
  g.fillRect( 3, 4, 3, 3);

  // --- outline ---
  g.lineStyle(2, 0x880000, 1);
  g.strokeCircle(0, 0, 13);
};
