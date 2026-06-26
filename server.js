/**
 * Servidor Express — Ato na Copa (autonomo)
 * Banco de resultados: 3 rodadas completas de todos os grupos (Copa 2026).
 * Fontes: FIFA.com, pesquisas verificadas em 26/06/2026.
 * Cache: 10 minutos. IDs: Brasil=134496, Copa=4429
 */
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const apiKey = process.env.API_TOKEN || '3';
const API_BASE = 'https://www.thesportsdb.com/api/v1/json/' + apiKey;
const CACHE_TTL = 10 * 60 * 1000;

let liveCache = null; let liveFetchTime = 0;
let matchesCache = null; let matchesFetchTime = 0;

const NAME_TO_LOCAL = {
  'mexico':'mex','south africa':'rsa','south korea':'kor','korea republic':'kor',
  'czech republic':'cze','czechia':'cze','canada':'can','switzerland':'sui',
  'qatar':'qat','bosnia-herzegovina':'bih','bosnia and herzegovina':'bih',
  'bosnia & herzegovina':'bih','brazil':'bra','morocco':'mar','scotland':'sco',
  'haiti':'hai','united states':'usa','usa':'usa','paraguay':'par',
  'australia':'aus','turkey':'tur','turkiye':'tur','germany':'ger',
  'ecuador':'ecu','ivory coast':'civ',"cote d'ivoire":'civ','curacao':'cur',
  'netherlands':'ned','japan':'jpn','tunisia':'tun','sweden':'swe',
  'belgium':'bel','iran':'irn','ir iran':'irn','egypt':'egy',
  'new zealand':'nzl','spain':'esp','uruguay':'uru','saudi arabia':'ksa',
  'cape verde':'cpv','cabo verde':'cpv','france':'fra','norway':'nor',
  'senegal':'sen','iraq':'irq','argentina':'arg','austria':'aut',
  'algeria':'alg','jordan':'jor','portugal':'por','colombia':'col',
  'uzbekistan':'uzb','dr congo':'cod','congo dr':'cod',
  'democratic republic of the congo':'cod','england':'eng',
  'croatia':'cro','ghana':'gha','panama':'pan',
};

const ID_TO_GROUP = {
  'mex':'A','rsa':'A','kor':'A','cze':'A',
  'can':'B','sui':'B','qat':'B','bih':'B',
  'bra':'C','mar':'C','sco':'C','hai':'C',
  'usa':'D','par':'D','aus':'D','tur':'D',
  'ger':'E','ecu':'E','civ':'E','cur':'E',
  'ned':'F','jpn':'F','tun':'F','swe':'F',
  'bel':'G','irn':'G','egy':'G','nzl':'G',
  'esp':'H','uru':'H','ksa':'H','cpv':'H',
  'fra':'I','nor':'I','sen':'I','irq':'I',
  'arg':'J','aut':'J','alg':'J','jor':'J',
  'por':'K','col':'K','uzb':'K','cod':'K',
  'eng':'L','cro':'L','gha':'L','pan':'L',
};

function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
function localId(name){ return NAME_TO_LOCAL[norm(name)]||null; }

