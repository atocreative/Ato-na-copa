/**
 * Groups Module — Renders 12 groups and handles position selection
 */
const GroupsModule = (() => {
  const state = {};
  const listeners = [];

  function init() {
    GROUP_NAMES.forEach(g => {
      state[g] = { first: null, second: null, third: null };
    });
    renderNav();
    renderGroups();
  }

  function onChange(fn) { listeners.push(fn); }

  function notify() {
    listeners.forEach(fn => fn(getState()));
  }

  function getState() {
    return JSON.parse(JSON.stringify(state));
  }

  function isGroupComplete(g) {
    const s = state[g];
    return s.first && s.second && s.third;
  }

  function allGroupsComplete() {
    return GROUP_NAMES.every(g => isGroupComplete(g));
  }

  function getClassifiedTeams() {
    const firsts = [];
    const seconds = [];
    const thirds = [];
    GROUP_NAMES.forEach(g => {
      if (state[g].first) firsts.push({ ...TEAMS[state[g].first], position: 1, fromGroup: g });
      if (state[g].second) seconds.push({ ...TEAMS[state[g].second], position: 2, fromGroup: g });
      if (state[g].third) thirds.push({ ...TEAMS[state[g].third], position: 3, fromGroup: g });
    });
    return { firsts, seconds, thirds };
  }

  // ── Render Navigation ──
  function renderNav() {
    const nav = document.getElementById('groups-nav');
    nav.innerHTML = GROUP_NAMES.map(g =>
      `<button class="groups-nav-btn" data-group="${g}" id="nav-group-${g}">GRUPO ${g}</button>`
    ).join('');

    nav.addEventListener('click', e => {
      const btn = e.target.closest('.groups-nav-btn');
      if (!btn) return;
      const g = btn.dataset.group;
      const card = document.getElementById(`group-card-${g}`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ── Render All Groups ──
  function renderGroups() {
    const grid = document.getElementById('groups-grid');
    grid.innerHTML = GROUP_NAMES.map(g => renderGroupCard(g)).join('');

    grid.addEventListener('click', handleClick);
  }

  function renderGroupCard(g) {
    const teams = GROUPS[g];
    const teamsHtml = teams.map(t => renderTeamRow(t, g)).join('');

    return `
      <div class="group-card" id="group-card-${g}" data-group="${g}">
        <div class="group-header">
          <h3 class="group-name">GRUPO ${g}</h3>
          <span class="group-status pending" id="status-${g}">PENDENTE</span>
        </div>
        <div class="group-columns">
          <span class="col-label">SELEÇÃO</span>
          <div class="col-positions">
            <span class="col-label">1º</span>
            <span class="col-label">2º</span>
            <span class="col-label">3º</span>
          </div>
        </div>
        <div class="group-teams" id="teams-${g}">
          ${teamsHtml}
        </div>
        <button class="group-shuffle-btn" data-shuffle="${g}" title="SORTEIO ALEATÓRIO">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
          SORTEIO ALEATÓRIO
        </button>
      </div>
    `;
  }

  function renderTeamRow(team, group) {
    const flagHtml = getFlagHtml(team);
    return `
      <div class="team-row" data-team="${team.id}" data-group="${group}">
        <div class="team-info-row">
          ${flagHtml}
          <span class="team-name">${team.name}</span>
        </div>
        <div class="team-positions">
          <button class="pos-btn" data-pos="1" data-team="${team.id}" data-group="${group}" title="1º" aria-label="Colocar ${team.name} em 1º lugar"></button>
          <button class="pos-btn" data-pos="2" data-team="${team.id}" data-group="${group}" title="2º" aria-label="Colocar ${team.name} em 2º lugar"></button>
          <button class="pos-btn" data-pos="3" data-team="${team.id}" data-group="${group}" title="3º" aria-label="Colocar ${team.name} em 3º lugar"></button>
        </div>
      </div>
    `;
  }

  function getFlagHtml(team) {
    const url = getFlagUrl(team);
    if (url) {
      return `<img src="${url}" alt="${team.name}" width="32" height="24" class="flag-placeholder" loading="lazy"/>`;
    }
    return `<div class="flag-placeholder"></div>`;
  }

  // ── Handle Clicks ──
  function handleClick(e) {
    const posBtn = e.target.closest('.pos-btn');
    const shuffleBtn = e.target.closest('.group-shuffle-btn');

    if (posBtn) {
      const teamId = posBtn.dataset.team;
      const group = posBtn.dataset.group;
      const pos = parseInt(posBtn.dataset.pos);
      selectPosition(group, teamId, pos);
    } else if (shuffleBtn) {
      const group = shuffleBtn.dataset.shuffle;
      shuffleGroup(group);
    }
  }

  // ── Select Position ──
  function selectPosition(group, teamId, pos) {
    const s = state[group];
    const posKey = pos === 1 ? 'first' : pos === 2 ? 'second' : 'third';

    if (s[posKey] === teamId) {
      s[posKey] = null;
      updateGroupUI(group);
      notify();
      return;
    }

    if (s.first === teamId) s.first = null;
    if (s.second === teamId) s.second = null;
    if (s.third === teamId) s.third = null;

    s[posKey] = teamId;

    updateGroupUI(group);
    notify();
  }

  // ── Shuffle Group ──
  function shuffleGroup(group) {
    const teams = GROUPS[group].slice();

    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    state[group].first = teams[0].id;
    state[group].second = teams[1].id;
    state[group].third = teams[2].id;

    updateGroupUI(group);
    notify();
  }

  // ── Shuffle All Groups ──
  function shuffleAll() {
    GROUP_NAMES.forEach(g => {
      const teams = GROUPS[g].slice();
      for (let i = teams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teams[i], teams[j]] = [teams[j], teams[i]];
      }
      state[g].first = teams[0].id;
      state[g].second = teams[1].id;
      state[g].third = teams[2].id;
    });

    GROUP_NAMES.forEach(g => updateGroupUI(g));
    notify();
  }

  // ── Reset All ──
  function resetAll() {
    GROUP_NAMES.forEach(g => {
      state[g] = { first: null, second: null, third: null };
      updateGroupUI(g);
    });
    notify();
  }

  // ── Update Group UI ──
  function updateGroupUI(group) {
    const s = state[group];
    const card = document.getElementById(`group-card-${group}`);
    const status = document.getElementById(`status-${group}`);
    const navBtn = document.getElementById(`nav-group-${group}`);

    const buttons = card.querySelectorAll('.pos-btn');
    buttons.forEach(btn => {
      const tid = btn.dataset.team;
      const pos = parseInt(btn.dataset.pos);
      const posKey = pos === 1 ? 'first' : pos === 2 ? 'second' : 'third';

      btn.classList.remove('selected-1', 'selected-2', 'selected-3');

      if (s[posKey] === tid) {
        btn.classList.add(`selected-${pos}`);
      }
    });

    const complete = isGroupComplete(group);
    card.classList.toggle('complete', complete);
    status.textContent = complete ? 'COMPLETO' : 'PENDENTE';
    status.className = `group-status ${complete ? 'complete' : 'pending'}`;

    navBtn.classList.toggle('complete', complete);
    navBtn.classList.toggle('active', !complete);
  }

  function loadState(savedState) {
    if (!savedState) return;
    GROUP_NAMES.forEach(g => {
      if (savedState[g]) {
        state[g] = { ...savedState[g] };
        updateGroupUI(g);
      }
    });
  }

  return {
    init,
    onChange,
    getState,
    getClassifiedTeams,
    isGroupComplete,
    allGroupsComplete,
    shuffleAll,
    shuffleGroup,
    resetAll,
    loadState,
  };
})();
