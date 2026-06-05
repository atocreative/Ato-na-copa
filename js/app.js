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

  const btnShare = document.getElementById('btn-share');
  const SHARE_LABEL_DEFAULT  = 'COMPARTILHAR';
  const SHARE_LABEL_RECOVERY = 'VER MEU PALPITE / DESCONTO';

  // ── Máquina de 3 estados do botão Compartilhar ───────────────────────────
  // Estado 1 — BLOQUEADO: simulador incompleto
  // Estado 2 — GERAÇÃO:   completo, sem imagem em cache
  // Estado 3 — RECUPERAÇÃO: completo, imagem já gerada
  function updateShareButton() {
    const complete  = BracketModule.isComplete();
    const hasImage  = ShareModule.isImageReady();

    if (!complete) {
      // Estado 1: bloqueado
      btnShare.disabled = true;
      btnShare.dataset.shareState = 'blocked';
      btnShare.title = 'Preencha todo o chaveamento para compartilhar';
      _setShareLabel(SHARE_LABEL_DEFAULT);
      return;
    }

    btnShare.disabled = false;

    if (hasImage) {
      // Estado 3: recuperação — abre overlay sem regerar
      btnShare.dataset.shareState = 'recovery';
      btnShare.title = 'Ver seu palpite e resgatar desconto';
      _setShareLabel(SHARE_LABEL_RECOVERY);
    } else {
      // Estado 2: geração — gera imagem e abre overlay
      btnShare.dataset.shareState = 'generate';
      btnShare.title = 'Compartilhar minha simulação';
      _setShareLabel(SHARE_LABEL_DEFAULT);
    }
  }

  function _setShareLabel(label) {
    // Preserva o ícone SVG e substitui apenas o nó de texto
    const btn = btnShare;
    let textNode = null;
    btn.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) textNode = n; });
    if (textNode) textNode.textContent = '\n      ' + label + '\n    ';
  }

  // ShareModule inicia após updateShareButton estar declarada
  ShareModule.init(updateShareButton);

  // ── Reatividade ───────────────────────────────────────────────────────────
  GroupsModule.onChange((groupsState) => {
    ThirdsModule.evaluate(groupsState);
    const qualified = ThirdsModule.isReady() ? ThirdsModule.getQualified() : [];
    BracketModule.evaluateRealtime(groupsState, qualified);
    updateShareButton();
  });

  // Quando o usuário completa os 8 terceiros, alimenta o bracket
  ThirdsModule.onChange((qualifiedThirds) => {
    if (ThirdsModule.isReady()) {
      const groupsState = GroupsModule.getState();
      BracketModule.evaluateRealtime(groupsState, qualifiedThirds);
    }
    updateShareButton();
  });

  // ── Sorteio Aleatório dos Terceiros ───────────────────────────────────────
  document.addEventListener('click', (e) => {
    const shuffleBtn = e.target.closest('#thirds-shuffle-btn');
    if (shuffleBtn) {
      ThirdsModule.randomDraw();
    }
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
      // Auto-fill os 8 melhores terceiros via ranking
      ThirdsModule.autoFill();

      // Alimenta o bracket com os terceiros qualificados
      const groupsState = GroupsModule.getState();
      const qualified = ThirdsModule.getQualified();
      BracketModule.evaluateRealtime(groupsState, qualified);

      setTimeout(() => {
        BracketModule.fillRandomly();
        showToast('SIMULAÇÃO COMPLETA');
        updateShareButton();
        if (BracketModule.isComplete()) ShareModule.preGenerate();

        const bracketWrap = document.getElementById('bracket-wrap');
        if (bracketWrap) bracketWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
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

    // Blindagem: zera imagem e fecha modal (equivalente a setGeneratedImage(null) + setIsModalOpen(false))
    ShareModule.clearCache();
    ShareModule.closeOverlay();

    // Esconde link de desconto até novo compartilhamento
    const btnRediscount = document.getElementById('btn-rediscount');
    if (btnRediscount) btnRediscount.classList.remove('visible');

    document.getElementById('thirds-section').style.display = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateShareButton();
    showToast('SIMULAÇÃO REINICIADA');
  });

  // ── Compartilhar — roteamento por estado ──────────────────────────────────
  btnShare.addEventListener('click', () => {
    if (btnShare.disabled) return;

    const state = btnShare.dataset.shareState;

    if (state === 'recovery') {
      // Estado 3: imagem pronta — apenas abre overlay (sem regerar)
      ShareModule.showDiscount();
      return;
    }

    // Estado 2: gera imagem e abre overlay
    ShareModule.share();

    // Exibe link de recuperação após o usuário iniciar o compartilhamento
    const btnRediscount = document.getElementById('btn-rediscount');
    if (btnRediscount) btnRediscount.classList.add('visible');
  });

  // ── Pegar desconto novamente ──────────────────────────────────────────────
  const btnRediscount = document.getElementById('btn-rediscount');
  if (btnRediscount) {
    btnRediscount.addEventListener('click', () => {
      ShareModule.showDiscount();
    });
  }

})();
