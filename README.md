# SciHealth — Ciencia y tecnología que importa · By TesJua

## Descripción
SciHealth es una plataforma de divulgación científica y tecnológica creada por **TesJua**. Conecta a los usuarios con las mejores fuentes de noticias científicas e innovación tecnológica del mundo: PubMed, NASA, MIT Technology Review, Nature, Science, Wired, Ars Technica, y más.

## Archivos del proyecto

```
scihealth/
├── backend/
│   ├── pipeline.js     ← Pipeline de ingesta (Node.js) · By TesJua
│   └── schema.sql      ← Schema de base de datos
└── frontend/
    ├── index.html      ← App pública (feed tipo slide) · By TesJua
    └── admin.html      ← Panel superadmin · By TesJua
```

---

## Paso 1 — Supabase (base de datos gratis)

1. Ve a https://supabase.com → "New project"
2. Anota: **Project URL** y estas 2 keys:
   - `anon public` → para `index.html` y `pipeline.js`
   - `service_role` → para `admin.html` (NUNCA la expongas en el frontend público)
3. SQL Editor → copia y ejecuta `backend/schema.sql` completo

---

## Paso 2 — Gemini API (IA gratuita)

1. Ve a https://ai.google.dev → "Get API key"
2. Plan gratuito: 15 RPM · 1M tokens/día — más que suficiente para empezar
3. Guarda tu key para el paso 3

---

## Paso 3 — Configurar variables

### En `backend/pipeline.js`, reemplaza:
```js
GEMINI_API_KEY: "TU_KEY_AQUI"        // de ai.google.dev
SUPABASE_URL:   "TU_SUPABASE_URL"    // ej: https://xxx.supabase.co
SUPABASE_KEY:   "TU_SUPABASE_ANON_KEY"
```

### En `frontend/index.html`, reemplaza:
```js
const SUPABASE_URL = "TU_SUPABASE_URL";
const SUPABASE_KEY = "TU_SUPABASE_ANON_KEY";
```

### En `frontend/admin.html`, reemplaza:
```js
const SUPABASE_URL = "TU_SUPABASE_URL";
const SUPABASE_KEY = "TU_SUPABASE_SERVICE_ROLE_KEY"; // ← service_role
```

---

## Paso 4 — Correr el pipeline localmente

```bash
# Instalar Node.js 18+ si no lo tienes
node --version

# En la carpeta backend/
node pipeline.js

# Deberías ver:
# 🔬 SciHealth Pipeline · By TesJua · 2025-...
# 📡 PubMed — Salud general
#   ✅ Título del artículo...
```

---

## Paso 5 — Deploy del pipeline (cron job gratis)

### Opción A: Railway (recomendado)
1. https://railway.app → New Project → Deploy from GitHub
2. Variables de entorno: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_KEY
3. En `railway.json` agrega cron: `"cronSchedule": "*/30 * * * *"` (cada 30 min)

### Opción B: Render
1. https://render.com → New Cron Job
2. Build: `npm install` · Run: `node pipeline.js`
3. Schedule: `*/30 * * * *`

### Opción C: GitHub Actions (totalmente gratis)
Crea `.github/workflows/pipeline.yml`:
```yaml
name: SciHealth Pipeline · By TesJua
on:
  schedule:
    - cron: '*/30 * * * *'
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: node backend/pipeline.js
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          SUPABASE_URL:   ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY:   ${{ secrets.SUPABASE_KEY }}
```

---

## Paso 6 — Deploy del frontend

### Opción A: Vercel (recomendado, gratis)
1. https://vercel.com → New Project → sube la carpeta `frontend/`
2. `index.html` → tu app pública
3. `admin.html` → accede solo tú en `/admin.html`

### Opción B: Netlify (gratis)
1. https://netlify.com → drag & drop de la carpeta `frontend/`

### Opción C: GitHub Pages (gratis)
1. Sube a un repo → Settings → Pages → branch main

---

## Fuentes configuradas
### Salud:
- PubMed (Salud general, Neurociencia, Nutrición, Genética)
- OMS (Noticias globales)
- NIH (Divulgación)

### Ciencia y tecnología:
- NASA (Noticias espaciales)
- MIT Technology Review (IA e innovación)
- Ars Technica (Tecnología general)
- Nature (Física y ciencia general)
- Science (Ciencia general)
- Wired (Innovación tecnológica)
- Energy.gov (Energía)
- Robotics Trends (Robótica)

---

## Flujo completo

```
[Cada 6h]
Pipeline → RSS (Salud, Ciencia, Tecnología) → Gemini (resume + clasifica) → Supabase

[Tiempo real]
Supabase → index.html (usuarios ven feed)
         → admin.html (tú apruebas/rechazas)
```

---

## Login del admin (demo)
- Email: admin@scihealth.com
- Contraseña: admin123

> Cambia esto por Supabase Auth real cuando tengas las variables configuradas.

---

## Costo total: $0/mes para empezar
- Supabase free: 500MB · 50k rows
- Gemini free: 1M tokens/día
- Railway/Render/Vercel: free tier
- Fuentes RSS: siempre gratis

---

**By TesJua** — Ciencia y tecnología que importa.
