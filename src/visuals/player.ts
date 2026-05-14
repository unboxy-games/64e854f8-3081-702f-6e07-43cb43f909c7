import type { RenderScriptModule } from '@unboxy/phaser-sdk';

export interface PlayerParams {
  dummy?: boolean;
  [key: string]: unknown;
}

export const defaultParams: PlayerParams = {};

export const render: RenderScriptModule<PlayerParams>['render'] = (g, _params) => {
  g.clear();

  // === HAT (red) ===
  g.fillStyle(0xcc2200, 1);
  g.fillRect(-12, -24, 24, 8); // hat top
  g.fillStyle(0xdd3311, 1);
  g.fillRect(-15, -16, 30, 4); // brim (wider)
  g.fillStyle(0x991100, 1);
  g.fillRect(-12, -16, 24, 2); // hat band shadow

  // === HEAD / FACE (skin) ===
  g.fillStyle(0xffcc99, 1);
  g.fillEllipse(0, -7, 22, 16);
  g.fillCircle(-11, -8, 3); // left ear
  g.fillCircle(11, -8, 3);  // right ear

  // === EYES ===
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-5, -10, 2.5); // left eye white
  g.fillCircle(5, -10, 2.5);  // right eye white
  g.fillStyle(0x222222, 1);
  g.fillCircle(-5, -10, 1.2); // left pupil
  g.fillCircle(5, -10, 1.2);  // right pupil

  // === NOSE ===
  g.fillStyle(0xffaa77, 1);
  g.fillEllipse(0, -6, 6, 4);

  // === MUSTACHE (brown) ===
  g.fillStyle(0x7a3010, 1);
  g.fillEllipse(-5, -3, 9, 4);
  g.fillEllipse(5, -3, 9, 4);

  // === BODY — red shirt sides ===
  g.fillStyle(0xcc2200, 1);
  g.fillRect(-11, 1, 4, 10); // left shirt side
  g.fillRect(7, 1, 4, 10);   // right shirt side

  // === OVERALLS (blue) ===
  g.fillStyle(0x3366bb, 1);
  g.fillRect(-7, 1, 14, 17); // center bib
  g.fillRect(-11, 9, 22, 9); // lower overalls

  // === BIB POCKET DETAIL ===
  g.fillStyle(0x2255aa, 1);
  g.fillRect(-6, 2, 12, 7);

  // === BUTTONS ===
  g.fillStyle(0xffd700, 1);
  g.fillCircle(-3, 5, 1.5);
  g.fillCircle(3, 5, 1.5);

  // === ARMS (red sleeves) ===
  g.fillStyle(0xcc2200, 1);
  g.fillRect(-16, 3, 6, 10); // left
  g.fillRect(10, 3, 6, 10);  // right

  // === HANDS (skin) ===
  g.fillStyle(0xffcc99, 1);
  g.fillCircle(-13, 14, 4);
  g.fillCircle(13, 14, 4);

  // === LEGS (dark blue) ===
  g.fillStyle(0x22448a, 1);
  g.fillRect(-10, 18, 8, 6); // left
  g.fillRect(2, 18, 8, 6);   // right

  // === SHOES (brown) ===
  g.fillStyle(0x8B3300, 1);
  g.fillRoundedRect(-13, 21, 11, 4, 2); // left shoe (wider front)
  g.fillRoundedRect(2, 21, 11, 4, 2);   // right shoe
};
