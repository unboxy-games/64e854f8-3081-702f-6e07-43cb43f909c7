// Auto-built render-script registry — visual editor slice 3.5.
//
// Drop a TS file into `src/visuals/` exporting `render(g, params)` and it
// appears here automatically; scene files reference it by path string
// (e.g. `"src/visuals/coin.ts"`). The SDK's `loadWorldScene` reads from
// this registry through `setRenderScriptRegistry` (called from main.ts).
//
// Render scripts are PURE FUNCTIONS — no module state, no time-based
// motion, no Math.random without seeded RNG. See the
// `phaser-render-script` agent skill for the full contract and examples.

import type { RenderScriptModule } from '@unboxy/phaser-sdk';

// `import.meta.glob` is a Vite feature — at build time it expands into a
// static map of paths to module objects. The `eager: true` flag inlines
// each module rather than returning a dynamic loader, so the registry is
// available synchronously at boot. Path strings on the keys are relative
// to this file (`./coin.ts`); the SDK's resolver normalises both this
// shape and the `src/visuals/coin.ts` shape so scene files can use either.
const modules = import.meta.glob<RenderScriptModule>('./*.ts', { eager: true });

// Filter out this index file and any other helper that doesn't export
// `render`. The keys we expose match what scene files reference: the
// `src/visuals/<name>.ts` path is the source of truth, so we re-key here.
export const renderScripts: Record<string, RenderScriptModule> = {};
for (const [key, mod] of Object.entries(modules)) {
  if (!mod || typeof (mod as { render?: unknown }).render !== 'function') continue;
  // key is './<name>.ts' — turn it into 'src/visuals/<name>.ts'
  const filename = key.replace(/^\.\//, '');
  if (filename === 'index.ts') continue;
  renderScripts[`src/visuals/${filename}`] = mod;
}
