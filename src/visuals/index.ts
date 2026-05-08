// Auto-built render-script registry — visual editor slice 3.5.
//
// Drop a TS file into `src/visuals/` exporting `render(g, params)` and it
// appears here automatically; scene files reference it by path string
// (e.g. `"src/visuals/coin.ts"`). The SDK's `loadWorldScene` reads from
// this registry through `setRenderScriptRegistry` (called from main.ts).

import type { RenderScriptModule } from '@unboxy/phaser-sdk';

const modules = import.meta.glob<RenderScriptModule>('./*.ts', { eager: true });

export const renderScripts: Record<string, RenderScriptModule> = {};
for (const [key, mod] of Object.entries(modules)) {
  if (!mod || typeof (mod as { render?: unknown }).render !== 'function') continue;
  const filename = key.replace(/^\.\//, '');
  if (filename === 'index.ts') continue;
  renderScripts[`src/visuals/${filename}`] = mod;
}
