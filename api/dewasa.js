const categories = {
  pawiwahan: { jenis: 1, macam: "Upacara Pernikahan", label: "Pawiwahan / nganten" },
  pitra: { jenis: 1, macam: "Pitra Yadnya", label: "Pitra Yadnya / ngaben" },
  manusa: { jenis: 1, macam: "Manusa Yadnya", label: "Manusa Yadnya" },
  dewa: { jenis: 1, macam: "Dewa Yadnya", label: "Dewa Yadnya" },
  melaspas: { jenis: 1, macam: "Upacara Melaspas", label: "Melaspas" },
  rumah: { jenis: 5, macam: "Membangun Rumah", label: "Membangun rumah" },
  tempat_usaha: { jenis: 5, macam: "Membuat Tempat Usaha", label: "Membuat tempat usaha" },
  mulai_usaha: { jenis: 6, macam: "Mulai Membangun Usaha", label: "Memulai usaha" },
  pertanian: { jenis: 2, macam: "Bercocok Tanam", label: "Bercocok tanam" },
  padi: { jenis: 2, macam: "Menanam Padi, Jagung, Kacang-kacangan", label: "Menanam padi, jagung, atau kacang" }
};

function decodeHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function parseEntries(value) {
  const text = decodeHtml(value);
  if (!text || /tidak ditemukan/i.test(text)) return [];
  const matches = [...text.matchAll(/(\d{2}-\d{2}-\d{4})\.\s*([\s\S]*?)(?=\n\d{2}-\d{2}-\d{4}\.\s*|$)/g)];
  return matches.map((match) => {
    const detail = match[2].replace(/\s+/g, " ").trim();
    const separator = detail.indexOf(".");
    return {
      date: match[1].split("-").reverse().join("-"),
      name: separator === -1 ? detail : detail.slice(0, separator).trim(),
      description: separator === -1 ? "" : detail.slice(separator + 1).trim()
    };
  });
}

function parsePage(html) {
  const areas = [...html.matchAll(/<textarea[^>]*title="([^"]*)"[^>]*>([\s\S]*?)<\/textarea>/gi)];
  const result = { good: [], mixed: [], avoid: [] };
  areas.forEach((area) => {
    const title = decodeHtml(area[1]).toLowerCase();
    if (title.includes("dewasa ayu")) result.good = parseEntries(area[2]);
    else if (title.includes("dewasa dipakai")) result.mixed = parseEntries(area[2]);
    else if (title.includes("dewasa ala")) result.avoid = parseEntries(area[2]);
  });
  return result;
}

module.exports = async function handler(request, response) {
  const now = new Date();
  const categoryKey = String(request.query.category || "pawiwahan");
  const category = categories[categoryKey];
  const month = Number(request.query.month || now.getMonth() + 1);
  const year = Number(request.query.year || now.getFullYear());
  if (!category || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) {
    response.status(400).json({ error: "Parameter pencarian tidak valid." });
    return;
  }
  const source = new URL("https://kalenderbali.org/pilihdewasa.php");
  source.searchParams.set("bulan", String(month));
  source.searchParams.set("jenis", String(category.jenis));
  source.searchParams.set("macam", category.macam);
  source.searchParams.set("tahun", String(year));
  try {
    const upstream = await fetch(source, {
      headers: { "User-Agent": "Gita-Bali-Dewasa-Search/1.0" },
      signal: AbortSignal.timeout(9000)
    });
    if (!upstream.ok) throw new Error("Upstream " + upstream.status);
    const parsed = parsePage(await upstream.text());
    response.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");
    response.status(200).json({ category: categoryKey, label: category.label, month, year, source: source.toString(), ...parsed });
  } catch (error) {
    response.status(502).json({ error: "Data dewasa belum dapat dimuat. Silakan buka sumber lengkap.", source: source.toString() });
  }
};

module.exports.categories = categories;
module.exports.parsePage = parsePage;
