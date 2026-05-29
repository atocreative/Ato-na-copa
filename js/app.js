/**
 * App Module — Main orchestrator
 * Wires groups → thirds → bracket → share together
 */

const STORAGE_KEY = 'ato_na_copa_2026';

function showToast(message, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('visible');
  }, duration);
}

// Lógica da Custom Modal
function showConfirmModal(title, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    const btnCancel = document.getElementById('modal-cancel');
    const btnConfirm = document.getElementById('modal-confirm');

    titleEl.textContent = title;
    msgEl.textContent = message;

    modal.classList.add('active');

    function cleanup() {
      modal.classList.remove('active');
      btnCancel.removeEventListener('click', onCancel);
      btnConfirm.removeEventListener('click', onConfirm);
    }

    function onCancel() {
      cleanup();
      resolve(false);
    }

    function onConfirm() {
      cleanup();
      resolve(true);
    }

    btnCancel.addEventListener('click', onCancel);
    btnConfirm.addEventListener('click', onConfirm);
  });
}

(function App() {
  GroupsModule.init();
  BracketModule.init();

  GroupsModule.onChange((groupsState) => {
    ThirdsModule.evaluate(groupsState);
    const qualified = ThirdsModule.getQualified();

    // Reatividade em tempo real para o chaveamento
    BracketModule.evaluateRealtime(groupsState, qualified);

    saveState();
  });

  BracketModule.onChange(() => {
    saveState();
    ShareModule.preGenerate();
  });

  document.getElementById('btn-fill-all').addEventListener('click', async () => {
    // Para evitar preenchimento acidental se já houver dados
    const currentState = GroupsModule.getState();
    const hasData = Object.keys(currentState).some(k => currentState[k].first || currentState[k].second || currentState[k].third);
    
    if (hasData) {
      const confirmed = await showConfirmModal('Preencher Aleatório', 'Isso irá sobrescrever suas escolhas atuais. Deseja continuar?');
      if (!confirmed) return;
    }

    GroupsModule.shuffleAll();

    setTimeout(() => {
      BracketModule.fillRandomly();
      showToast('SIMULAÇÃO COMPLETA');
      ShareModule.preGenerate();
      
      const bracketWrap = document.getElementById('bracket-wrap');
      if (bracketWrap) {
        bracketWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  });

  document.getElementById('btn-reset').addEventListener('click', async () => {
    const confirmed = await showConfirmModal('Reiniciar Simulação', 'Tem certeza que deseja apagar todos os dados e começar do zero?');
    if (!confirmed) return;

    GroupsModule.resetAll();
    ThirdsModule.reset();
    BracketModule.resetAll();

    document.getElementById('thirds-section').style.display = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    clearState();
    showToast('SIMULAÇÃO REINICIADA');
  });

  document.getElementById('btn-share').addEventListener('click', () => {
    ShareModule.share();
  });


  function saveState() {
    try {
      const data = {
        groups: GroupsModule.getState(),
        bracket: BracketModule.getMatchesState(),
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      if (!data || !data.groups) return;

      GroupsModule.loadState(data.groups);

      ThirdsModule.evaluate(data.groups);
      const qualified = ThirdsModule.getQualified();
      
      BracketModule.evaluateRealtime(data.groups, qualified);

      if (data.bracket) {
        BracketModule.loadState(data.bracket);
      }

      document.getElementById('thirds-section').style.display = '';

      showToast('SIMULAÇÃO RESTAURADA');
      ShareModule.preGenerate();
    } catch (e) {
      console.warn('Failed to load saved state:', e);
    }
  }

  loadState();
})();
