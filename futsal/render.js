// Lager bilder til chatgruppa: node futsal/render.js [program|poeng|christmas]
// Lagdeling til Christmas Games: node futsal/render.js lag <antall lag> [spillere som er til stede...]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const dir = __dirname;
const data = JSON.parse(fs.readFileSync(process.env.FUTSAL_DATA || path.join(dir, 'data.json'), 'utf8'));

const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(dir, 'hif-logo.png')).toString('base64');

const DAGER = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
const MND = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
const d = s => new Date(s + 'T12:00:00');
const tall = n => String(Math.round(n * 10) / 10).replace('.', ',');
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
.tbl{width:100%;border-collapse:separate;border-spacing:0 10px;font-size:30px}
.tbl th{font-size:19px;letter-spacing:.08em;text-transform:uppercase;color:#C8A84B;font-weight:700;padding:0 10px;text-align:center;line-height:1.2}
.tbl th:nth-child(2){text-align:left}
.tbl td{background:rgba(255,255,255,.06);padding:16px 10px;text-align:center;font-variant-numeric:tabular-nums}
.tbl td:first-child{border-radius:16px 0 0 16px;width:70px;font-weight:800;color:#C8A84B}
.tbl td:last-child{border-radius:0 16px 16px 0;font-weight:800;font-size:36px;width:120px}
.tbl td.n{text-align:left;font-weight:600}
.tbl td.z{color:rgba(255,255,255,.3)}
.tbl tr.top td{background:rgba(200,168,75,.16)}
.xmas .tbl th{color:#f08a8a}
.xmas .tbl td:first-child{color:#f08a8a}
.xmas .tbl tr.top td{background:rgba(214,69,69,.2)}
.info{font-size:24px;opacity:.75;margin-bottom:14px}
.res{display:grid;gap:8px;margin-bottom:26px}
.res .m{background:rgba(255,255,255,.06);border-radius:14px;padding:12px 20px}
.res .s{font-weight:800;width:90px;text-align:right}
.lagkort{background:rgba(214,69,69,.14);border-left:8px solid #d64545;border-radius:22px;padding:24px 30px;margin-bottom:18px}
.lagkort h2{font-size:34px;margin-bottom:10px}
.lagkort h2 span{font-size:22px;opacity:.6;font-weight:600}
.lagkort .sp{font-size:30px;line-height:1.5}
footer{margin-top:30px;text-align:center;opacity:.55;font-size:20px;letter-spacing:.08em}
`;

function page(eyebrow, title, inner, klasse = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="wrap ${klasse}">
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

// Sum per spiller. Alle i spillerlista vises, også de med 0 poeng.
function summer(rader, felt) {
  const sum = {};
  for (const navn of data.spillere || []) sum[navn] = Object.fromEntries(felt.map(f => [f, 0]));
  for (const [navn, verdier] of rader) {
    sum[navn] ??= Object.fromEntries(felt.map(f => [f, 0]));
    for (const f of felt) sum[navn][f] += verdier[f] || 0;
  }
  return Object.entries(sum).map(([navn, v]) => ({ navn, ...v }));
}

// Rangert tabell; like poeng gir lik plass.
function tabell(liste, kolonner, totalt) {
  liste.sort((a, b) => totalt(b) - totalt(a) || a.navn.localeCompare(b.navn, 'no'));
  let plass = 0;
  const rader = liste.map((r, i) => {
    if (i === 0 || totalt(r) !== totalt(liste[i - 1])) plass = i + 1;
    const celler = kolonner.map(k => `<td class="${r[k.felt] ? '' : 'z'}">${tall(r[k.felt])}</td>`).join('');
    return `<tr class="${plass <= 3 && totalt(r) > 0 ? 'top' : ''}"><td>${plass}.</td><td class="n">${esc(r.navn)}</td>${celler}<td>${tall(totalt(r))}</td></tr>`;
  }).join('');
  return `<table class="tbl"><tr><th></th><th>Spiller</th>${kolonner.map(k => `<th>${k.tittel}</th>`).join('')}<th>Poeng</th></tr>${rader}</table>`;
}

const KAMPFELT = [
  { felt: 'mål', tittel: 'Mål' },
  { felt: 'assist', tittel: 'Assist' },
  { felt: 'matchavgjørende', tittel: 'Match&shy;avgj.' },
  { felt: 'øyeblikk', tittel: 'Kampens øyeblikk' },
];

function poeng() {
  const spilt = data.kamper.filter(k => k.resultat);
  const rader = spilt.flatMap(k => Object.entries(k.poeng || {}));
  const verdi = data.poengverdier;
  const liste = summer(rader, KAMPFELT.map(k => k.felt));
  const totalt = r => KAMPFELT.reduce((s, k) => s + r[k.felt] * verdi[k.felt], 0);
  const res = spilt.map(k => `<div class="m"><span class="t">${d(k.dato).getDate()}.${d(k.dato).getMonth() + 1}</span><span class="v">${lagNavn(k.hjemme)} – ${lagNavn(k.borte)}</span><span class="s">${esc(k.resultat)}</span></div>`).join('');
  return page('Haugsbygd J17 · Futsal', 'Matchpoeng',
    `<div class="info">${spilt.length} ${spilt.length === 1 ? 'kamp' : 'kamper'} spilt</div><div class="res">${res}</div>` + tabell(liste, KAMPFELT, totalt));
}

function christmas() {
  const konk = data.christmasGames.konkurranser;
  const liste = summer(konk.flatMap(k => Object.entries(k.poeng).map(([navn, p]) => [navn, { poeng: p }])), ['poeng']);
  const okter = new Set(konk.map(k => k.dato)).size;
  return page('Haugsbygd J17 · Futsal', '🎄 Christmas Games',
    `<div class="info">${okter} ${okter === 1 ? 'økt' : 'økter'} · ${konk.length} konkurranser</div>` + tabell(liste, [], r => r.poeng), 'xmas');
}

// Slangetrekning etter Christmas Games-stillingen, så lagene blir jevne.
function lag() {
  const [antall, ...tilStede] = process.argv.slice(3);
  const n = Number(antall) || 2;
  const stilling = {};
  for (const k of data.christmasGames.konkurranser)
    for (const [navn, p] of Object.entries(k.poeng)) stilling[navn] = (stilling[navn] || 0) + p;
  const spillere = (tilStede.length ? tilStede : data.spillere)
    .map(navn => ({ navn, p: stilling[navn] || 0, r: Math.random() }))
    .sort((a, b) => b.p - a.p || a.r - b.r);
  const lagListe = Array.from({ length: n }, () => []);
  spillere.forEach((s, i) => {
    const runde = Math.floor(i / n), pos = i % n;
    lagListe[runde % 2 ? n - 1 - pos : pos].push(s);
  });
  const kort = lagListe.map((l, i) => `<div class="lagkort"><h2>Lag ${i + 1} <span>· ${tall(l.reduce((s, x) => s + x.p, 0))} poeng</span></h2><div class="sp">${l.map(x => esc(x.navn)).join(', ')}</div></div>`).join('');
  return page('Haugsbygd J17 · Christmas Games', 'Lag', kort, 'xmas');
}

const typer = { program, poeng, christmas, lag };

(async () => {
  const valg = process.argv.slice(2);
  const navn = valg[0] === 'lag' ? ['lag'] : valg.length ? valg : ['program', 'poeng', 'christmas'];
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
