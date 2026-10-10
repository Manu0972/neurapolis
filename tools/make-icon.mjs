/** Génère desktop/icon.png (256 × 256) sans dépendance : skyline dorée et petit fantôme. */
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const S = 256;
const px = Buffer.alloc(S * S * 4);
const set = (x, y, [r, g, b, a = 255]) => {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
};
const R = 44;
for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
  // Coins arrondis, dégradé nuit → crépuscule.
  const cx = Math.max(R - x, 0, x - (S - 1 - R)), cy = Math.max(R - y, 0, y - (S - 1 - R));
  if (cx * cx + cy * cy > R * R) continue;
  const t = y / S;
  set(x, y, [Math.round(10 + 70 * t * t), Math.round(14 + 30 * t), Math.round(40 + 30 * t)]);
}
// Skyline.
const gold = [255, 196, 90];
const bars = [[28, 150], [56, 110], [84, 170], [112, 80], [140, 135], [168, 100], [196, 160]];
for (const [x0, top] of bars) for (let x = x0; x < x0 + 26; x++) for (let y = top; y < 214; y++) set(x, y, gold);
// Fenêtres.
for (const [x0, top] of bars) for (let wy = top + 10; wy < 204; wy += 16) for (let wx = x0 + 5; wx < x0 + 22; wx += 10)
  for (let y = wy; y < wy + 7; y++) for (let x = wx; x < wx + 5; x++) set(x, y, [60, 40, 30]);
// Sol.
for (let x = 20; x < 236; x++) for (let y = 214; y < 222; y++) set(x, y, [255, 214, 140]);
// Petit fantôme (cercle + corps).
for (let y = 24; y < 80; y++) for (let x = 168; x < 224; x++) {
  const dx = x - 196, dy = y - 46;
  if (dx * dx + dy * dy < 22 * 22 || (y >= 46 && y < 78 && Math.abs(dx) < 22)) set(x, y, [235, 230, 255]);
}
for (const [ex, ey] of [[188, 44], [204, 44]]) for (let y = ey - 3; y <= ey + 3; y++) for (let x = ex - 3; x <= ex + 3; x++) set(x, y, [40, 30, 70]);

// Encodage PNG.
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((S * 4 + 1) * S);
for (let y = 0; y < S; y++) px.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
writeFileSync(process.argv[2] ?? 'desktop/icon.png', png);

// Un ICO peut contenir directement un PNG (format pris en charge par Windows Vista+).
// Le générer ici évite à electron-builder de convertir le PNG avec son outil WASM :
// celui-ci échoue avec « WebAssembly.Memory(): could not allocate memory » sur certains hôtes.
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0); // réservé
icoHeader.writeUInt16LE(1, 2); // icône
icoHeader.writeUInt16LE(1, 4); // une image
icoHeader[6] = S === 256 ? 0 : S;
icoHeader[7] = S === 256 ? 0 : S;
icoHeader[8] = 0; // palette par défaut
icoHeader[9] = 0; // réservé
icoHeader.writeUInt16LE(1, 10); // plans
icoHeader.writeUInt16LE(32, 12); // profondeur
icoHeader.writeUInt32LE(png.length, 14);
icoHeader.writeUInt32LE(22, 18); // début de l'image après l'en-tête
writeFileSync(process.argv[3] ?? 'desktop/icon.ico', Buffer.concat([icoHeader, png]));
console.log('icônes PNG et ICO écrites');
