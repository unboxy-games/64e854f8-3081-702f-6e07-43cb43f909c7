import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlatformParams {
  w?: number;
  h?: number;
  isGround?: boolean;
  [key: string]: unknown;
}

export const defaultParams: PlatformParams = {
  w: 192,
  h: 24,
  isGround: false,
};

export const render: RenderScriptModule<PlatformParams>['render'] = (g, params) => {
  g.clear();

  const w = params.w ?? 192;
  const h = params.h ?? 24;
  const hw = w / 2;
  const hh = h / 2;

  if (params.isGround) {
    // === Ground — grass top, dirt/rock underneath ===

    // Deep earth layer
    g.fillStyle(0x5c3a1e, 1);
    g.fillRect(-hw, -hh, w, h);

    // Mid dirt
    g.fillStyle(0x7a4e27, 1);
    g.fillRect(-hw, -hh + 4, w, h - 4);

    // Grass top stripe
    g.fillStyle(0x5cb85c, 1);
    g.fillRect(-hw, -hh, w, 8);

    // Grass top highlight
    g.fillStyle(0x7ecf7e, 1);
    g.fillRect(-hw, -hh, w, 3);

    // Grass blade details (short vertical dashes)
    g.fillStyle(0x4ea04e, 1);
    const step = 18;
    for (let x = -hw + 4; x < hw - 4; x += step) {
      g.fillRect(x, -hh, 3, 5);
      g.fillRect(x + 8, -hh, 2, 4);
    }

    // Dirt texture dots
    g.fillStyle(0x6b3e1f, 1);
    const dotStep = 40;
    for (let x = -hw + 20; x < hw - 10; x += dotStep) {
      g.fillRect(x, -hh + 12, 4, 3);
      g.fillRect(x + 20, -hh + 17, 3, 3);
    }

  } else {
    // === Floating brick platform ===

    // Base brick color
    g.fillStyle(0xc8622a, 1);
    g.fillRect(-hw, -hh, w, h);

    // Darker brick mortar lines
    g.fillStyle(0x8b3e18, 1);
    // Horizontal mortar line (center)
    g.fillRect(-hw, -1, w, 2);
    // Top and bottom edge
    g.fillRect(-hw, -hh, w, 2);
    g.fillRect(-hw, hh - 2, w, 2);

    // Vertical brick seams (top row, offset from bottom row)
    const brickW = 32;
    g.fillStyle(0x8b3e18, 1);
    // Top row seams
    for (let x = -hw + brickW; x < hw; x += brickW * 2) {
      if (x > -hw && x < hw) {
        g.fillRect(x, -hh, 2, hh + 1);
      }
    }
    // Bottom row seams (offset)
    for (let x = -hw + brickW * 0.5; x < hw; x += brickW * 2) {
      if (x > -hw && x < hw) {
        g.fillRect(x, 0, 2, hh);
      }
    }

    // Top highlight (3D ledge effect)
    g.fillStyle(0xf0a060, 1);
    g.fillRect(-hw, -hh, w, 3);
    // Bottom shadow
    g.fillStyle(0x5a2810, 1);
    g.fillRect(-hw, hh - 3, w, 3);
    // Left edge light
    g.fillStyle(0xde8040, 1);
    g.fillRect(-hw, -hh, 3, h);
  }
};
