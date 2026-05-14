import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlayerParams {
  hatColor?: string;
  shirtColor?: string;
  overallsColor?: string;
  [key: string]: unknown;
}

export const defaultParams: PlayerParams = {
  hatColor: '#cc2200',
  shirtColor: '#cc2200',
  overallsColor: '#2244cc',
};

export const render: RenderScriptModule<PlayerParams>['render'] = (g, params) => {
  g.clear();

  const hat = parseInt((params.hatColor ?? '#cc2200').replace('#', ''), 16);
  const shirt = parseInt((params.shirtColor ?? '#cc2200').replace('#', ''), 16);
  const ov = parseInt((params.overallsColor ?? '#2244cc').replace('#', ''), 16);
  const skin = 0xffc89a;
  const shoe = 0x3b2000;

  // --- Hat ---
  g.fillStyle(hat, 1);
  g.fillRect(-9, -24, 18, 9);  // top of hat
  g.fillRect(-14, -15, 28, 4); // brim
  // Hat band
  g.fillStyle(0x991a00, 1);
  g.fillRect(-9, -15, 18, 2);

  // --- Head ---
  g.fillStyle(skin, 1);
  g.fillRect(-10, -11, 20, 13);
  // Ear bumps
  g.fillRect(-13, -8, 3, 6);
  g.fillRect(10, -8, 3, 6);

  // Eyes
  g.fillStyle(0x000000, 1);
  g.fillRect(-7, -7, 4, 4);
  g.fillRect(3, -7, 4, 4);
  // Eye whites (small corners)
  g.fillStyle(0xffffff, 1);
  g.fillRect(-6, -7, 2, 2);
  g.fillRect(4, -7, 2, 2);

  // Nose
  g.fillStyle(0xffaa77, 1);
  g.fillRect(-3, -4, 5, 4);

  // Mustache
  g.fillStyle(0x3b2000, 1);
  g.fillRect(-9, -1, 7, 3);
  g.fillRect(2, -1, 7, 3);

  // --- Body / Shirt ---
  g.fillStyle(shirt, 1);
  g.fillRect(-12, 2, 24, 10);

  // Overalls bib over shirt
  g.fillStyle(ov, 1);
  g.fillRect(-6, 3, 12, 9);

  // Overall buttons (gold)
  g.fillStyle(0xffdd00, 1);
  g.fillRect(-5, 4, 2, 2);
  g.fillRect(3, 4, 2, 2);

  // Overall straps
  g.fillStyle(ov, 1);
  g.fillRect(-11, 2, 5, 7);
  g.fillRect(6, 2, 5, 7);

  // Pants
  g.fillStyle(ov, 1);
  g.fillRect(-13, 12, 26, 9);

  // Leg divider
  g.fillStyle(0x1a3399, 1);
  g.fillRect(-1, 12, 2, 9);

  // --- Shoes ---
  g.fillStyle(shoe, 1);
  g.fillRect(-14, 21, 13, 4); // left shoe
  g.fillRect(1, 21, 13, 4);   // right shoe
  // Toe bumps
  g.fillStyle(0x5a3200, 1);
  g.fillRect(-15, 22, 4, 3);
  g.fillRect(11, 22, 4, 3);
};
