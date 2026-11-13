import { readFile, writeFile } from 'node:fs/promises';

const outputPath = new URL('../offline/index.html', import.meta.url);
const shareOutputPath = new URL('../offline/crm-customer-prototype-share.html', import.meta.url);
const html = await readFile(outputPath, 'utf8');

// The bundle is fully inlined. Wrap startup so the head script waits for #root when opened via file://.
const patched = html.replace(
  /<script type="module" crossorigin>([\s\S]*?)<\/script>/,
  '<script>window.addEventListener("DOMContentLoaded",()=>{$1});</script>',
);
if (patched === html) {
  throw new Error('离线 HTML 未找到预期的内嵌模块脚本标记');
}

await writeFile(outputPath, patched, 'utf8');
await writeFile(shareOutputPath, patched, 'utf8');
