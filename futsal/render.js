// Lager bilder til chatgruppa: node futsal/render.js [program|poeng|christmas]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const dir = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(dir, 'data.json'), 'utf8'));

const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(dir, 'hif-logo.png')).toString('base64');

const DAGER = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
const MND = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
const d = s => new Date(s + 'T12:00:00');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;font-family:Inter,sans-serif;background:#0B2240;color:#fff}
.wrap{padding:56px 56px 48px;background:linear-gradient(170deg,#0B2240 0%,#1a3a5c 55%,#0B2240 100%)}
header{display:flex;align-items:center;gap:28px;margin-bottom:40px}
header img{height:150px;flex-shrink:0;filter:drop-shadow(0 4px 14px rgba(0,0,0,.4))}
.eyebrow{color:#C8A84B;font-weight:700;letter-spacing:.18em;text-transform:uppercase;font-size:24px}
h1{font-size:64px;font-weight:800;line-height:1.05}
.row{display:flex;gap:28px;background:rgba(255,255,255,.06);border-radius:22px;padding:26px 30px;margin-bottom:18px;border-left:8px solid rgba(255,255,255,.25)}
.row.kamp{border-left-color:#C8A84B;background:rgba(200,168,75,.12)}
.row.christmas{border-left-color:#d64545;background:rgba(214,69,69,.12)}
.date{width:130px;flex-shrink:0;text-align:center}
.date .dag{font-size:22px;text-transform:uppercase;letter-spacing:.1em;color:#C8A84B;font-weight:700}
.date .nr{font-size:58px;font-weight:800;line-height:1}
.date .mnd{font-size:22px;text-transform:uppercase;opacity:.75}
.body{flex:1;display:flex;flex-direction:column;justify-content:center}
.txt{font-size:32px;font-weight:600;line-height:1.3}
.tag{display:inline-block;font-size:20px;font-weight:700;padding:4px 14px;border-radius:999px;margin-bottom:10px;align-self:flex-start;letter-spacing:.06em;text-transform:uppercase}
.kamp .tag{background:#C8A84B;color:#0B2240}
.christmas .tag{background:#d64545}
.matches{margin-top:14px;display:grid;gap:8px}
.m{display:flex;gap:18px;font-size:26px;align-items:baseline}
.m .t{font-weight:800;color:#C8A84B;width:84px}
.m .v{flex:1}
.m .b{opacity:.7;font-size:22px}
.us{font-weight:800}
footer{margin-top:30px;text-align:center;opacity:.55;font-size:20px;letter-spacing:.08em}
`;

function page(eyebrow, title, inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="wrap">
<header><img src="${logo}"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1></div></header>
${inner}<footer>HAUGSBYGD J17 · FUTSAL</footer></div></body></html>`;
}

const lagNavn = n => n === data.lag ? `<span class="us">${esc(n)}</span>` : esc(n);

function program() {
  const rows = data.program.map(p => {
    const dt = d(p.dato);
    const tag = p.type === 'kamp' ? `<span class="tag">Kampdag · runde ${p.runde}</span>`
      : p.type === 'christmas' ? `<span class="tag">🎄 Christmas Games</span>` : '';
    const kamper = p.type === 'kamp' ? `<div class="matches">${data.kamper.filter(k => k.dato === p.dato).map(k =>
      `<div class="m"><span class="t">${k.tid}</span><span class="v">${lagNavn(k.hjemme)} – ${lagNavn(k.borte)}</span><span class="b">${esc(k.bane.replace('Drammenshallen ', 'Hall '))}</span></div>`).join('')}</div>` : '';
    return `<div class="row ${p.type || ''}"><div class="date"><div class="dag">${DAGER[dt.getDay()].slice(0, 3)}</div><div class="nr">${dt.getDate()}</div><div class="mnd">${MND[dt.getMonth()]}</div></div>
<div class="body">${tag}<div class="txt">${esc(p.tekst)}</div>${kamper}</div></div>`;
  }).join('');
  const kampdag = data.program.some(p => p.type === 'kamp');
  return page('Haugsbygd J17 · Futsal', 'Program', rows + (kampdag ? '<footer style="opacity:.8">Kamper i Drammenshallen</footer>' : ''));
}

const typer = { program };

(async () => {
  const valg = process.argv.slice(2);
  const navn = valg.length ? valg : Object.keys(typer);
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1080, height: 800 }, deviceScaleFactor: 1 });
  for (const n of navn) {
    if (!typer[n]) { console.error('Ukjent type: ' + n); continue; }
    await pg.setContent(typer[n]());
    const out = path.join(dir, n + '.png');
    await pg.screenshot({ path: out, fullPage: true });
    console.log('Lagret ' + out);
  }
  await browser.close();
})();
