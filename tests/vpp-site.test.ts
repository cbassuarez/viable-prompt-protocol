import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

function count(source: string, pattern: RegExp): number {
  return Array.from(source.matchAll(pattern)).length;
}

function luminance(hex: string): number {
  const channels = hex.match(/[a-f\d]{2}/gi);
  assert.ok(channels);
  const [red, green, blue] = channels.map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('homepage funnels to skill installation, MCP setup, and the v1.5 spec', () => {
  const home = read('website/docs/.vitepress/theme/components/VppHome.vue');
  assert.match(home, /href="\/install\/"/);
  assert.match(home, /href="\/install\/#connect-the-remote-mcp-server"/);
  assert.match(home, /href="\/spec\/"/);
  assert.doesNotMatch(home, /custom-instructions/);
  assert.doesNotMatch(home, /href="\/mcp/);
  assert.doesNotMatch(read('website/docs/index.md'), /custom-instructions/);
});

test('Canvas effects preserve semantic fallbacks and one shared glass renderer', () => {
  const ascii = read('website/docs/.vitepress/theme/components/VppAsciiIcon.vue');
  const decrypt = read('website/docs/.vitepress/theme/components/VppDecryptPanel.vue');
  const glass = read('website/docs/.vitepress/theme/components/VppSharedGlassLayer.vue');
  const layout = read('website/docs/.vitepress/theme/Layout.vue');

  assert.match(ascii, /vpp-ascii-icon__fallback/);
  assert.match(ascii, /fallbackAscii/);
  assert.match(ascii, /prefers-reduced-motion: reduce/);
  assert.match(decrypt, /v-else class="vpp-decrypt-panel vpp-decrypt-panel--fallback"/);
  assert.match(decrypt, /:fallback-paint="paintFallback"/);
  assert.match(decrypt, /getContext\('webgl2'\)/);
  assert.equal(count(glass, /<GlassObject\b/g), 1);
  assert.match(glass, /:on-load="handleGlassLoad"/);
  assert.match(glass, /loadedShape\.value !== shape\.value/);
  assert.match(glass, /:scale="18"/);
  assert.match(glass, /background-image=""/);
  assert.equal(count(layout, /<VppSharedGlassLayer\b/g), 1);
});

test('enforced path uses the supplied GLBs in the intended card order', () => {
  const home = read('website/docs/.vitepress/theme/components/VppHome.vue');

  assert.match(home, /alarm-clock\.glb[\s\S]*01 \/ Skill/);
  assert.match(home, /circuit-board\.glb[\s\S]*02 \/ Runtime/);
  assert.match(home, /magnifying-glass\.glb[\s\S]*03 \/ Guardrail/);
  assert.equal(count(home, /:cell-size="4"/g), 3);
  assert.equal(count(home, /:auto-rotate="true"/g), 3);
  assert.equal(count(home, /:orbit="true"/g), 3);
  assert.equal(count(home, /:show-fallback="false"/g), 3);
  assert.doesNotMatch(home, /fallback-src=/);
  assert.doesNotMatch(home, /drag to orbit/i);
});

test('hard-edge surfaces stay square and avoid left accent strips', () => {
  const css = read('website/docs/.vitepress/theme/style.css');
  assert.match(css, /\.vpp-layout \*[\s\S]*border-radius: 0 !important/);
  assert.doesNotMatch(css, /border-left/);
  assert.match(css, /\.vpp-shared-glass \{[\s\S]*position: absolute !important/);
  assert.match(css, /white-space: nowrap/);
});

test('all project-owned icon controls use ASCII icons and 56px targets', () => {
  const css = read('website/docs/.vitepress/theme/style.css');
  const viewer = read('website/docs/.vitepress/theme/components/CorpusViewer.vue');
  const detail = read('website/docs/.vitepress/theme/components/CorpusDetail.vue');

  assert.match(css, /--vpp-icon-control-size:\s*56px/);
  assert.match(viewer, /VppAsciiIcon/);
  assert.match(detail, /VppAsciiIcon/);
  assert.doesNotMatch(viewer, /<svg/);
  assert.doesNotMatch(detail, /<svg/);
});

test('interactive orange tokens meet WCAG AA for normal text', () => {
  assert.ok(contrast('#b43a12', '#ffffff') >= 4.5);
  assert.ok(contrast('#090807', '#ff7540') >= 4.5);
  assert.ok(contrast('#17130f', '#f7f6f2') >= 4.5);
  assert.ok(contrast('#fff9f4', '#090807') >= 4.5);
});

test('vendored Canvas UI source is pinned and licensed', () => {
  const notice = read('website/docs/.vitepress/theme/vendor/canvasui/README.md');
  const license = read('website/docs/.vitepress/theme/vendor/canvasui/LICENSE.md');
  assert.match(notice, /2dd45d70394b890a8130740061cdcc957e89dc35/);
  assert.match(license, /Copyright \(c\) 2026 David Haz/);
  assert.match(license, /Commons Clause Restriction/);
});
