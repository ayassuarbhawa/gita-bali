#!/usr/bin/env node
// Validator bab Bhagawad Gita.
// Jalankan: node tools/validate.mjs [path-file-bab]
// Default file: data/bab-02.json
//
// Pengecekan:
//  - file valid UTF-8; laporkan karakter pengganti U+FFFD
//  - struktur cocok dengan schema (cek ringan, tanpa dependency)
//  - nomor sloka berurutan 1..N tanpa lompat / duplikat
//  - jumlah entri sloka cocok dengan jumlah_sloka
//  - diakritik IAST mencurigakan (karakter non-ASCII di field iast
//    yang bukan bagian dari set IAST yang sah)
//  - field "id" tidak boleh persis sama dengan field "iast"

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const target = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : resolve(projectRoot, "data/bab-01.json");

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// Set karakter IAST yang sah (huruf berdiakritik). Baris kombinasi
// mark juga diizinkan agar bentuk NFD (huruf + combining) tidak ikut
// terdeteksi sebagai mencurigakan.
const IAST_CHARS = new Set(
  Array.from("āīūṛṝḷḹēōṅñṭḍṇśṣṃṁḥ" + "ĀĪŪṚṜḶḸĒŌṄÑṬḌṆŚṢṂṀḤ")
);
const COMBINING = new Set(
  Array.from("̣̥̟̱̲́̄̃̇̈")
);
function suspiciousIast(s) {
  const bad = [];
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code < 128) continue; // ASCII selalu ok
    if (IAST_CHARS.has(ch)) continue;
    if (COMBINING.has(ch)) continue;
    bad.push(ch + " (U+" + code.toString(16).toUpperCase().padStart(4, "0") + ")");
  }
  return bad;
}

// --- Baca file & cek UTF-8 / U+FFFD ---
let raw;
try {
  const buf = readFileSync(target);
  raw = buf.toString("utf8");
} catch (e) {
  console.error("Tidak bisa membaca file: " + target);
  console.error(String(e.message || e));
  process.exit(2);
}

const ffCount = (raw.match(/�/g) || []).length;
if (ffCount > 0) {
  err(`Ditemukan ${ffCount} karakter pengganti U+FFFD (kemungkinan bukan UTF-8 valid / teks rusak).`);
}

// --- Parse JSON ---
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  err("JSON tidak valid: " + e.message);
  report();
}

// --- Cek struktur ringan ---
if (typeof data !== "object" || data === null) {
  err("Root harus berupa object.");
  report();
}
if (typeof data.bab !== "number") err('Field "bab" harus number.');
if (typeof data.jumlah_sloka !== "number") err('Field "jumlah_sloka" harus number.');
if (!data.judul || typeof data.judul !== "object") err('Field "judul" harus object.');
if (!data.sumber || typeof data.sumber !== "object") err('Field "sumber" harus object.');
if (!Array.isArray(data.sloka)) {
  err('Field "sloka" harus array.');
  report();
}

const validStatus = new Set(["kosong", "draf", "review", "final"]);

// --- Cek jumlah entri vs jumlah_sloka ---
if (data.sloka.length !== data.jumlah_sloka) {
  err(`Jumlah entri sloka (${data.sloka.length}) tidak cocok dengan jumlah_sloka (${data.jumlah_sloka}).`);
}

// --- Cek nomor berurutan tanpa lompat / duplikat ---
const seen = new Map();
for (let i = 0; i < data.sloka.length; i++) {
  const s = data.sloka[i];
  const idx = i + 1;
  if (typeof s !== "object" || s === null) {
    err(`sloka[${i}] bukan object.`);
    continue;
  }
  if (typeof s.no !== "number") {
    err(`sloka[${i}] tidak punya field "no" berupa number.`);
  } else {
    if (seen.has(s.no)) {
      err(`Nomor sloka duplikat: ${s.no} (di indeks ${seen.get(s.no)} dan ${i}).`);
    }
    seen.set(s.no, i);
    if (s.no !== idx) {
      err(`Nomor sloka tidak berurutan: harusnya ${idx}, ditemukan ${s.no} (indeks ${i}).`);
    }
  }

  // field wajib string
  for (const f of ["devanagari", "iast", "id", "catatan"]) {
    if (typeof s[f] !== "string") err(`sloka no ${s.no}: field "${f}" harus string.`);
  }
  if (!(typeof s.ban === "string" || s.ban === null)) {
    err(`sloka no ${s.no}: field "ban" harus string atau null.`);
  }
  if (!(typeof s.en === "string" || s.en === null)) {
    err(`sloka no ${s.no}: field "en" harus string atau null.`);
  }

  // status
  if (!s.status || typeof s.status !== "object") {
    err(`sloka no ${s.no}: field "status" harus object.`);
  } else {
    for (const k of ["id", "ban", "en"]) {
      if (!validStatus.has(s.status[k])) {
        err(`sloka no ${s.no}: status.${k} = "${s.status[k]}" bukan nilai sah (kosong|draf|review|final).`);
      }
    }
  }

  // diakritik IAST mencurigakan
  if (typeof s.iast === "string" && s.iast.length) {
    const bad = suspiciousIast(s.iast);
    if (bad.length) {
      warn(`sloka no ${s.no}: karakter non-IAST mencurigakan di field "iast": ${bad.join(", ")}`);
    }
  }

  // id == iast (indikasi salah paste)
  if (typeof s.id === "string" && typeof s.iast === "string" &&
      s.id.trim().length > 0 && s.id.trim() === s.iast.trim()) {
    err(`sloka no ${s.no}: field "id" persis sama dengan "iast" (indikasi salah paste).`);
  }
}

report();

function report() {
  const rel = relative(process.cwd(), target) || target;
  console.log(`Validasi: ${rel}`);
  console.log("");
  if (warnings.length) {
    console.log(`PERINGATAN (${warnings.length}):`);
    for (const w of warnings) console.log("  ! " + w);
    console.log("");
  }
  if (errors.length) {
    console.log(`ERROR (${errors.length}):`);
    for (const e of errors) console.log("  x " + e);
    console.log("");
    console.log("HASIL: GAGAL");
    process.exit(1);
  } else {
    console.log("HASIL: LOLOS" + (warnings.length ? " (dengan peringatan)" : ""));
    process.exit(0);
  }
}
