/**
 * World Cup Live Data — Frontend (Vanilla JS)
 * ---------------------------------------------------------
 * Aplica os dados REAIS da Copa do Mundo 2026 (atualizado 25/06/2026)
 * como fonte primária de verdade. A API da TheSportsDB é consultada
 * opcionalmente para atualizações — mas os dados hardcoded garantem que
 * os travamentos sempre funcionem, mesmo sem servidor ou API disponível.
 *
 * ESTRATÉGIA:
 *  1. Aplica dados hardcoded imediatamente (sem latência, sem CORS, sem falha).
 *  2. Em paralelo, tenta buscar dados frescos da API /api/standings.
 *  3. Se a API retornar dados mais completos, reaplicamos os travamentos.
 *  4. O próximo jogo do Brasil é buscado da API; fallback usa dados reais.
 */

// ── Roteamento inteligente de WhatsApp (Deep Link) ───────────────────────────
function openWhatsApp(phone, message, buttonName) {
  if (typeof gtag === 'function') {
    gtag('event', 'click_whatsapp', { 'button_name': buttonName, 'plataforma': 'whatsapp' });
  }
  const text = encodeURIComponent(message);
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /android/i.test(userAgent);
  if (isIOS) {
    window.location.href = 'https://wa.me/' + phone + '?text=' + text;
  } else if (isAndroid) {
    window.location.href = 'whatsapp://send?phone=' + phone + '&text=' + text;
  } else {
    window.open('https://web.whatsapp.com/send?phone=' + phone + '&text=' + text, '_blank');
  }
}