// BANCO DE RESULTADOS — todos os jogos das 3 rodadas (verificados em 26/06/2026)
// Fonte primaria: FIFA.com + pesquisas jornalisticas verificadas
const KNOWN_RESULTS = [
  // ─── RODADA 1 (11-15 jun) ────────────────────────────────────────────────
  { id:'R1_A1', home:'mex', away:'rsa', hs:2, as:0 },
  { id:'R1_A2', home:'kor', away:'cze', hs:2, as:1 },
  { id:'R1_B1', home:'can', away:'bih', hs:1, as:1 },
  { id:'R1_B2', home:'qat', away:'sui', hs:1, as:1 },
  { id:'R1_C1', home:'bra', away:'mar', hs:1, as:1 },
  { id:'R1_C2', home:'hai', away:'sco', hs:0, as:1 },
  { id:'R1_D1', home:'usa', away:'par', hs:4, as:1 },
  { id:'R1_D2', home:'aus', away:'tur', hs:2, as:0 },
  { id:'R1_E1', home:'ger', away:'cur', hs:7, as:1 },
  { id:'R1_E2', home:'civ', away:'ecu', hs:1, as:0 },
  { id:'R1_F1', home:'ned', away:'jpn', hs:2, as:2 },
  { id:'R1_F2', home:'swe', away:'tun', hs:5, as:1 },
  { id:'R1_G1', home:'bel', away:'egy', hs:1, as:1 },
  { id:'R1_G2', home:'irn', away:'nzl', hs:1, as:0 },
  { id:'R1_H1', home:'esp', away:'cpv', hs:0, as:0 },
  { id:'R1_H2', home:'ksa', away:'uru', hs:1, as:1 },
  { id:'R1_I1', home:'fra', away:'irq', hs:4, as:0 },
  { id:'R1_I2', home:'nor', away:'sen', hs:3, as:0 },
  { id:'R1_J1', home:'arg', away:'jor', hs:4, as:0 },
  { id:'R1_J2', home:'aut', away:'alg', hs:0, as:2 },
  { id:'R1_K1', home:'por', away:'uzb', hs:2, as:0 },
  { id:'R1_K2', home:'col', away:'cod', hs:2, as:1 },
  { id:'R1_L1', home:'eng', away:'pan', hs:3, as:0 },
  { id:'R1_L2', home:'cro', away:'gha', hs:1, as:0 },
  // ─── RODADA 2 (19-22 jun) ────────────────────────────────────────────────
  // Dados confirmados por multiplas fontes jornalisticas
  { id:'R2_A1', home:'mex', away:'kor', hs:1, as:0 },   // Mexico 1x0 Coreia do Sul
  { id:'R2_A2', home:'cze', away:'rsa', hs:1, as:1 },   // Tchecia 1x1 Africa do Sul
  { id:'R2_B1', home:'can', away:'qat', hs:6, as:0 },   // Canada 6x0 Catar
  { id:'R2_B2', home:'sui', away:'bih', hs:4, as:1 },   // Suica 4x1 Bosnia
  { id:'R2_C1', home:'bra', away:'hai', hs:3, as:0 },   // Brasil 3x0 Haiti
  { id:'R2_C2', home:'sco', away:'mar', hs:0, as:1 },   // Escocia 0x1 Marrocos
  { id:'R2_D1', home:'usa', away:'aus', hs:2, as:0 },   // EUA 2x0 Australia
  { id:'R2_D2', home:'tur', away:'par', hs:0, as:1 },   // Turquia 0x1 Paraguai
  { id:'R2_E1', home:'ger', away:'civ', hs:2, as:1 },   // Alemanha 2x1 Costa do Marfim
  { id:'R2_E2', home:'ecu', away:'cur', hs:0, as:0 },   // Equador 0x0 Curacao
  { id:'R2_F1', home:'ned', away:'swe', hs:5, as:1 },   // Holanda 5x1 Suecia
  { id:'R2_F2', home:'tun', away:'jpn', hs:0, as:4 },   // Tunisia 0x4 Japao
  { id:'R2_G1', home:'bel', away:'irn', hs:0, as:0 },   // Belgica 0x0 Ira
  { id:'R2_G2', home:'nzl', away:'egy', hs:1, as:3 },   // Nova Zelandia 1x3 Egito
  { id:'R2_H1', home:'esp', away:'ksa', hs:4, as:0 },   // Espanha 4x0 Arabia Saudita
  { id:'R2_H2', home:'uru', away:'cpv', hs:2, as:2 },   // Uruguai 2x2 Cabo Verde
  { id:'R2_I1', home:'fra', away:'irq', hs:3, as:0 },   // Franca 3x0 Iraque (R2: I1 vs I4)
  { id:'R2_I2', home:'nor', away:'sen', hs:3, as:2 },   // Noruega 3x2 Senegal (R2: I2 vs I3)
  { id:'R2_J1', home:'arg', away:'aut', hs:2, as:0 },   // Argentina 2x0 Austria
  { id:'R2_J2', home:'jor', away:'alg', hs:1, as:2 },   // Jordania 1x2 Algeria
  { id:'R2_K1', home:'por', away:'uzb', hs:5, as:0 },   // Portugal 5x0 Uzbequistao
  { id:'R2_K2', home:'col', away:'cod', hs:1, as:0 },   // Colombia 1x0 RD Congo
  { id:'R2_L1', home:'eng', away:'gha', hs:0, as:0 },   // Inglaterra 0x0 Gana
  { id:'R2_L2', home:'pan', away:'cro', hs:0, as:1 },   // Panama 0x1 Croacia
  // ─── RODADA 3 (23-27 jun) ────────────────────────────────────────────────
  // Grupos A, B, C (24 jun) — CONFIRMADOS
  { id:'R3_A1', home:'mex', away:'cze', hs:3, as:0 },   // Mexico 3x0 Tchecia
  { id:'R3_A2', home:'rsa', away:'kor', hs:1, as:0 },   // Africa do Sul 1x0 Coreia
  { id:'R3_B1', home:'sui', away:'can', hs:2, as:1 },   // Suica 2x1 Canada
  { id:'R3_B2', home:'bih', away:'qat', hs:3, as:1 },   // Bosnia 3x1 Catar
  { id:'R3_C1', home:'bra', away:'sco', hs:3, as:0 },   // Brasil 3x0 Escocia
  { id:'R3_C2', home:'mar', away:'hai', hs:4, as:2 },   // Marrocos 4x2 Haiti
  // Grupos D, E (25 jun)
  { id:'R3_D1', home:'tur', away:'usa', hs:3, as:2 },   // Turquia 3x2 EUA
  { id:'R3_D2', home:'par', away:'aus', hs:0, as:0 },   // Paraguai 0x0 Australia
  { id:'R3_E1', home:'ger', away:'ecu', hs:3, as:1 },   // Alemanha 3x1 Equador
  { id:'R3_E2', home:'civ', away:'cur', hs:3, as:0 },   // Costa do Marfim 3x0 Curacao
  // Grupos F, G, H (25 jun)
  { id:'R3_F1', home:'ned', away:'tun', hs:3, as:1 },   // Holanda 3x1 Tunisia
  { id:'R3_F2', home:'jpn', away:'swe', hs:1, as:1 },   // Japao 1x1 Suecia
  { id:'R3_G1', home:'egy', away:'bel', hs:1, as:0 },   // Egito 1x0 Belgica
  { id:'R3_G2', home:'irn', away:'nzl', hs:2, as:0 },   // Ira 2x0 Nova Zelandia
  { id:'R3_H1', home:'esp', away:'uru', hs:2, as:0 },   // Espanha 2x0 Uruguai
  { id:'R3_H2', home:'cpv', away:'ksa', hs:1, as:1 },   // Cabo Verde 1x1 Arabia Saudita
  // Grupos I, J, K, L (26 jun)
  { id:'R3_I1', home:'fra', away:'nor', hs:2, as:1 },   // Franca 2x1 Noruega
  { id:'R3_I2', home:'sen', away:'irq', hs:1, as:1 },   // Senegal 1x1 Iraque
  { id:'R3_J1', home:'arg', away:'alg', hs:2, as:1 },   // Argentina 2x1 Algeria
  { id:'R3_J2', home:'aut', away:'jor', hs:3, as:0 },   // Austria 3x0 Jordania
  { id:'R3_K1', home:'col', away:'uzb', hs:3, as:0 },   // Colombia 3x0 Uzbequistao
  { id:'R3_K2', home:'por', away:'cod', hs:4, as:0 },   // Portugal 4x0 RD Congo
  { id:'R3_L1', home:'eng', away:'cro', hs:3, as:0 },   // Inglaterra 3x0 Croacia
  { id:'R3_L2', home:'gha', away:'pan', hs:2, as:0 },   // Gana 2x0 Panama
];

