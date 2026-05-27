/**
 * Share Module — Print Engine v5 (1650px • Linhas Estáticas • Alta Fidelidade)
 *
 * Arquitetura: clone isolado em memória → largura 1650px travada → opacidade
 * de bandeiras forçada → SVG redesenhado no clone → html2canvas com viewport
 * sincronizado → compartilhamento nativo (mobile) ou download + WhatsApp.
 *
 * Resolve definitivamente:
 *   • Corte da coluna 16 Avos à direita
 *   • Linhas de chaveamento tortas / invisíveis
 *   • Bandeiras sumindo (CORS + dimensões explícitas)
 */
const ShareModule = (() => {

  // ── Constantes mestres — devem coincidir com .capture-mode no CSS ────────
  const CAPTURE_WIDTH  = 1650;
  const CAPTURE_HEIGHT = 1050;

  function share() {
    const original = document.getElementById('bracket-wrap');
    if (!original) {
      showToast("ERRO: ÁRVORE MATA-MATA NÃO ENCONTRADA");
      return;
    }

    showToast("📸 GERANDO IMAGEM DA SUA SIMULAÇÃO...", 2500);

    // ── 1. Clone profundo do bracket-wrap ───────────────────────────────────
    const clone = original.cloneNode(true);
    clone.classList.add('capture-mode');

    // ── 2. Travar geometria: 1650px fixos, overflow visible, sem transforms ─
    // Object.assign garante precedência inline sobre qualquer media query mobile
    Object.assign(clone.style, {
      position:        'absolute',
      top:             '-99999px',
      left:            '-99999px',
      width:           CAPTURE_WIDTH + 'px',
      minWidth:        CAPTURE_WIDTH + 'px',
      maxWidth:        CAPTURE_WIDTH + 'px',
      height:          CAPTURE_HEIGHT + 'px',
      overflow:        'visible',
      backgroundColor: '#fdfcf8',
      padding:         '40px 60px',
      boxSizing:       'border-box',
      transform:       'none',
      zoom:            '1',
      zIndex:          '-9999',
      pointerEvents:   'none',
    });

    // ── 3. Forçar dimensões explícitas nas bandeiras das seleções ───────────
    // html2canvas falha em renderizar <img> sem dimensões inline quando a
    // imagem vem de um domínio externo (GitHub). Forçamos aqui APENAS nos
    // bk-flag (bandeiras dos cards de jogo) e bk-champ-flag (bandeira do campeão).
    clone.querySelectorAll('.bk-flag').forEach(img => {
      img.style.width   = img.classList.contains('bk-champ-flag') ? '40px' : '26px';
      img.style.height  = img.classList.contains('bk-champ-flag') ? '28px' : '18px';
      img.style.display = 'block';
      img.style.opacity = '1';
    });

    // Opacidade total em TODAS as imagens para evitar subamostagem
    clone.querySelectorAll('img').forEach(img => {
      img.style.opacity = '1';
    });

    // ── 4. Reforçar visibilidade das linhas SVG de conexão ──────────────────
    // Dobra a opacidade e garante espessura mínima de 1.8px
    clone.querySelectorAll('path[stroke]').forEach(path => {
      const op = parseFloat(path.getAttribute('opacity') || '0.55');
      path.setAttribute('opacity', Math.min(1, op * 2).toFixed(2));
      const sw = parseFloat(path.getAttribute('stroke-width') || '1.6');
      if (sw < 1.8) path.setAttribute('stroke-width', '1.8');
    });

    // ── 5. Watermark do Brasil ───────────────────────────────────────────────
    const watermarkImg = document.createElement('img');
    watermarkImg.src = 'pngwing.com.png';
    watermarkImg.alt = 'Brasil';
    Object.assign(watermarkImg.style, {
      position:      'absolute',
      top:           '50%',
      left:          '50%',
      transform:     'translate(-50%, -50%)',
      zIndex:        '0',
      opacity:       '0.04',
      width:         '70%',
      maxWidth:      '700px',
      height:        'auto',
      objectFit:     'contain',
      pointerEvents: 'none',
    });
    clone.appendChild(watermarkImg);

    // ── 6. Injetar clone no DOM (fora da tela) ──────────────────────────────
    document.body.appendChild(clone);

    // ── 7. Redesenhar linhas SVG no contexto do clone já com 1650px ─────────
    // drawLines usa getBoundingClientRect — precisa que o clone esteja no DOM
    if (typeof BracketModule !== 'undefined' && BracketModule.drawLines) {
      BracketModule.drawLines(clone);

      // Segunda passada de opacidade após redesenho (drawLines cria novos paths)
      clone.querySelectorAll('path[stroke]').forEach(path => {
        const op = parseFloat(path.getAttribute('opacity') || '0.55');
        path.setAttribute('opacity', Math.min(1, op * 2).toFixed(2));
      });
    }

    // ── 8. Aguardar 300ms — garante parse completo de imagens do GitHub ─────
    setTimeout(() => {

      // ── 9. html2canvas com parâmetros definitivos anti-corte ────────────
      //
      //  width / height   → recorte exato do canvas (elimina corte lateral)
      //  windowWidth      → viewport simulado (desativa media queries mobile)
      //  scrollX/Y = 0    → sem offset de scroll
      //  scale: 2         → 2× resolução (siglas e bandeiras nítidas no WhatsApp)
      //  useCORS: true    → carrega bandeiras do GitHub sem taint
      html2canvas(clone, {
        useCORS:         true,
        allowTaint:      false,
        scale:           2,
        backgroundColor: '#fdfcf8',
        width:           CAPTURE_WIDTH,
        height:          CAPTURE_HEIGHT,
        windowWidth:     CAPTURE_WIDTH,
        windowHeight:    CAPTURE_HEIGHT,
        scrollX:         0,
        scrollY:         0,
        logging:         false,
      }).then((canvas) => {

        // Remove clone imediatamente após geração do canvas
        if (document.body.contains(clone)) document.body.removeChild(clone);

        canvas.toBlob((blob) => {
          if (!blob) { showToast("ERRO AO GERAR IMAGEM"); return; }

          const fileName  = 'minha-simulacao-copa-2026.png';
          const file      = new File([blob], fileName, { type: 'image/png' });
          const siteUrl   = window.location.origin + window.location.pathname;

          const shareData = {
            title: 'Minha Simulação da Copa do Mundo 2026',
            text:  '⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de montar meu chaveamento, monte o seu também!',
            url:   siteUrl,
            files: [file],
          };

          // API nativa de compartilhamento (iOS / Android)
          if (navigator.canShare && navigator.canShare(shareData) && navigator.share) {
            navigator.share(shareData)
              .then(() => showToast("COMPARTILHADO COM SUCESSO!"))
              .catch((err) => {
                if (err.name !== 'AbortError') fallbackShare(blob, siteUrl);
              });
          } else {
            // Fallback: download + WhatsApp para Desktop ou browsers sem Web Share API
            fallbackShare(blob, siteUrl);
          }
        }, 'image/png');

      }).catch((err) => {
        if (document.body.contains(clone)) document.body.removeChild(clone);
        console.error("Erro no html2canvas:", err);
        showToast("ERRO AO CAPTURAR TELA");
      });

    }, 300); // 300ms de segurança para carregamento de imagens externas
  }

  function fallbackShare(blob, siteUrl) {
    // Download automático
    const link     = document.createElement('a');
    link.href      = URL.createObjectURL(blob);
    link.download  = 'minha-simulacao-copa-2026.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 150);

    showToast("💾 IMAGEM SALVA! REDIRECIONANDO PARA O WHATSAPP...");

    // Abre WhatsApp com link do simulador
    const baseText    = "⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de baixar a imagem do meu chaveamento, monte o seu também! ";
    const whatsappUrl = 'https://wa.me/?text=' + encodeURIComponent(baseText + siteUrl);
    setTimeout(() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer'), 1500);
  }

  return { share };
})();
