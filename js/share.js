/**
 * Share Module — Print Engine v3 (Infalível)
 * Clonagem isolada + viewport fixo de desktop + overflow visible
 * Evita cortes laterais e linhas invisíveis no mobile
 */
const ShareModule = (() => {

  // Largura fixa do clone — deve coincidir com .capture-mode no CSS
  const CAPTURE_WIDTH = 1500;

  function share() {
    const original = document.getElementById('bracket-wrap');
    if (!original) {
      showToast("ERRO: ÁRVORE MATA-MATA NÃO ENCONTRADA");
      return;
    }

    showToast("📸 GERANDO IMAGEM DA SUA SIMULAÇÃO...", 2500);

    setTimeout(() => {

      // ── 1. Clonar o bracket-wrap em memória ──────────────────────────────
      const clone = original.cloneNode(true);
      clone.classList.add('capture-mode');

      // ── 2. Travar geometria do clone em largura fixa de desktop ──────────
      // Sem isso, em telas mobile o html2canvas lê a largura colapsada e corta.
      clone.style.cssText = [
        'position: absolute',
        'top: -99999px',
        'left: -99999px',
        'width: ' + CAPTURE_WIDTH + 'px',
        'min-width: ' + CAPTURE_WIDTH + 'px',
        'max-width: ' + CAPTURE_WIDTH + 'px',
        'height: auto',
        'overflow: visible',
        'background-color: #fdfcf8',
        'z-index: -9999',
        'pointer-events: none',
      ].join('; ');

      // ── 3. Forçar linhas de conexão explícitas e nítidas ─────────────────
      // Garante que as linhas SVG apareçam no print independente do viewport.
      clone.querySelectorAll('path[stroke]').forEach(line => {
        const currentOpacity = parseFloat(line.getAttribute('opacity') || '1');
        // Aumenta levemente a opacidade das linhas para ficarem visíveis no print
        line.setAttribute('opacity', Math.min(1, currentOpacity * 1.8).toFixed(2));
      });

      // ── 4. Watermark do Brasil ───────────────────────────────────────────
      const watermarkImg = document.createElement('img');
      watermarkImg.src = 'pngwing.com.png';
      watermarkImg.alt = 'Brasil';
      watermarkImg.style.cssText = [
        'position: absolute',
        'top: 50%',
        'left: 50%',
        'transform: translate(-50%, -50%)',
        'z-index: 0',
        'opacity: 0.04',
        'width: 90%',
        'max-width: 800px',
        'height: auto',
        'object-fit: contain',
        'pointer-events: none',
      ].join('; ');
      clone.appendChild(watermarkImg);

      // ── 5. Injetar clone no DOM e redesenhar linhas SVG ──────────────────
      document.body.appendChild(clone);

      if (typeof BracketModule !== 'undefined' && BracketModule.drawLines) {
        BracketModule.drawLines(clone);
      }

      // ── 6. html2canvas com parâmetros anti-corte ─────────────────────────
      // windowWidth = CAPTURE_WIDTH  → força o media-query a ler como desktop
      // scrollX/scrollY = 0          → elimina offset de scroll que desloca o canvas
      // scale = 2                    → dobra a resolução (siglas nítidas)
      // useCORS = true               → carrega bandeiras do GitHub sem taint
      const options = {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: '#fdfcf8',
        windowWidth: CAPTURE_WIDTH,
        windowHeight: 900,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      };

      html2canvas(clone, options).then((canvas) => {
        // Remover clone imediatamente após captura
        if (document.body.contains(clone)) {
          document.body.removeChild(clone);
        }

        canvas.toBlob((blob) => {
          if (!blob) {
            showToast("ERRO AO GERAR IMAGEM");
            return;
          }

          const fileName = 'minha-simulacao-copa-2026.png';
          const file = new File([blob], fileName, { type: 'image/png' });
          const siteUrl = window.location.origin + window.location.pathname;

          const shareData = {
            title: 'Minha Simulação da Copa do Mundo 2026',
            text: '⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de montar meu chaveamento, monte o seu também!',
            url: siteUrl,
            files: [file]
          };

          // API de compartilhamento nativa (mobile) com suporte a arquivos
          if (navigator.canShare && navigator.canShare(shareData) && navigator.share) {
            navigator.share(shareData)
              .then(() => {
                showToast("COMPARTILHADO COM SUCESSO!");
              })
              .catch((err) => {
                if (err.name !== 'AbortError') {
                  console.warn("Compartilhamento nativo falhou. Fallback ativado.", err);
                  fallbackShare(blob, siteUrl);
                }
              });
          } else {
            // Fallback: download + WhatsApp (Desktop / navegadores sem Web Share API)
            fallbackShare(blob, siteUrl);
          }
        }, 'image/png');
      }).catch((err) => {
        if (document.body.contains(clone)) {
          document.body.removeChild(clone);
        }
        console.error("Erro no html2canvas:", err);
        showToast("ERRO AO CAPTURAR TELA");
      });

    }, 150);
  }

  function fallbackShare(blob, siteUrl) {
    // 1. Download automático da imagem
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'minha-simulacao-copa-2026.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 150);

    showToast("💾 IMAGEM SALVA! REDIRECIONANDO PARA O WHATSAPP...");

    // 2. Abrir WhatsApp com mensagem e link
    const baseText = "⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de baixar a imagem do meu chaveamento, monte o seu também! ";
    const fullText = baseText + siteUrl;
    const encodedText = encodeURIComponent(fullText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;

    setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 1500);
  }

  return { share };
})();
