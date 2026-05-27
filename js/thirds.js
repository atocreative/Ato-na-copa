/**
 * Thirds Module — Determines the 8 best third-placed teams
 */
const ThirdsModule = (() => {
  let qualifiedThirds = [];
  let allThirds = [];
  const listeners = [];

  function onChange(fn) { listeners.push(fn); }
  function notify() { listeners.forEach(fn => fn(qualifiedThirds)); }

  function evaluate(groupsState) {
    const { thirds } = GroupsModule.getClassifiedTeams();
    allThirds = thirds;

    if (thirds.length < 12) {
      qualifiedThirds = [];
      renderThirds();
      notify();
      return;
    }

    const sorted = thirds.slice().sort((a, b) => {
      if (a.pot !== b.pot) return a.pot - b.pot;
      return a.fromGroup.localeCompare(b.fromGroup);
    });

    qualifiedThirds = sorted.slice(0, 8);
    renderThirds();
    notify();
  }

  function getQualified() {
    return qualifiedThirds.slice();
  }

  function getQualifiedGroupKeys() {
    return qualifiedThirds.map(t => t.fromGroup).sort().join('');
  }

  function reset() {
    qualifiedThirds = [];
    allThirds = [];
    renderThirds();
  }

  function renderThirds() {
    const section = document.getElementById('thirds-section');
    const grid = document.getElementById('thirds-grid');

    if (allThirds.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = '';

    const qualifiedIds = new Set(qualifiedThirds.map(t => t.id));

    grid.innerHTML = GROUP_NAMES.map(g => {
      const third = allThirds.find(t => t.fromGroup === g);
      if (!third) {
        return `
          <div class="third-card">
            <div class="flag-placeholder"></div>
            <span class="third-name">A DEFINIR</span>
            <span class="third-group">${g}</span>
          </div>
        `;
      }

      const isQualified = qualifiedIds.has(third.id);
      const cls = qualifiedThirds.length === 8
        ? (isQualified ? 'qualified' : 'eliminated')
        : '';

      const flagUrl = getFlagUrl(third);
      const flagHtml = flagUrl
        ? `<img src="${flagUrl}" alt="${third.name}" width="32" height="24" class="flag-placeholder" loading="lazy"/>`
        : `<div class="flag-placeholder"></div>`;

      return `
        <div class="third-card ${cls}">
          ${flagHtml}
          <span class="third-name">${third.name}</span>
          <span class="third-group">${g}</span>
        </div>
      `;
    }).join('');
  }

  function getThirdsMatchMapping() {
    if (qualifiedThirds.length !== 8) return null;

    const groups = qualifiedThirds.map(t => t.fromGroup).sort();
    const key = groups.join('');

    const mapping = {};
    const slots = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    groups.forEach((g, i) => {
      mapping[g] = slots[i];
    });

    return mapping;
  }

  return {
    evaluate,
    getQualified,
    getQualifiedGroupKeys,
    getThirdsMatchMapping,
    reset,
    onChange,
  };
})();
