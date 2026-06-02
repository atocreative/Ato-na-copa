/**
 * Servidor Express — Ato na Copa (pronto para Railway)
 * ----------------------------------------------------
 * Faz duas coisas:
 *  1. Serve o frontend estático (index.html, css/, js/, assets/...).
 *  2. Expõe /api/matches e /api/standings como proxy da TheSportsDB,
 *     protegendo a cota com um cache em memória de 4 horas (o "JSON global"
 *     do processo Node).
 *
 * TheSportsDB usa a chave DIRETO NA URL (não em header). A chave gratuita
 * padrão é '3'. No Railway, defina API_TOKEN para usar uma chave própria.
 *   IDs (verificados na API): Seleção Brasileira = 134496 | FIFA World Cup = 4429
 *   (Atenção: 133602 = Liverpool FC e 4362 não resolve — IDs corrigidos.)
 * O Railway injeta PORT automaticamente.
 */
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Chave da TheSportsDB na URL ('3' = tier gratuito padrão deles).
const apiKey = process.env.API_TOKEN || '3';
const API_BASE = 'https://www.thesportsdb.com/api/v1/json/' + apiKey;
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 horas em ms

// ── Cache em memória (global) — sobrevive entre requisições do mesmo processo ──
let matchesCache = null;
let matchesFetchTime = 0;
let standingsCache = null;
let standingsFetchTime = 0;

// Busca crua na API externa. Sempre devolve { status, ok, data } — nunca lança
// por status HTTP, para o chamador poder logar com transparência total.
// TheSportsDB não usa header de autenticação: a chave já vai na URL.
async function callApi(apiPath) {
  const response = await fetch(API_BASE + apiPath);
  // TheSportsDB devolve JSON; em ausência de dados, campos vêm como null.
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, statusText: response.statusText, data };
}

// ── Rota: próximos jogos do Brasil ────────────────────────────────────────────
app.get('/api/matches', async (req, res) => {
  const agora = Date.now();

  // Cache fresco (< 4h): devolve da memória instantaneamente.
  if (matchesCache && agora - matchesFetchTime < CACHE_TTL) {
    const n = matchesCache.events ? matchesCache.events.length : 0;
    console.log('[API Match Fetch] (cache em memória) | Jogos encontrados:', n);
    return res.json(matchesCache);
  }

  try {
    // Próximos jogos da Seleção Brasileira (ID 134496).
    const { status, ok, statusText, data } = await callApi('/eventsnext.php?id=134496');

    // Transparência total: status e quantidade de jogos no terminal.
    console.log('[API Match Fetch] Status:', status, '| Jogos encontrados:', data.events ? data.events.length : 0);

    if (!ok) {
      console.warn('[API Match Fetch] Falha na API:', statusText);
      if (matchesCache) return res.json(matchesCache); // serve cache antigo se houver
      return res.status(status).json({ error: 'Falha ao buscar partidas', status });
    }

    matchesCache = data;
    matchesFetchTime = agora;
    return res.json(data);
  } catch (err) {
    console.error('[API Match Fetch] Erro de rede/conexão:', err.message);
    if (matchesCache) return res.json(matchesCache);
    return res.status(500).json({ error: 'Falha ao buscar partidas' });
  }
});

// ── Rota: classificação da Copa ───────────────────────────────────────────────
app.get('/api/standings', async (req, res) => {
  const agora = Date.now();

  if (standingsCache && agora - standingsFetchTime < CACHE_TTL) {
    const n = standingsCache.table ? standingsCache.table.length : 0;
    console.log('[API Standings Fetch] (cache em memória) | Linhas na tabela:', n);
    return res.json(standingsCache);
  }

  try {
    // Tabela da FIFA World Cup (liga 4429), temporada 2026.
    const { status, ok, statusText, data } = await callApi('/lookuptable.php?l=4429&s=2026');

    console.log('[API Standings Fetch] Status:', status, '| Linhas na tabela:', data.table ? data.table.length : 0);

    if (!ok) {
      console.warn('[API Standings Fetch] Falha na API:', statusText);
      if (standingsCache) return res.json(standingsCache);
      return res.status(status).json({ error: 'Falha ao buscar classificação', status });
    }

    standingsCache = data;
    standingsFetchTime = agora;
    return res.json(data);
  } catch (err) {
    console.error('[API Standings Fetch] Erro de rede/conexão:', err.message);
    if (standingsCache) return res.json(standingsCache);
    return res.status(500).json({ error: 'Falha ao buscar classificação' });
  }
});

// ── Arquivos estáticos do frontend (raiz do projeto) ──────────────────────────
// O index.html, css/, js/ e assets/ ficam na raiz, então servimos __dirname.
app.use(express.static(path.join(__dirname)));

const server = app.listen(PORT, () => {
  console.log('Ato na Copa rodando na porta ' + PORT);
});

// Mensagem amigável quando a porta já está em uso (em vez de stack trace).
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\n[ERRO] A porta ' + PORT + ' já está em uso (outro servidor rodando).');
    console.error('Soluções:');
    console.error('  • Feche o outro processo, ou');
    console.error('  • Rode em outra porta:  PORT=3001 npm start');
    console.error('  • Windows: descubra o PID com  netstat -ano | findstr :' + PORT + '  e encerre com  taskkill /F /PID <pid>\n');
    process.exit(1);
  }
  throw err;
});
