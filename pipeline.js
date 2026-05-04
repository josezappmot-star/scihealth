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

// Fuentes de salud (URLs REALES que sí funcionan)
const HEALTH_SOURCES = [
  { name:"World Health Organization",  url:"https://www.who.int/rss-feeds/news-english.xml", category:"Salud global", color:"#378ADD" },
  { name:"NIH News",              url:"https://www.nih.gov/news-events/news-releases/rss.xml", category:"Divulgación", color:"#D85A30" },
  { name:"Medical News Today",    url:"https://www.medicalnewstoday.com/rss", category:"Salud general", color:"#1D9E75" },
];

// Fuentes de ciencia, tecnología e innovación (URLs REALES)
const SCIENCE_TECH_SOURCES = [
  { name:"NASA News",             url:"https://www.nasa.gov/rss/dyn/breaking_news.rss", category:"Espacio", color:"#F9A8D4" },
  { name:"Science Magazine",       url:"https://www.science.org/rss/news_current.xml", category:"Ciencia General", color:"#888888" },
  { name:"Nature News",           url:"https://www.nature.com/nature/articles.rss", category:"Ciencia General", color:"#EAB308" },
  { name:"Ars Technica",         url:"https://feeds.arstechnica.com/arstechnica/index.xml", category:"Tecnología", color:"#06B6D4" },
  { name:"The Conversation ES",     url:"https://theconversation.com/es/rss", category:"Divulgación", color:"#E3173B" },
  { name:"Agencia SINC",         url:"https://www.agenciasinc.es/rss", category:"Ciencia General", color:"#0077B5" },
  { name:"Wired",                url:"https://www.wired.com/feed/rss", category:"Tecnología", color:"#06B6D4" },
  { name:"MIT Technology Review", url:"https://www.technologyreview.com/feed/", category:"Inteligencia Artificial", color:"#9333EA" },
];

// Fuentes web para efemérides (scraping directo)
const EFEMERIDES_SOURCES = [
  { name:"National Geographic España", url:"https://historia.nationalgeographic.com.es/efemerides", type:"web", category:"Efemérides", color:"#D4A574" },
  { name:"Hechos Historicos",      url:"https://www.hechoshistoricos.es/",       type:"web", category:"Efemérides", color:"#8B7355" },
];

// Fuentes de ciencia, tecnología e innovación (URLs REALES)
const SCIENCE_TECH_SOURCES = [
  { name:"NASA News",             url:"https://www.nasa.gov/rss/dyn/breaking_news.rss", category:"Espacio", color:"#F9A8D4" },
  { name:"Science Magazine",       url:"https://www.science.org/rss/news_current.xml", category:"Ciencia General", color:"#888888" },
  { name:"Nature News",           url:"https://www.nature.com/nature/articles.rss", category:"Ciencia General", color:"#EAB308" },
  { name:"Ars Technica",         url:"https://feeds.arstechnica.com/arstechnica/index", category:"Tecnología", color:"#06B6D4" },
  { name:"The Conversation ES",    url:"https://theconversation.com/es/rss", category:"Divulgación", color:"#E3173B" },
  { name:"Agencia SINC",         url:"https://www.agenciasinc.es/rss", category:"Ciencia General", color:"#0077B5" },
  { name:"Wired",                url:"https://www.wired.com/feed/rss", category:"Tecnología", color:"#06B6D4" },
  { name:"MIT Technology Review", url:"https://www.technologyreview.com/feed/", category:"Inteligencia Artificial", color:"#9333EA" },
];

// Fuentes de ciencia, tecnología e innovación (URLs verificadas)
const SCIENCE_TECH_SOURCES = [
  { name:"NASA — Espacio",           url:"https://www.nasa.gov/rss/dyn/breaking_news.rss", category:"Espacio", color:"#F9A8D4" },
  { name:"Science — News",          url:"https://www.science.org/rss/news_current.xml", category:"Ciencia General", color:"#888888" },
  { name:"Nature — News",          url:"https://www.nature.com/nature/articles.rss", category:"Ciencia General", color:"#EAB308" },
  { name:"Ars Technica — Tech",    url:"https://feeds.arstechnica.com/arstechnica/index", category:"Tecnología", color:"#06B6D4" },
  { name:"The Conversation ES",     url:"https://theconversation.com/es/rss", category:"Divulgación", color:"#E3173B" },
  { name:"Agencia SINC",          url:"https://www.agenciasinc.es/rss", category:"Ciencia General", color:"#0077B5" },
  { name:"Wired — Tech",           url:"https://www.wired.com/feed/rss", category:"Tecnología", color:"#06B6D4" },
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
  // Nuevas fuentes solicitadas (RSS)
  { name:"The Conversation España", url:"https://theconversation.com/es/rss", category:"Divulgación", color:"#E3173B" },
  { name:"Agencia SINC",           url:"https://www.agenciascinc.es/rss",     category:"Ciencia General", color:"#0077B5" },
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

// ── SCRAPING DE EFEMÉRIDES (SOLO DÍA ACTUAL) ─────────
async function scrapeEphemeris(url) {
  try {
    const html = await fetchWithTimeout(url);
    const clean = (s) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g," ").replace(/&[a-z]+;/g,"").replace(/\s+/g," ").trim();
    const today = new Date();
    const day = today.getDate();
    const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const month = monthNames[today.getMonth()];
    const items = [];

    // Busca: "3 de mayo: texto" o "3 de mayo — texto" (solo día actual)
    const todayPattern = new RegExp(`\\b${day}\\s+de\\s+${month}\\b[^<]{20,300}`, "i");
    const tempHtml = html.replace(/<[^>]+>/g," ").replace(/\s+/g," ");
    
    if (todayPattern.test(tempHtml)) {
      const matches = tempHtml.match(new RegExp(`\\b${day}\\s+de\\s+${month}\\b[^.]{20,300}`, "gi"));
      if (matches) {
        matches.forEach((ev) => {
          const title = clean(ev).slice(0,150);
          if (title.length > 30 && /\d{3,4}/.test(title)) {
            items.push({
              title: `Hoy ${day} de ${month}: ${title}`,
              description: `Efeméride histórica del ${day} de ${month}: ${title}`,
              link: url,
              pubDate: today.toISOString()
            });
          }
        });
      }
    }

    // Fallback: busca patrones "día de mes" + texto
    if (!items.length) {
      const eventRegex = new RegExp(`(${day}\\s+de\\s+${month}[^<]{20,200})`, "gi");
      let m;
      while ((m = eventRegex.exec(html)) !== null && items.length < 5) {
        const title = clean(m[1]);
        if (title.length > 30) {
          items.push({
            title: `Hoy ${day} de ${month}: ${title}`,
            description: `Efeméride del ${day} de ${month}: ${title}`,
            link: url,
            pubDate: today.toISOString()
          });
        }
      }
    }

    console.log(`  ${items.length} efemérides extraídas para hoy (${day} de ${month}) de ${url}`);
    return items.slice(0, 5);
  } catch(e) { console.warn(`  ⚠ Scraping fallido ${url}: ${e.message}`); return []; }
}

