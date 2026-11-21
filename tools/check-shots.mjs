// Verify PNG screenshot dimensions (1280x480), byte cap (<=262144), and count (3-4).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const MAX_BYTES = 262144;
const REQ_WIDTH = 1280;
const REQ_HEIGHT = 480;

const targetDir = resolve(process.argv[2] || 'screenshots');
let entries;
try {
  entries = readdirSync(targetDir).filter((name) => name.toLowerCase().endsWith('.png')).sort();
} catch (err) {
  console.error(`FAIL cannot read directory ${targetDir}: ${err.message}`);
  process.exit(1);
}

let failed = false;
if (entries.length < 3 || entries.length > 4) {
  console.error(`FAIL count=${entries.length} (expected 3-4 PNGs in ${targetDir})`);
  failed = true;
}

for (const name of entries) {
  const full = join(targetDir, name);
  const size = statSync(full).size;
  const buf = readFileSync(full);
  const reasons = [];

  if (size > MAX_BYTES) {
    reasons.push(`size ${size} > ${MAX_BYTES}`);
  }
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIG)) {
    reasons.push('invalid PNG signature');
  } else if (buf.subarray(12, 16).toString('ascii') !== 'IHDR') {
    reasons.push('missing IHDR chunk');
  } else {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width !== REQ_WIDTH || height !== REQ_HEIGHT) {
      reasons.push(`dimensions ${width}x${height} !== ${REQ_WIDTH}x${REQ_HEIGHT}`);
    }
    if (reasons.length === 0) {
      console.log(`PASS ${name} ${width}x${height} ${size}B`);
      continue;
    }
  }

  failed = true;
  console.log(`FAIL ${name} (${size}B): ${reasons.join('; ')}`);
}

if (failed) {
  process.exit(1);
}
