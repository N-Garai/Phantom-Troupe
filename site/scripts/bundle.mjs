/**
 * Builds site/public/phantom-troupe.zip — the one-click coffin.
 * Pure Node (zlib): no zip dependency, runs on Windows/macOS/Linux builders.
 * Also copies the two one-line installers into public/ so the hosted site
 * can serve them itself.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SITE = path.join(ROOT, "site");
const PUBLIC = path.join(SITE, "public");
const OUT = path.join(PUBLIC, "phantom-troupe.zip");

/* ---------------------------------------------------------------- crc32 --- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ------------------------------------------------------------- zip core --- */
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", ".agent", "roadmap", "dist-tmp", ".vercel"]);
function walk(dir, base) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push({ full, rel });
  }
  return out;
}

function zip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const u32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0); return b; };
  const u16 = (v) => { const b = Buffer.alloc(2); b.writeUInt16LE(v & 0xffff); return b; };

  for (const f of files) {
    const raw = fs.readFileSync(f.full);
    const name = Buffer.from(f.rel.split(path.sep).join("/"), "utf8");
    const crc = crc32(raw);
    const comp = zlib.deflateRawSync(raw, { level: 6 });
    const useDeflate = comp.length < raw.length;
    const body = useDeflate ? comp : raw;
    const method = useDeflate ? 8 : 0;

    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(method), u16(0), u16(0),
      u32(crc), u32(body.length), u32(raw.length),
      u16(name.length), u16(0), name,
    ]);
    chunks.push(local, body);
    central.push(
      Buffer.concat([
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(method), u16(0), u16(0),
        u32(crc), u32(body.length), u32(raw.length),
        u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name,
      ])
    );
    offset += local.length + body.length;
  }
  const cdSize = central.reduce((n, b) => n + b.length, 0);
  const end = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(cdSize), u32(offset), u16(0),
  ]);
  return Buffer.concat([...chunks, ...central, end]);
}

/* ---------------------------------------------------------------- main ---- */
const SKIP_FILES = new Set(["phantom-troupe.zip", "dev.log", "server.log"]);
const SKIP_GLOBS = [/\.env/, /\.log$/, /tsconfig\.tsbuildinfo/];

const dirs = [
  { dir: path.join(ROOT, "phantom-cli"), prefix: "phantom-troupe/phantom-cli", allowDist: true },
  { dir: SITE, prefix: "phantom-troupe/site", allowDist: false },
];
let files = [];
for (const { dir, prefix } of dirs) {
  for (const f of walk(dir, dir)) {
    if (SKIP_FILES.has(path.basename(f.rel)) || SKIP_GLOBS.some((g) => g.test(f.rel))) continue;
    files.push({ full: f.full, rel: `${prefix}/${f.rel.split(path.sep).join("/")}` });
  }
}
for (const extra of ["INSTALL.md", "README.md", "render.yaml", ".gitignore", ".github"]) {
  const full = path.join(ROOT, extra);
  if (fs.existsSync(full)) {
    if (fs.statSync(full).isDirectory()) for (const f of walk(full, full)) files.push({ full: f.full, rel: `phantom-troupe/${extra}/${f.rel.split(path.sep).join("/")}` });
    else files.push({ full, rel: `phantom-troupe/${extra}` });
  }
}

fs.mkdirSync(PUBLIC, { recursive: true });
fs.writeFileSync(OUT, zip(files));
const mb = (fs.statSync(OUT).size / 1048576).toFixed(2);
console.log(`[bundle] the coffin is nailed shut -> ${path.relative(ROOT, OUT)} (${mb} MB, ${files.length} files)`);

/* the hosted installers — copy so the landing page can serve its own one-liners */
for (const installer of ["install.sh", "install.ps1"]) {
  const src = path.join(ROOT, "phantom-cli", installer);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(PUBLIC, installer));
}
console.log("[bundle] install.sh + install.ps1 mirrored into site/public/");
