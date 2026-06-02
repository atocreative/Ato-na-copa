/**
 * World Cup Live Data — Frontend (Vanilla JS)
 * ---------------------------------------------------------
 * Não fala mais com a football-data.org diretamente. Consome NOSSO backend
 * serverless da Vercel (api/matches.js e api/standings.js), que guarda a chave
 * e resolve o CORS. Sem chave exposta, sem proxy público.
 *
 * Faz UMA rodada de requisições ao carregar e degrada de forma silenciosa:
 *  - Próximo jogo: sem jogos futuros ou rota indisponível → card em estado de
 *    espera ("Aguardando definição da tabela oficial."), sem dados falsos.
 *  - Travamento: se a rota falhar, o simulador segue 100% manual.
 *
 * NOTA: os grupos do simulador são um sorteio fictício. O travamento só vai
 * casar com a tela quando os grupos reais de 2026 estiverem em data.js E a API
 * tiver standings com playedGames > 0.
 */

// ── Roteamento inteligente de WhatsApp (Deep Link) ───────────────────────────
// Definida em escopo GLOBAL (fora da IIFE) para que o onclick inline do HTML
// consiga chamá-la. No celular abre o app nativo; no desktop, o WhatsApp Web.
function openWhatsApp(phone, message, buttonName) {
  // 1. Dispara o evento para o Google Analytics
  if (typeof gtag === 'function') {
    gtag('event', 'click_whatsapp', {
      'button_name': buttonName,
      'plataforma': 'whatsapp'
    });
  }

  const text = encodeURIComponent(message);
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /android/i.test(userAgent);

  // 2. Roteamento inteligente de link
  if (isIOS) {
    // iOS (inclusive Edge/Safari) funciona melhor com wa.me forçando o aplicativo
    window.location.href = 'https://wa.me/' + phone + '?text=' + text;
  } else if (isAndroid) {
    // Android aceita o protocolo direto bem
    window.location.href = 'whatsapp://send?phone=' + phone + '&text=' + text;
  } else {
    // Desktop
    window.open('https://web.whatsapp.com/send?phone=' + phone + '&text=' + text, '_blank');
  }
}

