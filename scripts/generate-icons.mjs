/**
 * Génère les icônes PWA (PNG) sans dépendance externe :
 * encodeur PNG minimal (zlib natif de Node) + dessin par pixel.
 * Motif : pierre de curling stylisée sur fond bleu glacier.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

/* ---------------- Encodeur PNG minimal ---------------- */

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Écrit un PNG RGBA à partir d'une fonction (x, y) -> [r, g, b, a]. */
function writePNG(size, pixelFn, filePath) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filtre "None"
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y, size);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 6; // couleur RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(filePath, png);
  console.log(`✓ ${filePath} (${size}×${size})`);
}

/* ---------------- Dessin ---------------- */

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

const TOP = hex('#49aed7');    // ice-400
const BOTTOM = hex('#125f86'); // ice-700
const STONE = hex('#f5fafd');
const STONE_BAND = hex('#bfe2f1'); // ice-200
const HANDLE = hex('#0e2b3e');     // ice-950

const lerp = (a, b, t) => Math.round(a + (b - a) * t);

/**
 * Pierre de curling vue de dessus : disque clair, bande interne, poignée.
 * `inset` réserve la zone de sécurité (icônes maskable).
 */
function iconPixel(x, y, size, { rounded, inset = 0 }) {
  const u = x / size;
  const v = y / size;

  // Coins arrondis (icônes classiques uniquement)
  if (rounded) {
    const r = 0.21;
    const cx = Math.min(Math.max(u, r), 1 - r);
    const cy = Math.min(Math.max(v, r), 1 - r);
    if (Math.hypot(u - cx, v - cy) > r) return [0, 0, 0, 0];
  }

  // Fond en dégradé vertical bleu glacier
  const bg = [
    lerp(TOP[0], BOTTOM[0], v),
    lerp(TOP[1], BOTTOM[1], v),
    lerp(TOP[2], BOTTOM[2], v),
  ];

  const scale = 1 - inset * 2;
  const px = (u - 0.5) / scale;
  const py = (v - 0.5) / scale;

  const d = Math.hypot(px, py - 0.06);
  let color = bg;
  if (d < 0.34) color = STONE; // corps de la pierre
  if (d < 0.24) color = STONE_BAND; // bande interne
  if (d < 0.15) color = STONE; // centre

  // Poignée : tige inclinée + pommeau
  const hx = px - (py - 0.06) * 0.55;
  if (Math.abs(hx) < 0.035 && py - 0.06 > -0.36 && py - 0.06 < 0) color = HANDLE;
  if (Math.hypot(px + 0.165, py - 0.06 + 0.30) < 0.075) color = HANDLE;

  return [...color, 255];
}

writePNG(192, (x, y, s) => iconPixel(x, y, s, { rounded: true }), join(outDir, 'icon-192.png'));
writePNG(512, (x, y, s) => iconPixel(x, y, s, { rounded: true }), join(outDir, 'icon-512.png'));
writePNG(512, (x, y, s) => iconPixel(x, y, s, { rounded: false, inset: 0.1 }), join(outDir, 'icon-512-maskable.png'));
writePNG(180, (x, y, s) => iconPixel(x, y, s, { rounded: false }), join(outDir, 'apple-touch-icon.png'));
