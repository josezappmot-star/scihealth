// ============================================================
//  SCIHEALTH — Pipeline de ingesta automática
//  Stack: Node.js · RSS · Gemini 2.0 Flash (gratis) · Supabase
//  Corre como cron job cada 30 min en Railway / Render
//  By TesJua
// ============================================================

const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "TU_KEY_AQUI",
  SUPABASE_URL:   process.env.SUPABASE_URL   || "TU_SUPABASE_URL",
  SUPABASE_KEY:   process.env.SUPABASE_KEY   || "TU_SUPABASE_ANON_KEY",
  MAX_PER_SOURCE: 8,
  TIMEOUT_MS:     8000,
  DELAY_MS:       1200,
};

// Fuentes de salud (originales)
const HEALTH_SOURCES = [
  { name:"PubMed — Salud general",  url:"https://pubmed.ncbi.nlm.nih.gov/rss/search/?term=health+science&format=abstract&count=10", category:"Investigación", color:"#1D9E75" },
  { name:"PubMed — Neurociencia",   url:"https://pubmed.ncbi.nlm.nih.gov/rss/search/?term=neuroscience+brain&format=abstract&count=10", category:"Neurociencia", color:"#7F77DD" },
  { name:"PubMed — Nutrición",      url:"https://pubmed.ncbi.nlm.nih.gov/rss/search/?term=nutrition+diet+health&format=abstract&count=10", category:"Nutrición", color:"#EF9F27" },
  { name:"PubMed — Genética",       url:"https://pubmed.ncbi.nlm.nih.gov/rss/search/?term=genetics+genomics+disease&format=abstract&count=10", category:"Genética", color:"#D4537E" },
  { name:"WHO — Noticias",          url:"https://www.who.int/rss-feeds/news-english.xml", category:"Salud global", color:"#378ADD" },
  { name:"NIH — Divulgación",       url:"https://www.nih.gov/news-events/feed.xml", category:"Divulgación", color:"#D85A30" },
];

// Nuevas fuentes de ciencia general y tecnología
const SCIENCE_TECH_SOURCES = [
  { name:"NASA — Espacio",               url:"https://www.nasa.gov/rss/dyn/breaking_news.rss", category:"Espacio", color:"#F9A8D4" },
  { name:"MIT Tech Review — IA",         url:"https://www.technologyreview.com/feed/", category:"Inteligencia Artificial", color:"#9333EA" },
  { name:"Ars Technica — Tecnología",    url:"https://feeds.arstechnica.com/arstechnica/index", category:"Tecnología", color:"#06B6D4" },
  { name:"Science — General",            url:"https://www.science.org/rss/news_current.xml", category:"Ciencia General", color:"#888888" },
  { name:"Nature — Física",             url:"https://www.nature.com/nphys.rss", category:"Física", color:"#EAB308" },
  { name:"Energy Gov — Energía",         url:"https://www.energy.gov/news/press-releases/rss.xml", category:"Energía", color:"#22C55E" },
  { name:"Robotics Trends",              url:"https://www.roboticstrends.com/rss.xml", category:"Robótica", color:"#EF4444" },
  { name:"Wired — Innovación",          url:"https://www.wired.com/feed/rss", category:"Tecnología", color:"#06B6D4" },
];

// Fuentes web para efemérides (scraping directo)
const EFEMERIDES_SOURCES = [
  { name:"National Geographic España — Efemérides", url:"https://historia.nationalgeographic.com.es/efemerides", type:"web", category:"Efemérides", color:"#D4A574" },
  { name:"Hechos Históricos",             url:"https://www.hechoshistoricos.es/",       type:"web", category:"Efemérides", color:"#8B7355" },
];

const SOURCES = [...HEALTH_SOURCES, ...SCIENCE_TECH_SOURCES, ...EFEMERIDES_SOURCES];

const CATEGORIES = [
  "Neurociencia","Genética","Nutrición","Oncología","Microbioma",
  "Salud mental","Cardiología","Inmunología","Divulgación","Salud global",
  "Investigación","Salud pública","Inteligencia Artificial","Tecnología",
  "Espacio","Física","Energía","Robótica","Ciencia General",
];

function parseRSS(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const get = (tag) => {
      const r = b.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"))
             || b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return r ? r[1].trim() : "";
    };
    const title = get("title"), link = get("link");
    if (title && link) items.push({ title, description: get("description") || get("summary"), link, pubDate: get("pubDate") || get("published") });
  }
  return items;
}

async function fetchWithTimeout(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), CONFIG.TIMEOUT_MS);
  try { const r = await fetch(url, { signal: ctrl.signal }); clearTimeout(t); return r.text(); }
  catch(e) { clearTimeout(t); throw e; }
}

