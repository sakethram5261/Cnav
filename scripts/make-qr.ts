import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { GRAPH_NODES } from '../src/data/campusGraph.ts';

const BASE_URL = process.env.APP_URL ?? '';

async function main() {
  const anchors = GRAPH_NODES.filter((n) => n.kind === 'anchor' || n.kind === 'gate');
  const cards: string[] = [];

  for (const node of anchors) {
    const targetPath = `/h/${encodeURIComponent(node.id)}`;
    const url = BASE_URL ? `${BASE_URL}${targetPath}` : targetPath;
    const svg = await QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      color: { dark: '#1A1613', light: '#F3ECDF' },
    });
    cards.push(
      `<div class="card"><div class="qr">${svg}</div><div class="meta"><div class="badge">YOU ARE HERE</div><div class="title">${node.label?.en ?? node.id}</div><div class="hi">${node.label?.hi ?? ''}</div><code>${targetPath}</code></div></div>`
    );
  }

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Which Block Is 34? — Printable QR Anchor Sheet</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #F3ECDF; color: #1A1613; margin: 24px; }
    h1 { font-size: 20px; text-transform: uppercase; border-bottom: 2px solid #1A1613; padding-bottom: 8px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px; }
    .card { border: 2px solid #1A1613; background: #F3ECDF; padding: 12px; display: flex; gap: 12px; align-items: center; break-inside: avoid; }
    .qr svg { width: 112px; height: 112px; display: block; }
    .badge { display: inline-block; background: #FFC400; border: 1px solid #1A1613; padding: 2px 6px; font-size: 10px; font-weight: 700; margin-bottom: 6px; }
    .title { font-weight: 700; font-size: 14px; }
    .hi { font-size: 12px; margin-top: 2px; }
    code { display: block; margin-top: 6px; font-size: 11px; color: #9E3B2B; }
    @media print { body { margin: 8mm; } }
  </style>
</head>
<body>
  <h1>Which Block Is 34? — QR Anchor Tags (${anchors.length})</h1>
  <div class="grid">${cards.join('')}</div>
</body>
</html>`;

  const outPath = path.resolve(process.cwd(), 'public/qr-sheet.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Generated ${anchors.length} QR anchor cards -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
