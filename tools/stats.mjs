#!/usr/bin/env node
// Laporan progres pengisian bab.
// Jalankan: node tools/stats.mjs [path-file-bab]
// Default file: data/bab-02.json

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const target = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : resolve(projectRoot, "data/bab-01.json");

let data;
try {
  data = JSON.parse(readFileSync(target, "utf8"));
} catch (e) {
  console.error("Tidak bisa membaca / parse file: " + target);
  console.error(String(e.message || e));
  process.exit(2);
}

const sloka = Array.isArray(data.sloka) ? data.sloka : [];
const total = sloka.length;

const isFilled = (v) => typeof v === "string" && v.trim().length > 0;

// Hitung terisi per field teks
const fields = ["devanagari", "iast", "id", "ban", "en"];
const filledPerField = Object.fromEntries(fields.map((f) => [f, 0]));

// Hitung status
const statuses = ["kosong", "draf", "review", "final"];
const statusCount = {
  id: Object.fromEntries(statuses.map((s) => [s, 0])),
  ban: Object.fromEntries(statuses.map((s) => [s, 0])),
  en: Object.fromEntries(statuses.map((s) => [s, 0])),
};

const kosongId = [];
const kosongBan = [];
const kosongEn = [];

for (const s of sloka) {
  for (const f of fields) if (isFilled(s[f])) filledPerField[f]++;

  const sid = s.status && s.status.id;
  const sban = s.status && s.status.ban;
  const sen = s.status && s.status.en;
  if (statuses.includes(sid)) statusCount.id[sid]++;
  if (statuses.includes(sban)) statusCount.ban[sban]++;
  if (statuses.includes(sen)) statusCount.en[sen]++;

  if (!isFilled(s.id)) kosongId.push(s.no);
  if (!isFilled(s.ban)) kosongBan.push(s.no);
  if (!isFilled(s.en)) kosongEn.push(s.no);
}

const pct = (n) => (total ? ((n / total) * 100).toFixed(1) : "0.0") + "%";
const bar = (n) => {
  const width = 24;
  const filled = total ? Math.round((n / total) * width) : 0;
  return "[" + "#".repeat(filled) + "-".repeat(width - filled) + "]";
};

const rel = relative(process.cwd(), target) || target;

console.log("=".repeat(52));
console.log(`Progres pengisian — ${rel}`);
console.log(`Bab ${data.bab ?? "?"} · jumlah_sloka: ${data.jumlah_sloka ?? "?"} · entri: ${total}`);
console.log("=".repeat(52));

console.log("\nTerisi per field:");
for (const f of fields) {
  console.log(`  ${f.padEnd(11)} ${bar(filledPerField[f])} ${String(filledPerField[f]).padStart(3)}/${total}  ${pct(filledPerField[f])}`);
}

console.log("\nStatus terjemahan Indonesia (id):");
for (const s of statuses) {
  console.log(`  ${s.padEnd(8)} ${String(statusCount.id[s]).padStart(3)}`);
}
console.log("\nStatus terjemahan Bali (ban):");
for (const s of statuses) {
  console.log(`  ${s.padEnd(8)} ${String(statusCount.ban[s]).padStart(3)}`);
}
console.log("\nStatus terjemahan Inggris (en):");
for (const s of statuses) console.log(`  ${s.padEnd(8)} ${String(statusCount.en[s]).padStart(3)}`);

console.log("\nProgres terjemahan:");
console.log(`  id   ${bar(filledPerField.id)}  ${pct(filledPerField.id)}`);
console.log(`  ban  ${bar(filledPerField.ban)}  ${pct(filledPerField.ban)}`);
console.log(`  en   ${bar(filledPerField.en)}  ${pct(filledPerField.en)}`);

const printList = (label, arr) => {
  console.log(`\n${label} (${arr.length}):`);
  if (arr.length === 0) {
    console.log("  — tidak ada, semua terisi —");
  } else {
    // cetak per baris, dibungkus rapi
    const lines = [];
    for (let i = 0; i < arr.length; i += 16) {
      lines.push("  " + arr.slice(i, i + 16).join(", "));
    }
    console.log(lines.join("\n"));
  }
};

printList("Sloka dengan field id masih kosong", kosongId);
printList("Sloka dengan field ban masih kosong", kosongBan);
printList("Sloka dengan field en masih kosong", kosongEn);

// Peringatan sumber
const sumber = data.sumber || {};
const sumberKosong = ["sanskrit", "terjemahan_id", "terjemahan_ban", "terjemahan_en"].filter(
  (k) => !isFilled(sumber[k])
);
if (sumberKosong.length) {
  console.log(`\n! Sumber belum diisi: ${sumberKosong.join(", ")} — WAJIB diisi sebelum publikasi.`);
}
console.log("");
