// Code-native icon: a skull on a dark red square, encoded as PNG inside ICO.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let n = 0; n < 8; n++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const content = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(content));
  return Buffer.concat([length, content, crc]);
}
function png(size) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + .5) / size, v = (y + .5) / size;
    const head = ((u - .5) / .29) ** 2 + ((v - .43) / .30) ** 2 < 1;
    const jaw = u > .33 && u < .67 && v > .49 && v < .80;
    const eye = [.39, .61].some(cx => ((u - cx) / .074) ** 2 + ((v - .44) / .09) ** 2 < 1);
    const nose = Math.abs(u - .5) < .035 && v > .52 && v < .61;
    const tooth = v > .68 && v < .82 && [.40, .50, .60].some(cx => Math.abs(u - cx) < .016);
    const skull = (head || jaw) && !eye && !nose && !tooth;
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    pixels[offset] = skull ? 240 : 12 + Math.round(35 * (1 - v));
    pixels[offset + 1] = skull ? 153 : 12;
    pixels[offset + 2] = skull ? 131 : 16;
    pixels[offset + 3] = 255;
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
function createIcon(destination) {
  const sizes = [32, 48, 64, 128, 256];
  const images = sizes.map(png);
  const directory = Buffer.alloc(6 + sizes.length * 16); directory.writeUInt16LE(1, 2); directory.writeUInt16LE(sizes.length, 4);
  let offset = directory.length;
  sizes.forEach((size, index) => {
    const at = 6 + index * 16;
    directory[at] = size === 256 ? 0 : size; directory[at + 1] = directory[at];
    directory.writeUInt16LE(1, at + 4); directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(images[index].length, at + 8); directory.writeUInt32LE(offset, at + 12); offset += images[index].length;
  });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.concat([directory, ...images]));
}
module.exports = { createIcon };