(function WorldCupLiveData() {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIGURAÇÃO  — apenas rotas internas. A chave vive no backend (Vercel).
  // ══════════════════════════════════════════════════════════════════════════

  const BRAZIL_TEAM_ID = 764; // ID do Brasil na football-data.org (p/ achar o adversário)

  const ROUTES = {
    matches: '/api/matches',
    standings: '/api/standings',
  };

  // Sinaliza se o Brasil já está matematicamente eliminado (definido ao ler os
  // standings). Quando true, o card de "próximo jogo" não é renderizado.
  let brazilEliminated = false;

  // Chama nossa própria rota interna (mesma origem → sem CORS, sem chave).
  function apiFetch(route) {
    return fetch(route).then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PASSO 1 — Dicionário PT-BR (competições + seleções). Fácil de expandir:
  // basta adicionar "Nome em inglês": "Nome em PT-BR". translate() devolve o
  // texto original quando não há tradução cadastrada.
  // ══════════════════════════════════════════════════════════════════════════
  const ptBrDictionary = {
    // ── Competições ──
    'International Friendlies': 'Amistosos',
    'Friendly': 'Amistoso',
    'Friendlies': 'Amistosos',
    'FIFA World Cup': 'Copa do Mundo',
    'World Cup': 'Copa do Mundo',
    'FIFA World Cup Qualifying': 'Eliminatórias da Copa',
    'CONMEBOL World Cup Qualifiers': 'Eliminatórias (CONMEBOL)',
    'UEFA Nations League': 'Liga das Nações da UEFA',
    'Copa America': 'Copa América',

    // ── Seleções (CONMEBOL) ──
    'Brazil': 'Brasil', 'Argentina': 'Argentina', 'Uruguay': 'Uruguai',
    'Colombia': 'Colômbia', 'Chile': 'Chile', 'Paraguay': 'Paraguai',
    'Peru': 'Peru', 'Ecuador': 'Equador', 'Bolivia': 'Bolívia', 'Venezuela': 'Venezuela',

    // ── Seleções (UEFA) ──
    'France': 'França', 'England': 'Inglaterra', 'Spain': 'Espanha',
    'Germany': 'Alemanha', 'Italy': 'Itália', 'Netherlands': 'Holanda',
    'Portugal': 'Portugal', 'Belgium': 'Bélgica', 'Croatia': 'Croácia',
    'Switzerland': 'Suíça', 'Denmark': 'Dinamarca', 'Sweden': 'Suécia',
    'Norway': 'Noruega', 'Poland': 'Polônia', 'Austria': 'Áustria',
    'Serbia': 'Sérvia', 'Scotland': 'Escócia', 'Wales': 'País de Gales',
    'Ukraine': 'Ucrânia', 'Czech Republic': 'Rep. Tcheca', 'Czechia': 'Rep. Tcheca',
    'Turkey': 'Turquia', 'Türkiye': 'Turquia', 'Hungary': 'Hungria',
    'Republic of Ireland': 'Irlanda', 'Ireland': 'Irlanda',
    'Bosnia and Herzegovina': 'Bósnia', 'Slovakia': 'Eslováquia',
    'Slovenia': 'Eslovênia', 'Romania': 'Romênia', 'Greece': 'Grécia',

    // ── Seleções (CONCACAF) ──
    'Mexico': 'México', 'United States': 'Estados Unidos', 'USA': 'Estados Unidos',
    'Canada': 'Canadá', 'Costa Rica': 'Costa Rica', 'Panama': 'Panamá',
    'Honduras': 'Honduras', 'Jamaica': 'Jamaica', 'Haiti': 'Haiti', 'Curacao': 'Curaçao',

    // ── Seleções (CAF) ──
    'Morocco': 'Marrocos', 'Senegal': 'Senegal', 'Egypt': 'Egito',
    'Nigeria': 'Nigéria', 'Cameroon': 'Camarões', 'Ghana': 'Gana',
    'Ivory Coast': 'Costa do Marfim', 'Algeria': 'Argélia', 'Tunisia': 'Tunísia',
    'South Africa': 'África do Sul', 'Cape Verde': 'Cabo Verde', 'DR Congo': 'RD Congo',
    'Mali': 'Mali',

    // ── Seleções (AFC / OFC) ──
    'Japan': 'Japão', 'South Korea': 'Coreia do Sul', 'Korea Republic': 'Coreia do Sul',
    'Australia': 'Austrália', 'Saudi Arabia': 'Arábia Saudita', 'Iran': 'Irã',
    'Qatar': 'Catar', 'Iraq': 'Iraque', 'Uzbekistan': 'Uzbequistão',
    'Jordan': 'Jordânia', 'New Zealand': 'Nova Zelândia',
  };

  function translate(text) {
    return ptBrDictionary[text] || text;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAPEAMENTO  — nome retornado pela API (inglês) → id local (data.js)
  // A API devolve nomes em inglês e um `tla` (sigla de 3 letras). Mapeamos por
  // nome normalizado, com aliases para os casos ambíguos.
  // ══════════════════════════════════════════════════════════════════════════
  const API_NAME_TO_ID = {
    // Grupo A
    'mexico': 'mex',
    'south africa': 'rsa',
    'south korea': 'kor', 'korea republic': 'kor', 'korea, republic of': 'kor',
    'czech republic': 'cze', 'czechia': 'cze',
    // Grupo B
    'canada': 'can',
    'switzerland': 'sui',
    'qatar': 'qat',
    'bosnia and herzegovina': 'bih', 'bosnia-herzegovina': 'bih', 'bosnia': 'bih',
    // Grupo C
    'brazil': 'bra',
    'morocco': 'mar',
    'scotland': 'sco',
    'haiti': 'hai',
    // Grupo D
    'united states': 'usa', 'usa': 'usa', 'united states of america': 'usa',
    'paraguay': 'par',
    'australia': 'aus',
    'turkey': 'tur', 'turkiye': 'tur', 'türkiye': 'tur',
    // Grupo E
    'germany': 'ger',
    'ecuador': 'ecu',
    'ivory coast': 'civ', 'cote d\'ivoire': 'civ', 'côte d\'ivoire': 'civ',
    'curacao': 'cur', 'curaçao': 'cur',
    // Grupo F
    'netherlands': 'ned',
    'japan': 'jpn',
    'tunisia': 'tun',
    'sweden': 'swe',
    // Grupo G
    'belgium': 'bel',
    'iran': 'irn', 'iran, islamic republic of': 'irn', 'ir iran': 'irn',
    'egypt': 'egy',
    'new zealand': 'nzl',
    // Grupo H
    'spain': 'esp',
    'uruguay': 'uru',
    'saudi arabia': 'ksa',
    'cape verde': 'cpv', 'cabo verde': 'cpv',
    // Grupo I
    'france': 'fra',
    'norway': 'nor',
    'senegal': 'sen',
    'iraq': 'irq',
    // Grupo J
    'argentina': 'arg',
    'austria': 'aut',
    'algeria': 'alg',
    'jordan': 'jor',
    // Grupo K
    'portugal': 'por',
    'colombia': 'col',
    'uzbekistan': 'uzb',
    'dr congo': 'cod', 'congo dr': 'cod', 'democratic republic of the congo': 'cod', 'dr congo (kinshasa)': 'cod',
    // Grupo L
    'england': 'eng',
    'croatia': 'cro',
    'ghana': 'gha',
    'panama': 'pan',
  };

  function normalize(str) {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // remove acentos (diacríticos combinantes)
      .trim();
  }

  // Resolve um time da API para o id local. Tenta nome, nome curto e tla.
  function resolveLocalId(apiTeam) {
    if (!apiTeam) return null;
    const candidates = [apiTeam.name, apiTeam.shortName, apiTeam.tla];
    for (const c of candidates) {
      const id = API_NAME_TO_ID[normalize(c)];
      if (id) return id;
    }
    return null;
  }

  // ── Bandeiras (flagcdn.com) ────────────────────────────────────────────────
  // Mapa nome-da-API (inglês, normalizado) → código ISO 3166-1 alpha-2.
  // flagcdn usa códigos de 2 letras (br, eg) e os especiais gb-eng / gb-sct.
  const NAME_TO_ISO2 = {
    'mexico': 'mx', 'south africa': 'za', 'south korea': 'kr', 'korea republic': 'kr',
    'czech republic': 'cz', 'czechia': 'cz', 'canada': 'ca', 'switzerland': 'ch',
    'qatar': 'qa', 'bosnia and herzegovina': 'ba', 'brazil': 'br', 'morocco': 'ma',
    'scotland': 'gb-sct', 'haiti': 'ht', 'united states': 'us', 'usa': 'us',
    'paraguay': 'py', 'australia': 'au', 'turkey': 'tr', 'turkiye': 'tr',
    'germany': 'de', 'ecuador': 'ec', 'ivory coast': 'ci', "cote d'ivoire": 'ci',
    'curacao': 'cw', 'netherlands': 'nl', 'japan': 'jp', 'tunisia': 'tn',
    'sweden': 'se', 'belgium': 'be', 'iran': 'ir', 'egypt': 'eg',
    'new zealand': 'nz', 'spain': 'es', 'uruguay': 'uy', 'saudi arabia': 'sa',
    'cape verde': 'cv', 'cabo verde': 'cv', 'france': 'fr', 'norway': 'no',
    'senegal': 'sn', 'iraq': 'iq', 'argentina': 'ar', 'austria': 'at',
    'algeria': 'dz', 'jordan': 'jo', 'portugal': 'pt', 'colombia': 'co',
    'uzbekistan': 'uz', 'dr congo': 'cd', 'congo dr': 'cd', 'england': 'gb-eng',
    'croatia': 'hr', 'ghana': 'gh', 'panama': 'pa',
  };

  // GIF transparente 1x1 (base64) — placeholder neutro se a bandeira não
  // carregar. IMPORTANTE: base64 NÃO contém aspas, então é seguro embutir
  // dentro de onerror="...this.src='...'" sem quebrar o HTML.
  const FLAG_PLACEHOLDER =
    'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

  // Resolve a URL da bandeira por nome da API; usa o `crest` da API como
  // segunda opção; o atributo onerror cobre o caso de a imagem 404.
  function flagUrl(apiTeam) {
    if (!apiTeam) return FLAG_PLACEHOLDER;
    const iso = NAME_TO_ISO2[normalize(apiTeam.name)] ||
                NAME_TO_ISO2[normalize(apiTeam.shortName)] ||
                NAME_TO_ISO2[normalize(apiTeam.tla)];
    if (iso) return 'https://flagcdn.com/w80/' + iso + '.png';
    return apiTeam.crest || FLAG_PLACEHOLDER;
  }

  // TheSportsDB já devolve a badge (escudo/bandeira) pronta. Usamos ela direto;
  // se vier vazia, caímos no flagcdn por nome; por fim, no placeholder.
  function badgeOrFlag(name, badge) {
    if (badge) return badge;
    const iso = NAME_TO_ISO2[normalize(name)];
    return iso ? 'https://flagcdn.com/w80/' + iso + '.png' : FLAG_PLACEHOLDER;
  }

  // PASSO 2 — Converte dateEvent + strTime (UTC) para o Horário de Brasília.
  // A TheSportsDB envia a hora em UTC, então acrescentamos 'Z' ao ISO para o JS
  // NÃO interpretar como horário local do navegador. Output: "sáb., 06/06, 19:00".
  function formatarDataBrasilia(dateEvent, strTime) {
    if (!dateEvent) return '';
    const dataUTC = new Date(dateEvent + 'T' + (strTime || '00:00:00') + 'Z');
    if (isNaN(dataUTC.getTime())) return '';
    return dataUTC.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Injeta o CSS do bloco uma única vez (o site usa styles.min.css; manter o
  // estilo aqui deixa a feature autocontida, sem depender do build de minify).
  function injectStyles() {
    if (document.getElementById('wc-live-styles')) return;
    const style = document.createElement('style');
    style.id = 'wc-live-styles';
    style.textContent =
      // Card NATIVO — fundo claro, borda igual à dos group-cards, texto azul do site.
      '.next-match-banner{max-width:520px;margin:1.25rem auto 0;padding:14px 22px 16px;' +
        'background:#fff;border:1px solid var(--border-color,rgba(1,37,98,0.15));' +
        'border-radius:10px;font-family:\'Roboto\',sans-serif;}' +
      '.nm-title{font-size:12px;font-weight:700;letter-spacing:1.5px;' +
        'text-transform:uppercase;color:var(--color-green,#027b35);' +
        'text-align:center;margin-bottom:3px;}' +
      '.nm-meta{text-align:center;margin-bottom:14px;line-height:1.8;}' +
      // Destaque da competição (equivale às classes Tailwind pedidas).
      '.nm-league-badge{font-size:12px;font-weight:900;color:#006b3f;' +
        'background:#e8f3ec;padding:2px 8px;border-radius:6px;' +
        'text-transform:uppercase;margin-right:8px;display:inline-block;' +
        'letter-spacing:0.5px;}' +
      '.nm-meta-date{font-size:13px;color:#374151;font-weight:500;}' +
      '.nm-teams{display:flex;align-items:flex-start;justify-content:space-between;}' +
      '.nm-team{display:flex;flex-direction:column;align-items:center;gap:8px;' +
        'flex:1;min-width:0;}' +
      '.nm-flag{width:46px;height:46px;border-radius:8px;object-fit:cover;' +
        'background:#eef0f4;' +
        'border:1px solid var(--border-color,rgba(1,37,98,0.15));' +
        'box-shadow:0 1px 3px rgba(1,37,98,0.12);}' +
      '.nm-team-name{font-size:14px;color:var(--color-blue,#012562);font-weight:700;' +
        'text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' +
        'max-width:100%;}' +
      '.nm-vs{align-self:flex-start;margin-top:18px;color:var(--color-blue,#012562);' +
        'opacity:0.45;font-size:14px;font-weight:700;padding:0 6px;}' +
      // Estado de espera (Copa ainda sem tabela definida).
      '.nm-empty{text-align:center;color:var(--color-blue,#012562);opacity:0.7;' +
        'font-size:14px;font-weight:500;padding:8px 0 4px;}' +
      '.pos-btn.locked-by-api{opacity:0.4;cursor:not-allowed;}';
    document.head.appendChild(style);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REQUISITO 1 — Próximo jogo do Brasil
  // ══════════════════════════════════════════════════════════════════════════

  // Escapa texto antes de injetar no HTML (adversário pode vir da API).
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Monta um <div> de time (bandeira + nome) no estilo Google.
  function teamColumnHtml(name, flag) {
    return (
      '<div class="nm-team">' +
        '<img class="nm-flag" src="' + flag + '" alt="' + escapeHtml(name) + '" ' +
          'onerror="this.onerror=null;this.src=\'' + FLAG_PLACEHOLDER + '\'">' +
        '<span class="nm-team-name">' + escapeHtml(name) + '</span>' +
      '</div>'
    );
  }

  /**
   * Renderiza o card no DOM. Dois modos:
   *   - Jogo:   { meta, home:{name,flag}, away:{name,flag} }
   *   - Espera: { message: 'texto centralizado' }  (Copa sem tabela definida)
   */
  function renderMatchBanner(match) {
    // PASSO 1/Blindagem — seletor com alternativas comuns
    const subtitleEl = document.querySelector('.header-subtitle, .hero-desc, .subtitle');
    if (!subtitleEl) {
      return console.error(
        '[WorldCupLiveData] Seletor .header-subtitle não encontrado no HTML.'
      );
    }

    // Evita duplicar o bloco se a função rodar mais de uma vez.
    const existing = document.querySelector('.next-match-banner');
    if (existing) existing.remove();

    injectStyles();

    // Corpo do card: estado de espera OU os dois times.
    // metaHtml já vem montado com tags (texto dinâmico escapado na origem).
    const body = match.message
      ? '<div class="nm-empty">' + escapeHtml(match.message) + '</div>'
      : '<div class="nm-meta">' + (match.metaHtml || '') + '</div>' +
        '<div class="nm-teams">' +
          teamColumnHtml(match.home.name, match.home.flag) +
          '<span class="nm-vs">x</span>' +
          teamColumnHtml(match.away.name, match.away.flag) +
        '</div>';

    const html =
      '<div class="next-match-banner" role="status">' +
        '<div class="nm-title">PRÓXIMO JOGO DA SELEÇÃO</div>' +
        body +
      '</div>';

    subtitleEl.insertAdjacentHTML('afterend', html);
  }

  // Remove o card da tela, se já existir.
  function hideNextMatchCard() {
    const card = document.querySelector('.next-match-banner');
    if (card) card.style.display = 'none';
  }

  // PASSO 1 — Fallback único, reutilizado tanto na lista vazia quanto no catch.
  const mockMatchFallback = [{
    strLeague: 'International Friendlies',
    dateEvent: '2026-06-06',
    strTime: '22:00:00', // UTC → o JS converte para 19:00 em Brasília
    strHomeTeam: 'Brazil',
    strAwayTeam: 'Egypt',
    strHomeTeamBadge: 'https://flagcdn.com/w80/br.png',
    strAwayTeamBadge: 'https://flagcdn.com/w80/eg.png',
  }];

  // Renderiza o card a partir de um evento (real OU fallback). Aplica tradução,
  // fuso horário e injeção de HTML — fonte única de verdade para os dois fluxos.
  function renderMatchFromEvent(ev) {
    const homeName = ev.strHomeTeam || 'A definir';
    const awayName = ev.strAwayTeam || 'A definir';
    const homeFlag = badgeOrFlag(homeName, ev.strHomeTeamBadge);
    const awayFlag = badgeOrFlag(awayName, ev.strAwayTeamBadge);

    // Meta-linha: competição traduzida em destaque + data no horário de Brasília.
    const ligaPt = translate(ev.strLeague || 'Amistoso');
    const dataPt = formatarDataBrasilia(ev.dateEvent, ev.strTime);
    const metaHtml =
      '<span class="nm-league-badge">[ ' + escapeHtml(ligaPt) + ' ]</span>' +
      '<span class="nm-meta-date">' + escapeHtml(dataPt) + '</span>';

    renderMatchBanner({
      metaHtml: metaHtml,
      // Nomes traduzidos para PT-BR (com fallback ao original).
      home: { name: translate(homeName), flag: homeFlag },
      away: { name: translate(awayName), flag: awayFlag },
    });
  }

  async function renderNextBrazilMatch() {
    // PASSO 3 — Se o Brasil está eliminado, não há próximo jogo: não renderiza.
    if (brazilEliminated) {
      console.info('[WorldCupLiveData] Card de próximo jogo suprimido (Brasil eliminado).');
      hideNextMatchCard();
      return;
    }

    try {
      const data = await apiFetch(ROUTES.matches);

      // TheSportsDB: jogos vêm em data.events; sem jogos → data.events = null.
      // Fallback ATIVO: em vez de "Aguardando definição", injetamos o amistoso
      // Brasil x Egito e seguimos o fluxo normal de renderização.
      const apiData = data || {};
      if (!apiData.events || apiData.events.length === 0) {
        console.info('[WorldCupLiveData] API sem jogos — injetando fallback ativo (Brasil x Egito).');
        apiData.events = mockMatchFallback;
      }

      // eventsnext já vem em ordem cronológica; pegamos o primeiro.
      const next = apiData.events[0];
      console.info('[WorldCupLiveData] Próximo jogo carregado:', next.strHomeTeam, 'x', next.strAwayTeam);
      renderMatchFromEvent(next);
    } catch (error) {
      // PASSO 2 — Erro fatal (rede caiu, backend off, 500). NÃO deixamos a tela
      // vazia: renderizamos o fallback de emergência com a mesma lógica visual.
      console.error('[Match Fetch Error] Injetando fallback de emergência:', error);
      renderMatchFromEvent(mockMatchFallback[0]);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REQUISITO 2 — Travamento matemático por classificação real
  // ══════════════════════════════════════════════════════════════════════════

  // Lê os botões reais do DOM: .pos-btn[data-pos][data-team][data-group]
  function posButton(groupLetter, localId, pos) {
    return document.querySelector(
      '.pos-btn[data-group="' + groupLetter + '"]' +
      '[data-team="' + localId + '"]' +
      '[data-pos="' + pos + '"]'
    );
  }

  function disableBtn(btn) {
    if (btn && !btn.disabled) {
      btn.disabled = true;
      btn.classList.add('locked-by-api');
      btn.title = 'Definido pela classificação real';
    }
  }

  // Força a seleção de 1º lugar reaproveitando o clique do próprio simulador
  // (mantém o estado do GroupsModule consistente).
  function forceFirstPlace(btn) {
    if (btn && !btn.classList.contains('selected-1')) {
      btn.click();
    }
  }

  // Extrai a letra do grupo (A–L) dos campos possíveis da TheSportsDB.
  // A lookuptable não tem um campo de grupo padronizado; tentamos os mais
  // prováveis. Sem grupo identificável → string vazia (linha é ignorada).
  function extractGroupLetter(row) {
    const raw = row.strGroup || row.intGroup || row.strDescription || '';
    const m = String(raw).toUpperCase().match(/(?:GROUP|GRUPO)[ _]?([A-L])\b/);
    if (m) return m[1];
    const t = String(raw).trim().toUpperCase();
    return /^[A-L]$/.test(t) ? t : '';
  }

  /**
   * Recebe a tabela plana da TheSportsDB (data.table) e aplica os travamentos.
   * Cada linha: { strTeam, intPlayed, intPoints, intRank, strGroup?, ... }
   * Agrupamos por grupo e rodamos a mesma matemática A/B/C por grupo.
   */
  function aplicarTravamentos(table) {
    if (!Array.isArray(table) || table.length === 0) return;

    // Agrupa as linhas por letra de grupo.
    const byGroup = {};
    table.forEach((row) => {
      const letter = extractGroupLetter(row);
      if (!letter) return;
      (byGroup[letter] = byGroup[letter] || []).push(row);
    });

    Object.keys(byGroup).forEach((groupLetter) => {
      const groupRows = byGroup[groupLetter];
      if (groupRows.length < 2) return;

      // Ordena por colocação (intRank) para garantir 1º..4º.
      groupRows.sort((a, b) => (parseInt(a.intRank) || 99) - (parseInt(b.intRank) || 99));

      // Enriquece cada linha: id local + pontos máximos possíveis.
      // Fórmula pedida: parseInt(intPoints) + ((3 - parseInt(intPlayed)) * 3)
      const rows = groupRows.map((row) => {
        const intPlayed = parseInt(row.intPlayed) || 0;
        const pontosAtuais = parseInt(row.intPoints) || 0;
        const jogosRestantes = Math.max(0, 3 - intPlayed);
        return {
          localId: resolveLocalId({ name: row.strTeam }),
          pontosAtuais: pontosAtuais,
          pontosMaximosPossiveis: pontosAtuais + jogosRestantes * 3,
        };
      });

      // Linhas por posição (já ordenadas por intRank)
      const segundo = rows[1];
      const terceiro = rows[2];
      const quarto = rows[3];

      rows.forEach((time, idx) => {
        if (!time.localId) return; // sem correspondência local: ignora

        const outros = rows.filter((_, i) => i !== idx);

        // ── A) Travar 1º lugar definido ──────────────────────────────────────
        // pontosAtuais de A > pontosMaximosPossiveis de TODOS os outros
        const ehPrimeiroMatematico = outros.every(
          (o) => time.pontosAtuais > o.pontosMaximosPossiveis
        );
        if (ehPrimeiroMatematico) {
          // Fixa A em 1º…
          forceFirstPlace(posButton(groupLetter, time.localId, 1));
          // …trava o 1º dos demais e impede tirar A do 1º
          disableBtn(posButton(groupLetter, time.localId, 2));
          disableBtn(posButton(groupLetter, time.localId, 3));
          outros.forEach((o) => {
            if (o.localId) disableBtn(posButton(groupLetter, o.localId, 1));
          });
        }

        // ── B) Bloquear rebaixamento de classificado (G2 garantido) ──────────
        // Pior caso de A (ganha 0) ainda > pontosMaximosPossiveis do 3º e do 4º
        const garantidoTop2 =
          terceiro && quarto &&
          time.pontosAtuais > terceiro.pontosMaximosPossiveis &&
          time.pontosAtuais > quarto.pontosMaximosPossiveis &&
          time !== terceiro && time !== quarto;
        if (garantidoTop2) {
          // Não pode cair para 3º (a única "queda" representável neste UI)
          disableBtn(posButton(groupLetter, time.localId, 3));
        }

        // ── C) Travar eliminados ─────────────────────────────────────────────
        // pontosMaximosPossiveis de A < pontosAtuais do 2º colocado → eliminado
        const eliminado =
          segundo && time !== segundo &&
          time.pontosMaximosPossiveis < segundo.pontosAtuais;
        if (eliminado) {
          // Bloqueia todos os botões de avanço (1º, 2º e 3º)
          disableBtn(posButton(groupLetter, time.localId, 1));
          disableBtn(posButton(groupLetter, time.localId, 2));
          disableBtn(posButton(groupLetter, time.localId, 3));

          // PASSO 3 — Brasil eliminado: marca para ocultar o card de próximo jogo.
          if (time.localId === 'bra') {
            brazilEliminated = true;
            console.warn('[WorldCupLiveData] Brasil matematicamente eliminado — ocultando card de próximo jogo.');
          }
        }
      });
    });
  }

  async function applyStandingsLocks() {
    const data = await apiFetch(ROUTES.standings);
    // TheSportsDB: tabela em data.table; null/vazia se a Copa não começou.
    const table = (data && data.table) || null;
    if (!table || table.length === 0) {
      console.info('[WorldCupLiveData] Sem tabela de classificação (Copa não começou) — nenhum travamento aplicado.');
      return;
    }
    aplicarTravamentos(table);
    // Se o Brasil já estava eliminado e o card foi renderizado, esconde.
    if (brazilEliminated) hideNextMatchCard();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INICIALIZAÇÃO  — uma única rodada de requisições, com fallback silencioso
  // ══════════════════════════════════════════════════════════════════════════
  async function initWorldCupData() {
    // Standings PRIMEIRO: define brazilEliminated antes de decidir renderizar o
    // card. Assim, se o Brasil estiver eliminado, o card nem chega a aparecer.
    try {
      await applyStandingsLocks();
    } catch (err) {
      console.warn('[WorldCupLiveData] Travamento por classificação indisponível:', err.message);
    }
    // Próximo jogo DEPOIS: respeita a flag de eliminação.
    try {
      await renderNextBrazilMatch();
    } catch (err) {
      console.warn('[WorldCupLiveData] Próximo jogo indisponível:', err.message);
    }
  }

  // app.min.js (defer) renderiza os grupos antes do DOMContentLoaded, então
  // os botões já existem quando este init roda.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorldCupData);
  } else {
    initWorldCupData();
  }
})();
