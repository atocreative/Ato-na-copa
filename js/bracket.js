/**
 * Bracket Module — Complete rebuild from bracket-copa-2026 (1).html reference
 * Uses l_/r_ match IDs, column-based layout, dynamic SVG connector lines
 */
const BracketModule = (() => {

  /* ============================================================
     DATA LAYER — FIFA 2026 Exact Matrix
  ============================================================ */
  const R32_MATCHES = [
    { id: 'r32_1', next: 'r16_1', nextSlot: 1, seed1: '2A', seed2: '2B' },
    { id: 'r32_2', next: 'r16_1', nextSlot: 2, seed1: '2D', seed2: '2G' },
    { id: 'r32_3', next: 'r16_2', nextSlot: 1, seed1: '2H', seed2: '2I' },
    { id: 'r32_4', next: 'r16_2', nextSlot: 2, seed1: '2K', seed2: '2L' },
    { id: 'r32_5', next: 'r16_3', nextSlot: 1, seed1: '1B', seed2: '2E' },
    { id: 'r32_6', next: 'r16_3', nextSlot: 2, seed1: '1C', seed2: '2F' },
    { id: 'r32_7', next: 'r16_4', nextSlot: 1, seed1: '1F', seed2: '2C' },
    { id: 'r32_8', next: 'r16_4', nextSlot: 2, seed1: '1H', seed2: '2J' },
    { id: 'r32_9',  next: 'r16_5', nextSlot: 1, seed1: '1A', seed2: '3_A' },
    { id: 'r32_10', next: 'r16_5', nextSlot: 2, seed1: '1D', seed2: '3_D' },
    { id: 'r32_11', next: 'r16_6', nextSlot: 1, seed1: '1E', seed2: '3_E' },
    { id: 'r32_12', next: 'r16_6', nextSlot: 2, seed1: '1G', seed2: '3_G' },
    { id: 'r32_13', next: 'r16_7', nextSlot: 1, seed1: '1I', seed2: '3_I' },
    { id: 'r32_14', next: 'r16_7', nextSlot: 2, seed1: '1J', seed2: '3_J' },
    { id: 'r32_15', next: 'r16_8', nextSlot: 1, seed1: '1K', seed2: '3_K' },
    { id: 'r32_16', next: 'r16_8', nextSlot: 2, seed1: '1L', seed2: '3_L' },
  ];

  const R16_MATCHES = [
    { id: 'r16_1', next: 'qf_1', nextSlot: 1 },
    { id: 'r16_2', next: 'qf_1', nextSlot: 2 },
    { id: 'r16_3', next: 'qf_2', nextSlot: 1 },
    { id: 'r16_4', next: 'qf_2', nextSlot: 2 },
    { id: 'r16_5', next: 'qf_3', nextSlot: 1 },
    { id: 'r16_6', next: 'qf_3', nextSlot: 2 },
    { id: 'r16_7', next: 'qf_4', nextSlot: 1 },
    { id: 'r16_8', next: 'qf_4', nextSlot: 2 },
  ];

  const QF_MATCHES = [
    { id: 'qf_1', next: 'sf_1', nextSlot: 1 },
    { id: 'qf_2', next: 'sf_1', nextSlot: 2 },
    { id: 'qf_3', next: 'sf_2', nextSlot: 1 },
    { id: 'qf_4', next: 'sf_2', nextSlot: 2 },
  ];

  const SF_MATCHES = [
    { id: 'sf_1', next: 'final', nextSlot: 1 },
    { id: 'sf_2', next: 'final', nextSlot: 2 },
  ];

  const FINAL_MATCH = { id: 'final', next: 'champion', nextSlot: 1 };
  const ALL_MATCH_DEFS = [...R32_MATCHES, ...R16_MATCHES, ...QF_MATCHES, ...SF_MATCHES, FINAL_MATCH];

  // Matriz Combinatória de Terceiros — FIFA Official
  const THIRDS_RULES = {
    '1A': ['C', 'E', 'F', 'H', 'I'],
    '1D': ['B', 'E', 'F', 'G', 'H'],
    '1E': ['A', 'B', 'C', 'D', 'G'],
    '1G': ['A', 'B', 'C', 'D', 'L'],
    '1I': ['C', 'D', 'F', 'G', 'H'],
    '1J': ['A', 'B', 'D', 'E', 'K'],
    '1K': ['A', 'B', 'I', 'J', 'L'],
    '1L': ['E', 'I', 'J', 'K', 'L']
  };
  const THIRDS_KEYS = ['1A', '1D', '1E', '1G', '1I', '1J', '1K', '1L'];

  const matches = {};
  const listeners = [];

  /*
   * Reference-file mapping:
   * Left side of bracket:  r32_1..8 → r16_1..4 → qf_1..2 → sf_1 → final
   * Right side of bracket: r32_9..16 → r16_5..8 → qf_3..4 → sf_2 → final
   *
   * In the reference: l_1_1..8 = our r32_1..8, l_2_1..4 = our r16_1..4, etc.
   * We keep our naming but render the reference's visual layout.
   */

  // These map our match IDs to [side, round, index] for rendering
  const LEFT_PHASES = [
    { label: '16 AVOS', ids: ['r32_1','r32_2','r32_3','r32_4','r32_5','r32_6','r32_7','r32_8'] },
    { label: 'OITAVAS', ids: ['r16_1','r16_2','r16_3','r16_4'] },
    { label: 'QUARTAS', ids: ['qf_1','qf_2'] },
    { label: 'SEMIFINAL', ids: ['sf_1'] },
  ];

  const RIGHT_PHASES = [
    { label: '16 AVOS', ids: ['r32_9','r32_10','r32_11','r32_12','r32_13','r32_14','r32_15','r32_16'] },
    { label: 'OITAVAS', ids: ['r16_5','r16_6','r16_7','r16_8'] },
    { label: 'QUARTAS', ids: ['qf_3','qf_4'] },
    { label: 'SEMIFINAL', ids: ['sf_2'] },
  ];

  function onChange(fn) { listeners.push(fn); }
  function notify() { listeners.forEach(fn => fn(getChampion())); }

  /* ============================================================
     INIT
  ============================================================ */
  function init() {
    ALL_MATCH_DEFS.forEach(m => {
      matches[m.id] = { team1: null, team2: null, winner: null, seed1: m.seed1, seed2: m.seed2 };
    });
    matches['champion'] = { team1: null, team2: null, winner: null };
    matches['third_place'] = { team1: null, team2: null, winner: null };
    render();

    window.addEventListener('resize', () => {
      requestAnimationFrame(() => drawLines());
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => requestAnimationFrame(() => drawLines()));
    }
  }

  function getChampion() {
    const finalMatch = matches['final'];
    if (finalMatch && finalMatch.winner) {
      return TEAMS[finalMatch.winner] || null;
    }
    return null;
  }

  /* ============================================================
     THIRDS ALLOCATION (Backtracking Solver)
  ============================================================ */
  function solveThirdsAllocation(availableThirds) {
    if (availableThirds.length !== 8) return null;
    const allocation = {};
    const used = new Set();
    const thirdsGroups = availableThirds.map(t => ({ id: t.id, group: t.fromGroup }));

    function backtrack(idx) {
      if (idx === 8) return true;
      const leaderSeed = THIRDS_KEYS[idx];
      const allowedGroups = THIRDS_RULES[leaderSeed];
      for (let i = 0; i < 8; i++) {
        if (!used.has(i)) {
          const candidate = thirdsGroups[i];
          if (allowedGroups.includes(candidate.group)) {
            used.add(i);
            allocation[leaderSeed] = candidate.id;
            if (backtrack(idx + 1)) return true;
            used.delete(i);
            delete allocation[leaderSeed];
          }
        }
      }
      return false;
    }

    if (backtrack(0)) return allocation;
    return null;
  }

  /* ============================================================
     EVALUATE REALTIME (Groups → Bracket seeding)
  ============================================================ */
  function evaluateRealtime(groupsState, qualifiedThirds) {
    const firsts = {};
    const seconds = {};
    GROUP_NAMES.forEach(g => {
      if (groupsState[g]) {
        firsts[g] = groupsState[g].first;
        seconds[g] = groupsState[g].second;
      }
    });

    let thirdsAllocation = null;
    if (qualifiedThirds && qualifiedThirds.length === 8) {
      thirdsAllocation = solveThirdsAllocation(qualifiedThirds);
      if (!thirdsAllocation) {
        thirdsAllocation = {};
        qualifiedThirds.forEach((t, i) => {
          thirdsAllocation[THIRDS_KEYS[i]] = t.id;
        });
      }
    }

    R32_MATCHES.forEach(m => {
      const match = matches[m.id];
      const oldT1 = match.team1 ? match.team1.id : null;
      const oldT2 = match.team2 ? match.team2.id : null;

      const t1Id = resolveSeeding(m.seed1, firsts, seconds, thirdsAllocation);
      const t2Id = resolveSeeding(m.seed2, firsts, seconds, thirdsAllocation);

      if (oldT1 !== t1Id) {
        match.team1 = t1Id ? TEAMS[t1Id] : null;
        if (match.winner === oldT1 && oldT1 !== null) clearDownstream(m.id);
      }
      if (oldT2 !== t2Id) {
        match.team2 = t2Id ? TEAMS[t2Id] : null;
        if (match.winner === oldT2 && oldT2 !== null) clearDownstream(m.id);
      }
    });

    render();
  }

  function resolveSeeding(seed, firsts, seconds, thirdsAllocation) {
    if (!seed) return null;
    if (seed.startsWith('3_')) {
      if (!thirdsAllocation) return null;
      const leaderKey = '1' + seed.substring(2);
      return thirdsAllocation[leaderKey] || null;
    }
    const pos = seed[0];
    const group = seed.substring(1);
    if (pos === '1') return firsts[group] || null;
    if (pos === '2') return seconds[group] || null;
    return null;
  }

  /* ============================================================
     WINNER SELECTION + CASCADING
  ============================================================ */
  function selectWinner(matchId, teamId) {
    const match = matches[matchId];
    if (!match) return;

    if (matchId === 'final') {
      const thirdMatch = matches['third_place'];
      if (!thirdMatch || !thirdMatch.winner) {
        if (typeof showToast === 'function') {
          showToast("POR FAVOR, DEFINA O TERCEIRO LUGAR PRIMEIRO!", 3500);
        } else {
          alert("Por favor, defina o terceiro lugar primeiro!");
        }
        return;
      }
    }

    const t1Id = match.team1 ? match.team1.id : null;
    const t2Id = match.team2 ? match.team2.id : null;
    if (teamId !== t1Id && teamId !== t2Id) return;

    // Toggle: clicking the same winner deselects
    if (match.winner === teamId) {
      match.winner = null;
      clearDownstream(matchId);
      render();
      notify();
      return;
    }

    match.winner = teamId;

    const def = ALL_MATCH_DEFS.find(d => d.id === matchId);
    if (def && def.next) {
      const nextMatch = matches[def.next];
      if (nextMatch) {
        const winnerTeam = TEAMS[teamId];
        if (def.nextSlot === 1) {
          if (nextMatch.team1 && nextMatch.team1.id !== teamId) clearDownstream(def.next);
          nextMatch.team1 = winnerTeam;
        } else {
          if (nextMatch.team2 && nextMatch.team2.id !== teamId) clearDownstream(def.next);
          nextMatch.team2 = winnerTeam;
        }
        nextMatch.winner = null;
      }

      if (matchId === 'final') {
        matches['champion'].team1 = TEAMS[teamId];
      }
    }

    render();
    notify();
  }

  function clearDownstream(matchId) {
    const match = matches[matchId];
    if (!match) return;
    match.winner = null;

    const def = ALL_MATCH_DEFS.find(d => d.id === matchId);
    if (def && def.next) {
      const nextMatch = matches[def.next];
      if (nextMatch) {
        if (def.nextSlot === 1) nextMatch.team1 = null;
        else nextMatch.team2 = null;
        nextMatch.winner = null;
        clearDownstream(def.next);
      }
    }
  }

  function fillRandomly() {
    [R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES].forEach(phase => {
      phase.forEach(m => {
        const match = matches[m.id];
        if (match.team1 && match.team2 && !match.winner) {
          const winner = Math.random() < 0.5 ? match.team1.id : match.team2.id;
          selectWinner(m.id, winner);
        }
      });
    });

    const finalMatch = matches['final'];
    if (finalMatch.team1 && finalMatch.team2 && !finalMatch.winner) {
      const winner = Math.random() < 0.5 ? finalMatch.team1.id : finalMatch.team2.id;
      selectWinner('final', winner);
    }

    // Auto-fill third place
    const losers = getSemifinalLosers();
    matches['third_place'].team1 = losers.loser1;
    matches['third_place'].team2 = losers.loser2;
    const thirdMatch = matches['third_place'];
    if (thirdMatch.team1 && thirdMatch.team2 && !thirdMatch.winner) {
      const winner = Math.random() < 0.5 ? thirdMatch.team1.id : thirdMatch.team2.id;
      selectWinner('third_place', winner);
    }
  }

  function resetAll() {
    ALL_MATCH_DEFS.forEach(m => {
      matches[m.id].team1 = null;
      matches[m.id].team2 = null;
      matches[m.id].winner = null;
    });
    matches['champion'] = { team1: null, team2: null, winner: null };
    matches['third_place'] = { team1: null, team2: null, winner: null };
    render();
    notify();
  }

  function getSemifinalLosers() {
    const sf1 = matches['sf_1'];
    const sf2 = matches['sf_2'];
    let loser1 = null;
    let loser2 = null;

    if (sf1 && sf1.team1 && sf1.team2 && sf1.winner) {
      loser1 = sf1.winner === sf1.team1.id ? sf1.team2 : sf1.team1;
    }
    if (sf2 && sf2.team1 && sf2.team2 && sf2.winner) {
      loser2 = sf2.winner === sf2.team1.id ? sf2.team2 : sf2.team1;
    }
    return { loser1, loser2 };
  }

  /* ============================================================
     RENDER — Reference-file visual structure
  ============================================================ */
  function teamHTML(team, isWinner, isLoser, matchId, slot) {
    if (!team) {
      return '<div class="bk-team" data-code=""><div class="bk-flag" style="background:#e2e8f0"></div><span class="bk-name">—</span></div>';
    }
    const cls = 'bk-team' + (isWinner ? ' winner' : '') + (isLoser ? ' loser' : '');
    const flagUrl = getFlagUrl(team);
    const abbr = team.abbr || team.id.toUpperCase();
    const imgHtml = flagUrl
      ? '<img class="bk-flag" src="' + flagUrl + '" alt="' + abbr + '">'
      : '<div class="bk-flag" style="background:#e2e8f0"></div>';
    return '<div class="' + cls + '" data-code="' + team.id + '" data-match-id="' + matchId + '" data-slot="' + slot + '">'
         + imgHtml
         + '<span class="bk-name">' + abbr + '</span></div>';
  }

  function matchHTML(matchId) {
    const m = matches[matchId];
    if (!m) return '';
    const decided = m.winner ? 'decided' : '';
    const wT1 = m.winner && m.winner === (m.team1 ? m.team1.id : null);
    const wT2 = m.winner && m.winner === (m.team2 ? m.team2.id : null);
    const lT1 = m.winner && m.team1 && !wT1;
    const lT2 = m.winner && m.team2 && !wT2;
    return '<div class="bk-match ' + decided + '" data-match-id="' + matchId + '">'
         + teamHTML(m.team1, wT1, lT1, matchId, 't1')
         + '<div class="bk-vs">VS</div>'
         + teamHTML(m.team2, wT2, lT2, matchId, 't2')
         + '</div>';
  }

  function render() {
    const bracket = document.getElementById('bracket');
    if (!bracket) return;
    bracket.innerHTML = '';

    // Sync third place dispute
    const losers = getSemifinalLosers();
    matches['third_place'].team1 = losers.loser1;
    matches['third_place'].team2 = losers.loser2;
    if (matches['third_place'].winner) {
      const wId = matches['third_place'].winner;
      const t1Id = losers.loser1 ? losers.loser1.id : null;
      const t2Id = losers.loser2 ? losers.loser2.id : null;
      if (wId !== t1Id && wId !== t2Id) {
        matches['third_place'].winner = null;
      }
    }

    // ===== LEFT SIDE: rounds 1 → 4 =====
    LEFT_PHASES.forEach((phase, idx) => {
      const col = document.createElement('div');
      col.className = 'bk-column left-col';
      col.dataset.round = idx + 1;
      col.dataset.side = 'l';
      col.innerHTML = '<div class="bk-round-title">' + phase.label + '</div><div class="bk-matches"></div>';
      const matchesDiv = col.querySelector('.bk-matches');
      phase.ids.forEach(id => {
        matchesDiv.insertAdjacentHTML('beforeend', matchHTML(id));
      });
      bracket.appendChild(col);
    });

    // ===== CENTER (FINAL + TROPHY + 3RD PLACE) =====
    const center = document.createElement('div');
    center.className = 'bk-column bk-center';

    const fm = matches['final'];
    const tm = matches['third_place'];
    const champ = matches['champion'];
    const championTeam = champ ? champ.team1 : null;

    let champHTML = '';
    if (championTeam) {
      const flagUrl = getFlagUrl(championTeam);
      const flagImg = flagUrl
        ? '<img class="bk-champ-flag" src="' + flagUrl + '" alt="' + (championTeam.abbr || championTeam.id.toUpperCase()) + '">'
        : '';
      const countryName = championTeam.name.toUpperCase();
      // Concordância de gênero: verifica última palavra (sem acentos) ou lista explícita feminina
      const FEMININE_COUNTRIES = ['COREIA DO SUL', '\u00c1FRICA DO SUL', 'NOVA ZEL\u00c2NDIA', 'AR\u00c1BIA SAUDITA', 'COSTA DO MARFIM', 'COSTA RICA'];
      const lastWord = countryName.normalize('NFD').replace(/\p{Diacritic}/gu, '').split(' ').pop();
      const champTitle = (lastWord.endsWith('A') || FEMININE_COUNTRIES.includes(countryName)) ? 'CAMPE\u00c3' : 'CAMPE\u00c3O';
      // Estrutura horizontal: bandeira | nome | título (flex-row via CSS .bk-champion-line)
      champHTML = flagImg
        + '<span class="bk-champ-name">' + countryName + '</span>'
        + '<span class="bk-champ-title">' + champTitle + '</span>';
    } else {
      champHTML = '&nbsp;';
    }

    center.innerHTML =
      '<div class="bk-center-stack">' +
        '<div class="bk-trophy-box" style="margin-bottom:2rem;">' +
          '<div class="bk-ato-watermark"></div>' +
          '<img src="ta\u00e7a.png" alt="Trof\u00e9u" class="bk-trophy ' + (championTeam ? 'lit' : '') + '">' +
          '<div class="bk-champion-line" style="margin-top:12px;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:12px;white-space:nowrap;">' + champHTML + '</div>' +
        '</div>' +
        '<div class="bk-final-wrap">' +
          '<div class="bk-round-title">FINAL</div>' +
          matchHTML('final') +
        '</div>' +
        '<div class="bk-third-wrap" style="margin-top:4rem;">' +
          '<div class="bk-round-title">DISPUTA 3\u00ba LUGAR</div>' +
          matchHTML('third_place') +
        '</div>' +
      '</div>';
    bracket.appendChild(center);

    // ===== RIGHT SIDE: rounds 4 → 1 (reversed for symmetry) =====
    for (let i = RIGHT_PHASES.length - 1; i >= 0; i--) {
      const phase = RIGHT_PHASES[i];
      const col = document.createElement('div');
      col.className = 'bk-column right-col';
      col.dataset.round = i + 1;
      col.dataset.side = 'r';
      col.innerHTML = '<div class="bk-round-title">' + phase.label + '</div><div class="bk-matches"></div>';
      const matchesDiv = col.querySelector('.bk-matches');
      phase.ids.forEach(id => {
        matchesDiv.insertAdjacentHTML('beforeend', matchHTML(id));
      });
      bracket.appendChild(col);
    }

    // Bind click events
    bracket.querySelectorAll('.bk-team[data-code]:not([data-code=""])').forEach(el => {
      el.addEventListener('click', () => {
        const matchId = el.dataset.matchId;
        const teamId = el.dataset.code;
        if (matchId && teamId) selectWinner(matchId, teamId);
      });
    });

    // Draw lines after DOM settles
    requestAnimationFrame(drawLines);
  }

  /* ============================================================
     SVG LINES — Exact copy from bracket-copa-2026 (1).html
  ============================================================ */
  function drawLines(target) {
    const wrap = target || document.getElementById('bracket-wrap');
    if (!wrap) return;

    const svg = wrap.querySelector('.lines-svg') || document.getElementById('lines-svg');
    const bracketEl = wrap.querySelector('.bracket, #bracket');
    if (!svg || !bracketEl) return;

    const wrapRect = wrap.getBoundingClientRect();
    const W = wrap.scrollWidth;
    const H = wrap.scrollHeight;

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.innerHTML = '';

    function getMatchRect(matchId) {
      const el = bracketEl.querySelector('[data-match-id="' + matchId + '"].bk-match');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left:   r.left   - wrapRect.left,
        right:  r.right  - wrapRect.left,
        top:    r.top    - wrapRect.top,
        bottom: r.bottom - wrapRect.top,
        cy:     r.top + r.height / 2 - wrapRect.top,
        cx:     r.left + r.width / 2 - wrapRect.left
      };
    }

    function drawLine(d, options) {
      options = options || {};
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', options.active ? '#fbbf24' : '#5a7ba8');
      path.setAttribute('stroke-width', options.active ? '2.5' : '1.6');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('opacity', options.active ? '0.95' : '0.55');
      svg.appendChild(path);
    }

    // LEFT SIDE connections
    // R32 → R16
    const leftR32 = LEFT_PHASES[0].ids;
    const leftR16 = LEFT_PHASES[1].ids;
    for (let i = 0; i < leftR32.length; i += 2) {
      const a = getMatchRect(leftR32[i]);
      const b = getMatchRect(leftR32[i + 1]);
      const next = getMatchRect(leftR16[Math.floor(i / 2)]);
      if (!a || !b || !next) continue;
      const mA = matches[leftR32[i]];
      const mB = matches[leftR32[i + 1]];
      const midX = (a.right + next.left) / 2;
      drawLine('M ' + a.right + ' ' + a.cy + ' L ' + midX + ' ' + a.cy + ' L ' + midX + ' ' + next.cy, { active: !!mA.winner });
      drawLine('M ' + b.right + ' ' + b.cy + ' L ' + midX + ' ' + b.cy + ' L ' + midX + ' ' + next.cy, { active: !!mB.winner });
      drawLine('M ' + midX + ' ' + next.cy + ' L ' + next.left + ' ' + next.cy, { active: !!(mA.winner || mB.winner) });
    }

    // R16 → QF
    const leftQF = LEFT_PHASES[2].ids;
    for (let i = 0; i < leftR16.length; i += 2) {
      const a = getMatchRect(leftR16[i]);
      const b = getMatchRect(leftR16[i + 1]);
      const next = getMatchRect(leftQF[Math.floor(i / 2)]);
      if (!a || !b || !next) continue;
      const mA = matches[leftR16[i]];
      const mB = matches[leftR16[i + 1]];
      const midX = (a.right + next.left) / 2;
      drawLine('M ' + a.right + ' ' + a.cy + ' L ' + midX + ' ' + a.cy + ' L ' + midX + ' ' + next.cy, { active: !!mA.winner });
      drawLine('M ' + b.right + ' ' + b.cy + ' L ' + midX + ' ' + b.cy + ' L ' + midX + ' ' + next.cy, { active: !!mB.winner });
      drawLine('M ' + midX + ' ' + next.cy + ' L ' + next.left + ' ' + next.cy, { active: !!(mA.winner || mB.winner) });
    }

    // QF → SF
    {
      const a = getMatchRect('qf_1');
      const b = getMatchRect('qf_2');
      const next = getMatchRect('sf_1');
      if (a && b && next) {
        const midX = (a.right + next.left) / 2;
        drawLine('M ' + a.right + ' ' + a.cy + ' L ' + midX + ' ' + a.cy + ' L ' + midX + ' ' + next.cy, { active: !!matches['qf_1'].winner });
        drawLine('M ' + b.right + ' ' + b.cy + ' L ' + midX + ' ' + b.cy + ' L ' + midX + ' ' + next.cy, { active: !!matches['qf_2'].winner });
        drawLine('M ' + midX + ' ' + next.cy + ' L ' + next.left + ' ' + next.cy, { active: !!(matches['qf_1'].winner || matches['qf_2'].winner) });
      }
    }

    // RIGHT SIDE connections (mirrored)
    const rightR32 = RIGHT_PHASES[0].ids;
    const rightR16 = RIGHT_PHASES[1].ids;
    for (let i = 0; i < rightR32.length; i += 2) {
      const a = getMatchRect(rightR32[i]);
      const b = getMatchRect(rightR32[i + 1]);
      const next = getMatchRect(rightR16[Math.floor(i / 2)]);
      if (!a || !b || !next) continue;
      const mA = matches[rightR32[i]];
      const mB = matches[rightR32[i + 1]];
      const midX = (a.left + next.right) / 2;
      drawLine('M ' + a.left + ' ' + a.cy + ' L ' + midX + ' ' + a.cy + ' L ' + midX + ' ' + next.cy, { active: !!mA.winner });
      drawLine('M ' + b.left + ' ' + b.cy + ' L ' + midX + ' ' + b.cy + ' L ' + midX + ' ' + next.cy, { active: !!mB.winner });
      drawLine('M ' + midX + ' ' + next.cy + ' L ' + next.right + ' ' + next.cy, { active: !!(mA.winner || mB.winner) });
    }

    // R16 → QF (right)
    const rightQF = RIGHT_PHASES[2].ids;
    for (let i = 0; i < rightR16.length; i += 2) {
      const a = getMatchRect(rightR16[i]);
      const b = getMatchRect(rightR16[i + 1]);
      const next = getMatchRect(rightQF[Math.floor(i / 2)]);
      if (!a || !b || !next) continue;
      const mA = matches[rightR16[i]];
      const mB = matches[rightR16[i + 1]];
      const midX = (a.left + next.right) / 2;
      drawLine('M ' + a.left + ' ' + a.cy + ' L ' + midX + ' ' + a.cy + ' L ' + midX + ' ' + next.cy, { active: !!mA.winner });
      drawLine('M ' + b.left + ' ' + b.cy + ' L ' + midX + ' ' + b.cy + ' L ' + midX + ' ' + next.cy, { active: !!mB.winner });
      drawLine('M ' + midX + ' ' + next.cy + ' L ' + next.right + ' ' + next.cy, { active: !!(mA.winner || mB.winner) });
    }

    // QF → SF (right)
    {
      const a = getMatchRect('qf_3');
      const b = getMatchRect('qf_4');
      const next = getMatchRect('sf_2');
      if (a && b && next) {
        const midX = (a.left + next.right) / 2;
        drawLine('M ' + a.left + ' ' + a.cy + ' L ' + midX + ' ' + a.cy + ' L ' + midX + ' ' + next.cy, { active: !!matches['qf_3'].winner });
        drawLine('M ' + b.left + ' ' + b.cy + ' L ' + midX + ' ' + b.cy + ' L ' + midX + ' ' + next.cy, { active: !!matches['qf_4'].winner });
        drawLine('M ' + midX + ' ' + next.cy + ' L ' + next.right + ' ' + next.cy, { active: !!(matches['qf_3'].winner || matches['qf_4'].winner) });
      }
    }

    // SEMIFINALS → FINAL
    const semiL = getMatchRect('sf_1');
    const semiR = getMatchRect('sf_2');
    const finalR = getMatchRect('final');

    if (semiL && finalR) {
      const active = !!matches['sf_1'].winner;
      drawLine('M ' + semiL.right + ' ' + semiL.cy + ' L ' + finalR.left + ' ' + semiL.cy + ' L ' + finalR.left + ' ' + (finalR.cy - 2), { active: active });
      drawLine('M ' + finalR.left + ' ' + finalR.cy + ' L ' + (finalR.left + 2) + ' ' + finalR.cy, { active: active });
    }
    if (semiR && finalR) {
      const active = !!matches['sf_2'].winner;
      drawLine('M ' + semiR.left + ' ' + semiR.cy + ' L ' + finalR.right + ' ' + semiR.cy + ' L ' + finalR.right + ' ' + (finalR.cy - 2), { active: active });
      drawLine('M ' + finalR.right + ' ' + finalR.cy + ' L ' + (finalR.right - 2) + ' ' + finalR.cy, { active: active });
    }

    // SEMIFINALS → 3RD PLACE (dashed lines removed for cleaner UI)
  }

  /* ============================================================
     STATE MANAGEMENT
  ============================================================ */
  function getMatchesState() {
    const result = {};
    Object.keys(matches).forEach(k => {
      const m = matches[k];
      result[k] = {
        team1: m.team1 ? m.team1.id : null,
        team2: m.team2 ? m.team2.id : null,
        winner: m.winner
      };
    });
    return result;
  }

  function loadState(savedMatches) {
    if (!savedMatches) return;
    Object.keys(savedMatches).forEach(k => {
      const saved = savedMatches[k];
      if (matches[k]) {
        matches[k].team1 = saved.team1 ? TEAMS[saved.team1] : null;
        matches[k].team2 = saved.team2 ? TEAMS[saved.team2] : null;
        matches[k].winner = saved.winner;
      }
    });
    render();
  }

  function isComplete() {
    return !!(
      matches['final'] && matches['final'].winner &&
      matches['third_place'] && matches['third_place'].winner
    );
  }

  return {
    init,
    evaluateRealtime,
    selectWinner,
    fillRandomly,
    resetAll,
    getChampion,
    getMatchesState,
    loadState,
    onChange,
    drawLines,
    isComplete,
  };
})();
