import { writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const width = 88;
const height = 31;
const pixels = Buffer.alloc(width * height * 4);

const colors = {
  ink: [0, 0, 0, 255],
  paper: [255, 253, 247, 255],
  purple: [128, 91, 219, 255],
  pink: [236, 84, 157, 255],
  blue: [50, 122, 228, 255],
};

const font = {
  " ": ["0", "0", "0", "0", "0"],
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["111", "100", "100", "100", "111"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  I: ["1", "1", "1", "1", "1"],
  O: ["111", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
};

function putPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const offset = (y * width + x) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
}

function fillRect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) putPixel(xx, yy, color);
  }
}

function drawGlyph(char, x, y, color, scale = 1) {
  const glyph = font[char];
  if (!glyph) return 0;
  glyph.forEach((row, rowIndex) => {
    [...row].forEach((bit, colIndex) => {
      if (bit === "1") fillRect(x + colIndex * scale, y + rowIndex * scale, scale, scale, color);
    });
  });
  return glyph[0].length * scale;
}

function drawText(text, x, y, color, scale = 1, gap = 1) {
  let cursor = x;
  for (const char of text) cursor += drawGlyph(char, cursor, y, color, scale) + gap;
}

function drawPlus(cx, cy, color) {
  fillRect(cx - 1, cy - 3, 3, 7, color);
  fillRect(cx - 3, cy - 1, 7, 3, color);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

fillRect(0, 0, width, height, colors.paper);

fillRect(4, 0, 80, 2, colors.ink);
fillRect(2, 2, 2, 2, colors.ink);
fillRect(0, 4, 2, 23, colors.ink);
fillRect(2, 27, 2, 2, colors.ink);
fillRect(4, 29, 80, 2, colors.ink);
fillRect(84, 2, 2, 2, colors.ink);
fillRect(86, 4, 2, 23, colors.ink);
fillRect(84, 27, 2, 2, colors.ink);

fillRect(6, 6, 28, 19, colors.ink);
drawText("VCC", 8, 10, colors.paper, 2, 2);

for (let y = 5; y < 26; y += 4) fillRect(37, y, 1, 2, colors.ink);

drawText("VIBE", 41, 8, colors.ink, 1, 1);
drawText("CODED", 41, 17, colors.ink, 1, 1);

drawPlus(79, 8, colors.purple);
drawPlus(83, 15, colors.pink);
drawPlus(78, 23, colors.blue);

const rawRows = [];
for (let y = 0; y < height; y += 1) {
  rawRows.push(Buffer.from([0]));
  rawRows.push(pixels.subarray(y * width * 4, (y + 1) * width * 4));
}

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 6;

const png = Buffer.concat([
  signature,
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(Buffer.concat(rawRows), { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

await writeFile(new URL("../img/badge.png", import.meta.url), png);
console.log(`Built img/badge.png (${png.length} bytes).`);
