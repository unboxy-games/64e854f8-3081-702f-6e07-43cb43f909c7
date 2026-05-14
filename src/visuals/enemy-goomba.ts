import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface GoombaParams {
  bodyColor?: string;
  dead?: boolean;
  [key: string]: unknown;
}

export const defaultParams: GoombaParams = {
  bodyColor: '#8b4513',
  dead: false,
};

export const render: RenderScriptModule<GoombaParams>['render'] = (g, params) => {
  g.clear();

  const body = parseInt((params.bodyColor ?? '#8b4513').replace('#', ''), 16);

  if (params.dead) {
    // Squished — flat oval
    g.fillStyle(body, 1);
    g.fillEllipse(0, 14, 36, 8);
    return;
  }

  // === Main body (round-ish, sits slightly above center) ===
  g.fillStyle(body, 1);
  g.fillEllipse(0, -2, 36, 30);

  // Dark outline / shadow at bottom of body
  g.fillStyle(0x5c2d0e, 1);
  g.fillEllipse(0, 8, 32, 12);

  // Tan/cream underbelly
  g.fillStyle(0xd2934a, 1);
  g.fillEllipse(0, 4, 24, 14);

  // === Eyes ===
  // White eye circles
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-10, -5, 8);
  g.fillCircle(10, -5, 8);
  // Black pupils (shifted inward for cross-eyed angry look)
  g.fillStyle(0x111111, 1);
  g.fillCircle(-8, -4, 5);
  g.fillCircle(8, -4, 5);
  // Pupil highlights
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-6, -6, 2);
  g.fillCircle(10, -6, 2);

  // === Angry eyebrows ===
  g.fillStyle(0x2a1200, 1);
  // Left brow (angled down toward center)
  g.fillTriangle(-18, -14, -7, -11, -18, -11);
  // Right brow (angled down toward center)
  g.fillTriangle(18, -14, 7, -11, 18, -11);

  // === Teeth / fangs ===
  g.fillStyle(0xffffff, 1);
  g.fillRect(-10, 2, 6, 6);  // left fang
  g.fillRect(4, 2, 6, 6);    // right fang
  // Fang shading
  g.fillStyle(0xdddddd, 1);
  g.fillRect(-10, 6, 6, 2);
  g.fillRect(4, 6, 6, 2);

  // === Feet ===
  g.fillStyle(0x5c2d0e, 1);
  g.fillRect(-19, 10, 16, 8); // left foot
  g.fillRect(3, 10, 16, 8);   // right foot
  // Foot highlights
  g.fillStyle(0x7a4020, 1);
  g.fillRect(-19, 10, 16, 2);
  g.fillRect(3, 10, 16, 2);
};
