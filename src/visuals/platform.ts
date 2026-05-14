import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlatformParams {
  w?: number;
  h?: number;
  [key: string]: unknown;
}

export const defaultParams: PlatformParams = { w: 160, h: 20 };

export const render: RenderScriptModule<PlatformParams>['render'] = (g, params) => {
  g.clear();
  const w = params.w ?? 160;
  const h = params.h ?? 20;
  const hw = w / 2;
  const hh = h / 2;
  const grassH = Math.min(7, Math.floor(h * 0.35));

  // === DROP SHADOW ===
  g.fillStyle(0x000000, 0.15);
  g.fillRect(-hw + 3, -hh + 4, w, h);

  // === MAIN DIRT BODY ===
  g.fillStyle(0x8B5E3C, 1);
  g.fillRect(-hw, -hh, w, h);

  // === BRICK LINES (only for small-to-medium platforms) ===
  if (w <= 450 && h > 12) {
    const bodyH = h - grassH;
    const brickH = Math.max(7, Math.floor(bodyH / Math.max(1, Math.round(bodyH / 9))));
    const brickW = Math.min(36, Math.max(20, Math.floor(w / Math.max(2, Math.round(w / 32)))));
    g.lineStyle(1, 0x6B3C1C, 0.5);
    // Horizontal rows
    for (let by = -hh + grassH + brickH; by < hh - 1; by += brickH) {
      g.lineBetween(-hw + 1, by, hw - 1, by);
    }
    // Vertical joints (alternating offset)
    for (let row = 0; row * brickH < bodyH - 1; row++) {
      const rowTop = -hh + grassH + row * brickH;
      const offset = row % 2 === 0 ? 0 : brickW * 0.5;
      for (let bx = -hw + brickW + offset; bx < hw; bx += brickW) {
        g.lineBetween(bx, rowTop + 1, bx, rowTop + brickH - 1);
      }
    }
  }

  // === GRASS TOP STRIP ===
  g.fillStyle(0x4CAF50, 1);
  g.fillRect(-hw, -hh, w, grassH);

  // === BRIGHT TOP EDGE ===
  g.fillStyle(0x81C784, 1);
  g.fillRect(-hw, -hh, w, 2);

  // === RIGHT DEPTH EDGE ===
  g.fillStyle(0x5a2d0c, 0.6);
  g.fillRect(hw - 3, -hh + grassH, 3, h - grassH);

  // === BOTTOM SHADOW EDGE ===
  g.fillStyle(0x3d1a06, 0.8);
  g.fillRect(-hw, hh - 2, w, 2);
};
