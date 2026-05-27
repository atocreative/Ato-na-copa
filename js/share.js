/**
 * Share Module — Print Engine v4 (Largura 1440px + Linhas Nítidas)
 * Clonagem isolada em memória com viewport de desktop travado.
 * Resolve: corte da coluna direita, linhas invisíveis, quebra em mobile.
 */
const ShareModule = (() => {

  // ── Constante mestre de largura ──────────────────────────────────────────
  // Deve coincidir com .bracket-wrap.capture-mode no CSS
  const CAPTURE_WIDTH = 1440;

  function share() {
    const original = document.getElementById('bracket-wrap');
    if (!original) {
      showToast("ERRO: ÁRVORE MATA-MATA NÃO ENCONTRADA");
      return;
    }

    showToast("📸 GERANDO IMAGEM DA SUA SIMULAÇÃO...", 2500);

    // ── 1. Clonar o bracket-wrap inteiro em memória ──────────────────────
    const clone = original.cloneNode(true);
    clone.classList.add('capture-mode');

    // ── 2. Travar a geometria do clone em largura fixa de desktop ────────
    // Usando Object.assign para garantir precedência inline sobre media queries
    Object.assign(clone.style, {
      position:        'absolute',
      top:             '-99999px',
      left:            '-99999px',
      width:           CAPTURE_WIDTH + 'px',
      minWidth:        CAPTURE_WIDTH + 'px',
      maxWidth:        CAPTURE_WIDTH + 'px',
      height:          'auto',
      overflow:        'visible',
      backgroundColor: '#fdfcf8',
      padding:         '40px',
      zIndex:          '-9999',
      pointerEvents:   'none',
      transform:       'none',
    });

    // ── 3. Forçar opacidade total em bandeiras e imagens ─────────────────
    // html2canvas às vezes subamostra imagens com opacity < 1
    clone.querySelectorAll('img, .flag-placeholder').forEach(el => {
      el.style.opacity = '1';
    });

    // ── 4. Reforçar visibilidade das linhas SVG de conexão ───────────────
    // Aumenta a opacidade das linhas do chaveamento para aparecerem no print
    clone.querySelectorAll('path[stroke]').forEach(line => {
      const op = parseFloat(line.getAttribute('opacity') || '1');
      line.setAttribute('opacity', Math.min(1, op * 2).toFixed(2));
      // Garante a cor e espessura padrão
      if (!line.getAttribute('stroke-width') || parseFloat(line.getAttribute('stroke-width')) < 1.5) {
        line.setAttribute('stroke-width', '1.8');
      }
    });

    // ── 5. Watermark do Brasil ───────────────────────────────────────────
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
      width:         '90%',
      maxWidth:      '800px',
      height:        'auto',
      objectFit:     'contain',
      pointerEvents: 'none',
    });
    clone.appendChild(watermarkImg);

    // ── 6. Injetar clone no DOM ──────────────────────────────────────────
    document.body.appendChild(clone);

    // ── 7. Redesenhar linhas SVG no clone com as dimensões corretas ──────
    if (typeof BracketModule !== 'undefined' && BracketModule.drawLines) {
      BracketModule.drawLines(clone);
    }

    // ── 8. Aguardar 200ms para garantir que bandeiras do GitHub carreguem ─
    setTimeout(() => {
      // ── 9. html2canvas com parâmetros anti-corte definitivos ──────────
      // width        → define a largura real capturada do elemento
      // windowWidth  → força o viewport simulado (desativa media queries mobile)
      // scrollX/Y    → elimina offset de scroll que desloca o canvas
      // scale: 2     → 2× resolução para siglas legíveis no WhatsApp
      html2canvas(clone, {
        useCORS:         true,
        allowTaint:      false,
        scale:           2,
        backgroundColor: '#fdfcf8',
        width:           CAPTURE_WIDTH,
        windowWidth:     CAPTURE_WIDTH,
        windowHeight:    900,
        scrollX:         0,
        scrollY:         0,
        logging:         false,
      }).then((canvas) => {

        // Remover clone imediatamente após geração
        if (document.body.contains(clone)) {
          document.body.removeChild(clone);
        }

        canvas.toBlob((blob) => {
          if (!blob) {
            showToast("ERRO AO GERAR IMAGEM");
            return;
          }

          const fileName  = 'minha-simulacao-copa-2026.png';
          const file      = new File([blob], fileName, { type: 'image/png' });
          const siteUrl   = window.location.origin + window.location.pathname;

          const shareData = {
            title: 'Minha Simulação da Copa do Mundo 2026',
            text:  '⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de montar meu chaveamento, monte o seu também!',
            url:   siteUrl,
            files: [file],
          };

          // API nativa de compartilhamento (iOS/Android)
          if (navigator.canShare && navigator.canShare(shareData) && navigator.share) {
            navigator.share(shareData)
              .then(() => showToast("COMPARTILHADO COM SUCESSO!"))
              .catch((err) => {
                if (err.name !== 'AbortError') {
                  fallbackShare(blob, siteUrl);
                }
              });
          } else {
            // Fallback: download + WhatsApp (Desktop / browsers sem Web Share API)
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

    }, 200); // 200ms de segurança para carregamento de imagens externas
  }

  function fallbackShare(blob, siteUrl) {
    // Download automático da imagem gerada
    const link = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'minha-simulacao-copa-2026.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(link.href), 150);

    showToast("💾 IMAGEM SALVA! REDIRECIONANDO PARA O WHATSAPP...");

    // Abrir WhatsApp com link do site
    const baseText    = "⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de baixar a imagem do meu chaveamento, monte o seu também! ";
    const whatsappUrl = 'https://wa.me/?text=' + encodeURIComponent(baseText + siteUrl);

    setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 1500);
  }

  return { share };
})();
