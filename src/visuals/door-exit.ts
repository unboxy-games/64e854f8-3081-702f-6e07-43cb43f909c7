import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface DoorParams {
  open?: boolean;
}

export const render: RenderScriptModule['render'] = (g, params) => {
  g.clear();
  const isOpen = (params?.open as boolean) ?? false;

  // --- outer frame shadow ---
  g.fillStyle(0x1a0f00, 1);
  g.fillRoundedRect(-23, -35, 46, 70, { tl: 10, tr: 10, bl: 2, br: 2 });

  // --- outer frame ---
  g.fillStyle(0x5c3d1e, 1);
  g.fillRoundedRect(-22, -34, 44, 69, { tl: 9, tr: 9, bl: 2, br: 2 });

  // --- door surface ---
  g.fillStyle(isOpen ? 0x1a0f00 : 0x7a4f2a, 1);
  g.fillRoundedRect(-17, -29, 34, 60, { tl: 7, tr: 7, bl: 2, br: 2 });

  // --- door panels (decorative insets) ---
  if (!isOpen) {
    g.fillStyle(0x5c3d1e, 1);
    g.fillRoundedRect(-13, -25, 26, 24, 3);
    g.fillRoundedRect(-13,   2, 26, 20, 3);

    // panel highlights
    g.fillStyle(0x8b5e3c, 1);
    g.fillRoundedRect(-12, -24, 12, 22, 2);
    g.fillRoundedRect(-12,   3, 12, 18, 2);

    // --- door knob ---
    g.fillStyle(0xffd700, 1);
    g.fillCircle(9, -10, 3);
    g.fillStyle(0xa06800, 1);
    g.fillCircle(9, -10, 1.5);
  }

  // --- glowing arch / top decoration ---
  g.fillStyle(0x22ff88, 0.25);
  g.fillRoundedRect(-20, -33, 40, 20, { tl: 8, tr: 8, bl: 0, br: 0 });

  // --- green exit glow border ---
  g.lineStyle(3, 0x22ff88, 0.9);
  g.strokeRoundedRect(-22, -34, 44, 69, { tl: 9, tr: 9, bl: 2, br: 2 });

  // --- arrow pointing right (exit indicator) ---
  g.fillStyle(0x22ff88, 1);
  // arrow body
  g.fillRect(-7, -4, 10, 8);
  // arrowhead triangle
  g.fillTriangle(3, -8, 3, 8, 12, 0);

  // --- "EXIT" dots pattern above arrow ---
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(-10, -18, 20, 3);
  g.fillRect(-10, -13, 14, 3);
};
