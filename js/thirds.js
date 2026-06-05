/**
 * Thirds Module — Interactive selection of the 8 best third-placed teams
 * Supports 3 modes: Manual click, Random Draw, Auto-fill
 */
const ThirdsModule = (() => {
  let qualifiedThirds = [];
  let allThirds = [];
  const manualSelection = new Set();
  const listeners = [];
  let isLocked = false; // locked after auto-fill from "Preencher Tudo"

  function onChange(fn) { listeners.push(fn); }
  function notify() { listeners.forEach(fn => fn(qualifiedThirds)); }

  /**
   * Called whenever groups change.
   * When all 12 thirds are available, renders the interactive panel.
   * Does NOT auto-select — waits for user action.
   */
  function evaluate(groupsState) {
    const { thirds } = GroupsModule.getClassifiedTeams();
    allThirds = thirds;

    if (thirds.length < 12) {
      qualifiedThirds = [];
      manualSelection.clear();
      isLocked = false;
      renderThirds();
      notify();
      return;
    }

    // If manual selection already has 8, update qualifiedThirds from it
    if (manualSelection.size === 8) {
      qualifiedThirds = allThirds.filter(t => manualSelection.has(t.id));
    } else {
      qualifiedThirds = [];
    }

    renderThirds();
    notify();
  }

  /**
   * Toggle a team in/out of the manual selection.
   */
  function toggleManual(teamId) {
    if (isLocked) return;

    if (manualSelection.has(teamId)) {
      manualSelection.delete(teamId);
    } else {
      if (manualSelection.size >= 8) {
        if (typeof showToast === 'function') {
          showToast('MÁXIMO DE 8 SELEÇÕES ATINGIDO! REMOVA UMA PARA TROCAR.', 3000);
        }
        return;
      }
      manualSelection.add(teamId);
    }

    if (manualSelection.size === 8) {
      qualifiedThirds = allThirds.filter(t => manualSelection.has(t.id));
    } else {
      qualifiedThirds = [];
    }

    renderThirds();
    notify();
  }

  /**
   * Random Draw — selects 8 of 12 at random, but keeps state editable.
   */
  function randomDraw() {
    if (allThirds.length < 12) return;
    isLocked = false;

    const shuffled = allThirds.slice().sort(() => Math.random() - 0.5);
    manualSelection.clear();
    shuffled.slice(0, 8).forEach(t => manualSelection.add(t.id));

    qualifiedThirds = allThirds.filter(t => manualSelection.has(t.id));

    renderThirds();
    notify();

    if (typeof showToast === 'function') {
      showToast('8 SELEÇÕES SORTEADAS — CLIQUE PARA ALTERAR', 3000);
    }
  }

  /**
   * Auto-fill — uses pot ranking to pick the best 8 (existing logic).
   * Called by "Preencher Tudo" global button.
   */
  function autoFill() {
    if (allThirds.length < 12) return;

    const sorted = allThirds.slice().sort((a, b) => {
      if (a.pot !== b.pot) return a.pot - b.pot;
      return a.fromGroup.localeCompare(b.fromGroup);
    });

    manualSelection.clear();
    sorted.slice(0, 8).forEach(t => manualSelection.add(t.id));
    qualifiedThirds = sorted.slice(0, 8);
    isLocked = true;

    renderThirds();
    notify();
  }

  function getQualified() {
    return qualifiedThirds.slice();
  }

  function getQualifiedGroupKeys() {
    return qualifiedThirds.map(t => t.fromGroup).sort().join('');
  }

  function isReady() {
    return qualifiedThirds.length === 8;
  }

  function reset() {
    qualifiedThirds = [];
    allThirds = [];
    manualSelection.clear();
    isLocked = false;
    renderThirds();
  }

  /**
   * Render the Thirds panel with interactive cards
   */
  function renderThirds() {
    const section = document.getElementById('thirds-section');
    const grid = document.getElementById('thirds-grid');
    const counter = document.getElementById('thirds-counter');
    const shuffleBtn = document.getElementById('thirds-shuffle-btn');

    if (allThirds.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = '';

    // Update counter
    if (counter) {
      counter.textContent = manualSelection.size + '/8 SELECIONADOS';
      counter.classList.toggle('complete', manualSelection.size === 8);
    }

    // Show/hide shuffle button
    if (shuffleBtn) {
      shuffleBtn.style.display = allThirds.length === 12 ? '' : 'none';
    }

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

      const isSelected = manualSelection.has(third.id);
      const allFilled = manualSelection.size === 8;
      let cls = 'selectable';
      if (isSelected) cls += ' qualified';
      else if (allFilled) cls += ' eliminated';

      const flagUrl = getFlagUrl(third);
      const flagHtml = flagUrl
        ? `<img src="${flagUrl}" alt="${third.name}" width="32" height="24" class="flag-placeholder" loading="lazy"/>`
        : `<div class="flag-placeholder"></div>`;

      return `
        <div class="third-card ${cls}" data-third-id="${third.id}">
          ${flagHtml}
          <span class="third-name">${third.name}</span>
          <span class="third-group">${g}</span>
          <span class="third-check">${isSelected ? '✓' : ''}</span>
        </div>
      `;
    }).join('');

    // Bind click events on selectable cards
    grid.querySelectorAll('.third-card.selectable').forEach(card => {
      card.addEventListener('click', () => {
        const teamId = card.dataset.thirdId;
        if (teamId) toggleManual(teamId);
      });
    });
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
    isReady,
    reset,
    onChange,
    randomDraw,
    autoFill,
    toggleManual,
  };
})();