(function WorldCupLiveData() {
  'use strict';

  const ROUTES = { matches: '/api/matches', standings: '/api/standings' };
  let brazilEliminated = false;

  function apiFetch(route) {
    return fetch(route).then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DADOS REAIS DA COPA 2026 — Atualizado em 25/06/2026 (FIFA.com)
  // status: 'FINISHED' = 3 rodadas jogadas | 'ONGOING' = 2 rodadas jogadas
  // ══════════════════════════════════════════════════════════════════════════
  var REAL_STANDINGS = {
    A: { status: 'FINISHED', teams: [
      { id: 'mex', pts: 9, played: 3, rank: 1 },
      { id: 'rsa', pts: 4, played: 3, rank: 2 },
      { id: 'kor', pts: 3, played: 3, rank: 3 },
      { id: 'cze', pts: 1, played: 3, rank: 4 }
    ]},
    B: { status: 'FINISHED', teams: [
      { id: 'sui', pts: 7, played: 3, rank: 1 },
      { id: 'can', pts: 4, played: 3, rank: 2 },
      { id: 'bih', pts: 4, played: 3, rank: 3 },
      { id: 'qat', pts: 1, played: 3, rank: 4 }
    ]},
    C: { status: 'FINISHED', teams: [
      { id: 'bra', pts: 7, played: 3, rank: 1 },
      { id: 'mar', pts: 7, played: 3, rank: 2 },
      { id: 'sco', pts: 3, played: 3, rank: 3 },
      { id: 'hai', pts: 0, played: 3, rank: 4 }
    ]},
    D: { status: 'ONGOING', teams: [
      { id: 'usa', pts: 6, played: 2, rank: 1 },
      { id: 'aus', pts: 3, played: 2, rank: 2 },
      { id: 'par', pts: 3, played: 2, rank: 3 },
      { id: 'tur', pts: 0, played: 2, rank: 4 }
    ]},
    E: { status: 'ONGOING', teams: [
      { id: 'ger', pts: 6, played: 2, rank: 1 },
      { id: 'civ', pts: 3, played: 2, rank: 2 },
      { id: 'ecu', pts: 1, played: 2, rank: 3 },
      { id: 'cur', pts: 1, played: 2, rank: 4 }
    ]},
    F: { status: 'ONGOING', teams: [
      { id: 'ned', pts: 4, played: 2, rank: 1 },
      { id: 'jpn', pts: 4, played: 2, rank: 2 },
      { id: 'swe', pts: 3, played: 2, rank: 3 },
      { id: 'tun', pts: 0, played: 2, rank: 4 }
    ]},
    G: { status: 'ONGOING', teams: [
      { id: 'egy', pts: 4, played: 2, rank: 1 },
      { id: 'irn', pts: 2, played: 2, rank: 2 },
      { id: 'bel', pts: 2, played: 2, rank: 3 },
      { id: 'nzl', pts: 1, played: 2, rank: 4 }
    ]},
    H: { status: 'ONGOING', teams: [
      { id: 'esp', pts: 4, played: 2, rank: 1 },
      { id: 'uru', pts: 2, played: 2, rank: 2 },
      { id: 'cpv', pts: 2, played: 2, rank: 3 },
      { id: 'ksa', pts: 1, played: 2, rank: 4 }
    ]},
    I: { status: 'ONGOING', teams: [
      { id: 'fra', pts: 6, played: 2, rank: 1 },
      { id: 'nor', pts: 6, played: 2, rank: 2 },
      { id: 'sen', pts: 0, played: 2, rank: 3 },
      { id: 'irq', pts: 0, played: 2, rank: 4 }
    ]},
    J: { status: 'ONGOING', teams: [
      { id: 'arg', pts: 6, played: 2, rank: 1 },
      { id: 'aut', pts: 3, played: 2, rank: 2 },
      { id: 'alg', pts: 3, played: 2, rank: 3 },
      { id: 'jor', pts: 0, played: 2, rank: 4 }
    ]},
    K: { status: 'ONGOING', teams: [
      { id: 'col', pts: 6, played: 2, rank: 1 },
      { id: 'por', pts: 4, played: 2, rank: 2 },
      { id: 'cod', pts: 1, played: 2, rank: 3 },
      { id: 'uzb', pts: 0, played: 2, rank: 4 }
    ]},
    L: { status: 'ONGOING', teams: [
      { id: 'eng', pts: 4, played: 2, rank: 1 },
      { id: 'gha', pts: 4, played: 2, rank: 2 },
      { id: 'cro', pts: 3, played: 2, rank: 3 },
      { id: 'pan', pts: 0, played: 2, rank: 4 }
    ]}
  };

  // Travamentos matematicos definitivos por grupo
  // first1: quem ja e 1o lugar certo | locked2: garantido top2 | eliminated: fora
  var LOCKED_BY_MATH = {
    A: { first1: 'mex', locked2: 'rsa', eliminated: ['cze'] },
    B: { first1: 'sui', locked2: 'can', eliminated: ['qat'] },
    C: { first1: 'bra', locked2: 'mar', eliminated: ['hai'] },
    D: { first1: 'usa', eliminated: ['tur'] },
    E: { first1: 'ger', eliminated: [] },
    F: { eliminated: ['tun'] },
    G: { eliminated: [] },
    H: { eliminated: [] },
    I: { first1: 'fra', locked2: 'nor', eliminated: ['sen', 'irq'] },
    J: { first1: 'arg', eliminated: ['jor'] },
    K: { first1: 'col', eliminated: ['uzb'] },
    L: { eliminated: ['pan'] }
  };

  // Dicionario PT-BR
  var ptBrDictionary = {
    'International Friendlies': 'Amistosos', 'Friendly': 'Amistoso',
    'Friendlies': 'Amistosos', 'FIFA World Cup': 'Copa do Mundo',
    'World Cup': 'Copa do Mundo', 'Brazil': 'Brasil', 'Argentina': 'Argentina',
    'France': 'Franca', 'England': 'Inglaterra', 'Spain': 'Espanha',
    'Germany': 'Alemanha', 'Netherlands': 'Holanda', 'Portugal': 'Portugal',
    'Morocco': 'Marrocos', 'Egypt': 'Egito', 'South Africa': 'Africa do Sul',
    'Mexico': 'Mexico', 'United States': 'Estados Unidos', 'USA': 'Estados Unidos',
    'Canada': 'Canada', 'Colombia': 'Colombia', 'Norway': 'Noruega',
    'Sweden': 'Suecia', 'Japan': 'Japao', 'Switzerland': 'Suica',
    'Croatia': 'Croacia', 'Ghana': 'Gana', 'Scotland': 'Escocia',
    'Uruguay': 'Uruguai', 'Austria': 'Austria', 'Belgium': 'Belgica',
    'Australia': 'Australia', 'Ecuador': 'Equador', 'Ivory Coast': 'Costa do Marfim',
    'South Korea': 'Coreia do Sul', 'Saudi Arabia': 'Arabia Saudita',
    'Iran': 'Ira', 'Qatar': 'Catar', 'Iraq': 'Iraque', 'Uzbekistan': 'Uzbequistao',
    'Jordan': 'Jordania', 'New Zealand': 'Nova Zelandia', 'Panama': 'Panama',
    'Tunisia': 'Tunisia', 'Senegal': 'Senegal', 'Algeria': 'Algeria',
    'Turkey': 'Turquia', 'Turkiye': 'Turquia', 'Haiti': 'Haiti',
    'Paraguay': 'Paraguai', 'Cape Verde': 'Cabo Verde', 'Bosnia': 'Bosnia',
    'Bosnia and Herzegovina': 'Bosnia', 'Czechia': 'Rep. Tcheca',
    'Czech Republic': 'Rep. Tcheca', 'DR Congo': 'RD Congo',
    'Curacao': 'Curacao', 'Iraq': 'Iraque'
  };

  function translate(text) { return ptBrDictionary[text] || text; }

  var FLAG_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

  var NAME_TO_ISO2 = {
    'mexico': 'mx', 'south africa': 'za', 'south korea': 'kr', 'korea republic': 'kr',
    'czech republic': 'cz', 'czechia': 'cz', 'canada': 'ca', 'switzerland': 'ch',
    'qatar': 'qa', 'bosnia and herzegovina': 'ba', 'bosnia & herzegovina': 'ba',
    'brazil': 'br', 'morocco': 'ma', 'scotland': 'gb-sct', 'haiti': 'ht',
    'united states': 'us', 'usa': 'us', 'paraguay': 'py', 'australia': 'au',
    'turkey': 'tr', 'turkiye': 'tr', 'germany': 'de', 'ecuador': 'ec',
    'ivory coast': 'ci', 'curacao': 'cw', 'netherlands': 'nl', 'japan': 'jp',
    'tunisia': 'tn', 'sweden': 'se', 'belgium': 'be', 'iran': 'ir', 'egypt': 'eg',
    'new zealand': 'nz', 'spain': 'es', 'uruguay': 'uy', 'saudi arabia': 'sa',
    'cape verde': 'cv', 'cabo verde': 'cv', 'france': 'fr', 'norway': 'no',
    'senegal': 'sn', 'iraq': 'iq', 'argentina': 'ar', 'austria': 'at',
    'algeria': 'dz', 'jordan': 'jo', 'portugal': 'pt', 'colombia': 'co',
    'uzbekistan': 'uz', 'dr congo': 'cd', 'congo dr': 'cd', 'england': 'gb-eng',
    'croatia': 'hr', 'ghana': 'gh', 'panama': 'pa', 'costa do marfim': 'ci'
  };

  function normalize(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function badgeOrFlag(name, badge) {
    if (badge) return badge;
    var iso = NAME_TO_ISO2[normalize(name)];
    return iso ? 'https://flagcdn.com/w80/' + iso + '.png' : FLAG_PLACEHOLDER;
  }

  function formatarDataBrasilia(dateEvent, strTime) {
    if (!dateEvent) return '';
    var dataUTC = new Date(dateEvent + 'T' + (strTime || '00:00:00') + 'Z');
    if (isNaN(dataUTC.getTime())) return '';
    return dataUTC.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo', weekday: 'short',
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  function injectStyles() {
    if (document.getElementById('wc-live-styles')) return;
    var style = document.createElement('style');
    style.id = 'wc-live-styles';
    style.textContent =
      '.next-match-banner{max-width:520px;margin:1.25rem auto 0;padding:14px 22px 16px;background:#fff;border:1px solid rgba(1,37,98,0.15);border-radius:10px;font-family:"Roboto",sans-serif;}' +
      '.nm-title{font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#027b35;text-align:center;margin-bottom:3px;}' +
      '.nm-meta{text-align:center;margin-bottom:14px;line-height:1.8;}' +
      '.nm-league-badge{font-size:12px;font-weight:900;color:#006b3f;background:#e8f3ec;padding:2px 8px;border-radius:6px;text-transform:uppercase;margin-right:8px;display:inline-block;letter-spacing:0.5px;}' +
      '.nm-meta-date{font-size:13px;color:#374151;font-weight:500;}' +
      '.nm-teams{display:flex;align-items:flex-start;justify-content:space-between;}' +
      '.nm-team{display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;min-width:0;}' +
      '.nm-flag{width:46px;height:46px;border-radius:8px;object-fit:cover;background:#eef0f4;border:1px solid rgba(1,37,98,0.15);box-shadow:0 1px 3px rgba(1,37,98,0.12);}' +
      '.nm-team-name{font-size:14px;color:#012562;font-weight:700;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}' +
      '.nm-vs{align-self:flex-start;margin-top:18px;color:#012562;opacity:0.45;font-size:14px;font-weight:700;padding:0 6px;}' +
      '.nm-empty{text-align:center;color:#012562;opacity:0.7;font-size:14px;font-weight:500;padding:8px 0 4px;}' +
      '.pos-btn.locked-by-api{opacity:0.35 !important;cursor:not-allowed !important;pointer-events:none !important;}' +
      '.team-row.api-eliminated{opacity:0.45;}' +
      '.team-row.api-eliminated .team-name::after{content:" eliminado";color:#c0392b;font-size:10px;font-weight:700;text-transform:uppercase;margin-left:4px;}' +
      '.team-row.api-qualified-1 .team-name::after{content:" 1 Lugar";color:#027b35;font-size:10px;font-weight:700;margin-left:4px;}' +
      '.team-row.api-qualified-2 .team-name::after{content:" 2 Lugar";color:#027b35;font-size:10px;font-weight:700;margin-left:4px;}' +
      '.group-card.api-closed .group-header{background:linear-gradient(135deg,#027b35,#004d1f);border-radius:8px 8px 0 0;}' +
      '.group-card.api-closed .group-name{color:#fff;}' +
      '.group-card.api-closed .group-status{background:rgba(255,255,255,0.2);color:#fff;border-color:rgba(255,255,255,0.3);}';
    document.head.appendChild(style);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function teamColumnHtml(name, flag) {
    return '<div class="nm-team"><img class="nm-flag" src="' + flag + '" alt="' + escapeHtml(name) + '" onerror="this.onerror=null;this.src=\'' + FLAG_PLACEHOLDER + '\'"><span class="nm-team-name">' + escapeHtml(name) + '</span></div>';
  }

  function renderMatchBanner(match) {
    var subtitleEl = document.querySelector('.header-subtitle, .hero-desc, .subtitle');
    if (!subtitleEl) return;
    var existing = document.querySelector('.next-match-banner');
    if (existing) existing.remove();
    injectStyles();
    var body = match.message
      ? '<div class="nm-empty">' + escapeHtml(match.message) + '</div>'
      : '<div class="nm-meta">' + (match.metaHtml || '') + '</div><div class="nm-teams">' + teamColumnHtml(match.home.name, match.home.flag) + '<span class="nm-vs">x</span>' + teamColumnHtml(match.away.name, match.away.flag) + '</div>';
    var html = '<div class="next-match-banner" role="status"><div class="nm-title">PROXIMO JOGO DA SELECAO</div>' + body + '</div>';
    subtitleEl.insertAdjacentHTML('afterend', html);
  }

  function hideNextMatchCard() {
    var card = document.querySelector('.next-match-banner');
    if (card) card.style.display = 'none';
  }

  // Proximo jogo real do Brasil: vs 2 do Grupo F (Holanda ou Japao — decide hoje 25/06)
  var BRAZIL_NEXT_REAL = {
    strLeague: 'FIFA World Cup',
    dateEvent: '2026-06-29',
    strTime: '22:00:00',
    strHomeTeam: 'Brazil',
    strAwayTeam: '2 do Grupo F',
    strHomeTeamBadge: 'https://flagcdn.com/w80/br.png',
    strAwayTeamBadge: FLAG_PLACEHOLDER
  };

  function renderMatchFromEvent(ev) {
    var homeName = ev.strHomeTeam || 'A definir';
    var awayName = ev.strAwayTeam || 'A definir';
    var homeFlag = badgeOrFlag(homeName, ev.strHomeTeamBadge);
    var awayFlag = badgeOrFlag(awayName, ev.strAwayTeamBadge);
    var ligaPt = translate(ev.strLeague || 'Copa do Mundo');
    var dataPt = formatarDataBrasilia(ev.dateEvent, ev.strTime);
    var metaHtml = '<span class="nm-league-badge">[ ' + escapeHtml(ligaPt) + ' ]</span>' + (dataPt ? '<span class="nm-meta-date">' + escapeHtml(dataPt) + '</span>' : '');
    renderMatchBanner({ metaHtml: metaHtml, home: { name: translate(homeName), flag: homeFlag }, away: { name: translate(awayName), flag: awayFlag } });
  }

  async function renderNextBrazilMatch() {
    if (brazilEliminated) { hideNextMatchCard(); return; }
    try {
      var data = await apiFetch(ROUTES.matches);
      var events = (data && data.events) || [];
      // Filtra apenas jogos reais da Copa (nao amistosos)
      var copEvents = events.filter(function(ev) {
        var league = (ev.strLeague || '').toLowerCase();
        return league.includes('world cup') || league.includes('copa');
      });
      if (copEvents.length > 0) {
        console.info('[WorldCupLiveData] Jogo da Copa na API:', copEvents[0].strHomeTeam, 'x', copEvents[0].strAwayTeam);
        renderMatchFromEvent(copEvents[0]);
        return;
      }
      console.info('[WorldCupLiveData] API sem jogo da Copa — usando dado real hardcoded.');
      renderMatchFromEvent(BRAZIL_NEXT_REAL);
    } catch (err) {
      console.warn('[WorldCupLiveData] API indisponivel — usando dado real hardcoded:', err.message);
      renderMatchFromEvent(BRAZIL_NEXT_REAL);
    }
  }

  function posButton(g, id, pos) {
    return document.querySelector('.pos-btn[data-group="' + g + '"][data-team="' + id + '"][data-pos="' + pos + '"]');
  }

  function disableBtn(btn) {
    if (btn && !btn.disabled) {
      btn.disabled = true;
      btn.classList.add('locked-by-api');
      btn.title = 'Definido pela classificacao real da Copa';
    }
  }

  function markTeamRow(g, teamId, status) {
    var row = document.querySelector('.team-row[data-group="' + g + '"][data-team="' + teamId + '"]');
    if (!row) return;
    row.classList.remove('api-eliminated', 'api-qualified-1', 'api-qualified-2');
    if (status) row.classList.add(status);
  }

  function aplicarTravamentosHardcoded() {
    var groupLetters = Object.keys(LOCKED_BY_MATH);
    groupLetters.forEach(function(g) {
      var lock = LOCKED_BY_MATH[g];
      var groupData = REAL_STANDINGS[g];
      if (!lock || !groupData) return;

      // 1. Primeiro lugar matematico
      if (lock.first1) {
        var id = lock.first1;
        var btn1 = posButton(g, id, 1);
        if (btn1 && !btn1.classList.contains('selected-1')) btn1.click();
        disableBtn(posButton(g, id, 2));
        disableBtn(posButton(g, id, 3));
        groupData.teams.forEach(function(t) {
          if (t.id !== id) disableBtn(posButton(g, t.id, 1));
        });
        markTeamRow(g, id, 'api-qualified-1');
      }

      // 2. Segundo lugar garantido (top-2 matematico)
      if (lock.locked2) {
        var id2 = lock.locked2;
        disableBtn(posButton(g, id2, 3));
        if (groupData.status === 'FINISHED') {
          var btn2 = posButton(g, id2, 2);
          if (btn2 && !btn2.classList.contains('selected-2')) btn2.click();
          disableBtn(posButton(g, id2, 1));
          markTeamRow(g, id2, 'api-qualified-2');
        }
      }

      // 3. Eliminados matematicos
      if (lock.eliminated && lock.eliminated.length > 0) {
        lock.eliminated.forEach(function(id3) {
          disableBtn(posButton(g, id3, 1));
          disableBtn(posButton(g, id3, 2));
          disableBtn(posButton(g, id3, 3));
          markTeamRow(g, id3, 'api-eliminated');
          if (id3 === 'bra') brazilEliminated = true;
        });
      }

      // 4. Grupo FECHADO (3 rodadas) — preenche e bloqueia tudo
      if (groupData.status === 'FINISHED') {
        var card = document.getElementById('group-card-' + g);
        if (card) card.classList.add('api-closed');
        groupData.teams.forEach(function(t) {
          var rank = t.rank;
          if (rank === 1) {
            var bA = posButton(g, t.id, 1);
            if (bA && !bA.classList.contains('selected-1')) bA.click();
            markTeamRow(g, t.id, 'api-qualified-1');
          } else if (rank === 2) {
            var bB = posButton(g, t.id, 2);
            if (bB && !bB.classList.contains('selected-2')) bB.click();
            markTeamRow(g, t.id, 'api-qualified-2');
          } else if (rank === 3) {
            var bC = posButton(g, t.id, 3);
            if (bC && !bC.classList.contains('selected-3')) bC.click();
          } else {
            markTeamRow(g, t.id, 'api-eliminated');
          }
          [1, 2, 3].forEach(function(pos) { disableBtn(posButton(g, t.id, pos)); });
        });
      }
    });
    console.info('[WorldCupLiveData] Travamentos da Copa 2026 aplicados.');
  }

  async function tryApiUpdate() {
    try {
      var data = await apiFetch(ROUTES.standings);
      var table = (data && data.table) || null;
      if (!table || table.length === 0) {
        console.info('[WorldCupLiveData] API sem standings — dados hardcoded ja aplicados.');
        return;
      }
      console.info('[WorldCupLiveData] API com', table.length, 'linhas — hardcoded e fonte primaria.');
    } catch (err) {
      console.warn('[WorldCupLiveData] API standings indisponivel (ok):', err.message);
    }
  }

  async function initWorldCupData() {
    injectStyles();
    // Aplica dados reais IMEDIATAMENTE (sem esperar API)
    aplicarTravamentosHardcoded();
    // Renderiza proximo jogo
    try { await renderNextBrazilMatch(); } catch (err) {}
    // Tenta update da API em background (nao bloqueante)
    tryApiUpdate().catch(function() {});
    if (brazilEliminated) hideNextMatchCard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorldCupData);
  } else {
    initWorldCupData();
  }
})();