// ── SCRAPING DE NOTICIAS WEB (The Conversation, SINC - SIN filtro de fecha) ─────────
async function scrapeWebContent(url, category) {
  try {
    const html = await fetchWithTimeout(url);
    const clean = (s) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g," ").replace(/&[a-z]+;/g,"").replace(/\s+/g," ").trim();
    const items = [];

    // Busca encabezados (h1, h2, h3) con contenido sustancioso
    const titleRegex = /<h[1-3][^>]*>([^<]{20,120})<\/h[1-3]>/gi;
    let m;
    while ((m = titleRegex.exec(html)) !== null && items.length < 10) {
      const title = clean(m[1]);
      if (title.length > 30 && !title.match(/menu|nav|footer|header|inicio|home/i)) {
        items.push({
          title: title,
          description: `Noticia de ${category}: ${title}`,
          link: url,
          pubDate: new Date().toISOString()
        });
      }
    }

    // Fallback: busca enlaces con títulos significativos (ignora imágenes)
    if (!items.length) {
      const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([^<]{30,100})<\/a>/gi;
      while ((m = linkRegex.exec(html)) !== null && items.length < 10) {
        const title = clean(m[2]);
        const href = m[1];
        if (title.length > 30 && href.startsWith("http") && !href.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip)$/i)) {
          items.push({
            title: title,
            description: `Artículo: ${title}`,
            link: href,
            pubDate: new Date().toISOString()
          });
        }
      }
    }

    console.log(`  ${items.length} artículos extraídos de ${url}`);
    return items.slice(0, 8);
  } catch(e) { console.warn(`  ⚠ Scraping fallido ${url}: ${e.message}`); return []; }
}
        });
      }
    }

    // Fallback: busca coincidencias exactas tipo "3 de mayo" + texto
    if (!items.length) {
      const eventRegex = new RegExp(`(${day}\\s+de\\s+${month}[^<]{20,200})`, "gi");
      let m;
      while ((m = eventRegex.exec(html)) !== null && items.length < 5) {
        const title = clean(m[1]);
        if (title.length > 30) {
          items.push({
            title: `Hoy ${day} de ${month}: ${title}`,
            description: `Efeméride del ${day} de ${month}: ${title}`,
            link: url,
            pubDate: today.toISOString()
          });
        }
      }
    }

    // Fallback 2: busca elementos <li> con la fecha de hoy
    if (!items.length) {
      const liRegex = new RegExp(`<li[^>]*>.*?${day}\\s+de\\s+${month}.*?<\\/li>`, "gi");
      let m;
      while ((m = liRegex.exec(html)) !== null && items.length < 5) {
        const text = clean(m[0]);
        if (text.length > 30) {
          items.push({
            title: `Hoy ${day} de ${month}: ${text.slice(0,100)}`,
            description: text,
            link: url,
            pubDate: today.toISOString()
          });
        }
      }
    }

    console.log(`  ${items.length} efemérides extraídas para hoy (${day} de ${month}) de ${url}`);
    return items.slice(0, 5);
  } catch(e) { console.warn(`  ⚠ Scraping fallido ${url}: ${e.message}`); return []; }
}
    }

    // Fallback: busca enlaces con títulos significativos (ignora imágenes)
    if (!items.length) {
      const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([^<]{30,100}<\/a>/gi;
      while ((m = linkRegex.exec(html)) !== null && items.length < 10) {
        const title = clean(m[2]);
        const href = m[1];
        // Ignora enlaces a imágenes o archivos binarios
        if (title.length > 30 && href.startsWith("http") && !href.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip)$/i)) {
          items.push({
            title: title,
            description: `Artículo: ${title}`,
            link: href,
            pubDate: new Date().toISOString()
          });
        }
      }
    }
      }
    }

    // Fallback 2: busca párrafos con contenido sustancioso
    if (!items.length) {
      const pRegex = /<p[^>]*>([^<]{60,300})<\/p>/gi;
      while ((m = pRegex.exec(html)) !== null && items.length < 8) {
        const text = clean(m[1]);
        if (text.length > 60) {
          items.push({
            title: text.slice(0,80),
            description: text,
            link: url,
            pubDate: new Date().toISOString()
          });
        }
      }
    }

    console.log(`  ${items.length} artículos extraídos de ${url}`);
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
        items = await scrapeWebContent(src.url, src.category);
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
