/**
 * QR codes, made on the device.
 *
 * For the invite cards: a code a friend's phone camera opens the studio from.
 * Made here rather than by a library or a website, so it works offline and
 * inside Sukhi Play, and nothing about it goes anywhere.
 *
 * The standard (ISO/IEC 18004) as far as a web address needs it: byte mode,
 * versions 1 to 6 (up to 33 characters at the highest error correction),
 * Reed-Solomon error correction, and the mask that scores best on the
 * standard's penalty rules. Level H, the highest, lets about a quarter of the
 * code be lost and still read, which is what leaves room for a face in the
 * middle. Follows Project Nayuki's reference implementation (MIT).
 */

type Level = 'L' | 'M' | 'Q' | 'H';

const ORDER: Record<Level, number> = { L: 0, M: 1, Q: 2, H: 3 };
/** The two bits each level puts in the format information. */
const FORMAT: Record<Level, number> = { L: 1, M: 0, Q: 3, H: 2 };
// Index 0 is unused: versions count from 1.
const ECC_PER_BLOCK = [
  [-1, 7, 10, 15, 20, 26, 18],
  [-1, 10, 16, 26, 18, 24, 16],
  [-1, 13, 22, 18, 26, 18, 24],
  [-1, 17, 28, 22, 16, 22, 28]
];
const BLOCKS = [
  [-1, 1, 1, 1, 1, 1, 2],
  [-1, 1, 1, 1, 2, 2, 4],
  [-1, 1, 1, 2, 2, 4, 4],
  [-1, 1, 1, 2, 4, 4, 4]
];
const MAX_VERSION = 6;

/** Modules available for data and error correction in a version. */
function rawModules (ver: number): number {
  let n = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const align = Math.floor(ver / 7) + 2;
    n -= (25 * align - 10) * align - 55;
  }
  return n;
}

const dataCodewords = (ver: number, lvl: Level): number =>
  Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ORDER[lvl]][ver] * BLOCKS[ORDER[lvl]][ver];

/* Reed-Solomon over GF(2^8), with the QR polynomial 0x11D. */
function multiply (x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function divisor (degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = multiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = multiply(root, 0x02);
  }
  return result;
}

function remainder (data: number[], div: number[]): number[] {
  const result = div.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    div.forEach((coef, i) => { result[i] ^= multiply(coef, factor); });
  }
  return result;
}

/** A QR code: `size` by `size` modules, true for dark. */
export interface Qr { size: number; dark: boolean[][] }

/** The code for `text`, at the smallest version that holds it at this level. */
export function qr (text: string, lvl: Level = 'H'): Qr {
  const bytes = [...new TextEncoder().encode(text)];
  let ver = 1;
  // Byte mode: a 4-bit mode, an 8-bit count (versions 1 to 9), then the bytes.
  while (ver <= MAX_VERSION && 4 + 8 + bytes.length * 8 > dataCodewords(ver, lvl) * 8) ver++;
  if (ver > MAX_VERSION) throw new Error('Too long for a QR code here');

  // The data bits, then a terminator, then padding to fill the version.
  const bits: number[] = [];
  const put = (value: number, n: number): void => { for (let i = n - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  put(0b0100, 4);
  put(bytes.length, 8);
  bytes.forEach((b) => put(b, 8));
  const capacity = dataCodewords(ver, lvl) * 8;
  put(0, Math.min(4, capacity - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));

  // Split into blocks, add each one's error correction, and interleave.
  const blocks = BLOCKS[ORDER[lvl]][ver];
  const eccLen = ECC_PER_BLOCK[ORDER[lvl]][ver];
  const raw = Math.floor(rawModules(ver) / 8);
  const shortBlocks = blocks - (raw % blocks);
  const shortLen = Math.floor(raw / blocks);
  const div = divisor(eccLen);
  const parts: number[][] = [];
  for (let i = 0, k = 0; i < blocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < shortBlocks ? 0 : 1));
    k += dat.length;
    const ecc = remainder(dat, div);
    if (i < shortBlocks) dat.push(0);
    parts.push(dat.concat(ecc));
  }
  const codewords: number[] = [];
  for (let i = 0; i < parts[0].length; i++) {
    parts.forEach((p, j) => { if (i !== shortLen - eccLen || j >= shortBlocks) codewords.push(p[i]); });
  }

  const size = ver * 4 + 17;
  const dark = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (x: number, y: number, on: boolean): void => { dark[y][x] = on; fixed[y][x] = true; };

  // Timing lines, the three finder squares, and the alignment squares.
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    }
  }
  const align: number[] = ver === 1 ? [] : [6, size - 7];
  for (const ax of align) {
    for (const ay of align) {
      if (fixed[ay][ax]) continue; // the corners with finder squares
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
  const format = (mask: number): void => {
    const d = (FORMAT[lvl] << 3) | mask;
    let rem = d;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const f = ((d << 10) | rem) ^ 0x5412;
    const bit = (i: number): boolean => ((f >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6));
    set(8, 8, bit(7));
    set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  format(0); // reserves its modules before the data goes in

  // The data, in pairs of columns zigzagging up and down from the right.
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const up = ((right + 1) & 2) === 0;
        const y = up ? size - 1 - v : v;
        if (!fixed[y][x] && i < codewords.length * 8) {
          dark[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
          i++;
        }
      }
    }
  }

  // Each of the eight masks, and keep the one with the lowest penalty.
  const MASKS: Array<(x: number, y: number) => boolean> = [
    (x, y) => (x + y) % 2 === 0,
    (_x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
  ];
  const flip = (m: number): void => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fixed[y][x] && MASKS[m](x, y)) dark[y][x] = !dark[y][x];
  };
  let best = 0;
  let lowest = Infinity;
  for (let m = 0; m < 8; m++) {
    flip(m);
    format(m);
    const p = penalty(dark);
    if (p < lowest) { lowest = p; best = m; }
    flip(m); // undo
  }
  flip(best);
  format(best);
  return { size, dark };
}