// ── SCRAPING DE EFEMÉRIDES ──────────────────────────────
async function scrapeEphemeris(url) {
  try {
    const html = await fetchWithTimeout(url);
    const clean = (s) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g," ").replace(/&[a-z]+;/g,"").replace(/\s+/g," ").trim();
    const items = [];
    const today = new Date();
    const day = today.getDate();
    const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const month = monthNames[today.getMonth()];
    const datePattern = new RegExp(`\\b${day}\\s*de\\s*${month}\\b[^<]{20,200}`, "i");

    // Extrae todas las fechas del día de hoy
    let match;
    const tempHtml = html.replace(/<[^>]+>/g," ").replace(/\s+/g," ");
    if (datePattern.test(tempHtml)) {
      tempHtml.match(datePattern).forEach((ev) => {
        const title = clean(ev).slice(0,120);
        if (title.length > 30 && /\d{3,4}/.test(title)) {
          items.push({
            title: `Hoy ${day} de ${month}: ${title}`,
            description: `Efeméride del ${day} de ${month}: ${title}`,
            link: url,
            pubDate: today.toISOString()
          });
        }
      });
    }

    // Fallback: busca eventos con patrones de fecha
    if (!items.length) {
      const eventRegex = /(\d{1,2}\s+de\s+\w+\s*[:\-]\s*)([A-ZÁ-Ú][^\n<]{30,})/gi;
      let m;
      while ((m = eventRegex.exec(html)) !== null && items.length < 5) {
        const title = clean(m[2]);
        if (title.length > 30) {
          items.push({ title, description: `Efeméride histórica: ${title}`, link: url, pubDate: new Date().toISOString() });
        }
      }
    }

    // Fallback 2: busca párrafos con años históricos
    if (!items.length) {
      const pRegex = /<p[^>]*>([^<]{50,300})<\/p>/gi;
      let m;
      while ((m = pRegex.exec(html)) !== null && items.length < 5) {
        const text = clean(m[1]);
        if (/\b(1[5-9]\d{2}|20\d{2})\b/.test(text) && text.length > 50) {
          items.push({ title: text.slice(0,80), description: text, link: url, pubDate: new Date().toISOString() });
        }
      }
    }

    console.log(`  ${items.length} efemérides extraídas de ${url}`);
    return items.slice(0, 8);
  } catch(e) { console.warn(`  ⚠ Scraping fallido ${url}: ${e.message}`); return []; }
}

async function geminiProcess(title, desc) {
  const prompt = `Eres un divulgador científico bilingüe. Analiza este artículo y responde ÚNICAMENTE con JSON válido, sin texto ni markdown extra.

Título original: ${title}
Descripción: ${(desc||"").slice(0,600)}

Detecta automáticamente el idioma original del título (es o en).
Genera TODO el contenido en ESPAÑOL y en INGLÉS.

JSON requerido:
{
  "idioma_original": "es o en",
  "titulo_es": "título atractivo en español (máx 85 chars)",
  "titulo_en": "attractive title in English (max 85 chars)",
  "resumen_divulgacion": "explicación accesible para público general en español (100-140 palabras)",
  "resumen_divulgacion_en": "accessible explanation for general audience in English (100-140 words)",
  "resumen_tecnico": "resumen técnico para profesionales en español (140-180 palabras)",
  "resumen_tecnico_en": "technical summary for professionals in English (140-180 words)",
  "categoria": "una de: ${CATEGORIES.join(", ")}",
  "palabras_clave": ["kw1","kw2","kw3"],
  "nivel_evidencia": "preliminar | moderado | sólido",
  "es_relevante": true
}
Si NO es ciencia o tecnología relevante, pon "es_relevante": false.`;

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
    { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.3,maxOutputTokens:700} }) }
  );
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const d = await r.json();
  const raw = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return JSON.parse(raw.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim());
}

async function isDuplicate(url) {
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/articles?source_url=eq.${encodeURIComponent(url)}&select=id&limit=1`,
    { headers:{ apikey:CONFIG.SUPABASE_KEY, Authorization:`Bearer ${CONFIG.SUPABASE_KEY}` } });
  const d = await r.json();
  return Array.isArray(d) && d.length > 0;
}

async function save(article) {
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/articles`,
    { method:"POST", headers:{ "Content-Type":"application/json", apikey:CONFIG.SUPABASE_KEY,
        Authorization:`Bearer ${CONFIG.SUPABASE_KEY}`, Prefer:"return=minimal" },
      body: JSON.stringify(article) });
  return r.status !== 409;
}

async function runPipeline() {
  console.log(`\n🔬 SciHealth Pipeline · By TesJua · ${new Date().toISOString()}`);
  let newCount=0, skipped=0, errors=0;

  for (const src of SOURCES) {
    console.log(`\n📡 ${src.name}`);
    let items = [];
    try {
      if (src.type === "web") {
        items = await scrapeEphemeris(src.url);
      } else {
        const xml = await fetchWithTimeout(src.url);
        items = parseRSS(xml);
      }
    } catch(e) { console.warn(`  ⚠ Error: ${e.message}`); errors++; continue; }

    items = items.slice(0, CONFIG.MAX_PER_SOURCE);
    console.log(`  ${items.length} artículos encontrados`);

    for (const item of items) {
      try {
        if (await isDuplicate(item.link)) { skipped++; continue; }
        const ai = await geminiProcess(item.title, item.description);
        if (!ai.es_relevante) { skipped++; continue; }

        const saved = await save({
          titulo_es:              ai.titulo_es,
          titulo_en:              ai.titulo_en,
          titulo_original:        item.title,
          resumen_divulgacion:    ai.resumen_divulgacion,
          resumen_divulgacion_en: ai.resumen_divulgacion_en,
          resumen_tecnico:        ai.resumen_tecnico,
          resumen_tecnico_en:     ai.resumen_tecnico_en,
          categoria:              ai.categoria || src.category,
          palabras_clave:         ai.palabras_clave,
          nivel_evidencia:        ai.nivel_evidencia,
          source_name:            src.name,
          source_url:             item.link,
          source_color:           src.color,
          idioma_original:        ai.idioma_original || 'en',
          published_at:           item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          status:                 "pending",
          created_at:             new Date().toISOString(),
        });
        if (saved) { console.log(`  ✅ ${ai.titulo_es?.slice(0,60)}`); newCount++; }
        await new Promise(r => setTimeout(r, CONFIG.DELAY_MS));
      } catch(e) { console.error(`  ❌ ${e.message}`); errors++; }
    }
  }
  console.log(`\n📊 Resultado: ${newCount} nuevos · ${skipped} ignorados · ${errors} errores\n`);
}

runPipeline().catch(console.error);