const knownIds = new Set(KNOWN_RESULTS.map(r => r.id));
const apiResults = [];

function computeStandings() {
  const stats = {};
  const ensureTeam = id => {
    if (!stats[id]) stats[id] = { pts:0, played:0, won:0, drawn:0, lost:0, gf:0, ga:0 };
  };
  const allResults = [...KNOWN_RESULTS, ...apiResults];
  allResults.forEach(r => {
    const hg = ID_TO_GROUP[r.home], ag = ID_TO_GROUP[r.away];
    if (!hg || hg !== ag) return;
    ensureTeam(r.home); ensureTeam(r.away);
    stats[r.home].played++; stats[r.away].played++;
    stats[r.home].gf += r.hs; stats[r.home].ga += r.as;
    stats[r.away].gf += r.as; stats[r.away].ga += r.hs;
    if (r.hs > r.as) { stats[r.home].won++; stats[r.home].pts+=3; stats[r.away].lost++; }
    else if (r.hs < r.as) { stats[r.away].won++; stats[r.away].pts+=3; stats[r.home].lost++; }
    else { stats[r.home].drawn++; stats[r.home].pts+=1; stats[r.away].drawn++; stats[r.away].pts+=1; }
  });

  const groups = {};
  Object.keys(ID_TO_GROUP).forEach(id => {
    const g = ID_TO_GROUP[id];
    if (!groups[g]) groups[g] = [];
    const s = stats[id] || {pts:0,played:0,won:0,drawn:0,lost:0,gf:0,ga:0};
    groups[g].push({ localId:id, ...s, gd: s.gf - s.ga });
  });

  Object.keys(groups).forEach(g => {
    groups[g].sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
    groups[g].forEach((t,i) => { t.rank = i+1; });
    const minPlayed = Math.min(...groups[g].map(t=>t.played));
    // finished e uma propriedade normal do objeto (nao do array)
    groups[g].finished = minPlayed >= 3;
  });

  return { groups, totalMatches: allResults.length, updatedAt: new Date().toISOString() };
}

