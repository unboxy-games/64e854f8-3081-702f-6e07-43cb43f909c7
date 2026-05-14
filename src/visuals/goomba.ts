import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export const defaultParams = {};

export const render: RenderScriptModule<typeof defaultParams>['render'] = (g, _params) => {
  g.clear();

  // === FOOT SHADOW ===
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(0, 16, 34, 8);

  // === MAIN MUSHROOM BODY (dark brown) ===
  g.fillStyle(0x8B4513, 1);
  g.fillEllipse(0, -1, 38, 30);

  // === TOP CAP RIDGE (darker) ===
  g.fillStyle(0x6B2F0A, 1);
  g.fillEllipse(0, -7, 36, 16);

  // === FACE AREA (cream/light brown) ===
  g.fillStyle(0xE8C49A, 1);
  g.fillEllipse(0, 5, 28, 20);

  // === EYES (white sclera) ===
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(-9, 0, 13, 14);
  g.fillEllipse(9, 0, 13, 14);

  // === PUPILS (black, shifted inward for angry look) ===
  g.fillStyle(0x111111, 1);
  g.fillEllipse(-8, 1, 8, 9);
  g.fillEllipse(8, 1, 8, 9);

  // === ANGRY EYEBROWS ===
  g.fillStyle(0x111111, 1);
  // Left brow — angled inward (inner end higher)
  g.fillRect(-16, -9, 11, 3);
  g.fillRect(-11, -13, 5, 4); // inner raised angle
  // Right brow — mirrored
  g.fillRect(5, -9, 11, 3);
  g.fillRect(6, -13, 5, 4);  // inner raised angle

  // === MOUTH (grimace line) ===
  g.lineStyle(2, 0x553311, 1);
  g.beginPath();
  g.moveTo(-7, 9);
  g.lineTo(-3, 12);
  g.lineTo(3, 12);
  g.lineTo(7, 9);
  g.strokePath();

  // === FEET (stubby, dark) ===
  g.fillStyle(0x5a2d0c, 1);
  g.fillEllipse(-11, 15, 14, 8);
  g.fillEllipse(11, 15, 14, 8);
};
