/**
 * Bracket Module — Knockout stage visualization and interaction (FIFA 2026 Engine)
 */
const BracketModule = (() => {
  const matches = {};
  const listeners = [];

  // FIFA 2026 Exact Matrix
  const R32_MATCHES = [
    // A) Confrontos Diretos entre Vice-Líderes
    { id: 'r32_1', next: 'r16_1', nextSlot: 1, seed1: '2A', seed2: '2B' },
    { id: 'r32_2', next: 'r16_1', nextSlot: 2, seed1: '2D', seed2: '2G' },
    { id: 'r32_3', next: 'r16_2', nextSlot: 1, seed1: '2H', seed2: '2I' },
    { id: 'r32_4', next: 'r16_2', nextSlot: 2, seed1: '2K', seed2: '2L' },
    
    // B) Confrontos de Líderes enfrentando Vice-Líderes
    { id: 'r32_5', next: 'r16_3', nextSlot: 1, seed1: '1B', seed2: '2E' },
    { id: 'r32_6', next: 'r16_3', nextSlot: 2, seed1: '1C', seed2: '2F' },
    { id: 'r32_7', next: 'r16_4', nextSlot: 1, seed1: '1F', seed2: '2C' },
    { id: 'r32_8', next: 'r16_4', nextSlot: 2, seed1: '1H', seed2: '2J' },

    // C) Lideres vs Terceiros
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

  // Matriz Combinatória de Terceiros
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

  function onChange(fn) { listeners.push(fn); }
  function notify() { listeners.forEach(fn => fn(getChampion())); }

  function init() {
    ALL_MATCH_DEFS.forEach(m => {
      matches[m.id] = { team1: null, team2: null, winner: null, seed1: m.seed1, seed2: m.seed2 };
    });
    matches['champion'] = { team1: null, team2: null, winner: null };
    renderBracket(); // Renderiza instantaneamente vazio
  }

  function getChampion() {
    const finalMatch = matches['final'];
    if (finalMatch && finalMatch.winner) {
      return TEAMS[finalMatch.winner] || null;
    }
    return null;
  }

  // Backtracking Solver para a matriz dos 8 melhores terceiros
  function solveThirdsAllocation(availableThirds) {
    if (availableThirds.length !== 8) return null;
    const allocation = {}; // { '1A': thirdId, ... }
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
    return null; // Fallback se impossível teoricamente
  }

  // Chamado pelo App.js toda vez que o estado dos grupos muda
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
      // Se não achar, aloca sequencial fallback
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

    renderBracket();
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

  function getSeedLabel(seed) {
    if (!seed) return '';
    if (seed.startsWith('3_')) return '3º LUGAR'; // Textos compactos
    return `${seed[0]}º G.${seed.substring(1)}`;
  }

  function selectWinner(matchId, teamId) {
    const match = matches[matchId];
    if (!match) return;

    const t1Id = match.team1 ? match.team1.id : null;
    const t2Id = match.team2 ? match.team2.id : null;
    if (teamId !== t1Id && teamId !== t2Id) return;

    if (match.winner === teamId) {
      match.winner = null;
      clearDownstream(matchId);
      renderBracket();
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

    renderBracket();
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
  }

  function resetAll() {
    ALL_MATCH_DEFS.forEach(m => {
      matches[m.id].team1 = null;
      matches[m.id].team2 = null;
      matches[m.id].winner = null;
    });
    matches['champion'] = { team1: null, team2: null, winner: null };
    renderBracket();
    notify();
  }

  function renderBracket() {
    const container = document.getElementById('bracket-container');

    const leftR32 = R32_MATCHES.slice(0, 8);
    const leftR16 = R16_MATCHES.slice(0, 4);
    const leftQF = QF_MATCHES.slice(0, 2);
    const leftSF = [SF_MATCHES[0]];

    const rightR32 = R32_MATCHES.slice(8, 16);
    const rightR16 = R16_MATCHES.slice(4, 8);
    const rightQF = QF_MATCHES.slice(2, 4);
    const rightSF = [SF_MATCHES[1]];

    container.innerHTML = `
      <div class="bracket-side left">
        ${renderPhaseColumn('16-AVOS', leftR32, 'r32')}
        ${renderPhaseColumn('OITAVAS', leftR16, 'r16')}
        ${renderPhaseColumn('QUARTAS', leftQF, 'qf')}
        ${renderPhaseColumn('SEMIFINAL', leftSF, 'sf')}
      </div>

      <div class="champion-column">
        ${renderFinalAndChampion()}
      </div>

      <div class="bracket-side right">
        ${renderPhaseColumn('16-AVOS', rightR32, 'r32')}
        ${renderPhaseColumn('OITAVAS', rightR16, 'r16')}
        ${renderPhaseColumn('QUARTAS', rightQF, 'qf')}
        ${renderPhaseColumn('SEMIFINAL', rightSF, 'sf')}
      </div>
    `;

    container.querySelectorAll('.match-team[data-team-id]').forEach(el => {
      el.addEventListener('click', () => {
        const matchId = el.dataset.matchId;
        const teamId = el.dataset.teamId;
        if (matchId && teamId) selectWinner(matchId, teamId);
      });
    });
  }

  function renderPhaseColumn(label, matchDefs, phaseKey) {
    const matchesHtml = matchDefs.map(def => renderMatchCard(def.id)).join('');
    return `
      <div class="bracket-phase" data-phase="${phaseKey}">
        <div class="bracket-phase-label">${label}</div>
        ${matchesHtml}
      </div>
    `;
  }

  function renderMatchCard(matchId) {
    const match = matches[matchId];
    if (!match) return '';

    const t1 = match.team1;
    const t2 = match.team2;
    const winner = match.winner;

    return `
      <div class="match-card" data-match="${matchId}">
        ${renderMatchTeam(matchId, t1, winner, match.seed1)}
        ${renderMatchTeam(matchId, t2, winner, match.seed2)}
      </div>
    `;
  }

  function renderMatchTeam(matchId, team, winnerId, seedLabel) {
    if (!team) {
      const label = getSeedLabel(seedLabel);
      return `
        <div class="match-team empty">
          <div class="flag-placeholder"></div>
          <span class="match-team-name">${label || 'A DEFINIR'}</span>
        </div>
      `;
    }

    const isWinner = winnerId === team.id;
    const isLoser = winnerId && winnerId !== team.id;
    const cls = isWinner ? 'winner' : isLoser ? 'loser' : '';

    const flagUrl = getFlagUrl(team);
    const flagHtml = flagUrl
      ? `<div class="flag-placeholder"><img src="${flagUrl}" alt="${team.id}" loading="lazy"/></div>`
      : `<div class="flag-placeholder"></div>`;

    return `
      <div class="match-team ${cls}" data-match-id="${matchId}" data-team-id="${team.id}">
        ${flagHtml}
        <span class="match-team-name">${team.id}</span>
      </div>
    `;
  }

  function renderFinalAndChampion() {
    const finalMatch = matches['final'];
    const champion = matches['champion'];
    const championTeam = champion ? champion.team1 : null;

    const finalHtml = renderMatchCard('final');

    let champHtml = '';
    if (championTeam) {
      const flagUrl = getFlagUrl(championTeam);
      const flagHtml = flagUrl
        ? `<div class="champion-flag-box"><img src="${flagUrl}" alt="${championTeam.id}"/></div>`
        : `<div class="champion-flag-box"></div>`;

      champHtml = `
        <div class="champion-card has-winner">
          <div class="champion-label">CAMPEÃO</div>
          ${flagHtml}
          <div class="champion-name">${championTeam.id}</div>
        </div>
      `;
    } else {
      champHtml = `
        <div class="champion-card empty-champion">
          <div class="champion-label">CAMPEÃO</div>
          <div class="champion-flag-box"></div>
          <div class="champion-name">?</div>
        </div>
      `;
    }

    return `
      ${champHtml}
      <div style="margin-top: var(--space-xl); width: 100%;">
        <div class="bracket-phase-label">FINAL</div>
        ${finalHtml}
      </div>
    `;
  }

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
    renderBracket();
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
  };
})();
