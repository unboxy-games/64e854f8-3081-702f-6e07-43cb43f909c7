import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlayerParams {
  bodyColor?: string;
  capColor?: string;
}

export const render: RenderScriptModule['render'] = (g, params) => {
  g.clear();
  const body = parseInt(((params?.bodyColor as string) ?? '#3b82f6').replace('#', ''), 16);
  const cap  = parseInt(((params?.capColor as string) ?? '#1e40af').replace('#', ''), 16);

  // --- shoes ---
  g.fillStyle(0x3d2a1a, 1);
  g.fillRoundedRect(-13, 20, 11, 5, 2);
  g.fillRoundedRect(2, 20, 11, 5, 2);

  // --- legs (pants) ---
  g.fillStyle(0x1e293b, 1);
  g.fillRect(-11, 8, 9, 14);
  g.fillRect(2,   8, 9, 14);

  // --- belt ---
  g.fillStyle(0x92400e, 1);
  g.fillRect(-11, 6, 22, 4);

  // --- torso ---
  g.fillStyle(body, 1);
  g.fillRoundedRect(-11, -6, 22, 16, 3);

  // --- arm stubs ---
  g.fillStyle(body, 1);
  g.fillRect(-14, -5, 4, 9);
  g.fillRect( 10, -5, 4, 9);
  // fists
  g.fillStyle(0xfcd5b5, 1);
  g.fillCircle(-12, 5, 3);
  g.fillCircle( 12, 5, 3);

  // --- neck ---
  g.fillStyle(0xfcd5b5, 1);
  g.fillRect(-3, -10, 6, 6);

  // --- head ---
  g.fillStyle(0xfcd5b5, 1);
  g.fillCircle(0, -18, 11);

  // --- cap ---
  g.fillStyle(cap, 1);
  g.fillRect(-13, -21, 26, 6);      // brim
  g.fillRoundedRect(-9, -28, 18, 9, { tl: 4, tr: 4, bl: 0, br: 0 }); // crown

  // --- eyes ---
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-4, -19, 3.5);
  g.fillCircle( 4, -19, 3.5);
  g.fillStyle(0x1e293b, 1);
  g.fillCircle(-4, -19, 2);
  g.fillCircle( 4, -19, 2);
  // shine
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-5, -20, 0.8);
  g.fillCircle( 3, -20, 0.8);

  // --- smile ---
  g.lineStyle(1.5, 0x8b5e3c, 1);
  g.beginPath();
  g.arc(0, -15, 4, 0.15, Math.PI - 0.15);
  g.strokePath();

  // --- torso outline ---
  g.lineStyle(2, cap, 0.7);
  g.strokeRoundedRect(-11, -6, 22, 16, 3);
};
