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
    function onCancel()  { cleanup(); resolve(false); }
    function onConfirm() { cleanup(); resolve(true); }

    btnCancel.addEventListener('click', onCancel);
    btnConfirm.addEventListener('click', onConfirm);
  });
}

(function App() {

  // ── Limpa estado salvo a cada visita ──────────────────────────────────────
  // O site sempre começa limpo. Sem isso, seleções antigas ficam restauradas
  // e podem gerar prints com dados inconsistentes.
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}

  // ── Inicialização dos módulos ─────────────────────────────────────────────
  GroupsModule.init();
  BracketModule.init();
  ShareModule.init(); // inicia prefetch de bandeiras em background

  const btnShare = document.getElementById('btn-share');

  // Começa desabilitado — só habilita quando bracket estiver completo
  btnShare.disabled = true;
  btnShare.title = 'Preencha todo o chaveamento para compartilhar';

  function updateShareButton() {
    const complete = BracketModule.isComplete();
    btnShare.disabled = !complete;
    btnShare.title = complete
      ? 'Compartilhar minha simulação'
      : 'Preencha todo o chaveamento para compartilhar';
  }

  // ── Reatividade ───────────────────────────────────────────────────────────
  GroupsModule.onChange((groupsState) => {
    ThirdsModule.evaluate(groupsState);
    const qualified = ThirdsModule.getQualified();
    BracketModule.evaluateRealtime(groupsState, qualified);
    updateShareButton();
  });

  BracketModule.onChange(() => {
    updateShareButton();
    if (BracketModule.isComplete()) {
      ShareModule.preGenerate();
    }
  });

  // ── Preencher aleatório ───────────────────────────────────────────────────
  document.getElementById('btn-fill-all').addEventListener('click', async () => {
    const currentState = GroupsModule.getState();
    const hasData = Object.keys(currentState).some(
      k => currentState[k].first || currentState[k].second || currentState[k].third
    );

    if (hasData) {
      const confirmed = await showConfirmModal(
        'Preencher Aleatório',
        'Isso irá sobrescrever suas escolhas atuais. Deseja continuar?'
      );
      if (!confirmed) return;
    }

    GroupsModule.shuffleAll();

    setTimeout(() => {
      BracketModule.fillRandomly();
      showToast('SIMULAÇÃO COMPLETA');
      updateShareButton();
      if (BracketModule.isComplete()) ShareModule.preGenerate();

      const bracketWrap = document.getElementById('bracket-wrap');
      if (bracketWrap) bracketWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  });

  // ── Reiniciar ─────────────────────────────────────────────────────────────
  document.getElementById('btn-reset').addEventListener('click', async () => {
    const confirmed = await showConfirmModal(
      'Reiniciar Simulação',
      'Tem certeza que deseja apagar todos os dados e começar do zero?'
    );
    if (!confirmed) return;

    GroupsModule.resetAll();
    ThirdsModule.reset();
    BracketModule.resetAll();

    document.getElementById('thirds-section').style.display = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateShareButton();
    showToast('SIMULAÇÃO REINICIADA');
  });

  // ── Compartilhar ──────────────────────────────────────────────────────────
  btnShare.addEventListener('click', () => {
    if (btnShare.disabled) {
      showToast('⚠️ PREENCHA TODO O CHAVEAMENTO ANTES DE COMPARTILHAR', 3000);
      return;
    }
    ShareModule.share();
  });

})();