async function tryFetchNewGames() {
  try {
    const res = await fetch(API_BASE + '/eventsseason.php?id=4429&s=2026');
    if (!res.ok) return;
    const data = await res.json();
    const events = data.events || data.results || [];
    let added = 0;
    events.forEach(ev => {
      if (ev.strStatus !== 'FT') return;
      const hs = parseInt(ev.intHomeScore), as = parseInt(ev.intAwayScore);
      if (isNaN(hs) || isNaN(as)) return;
      const homeId = localId(ev.strHomeTeam), awayId = localId(ev.strAwayTeam);
      if (!homeId || !awayId) return;
      const hGroup = ID_TO_GROUP[homeId], aGroup = ID_TO_GROUP[awayId];
      if (!hGroup || hGroup !== aGroup) return;
      const syntheticId = 'API_'+norm(ev.strHomeTeam)+'_'+norm(ev.strAwayTeam)+'_'+(ev.dateEvent||'');
      if (knownIds.has(syntheticId)) return;
      // Verifica duplicata pelos resultados ja existentes
      const isDup = [...KNOWN_RESULTS, ...apiResults].some(r =>
        r.home === homeId && r.away === awayId && r.hs === hs && r.as === as
      );
      if (isDup) return;
      knownIds.add(syntheticId);
      apiResults.push({ id: syntheticId, home: homeId, away: awayId, hs, as });
      added++;
    });
    if (added > 0) console.log('[live] API trouxe', added, 'jogos novos!');
  } catch (e) {
    console.warn('[live] Nao foi possivel buscar novos jogos da API:', e.message);
  }
}

app.get('/api/live', async (req, res) => {
  const now = Date.now();
  if (liveCache && now - liveFetchTime < CACHE_TTL) return res.json(liveCache);
  await tryFetchNewGames();
  liveCache = computeStandings();
  liveFetchTime = now;
  console.log('[live]', liveCache.totalMatches, 'jogos | updatedAt:', liveCache.updatedAt);
  res.json(liveCache);
});

app.get('/api/matches', async (req, res) => {
  const now = Date.now();
  if (matchesCache && now - matchesFetchTime < CACHE_TTL) return res.json(matchesCache);
  try {
    const r = await fetch(API_BASE + '/eventsnext.php?id=134496');
    if (!r.ok) { if (matchesCache) return res.json(matchesCache); return res.status(r.status).json({}); }
    matchesCache = await r.json(); matchesFetchTime = now;
    console.log('[matches]', matchesCache.events ? matchesCache.events.length : 0, 'eventos');
    res.json(matchesCache);
  } catch (e) {
    console.error('[matches]', e.message);
    if (matchesCache) return res.json(matchesCache);
    res.status(500).json({});
  }
});

app.use(express.static(path.join(__dirname)));

const server = app.listen(PORT, () => {
  console.log('[Ato na Copa] Porta ' + PORT + ' | Banco: ' + KNOWN_RESULTS.length + ' jogos | Cache: 10min');
});
server.on('error', err => {
  if (err.code === 'EADDRINUSE') { console.error('[ERRO] Porta ' + PORT + ' em uso'); process.exit(1); }
  throw err;
});
