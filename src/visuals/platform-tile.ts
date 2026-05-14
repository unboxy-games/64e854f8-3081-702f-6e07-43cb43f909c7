import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlatformParams {
  width?: number;
  height?: number;
  stoneColor?: string;
  grassColor?: string;
}

export const render: RenderScriptModule['render'] = (g, params) => {
  g.clear();
  const w = (params?.width  as number) ?? 280;
  const h = (params?.height as number) ?? 22;
  const stoneCol = parseInt(((params?.stoneColor as string) ?? '#6b7280').replace('#', ''), 16);
  const grassCol = parseInt(((params?.grassColor as string) ?? '#4ade80').replace('#', ''), 16);

  const hw = w / 2;
  const hh = h / 2;

  // --- stone body shadow ---
  g.fillStyle(0x374151, 1);
  g.fillRoundedRect(-hw + 2, -hh + 2, w - 2, h - 2, 3);

  // --- stone body ---
  g.fillStyle(stoneCol, 1);
  g.fillRoundedRect(-hw, -hh, w, h, 3);

  // --- stone face highlights (lighter top-left) ---
  g.fillStyle(0xd1d5db, 0.3);
  g.fillRoundedRect(-hw, -hh, w, 4, { tl: 3, tr: 3, bl: 0, br: 0 });

  // --- stone seam lines (tile joints) ---
  g.lineStyle(1, 0x4b5563, 0.6);
  for (let x = -hw + 40; x < hw - 20; x += 40) {
    g.lineBetween(x, -hh + 4, x, hh);
  }

  // --- grass top strip ---
  g.fillStyle(grassCol, 1);
  g.fillRoundedRect(-hw, -hh, w, 6, { tl: 3, tr: 3, bl: 0, br: 0 });

  // --- grass tufts ---
  g.fillStyle(0x16a34a, 1);
  for (let x = -hw + 8; x < hw - 4; x += 18) {
    g.fillTriangle(x, -hh, x + 4, -hh - 5, x + 8, -hh);
  }

  // --- outer border ---
  g.lineStyle(2, 0x374151, 0.8);
  g.strokeRoundedRect(-hw, -hh, w, h, 3);
};
