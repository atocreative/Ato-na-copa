/**
 * Ato na Copa — World Cup Live Engine (Autonomo)
 * ─────────────────────────────────────────────────────────────────────────────
 * Consome /api/live (que retorna standings calculadas de todos os grupos)
 * e aplica automaticamente:
 *  - Travamentos matematicos (1o lugar garantido, 2o garantido, eliminados)
 *  - Preenchimento automatico de grupos fechados (3 rodadas jogadas)
 *  - Card de proximo jogo do Brasil (sem amistosos)
 *  - Polling automatico a cada 10 minutos
 *  - Indicador visual de "Atualizado em HH:MM"
 *
 * Degradacao gracosa: se a API falhar, o site continua funcionando normalmente
 * (usuario palpita livremente). Sem dados hardcoded no frontend.
 */

// ── WhatsApp Deep Link ────────────────────────────────────────────────────────
function openWhatsApp(phone, message, buttonName) {
  if (typeof gtag === 'function') {
    gtag('event', 'click_whatsapp', { 'button_name': buttonName, 'plataforma': 'whatsapp' });
  }
  const text = encodeURIComponent(message);
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    window.location.href = 'https://wa.me/' + phone + '?text=' + text;
  } else if (/android/i.test(ua)) {
    window.location.href = 'whatsapp://send?phone=' + phone + '&text=' + text;
  } else {
    window.open('https://web.whatsapp.com/send?phone=' + phone + '&text=' + text, '_blank');
  }
}