/** The standard's penalty rules: long runs, 2x2 blocks, finder look-alikes, and dark/light balance. */
function penalty (m: boolean[][]): number {
  const n = m.length;
  let score = 0;
  const line = (get: (i: number) => boolean): void => {
    let run = 1;
    for (let i = 1; i <= n; i++) {
      if (i < n && get(i) === get(i - 1)) run++;
      else { if (run >= 5) score += run - 2; run = 1; }
    }
    for (let i = 0; i + 7 <= n; i++) {
      const s = [0, 1, 2, 3, 4, 5, 6].map((k) => get(i + k));
      if (s[0] && !s[1] && s[2] && s[3] && s[4] && !s[5] && s[6]) score += 40;
    }
  };
  for (let y = 0; y < n; y++) line((x) => m[y][x]);
  for (let x = 0; x < n; x++) line((y) => m[y][x]);
  let darkCount = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (m[y][x]) darkCount++;
      if (x < n - 1 && y < n - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) score += 3;
    }
  }
  score += Math.floor(Math.abs(darkCount * 20 - n * n * 10) / (n * n)) * 10;
  return score;
}

/**
 * The code as SVG, `mm` wide including the quiet margin every code needs, at
 * (x, y). `hole` is how much of the middle to leave clear, as a share of the
 * code's width, for a picture on top; 0 for none.
 */
export function qrSvg (code: Qr, x: number, y: number, mm: number, ink: string, hole = 0): string {
  const quiet = 4;
  const cells = code.size + quiet * 2;
  const k = mm / cells;
  const mid = code.size / 2;
  const r = (code.size * hole) / 2;
  let d = '';
  for (let row = 0; row < code.size; row++) {
    for (let col = 0; col < code.size; col++) {
      if (!code.dark[row][col]) continue;
      if (hole && Math.hypot(col + 0.5 - mid, row + 0.5 - mid) < r + 0.7) continue;
      const px = +(x + (col + quiet) * k).toFixed(3);
      const py = +(y + (row + quiet) * k).toFixed(3);
      d += `M${px} ${py}h${+k.toFixed(3)}v${+k.toFixed(3)}h${-k.toFixed(3)}z`;
    }
  }
  // A hair of overlap between modules, so no white seams show between them.
  return `<rect x="${x}" y="${y}" width="${mm}" height="${mm}" fill="#fff"/><path d="${d}" fill="${ink}" stroke="${ink}" stroke-width="${+(k * 0.04).toFixed(3)}"/>`;
}