(function WorldCupLiveEngine() {
  'use strict';

  // ── Configuracao ─────────────────────────────────────────────────────────────
  const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos
  const FLAG_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

  const ptBR = {
    'FIFA World Cup':'Copa do Mundo','World Cup':'Copa do Mundo',
    'International Friendlies':'Amistosos','Friendly':'Amistoso',
    'Brazil':'Brasil','Argentina':'Argentina','France':'Franca',
    'England':'Inglaterra','Spain':'Espanha','Germany':'Alemanha',
    'Netherlands':'Holanda','Portugal':'Portugal','Morocco':'Marrocos',
    'Egypt':'Egito','South Africa':'Africa do Sul','Mexico':'Mexico',
    'United States':'Estados Unidos','USA':'Estados Unidos',
    'Canada':'Canada','Colombia':'Colombia','Norway':'Noruega',
    'Sweden':'Suecia','Japan':'Japao','Switzerland':'Suica',
    'Croatia':'Croacia','Ghana':'Gana','Scotland':'Escocia',
    'Uruguay':'Uruguai','Austria':'Austria','Belgium':'Belgica',
    'Australia':'Australia','Ecuador':'Equador',
    'Ivory Coast':'Costa do Marfim','South Korea':'Coreia do Sul',
    'Saudi Arabia':'Arabia Saudita','Iran':'Ira','Qatar':'Catar',
    'Iraq':'Iraque','Uzbekistan':'Uzbequistao','Jordan':'Jordania',
    'New Zealand':'Nova Zelandia','Panama':'Panama','Tunisia':'Tunisia',
    'Senegal':'Senegal','Algeria':'Algeria','Turkey':'Turquia',
    'Turkiye':'Turquia','Haiti':'Haiti','Paraguay':'Paraguai',
    'Cape Verde':'Cabo Verde','Bosnia-Herzegovina':'Bosnia',
    'Bosnia and Herzegovina':'Bosnia','Czechia':'Rep. Tcheca',
    'Czech Republic':'Rep. Tcheca','DR Congo':'RD Congo','Curacao':'Curacao',
  };
  function tr(t){ return ptBR[t]||t; }

  const ISO2 = {
    'mexico':'mx','south africa':'za','south korea':'kr','korea republic':'kr',
    'czech republic':'cz','czechia':'cz','canada':'ca','switzerland':'ch',
    'qatar':'qa','bosnia-herzegovina':'ba','bosnia and herzegovina':'ba',
    'brazil':'br','morocco':'ma','scotland':'gb-sct','haiti':'ht',
    'united states':'us','usa':'us','paraguay':'py','australia':'au',
    'turkey':'tr','turkiye':'tr','germany':'de','ecuador':'ec',
    'ivory coast':'ci','curacao':'cw','netherlands':'nl','japan':'jp',
    'tunisia':'tn','sweden':'se','belgium':'be','iran':'ir','egypt':'eg',
    'new zealand':'nz','spain':'es','uruguay':'uy','saudi arabia':'sa',
    'cape verde':'cv','france':'fr','norway':'no','senegal':'sn',
    'iraq':'iq','argentina':'ar','austria':'at','algeria':'dz',
    'jordan':'jo','portugal':'pt','colombia':'co','uzbekistan':'uz',
    'dr congo':'cd','england':'gb-eng','croatia':'hr','ghana':'gh','panama':'pa',
  };
  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
  function flagUrl(name, badge){ if(badge) return badge; const iso=ISO2[norm(name)]; return iso?'https://flagcdn.com/w80/'+iso+'.png':FLAG_PLACEHOLDER; }

  // ID local → nome PT-BR (para exibir no card de proximo jogo)
  const LOCAL_TO_PTBR = {
    'mex':'Mexico','rsa':'Africa do Sul','kor':'Coreia do Sul','cze':'Rep. Tcheca',
    'can':'Canada','sui':'Suica','qat':'Catar','bih':'Bosnia',
    'bra':'Brasil','mar':'Marrocos','sco':'Escocia','hai':'Haiti',
    'usa':'Estados Unidos','par':'Paraguai','aus':'Australia','tur':'Turquia',
    'ger':'Alemanha','ecu':'Equador','civ':'Costa do Marfim','cur':'Curacao',
    'ned':'Holanda','jpn':'Japao','tun':'Tunisia','swe':'Suecia',
    'bel':'Belgica','irn':'Ira','egy':'Egito','nzl':'Nova Zelandia',
    'esp':'Espanha','uru':'Uruguai','ksa':'Arabia Saudita','cpv':'Cabo Verde',
    'fra':'Franca','nor':'Noruega','sen':'Senegal','irq':'Iraque',
    'arg':'Argentina','aut':'Austria','alg':'Algeria','jor':'Jordania',
    'por':'Portugal','col':'Colombia','uzb':'Uzbequistao','cod':'RD Congo',
    'eng':'Inglaterra','cro':'Croacia','gha':'Gana','pan':'Panama',
  };
  const LOCAL_TO_FLAG = {
    'mex':'mx','rsa':'za','kor':'kr','cze':'cz','can':'ca','sui':'ch',
    'qat':'qa','bih':'ba','bra':'br','mar':'ma','sco':'gb-sct','hai':'ht',
    'usa':'us','par':'py','aus':'au','tur':'tr','ger':'de','ecu':'ec',
    'civ':'ci','cur':'cw','ned':'nl','jpn':'jp','tun':'tn','swe':'se',
    'bel':'be','irn':'ir','egy':'eg','nzl':'nz','esp':'es','uru':'uy',
    'ksa':'sa','cpv':'cv','fra':'fr','nor':'no','sen':'sn','irq':'iq',
    'arg':'ar','aut':'at','alg':'dz','jor':'jo','por':'pt','col':'co',
    'uzb':'uz','cod':'cd','eng':'gb-eng','cro':'hr','gha':'gh','pan':'pa',
  };
  function localFlagUrl(id){ const iso=LOCAL_TO_FLAG[id]; return iso?'https://flagcdn.com/w80/'+iso+'.png':FLAG_PLACEHOLDER; }

  // ── Injecao de estilos ────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('wc-live-styles')) return;
    const s = document.createElement('style');
    s.id = 'wc-live-styles';
    s.textContent =
      // Card proximo jogo
      '.next-match-banner{max-width:520px;margin:1.25rem auto 0;padding:14px 22px 16px;background:#fff;border:1px solid rgba(1,37,98,0.15);border-radius:10px;font-family:"Roboto",sans-serif;}' +
      '.nm-title{font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#027b35;text-align:center;margin-bottom:3px;}' +
      '.nm-meta{text-align:center;margin-bottom:14px;line-height:1.8;}' +
      '.nm-league-badge{font-size:12px;font-weight:900;color:#006b3f;background:#e8f3ec;padding:2px 8px;border-radius:6px;text-transform:uppercase;margin-right:8px;display:inline-block;}' +
      '.nm-meta-date{font-size:13px;color:#374151;font-weight:500;}' +
      '.nm-teams{display:flex;align-items:flex-start;justify-content:space-between;}' +
      '.nm-team{display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;min-width:0;}' +
      '.nm-flag{width:46px;height:46px;border-radius:8px;object-fit:cover;background:#eef0f4;border:1px solid rgba(1,37,98,0.15);}' +
      '.nm-team-name{font-size:14px;color:#012562;font-weight:700;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}' +
      '.nm-vs{align-self:flex-start;margin-top:18px;color:#012562;opacity:.45;font-size:14px;font-weight:700;padding:0 6px;}' +
      '.nm-empty{text-align:center;color:#012562;opacity:.7;font-size:14px;font-weight:500;padding:8px 0 4px;}' +
      // Indicador de atualizacao
      '.wc-live-badge{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;background:#e8f3ec;color:#027b35;padding:3px 8px;border-radius:20px;margin-left:8px;vertical-align:middle;}' +
      '.wc-live-dot{width:6px;height:6px;border-radius:50%;background:#027b35;animation:wcPulse 1.8s infinite;}' +
      '@keyframes wcPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}' +
      // Travamentos
      '.pos-btn.locked-by-api{opacity:.32!important;cursor:not-allowed!important;pointer-events:none!important;}' +
      // Estados dos times
      '.team-row.api-eliminated{opacity:.42;}' +
      '.team-row.api-eliminated .team-name::after{content:" ELIM.";color:#c0392b;font-size:9px;font-weight:700;letter-spacing:.5px;margin-left:4px;}' +
      '.team-row.api-qualified-1 .team-name::after{content:" \u2605 1\u00ba";color:#027b35;font-size:10px;font-weight:700;margin-left:4px;}' +
      '.team-row.api-qualified-2 .team-name::after{content:" \u2605 2\u00ba";color:#027b35;font-size:10px;font-weight:700;margin-left:4px;}' +
      // Grupos fechados
      '.group-card.api-closed .group-header{background:linear-gradient(135deg,#027b35 0%,#004d1f 100%);border-radius:8px 8px 0 0;}' +
      '.group-card.api-closed .group-name{color:#fff!important;}' +
      '.group-card.api-closed .group-status{background:rgba(255,255,255,.18);color:#fff!important;border-color:rgba(255,255,255,.3);}';
    document.head.appendChild(s);
  }

  // ── Indicador "Atualizado em HH:MM" ──────────────────────────────────────────
  function upsertBadge(updatedAt) {
    const header = document.querySelector('.site-header, header');
    if (!header) return;
    let badge = document.getElementById('wc-live-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'wc-live-badge';
      badge.className = 'wc-live-badge';
      header.appendChild(badge);
    }
    const t = updatedAt ? new Date(updatedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '--:--';
    badge.innerHTML = '<span class="wc-live-dot"></span>AO VIVO &bull; ' + t;
  }

  // ── Utilitarios DOM ───────────────────────────────────────────────────────────
  function posBtn(g, id, pos) {
    return document.querySelector('.pos-btn[data-group="'+g+'"][data-team="'+id+'"][data-pos="'+pos+'"]');
  }
  function lockBtn(btn) {
    if (btn && !btn.disabled) {
      btn.disabled = true;
      btn.classList.add('locked-by-api');
      btn.title = 'Definido pelos resultados reais da Copa';
    }
  }
  function clickIfNot(btn, cls) {
    if (btn && !btn.classList.contains(cls)) btn.click();
  }
  function markRow(g, id, status) {
    const row = document.querySelector('.team-row[data-group="'+g+'"][data-team="'+id+'"]');
    if (!row) return;
    row.classList.remove('api-eliminated','api-qualified-1','api-qualified-2');
    if (status) row.classList.add(status);
  }

  // ── Motor de travamentos matematicos ─────────────────────────────────────────
  /**
   * Para cada grupo, determina automaticamente:
   *  - Quem e matematicamente 1o (points > maxPossible de todos os outros)
   *  - Quem e matematicamente no top-2 (points > maxPossible do 3o e 4o)
   *  - Quem esta matematicamente eliminado (maxPossible < points do 2o atual)
   *  - Se o grupo esta fechado (todos jogaram 3 partidas)
   */
  function applyLocks(groups) {
    let brazilEliminated = false;

    Object.keys(groups).forEach(g => {
      const teamsList = groups[g]; // ja ordenado por rank no servidor
      if (!teamsList || teamsList.length < 2) return;

      const isFinished = teamsList.finished === true ||
        (teamsList.every && teamsList.every(t => t.played >= 3));

      // Enriquece: calcula maxPossivel para cada time
      const withMax = teamsList.map(t => ({
        ...t,
        maxPossible: t.pts + Math.max(0, 3 - t.played) * 3,
      }));

      const [t1, t2, t3, t4] = withMax;

      withMax.forEach((time, idx) => {
        const outros = withMax.filter((_, i) => i !== idx);

        // A) Matematicamente 1o lugar
        const is1st = outros.every(o => time.pts > o.maxPossible);
        if (is1st) {
          clickIfNot(posBtn(g, time.localId, 1), 'selected-1');
          lockBtn(posBtn(g, time.localId, 2));
          lockBtn(posBtn(g, time.localId, 3));
          outros.forEach(o => { if(o.localId) lockBtn(posBtn(g, o.localId, 1)); });
          markRow(g, time.localId, 'api-qualified-1');
        }

        // B) Matematicamente top-2 (nao pode cair para 3o ou 4o)
        const garantidoTop2 = t3 && t4 &&
          time.pts > t3.maxPossible && time.pts > t4.maxPossible &&
          time !== t3 && time !== t4;
        if (garantidoTop2) {
          lockBtn(posBtn(g, time.localId, 3));
          if (!is1st && !document.querySelector('.pos-btn[data-group="'+g+'"][data-team="'+time.localId+'"][data-pos="1"].selected-1')) {
            markRow(g, time.localId, 'api-qualified-2');
          }
        }

        // C) Matematicamente eliminado
        const eliminado = t2 && time !== t2 &&
          time.maxPossible < t2.pts;
        if (eliminado) {
          lockBtn(posBtn(g, time.localId, 1));
          lockBtn(posBtn(g, time.localId, 2));
          lockBtn(posBtn(g, time.localId, 3));
          markRow(g, time.localId, 'api-eliminated');
          if (time.localId === 'bra') brazilEliminated = true;
        }
      });

      // D) Grupo fechado — preenche tudo e bloqueia
      if (isFinished) {
        const card = document.getElementById('group-card-' + g);
        if (card) card.classList.add('api-closed');

        teamsList.forEach(t => {
          const rank = t.rank;
          if (rank === 1) {
            clickIfNot(posBtn(g, t.localId, 1), 'selected-1');
            markRow(g, t.localId, 'api-qualified-1');
          } else if (rank === 2) {
            clickIfNot(posBtn(g, t.localId, 2), 'selected-2');
            markRow(g, t.localId, 'api-qualified-2');
          } else if (rank === 3) {
            clickIfNot(posBtn(g, t.localId, 3), 'selected-3');
          } else {
            markRow(g, t.localId, 'api-eliminated');
          }
          [1,2,3].forEach(pos => lockBtn(posBtn(g, t.localId, pos)));
        });
      }
    });

    return brazilEliminated;
  }

  // ── Card do proximo jogo do Brasil ────────────────────────────────────────────
  function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function teamColHtml(name, flag){
    return '<div class="nm-team"><img class="nm-flag" src="'+flag+'" alt="'+escHtml(name)+'" onerror="this.onerror=null;this.src=\''+FLAG_PLACEHOLDER+'\'"><span class="nm-team-name">'+escHtml(name)+'</span></div>';
  }
  function formatBrasilia(dateStr, timeStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T' + (timeStr||'00:00:00') + 'Z');
    if (isNaN(d)) return '';
    return d.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  }

  function renderMatchBanner(data) {
    const anchor = document.querySelector('.header-subtitle,.hero-desc,.subtitle');
    if (!anchor) return;
    const old = document.querySelector('.next-match-banner');
    if (old) old.remove();

    let body;
    if (data.message) {
      body = '<div class="nm-empty">'+escHtml(data.message)+'</div>';
    } else {
      const meta = '<span class="nm-league-badge">[ '+escHtml(tr(data.league||'Copa do Mundo'))+' ]</span>' +
        (data.date ? '<span class="nm-meta-date">'+escHtml(data.date)+'</span>' : '');
      body = '<div class="nm-meta">'+meta+'</div>' +
             '<div class="nm-teams">'+teamColHtml(data.home,data.homeFlag)+'<span class="nm-vs">x</span>'+teamColHtml(data.away,data.awayFlag)+'</div>';
    }
    anchor.insertAdjacentHTML('afterend',
      '<div class="next-match-banner" role="status"><div class="nm-title">PROXIMO JOGO DA SELECAO</div>'+body+'</div>'
    );
  }

  function hideMatchBanner() {
    const c = document.querySelector('.next-match-banner');
    if (c) c.style.display = 'none';
  }

  async function updateMatchCard(brazilEliminated) {
    if (brazilEliminated) { hideMatchBanner(); return; }

    try {
      const res = await fetch('/api/matches');
      if (!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      const events = data.events || [];
      // Filtra Copa do Mundo (nao amistosos)
      const copEvents = events.filter(ev => {
        const lg = (ev.strLeague||'').toLowerCase();
        return lg.includes('world cup') || lg.includes('copa');
      });
      if (copEvents.length > 0) {
        const ev = copEvents[0];
        renderMatchBanner({
          league: ev.strLeague,
          date: formatBrasilia(ev.dateEvent, ev.strTime),
          home: tr(ev.strHomeTeam||'Brasil'),
          homeFlag: flagUrl(ev.strHomeTeam, ev.strHomeTeamBadge),
          away: tr(ev.strAwayTeam||'A definir'),
          awayFlag: flagUrl(ev.strAwayTeam, ev.strAwayTeamBadge),
        });
        return;
      }
    } catch (e) {
      console.warn('[match card] API indisponivel:', e.message);
    }

    // Fallback: Brasil classificado do Grupo C — aguarda definicao do adversario
    renderMatchBanner({
      league: 'FIFA World Cup',
      date: '',
      home: 'Brasil',
      homeFlag: 'https://flagcdn.com/w80/br.png',
      away: 'A definir',
      awayFlag: FLAG_PLACEHOLDER,
    });
  }

  // ── Ciclo principal de atualizacao ────────────────────────────────────────────
  async function refresh() {
    try {
      const res = await fetch('/api/live');
      if (!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();

      if (!data.groups || Object.keys(data.groups).length === 0) {
        console.info('[WorldCupLiveEngine] API sem grupos — simulador livre.');
        return;
      }

      console.info('[WorldCupLiveEngine] Atualizando com', data.totalMatches||'?', 'jogos | updatedAt:', data.updatedAt);

      const brazilEliminated = applyLocks(data.groups);
      await updateMatchCard(brazilEliminated);
      upsertBadge(data.updatedAt);

    } catch (e) {
      console.warn('[WorldCupLiveEngine] Erro ao atualizar:', e.message);
      // Nao interrompe o site — usuario continua palpitando livremente
    }
  }

  // ── Boot ──────────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    // Primeira atualizacao
    refresh();
    // Polling a cada 10 minutos (renovacao automatica)
    setInterval(refresh, POLL_INTERVAL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
