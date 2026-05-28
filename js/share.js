/**
 * Share Module — Print Engine (Flexbox Simétrico + Miolo Flow + Base64)
 * Mantém o chaveamento limpo usando flexbox do HTML original, corrigindo
 * linhas tortas, alinhando cards ao centro e preservando bandeiras.
 */
const ShareModule = (() => {

  const CAPTURE_WIDTH = 1650;
  const CAPTURE_HEIGHT = 1050;

  // ── FUNÇÃO BASE64 (MANTÉM AS BANDEIRAS VISÍVEIS) ─────────────────────────
  const convertImagesToBase64 = async (cloneNode) => {
    const images = cloneNode.querySelectorAll("img");
    const promises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        const src = img.src;
        if (!src || src.startsWith("data:")) return resolve();

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const tempImg = new Image();
        tempImg.crossOrigin = "anonymous";
        
        tempImg.onload = () => {
          canvas.width = tempImg.naturalWidth || tempImg.width || 40;
          canvas.height = tempImg.naturalHeight || tempImg.height || 40;
          ctx.drawImage(tempImg, 0, 0);
          try {
            img.src = canvas.toDataURL("image/png");
          } catch (e) {
            console.error(e);
          }
          resolve();
        };
        tempImg.onerror = () => resolve();
        tempImg.src = src;
      });
    });
    await Promise.all(promises);
  };

  function share() {
    const original = document.getElementById('bracket-wrap');
    if (!original) {
      showToast("ERRO: ÁRVORE MATA-MATA NÃO ENCONTRADA");
      return;
    }

    showToast("📸 GERANDO IMAGEM DA SUA SIMULAÇÃO...", 3000);

    const printClone = original.cloneNode(true);
    printClone.classList.add('capture-mode');

    // ── 1. Estilização Flexbox Simétrica para o Clone Principal ─────────────
    Object.assign(printClone.style, {
      position: "absolute",
      top: "-9999px",
      left: "-9999px",
      width: CAPTURE_WIDTH + "px",
      minWidth: CAPTURE_WIDTH + "px",
      height: CAPTURE_HEIGHT + "px",
      padding: "40px 60px",
      backgroundColor: "#fdfcf8",
      transform: "none",
      zoom: "1",
      boxSizing: "border-box"
    });

    const bracketInner = printClone.querySelector('#bracket');
    if (bracketInner) {
      Object.assign(bracketInner.style, {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "stretch",
        width: "100%",
        height: "100%",
        position: "relative"
      });
      // Reseta todas as colunas laterais para fluxo natural
      Array.from(bracketInner.children).forEach(col => {
        if (col.classList.contains('bk-column')) {
          col.style.position = "relative";
          col.style.top = "auto";
          col.style.left = "auto";
          col.style.right = "auto";
          col.style.bottom = "auto";
        }
      });
    }

    // ── 2. ISOLAMENTO E CENTRALIZAÇÃO DO MIOLO CENTRAL ───────────────────────
    const centerCol = printClone.querySelector('.bk-center');
    if (centerCol) {
      Object.assign(centerCol.style, {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center", // Centraliza o conteúdo inteiro verticalmente
        width: "350px", // Dá respiro pro miolo
        position: "relative",
        zIndex: "50"
      });

      // Se existir o stack, reseta ele também
      const stack = centerCol.querySelector('.bk-center-stack');
      if (stack) {
        Object.assign(stack.style, {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          position: "static"
        });
      }

      // Ajustes finos de espaçamento interno no miolo centralizado
      const trophyBox = centerCol.querySelector(".bk-trophy-box");
      const taçaImg = centerCol.querySelector(".bk-trophy");
      const championLine = centerCol.querySelector(".bk-champion-line");
      const finalWrap = centerCol.querySelector(".bk-final-wrap");
      const thirdWrap = centerCol.querySelector(".bk-third-wrap");

      if (trophyBox) {
        Object.assign(trophyBox.style, {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bottom: "auto", left: "auto", transform: "none",
          margin: "0 0 20px 0"
        });
      }

      if (taçaImg) {
        // Reduz o tamanho da taça conforme solicitado
        taçaImg.style.width = "90px";
        taçaImg.style.marginBottom = "12px";
      }

      if (championLine) {
        Object.assign(championLine.style, {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginTop: "0"
        });
      }

      if (finalWrap) {
        Object.assign(finalWrap.style, {
          position: "relative",
          width: "240px",
          margin: "20px 0",
          top: "auto", left: "auto", transform: "none"
        });
        
        // Garante que o titulo da final fique no fluxo
        const finalTitle = finalWrap.querySelector(".bk-round-title");
        if (finalTitle) {
          finalTitle.style.position = "relative";
          finalTitle.style.top = "auto";
          finalTitle.style.marginBottom = "8px";
        }
      }

      if (thirdWrap) {
        Object.assign(thirdWrap.style, {
          position: "relative",
          width: "240px",
          margin: "30px 0 0 0",
          top: "auto", left: "auto", transform: "none"
        });

        // Garante que o titulo de terceiro fique no fluxo
        const thirdTitle = thirdWrap.querySelector(".bk-round-title");
        if (thirdTitle) {
          thirdTitle.style.position = "relative";
          thirdTitle.style.top = "auto";
          thirdTitle.style.marginBottom = "8px";
        }
      }
    }

    // ── 3. Watermark do Brasil cobrindo o print todo com opacity 0.3 ────────
    const oldWatermark = printClone.querySelector(".bk-ato-watermark");
    if (oldWatermark) oldWatermark.remove(); // Limpa se existir versão antiga
    
    const watermarkImg = document.createElement('img');
    watermarkImg.src = 'pngwing.com.png';
    watermarkImg.className = "print-watermark";
    Object.assign(watermarkImg.style, {
      position: "absolute", 
      top: "50%", 
      left: "50%", 
      transform: "translate(-50%, -50%)",
      zIndex: "0", 
      opacity: "0.3", // Conforme solicitado
      width: "auto",
      height: "100%", // Cobre a altura toda
      objectFit: "contain", 
      pointerEvents: "none"
    });
    printClone.appendChild(watermarkImg);

    // Forçar opacidade nas flags para nao sumirem
    printClone.querySelectorAll("img.bk-flag, img.bk-champ-flag, .flag-placeholder").forEach(el => {
      el.style.opacity = "1";
    });

    document.body.appendChild(printClone);

    // Redesenha as linhas SVG após o layout estático assentar
    if (typeof BracketModule !== 'undefined' && BracketModule.drawLines) {
      BracketModule.drawLines(printClone);
      
      printClone.querySelectorAll('path[stroke]').forEach(line => {
        line.style.opacity = '1';
        line.setAttribute('opacity', '1');
        if (parseFloat(line.getAttribute('stroke-width') || '0') < 1.8) {
          line.setAttribute('stroke-width', '1.8');
        }
      });
    }

    // Converte imagens pra Base64 e captura
    convertImagesToBase64(printClone).then(() => {
      setTimeout(() => {
        html2canvas(printClone, {
          useCORS: true,
          allowTaint: false,
          scale: 2, 
          backgroundColor: "#fdfcf8",
          width: CAPTURE_WIDTH,
          height: CAPTURE_HEIGHT,
          windowWidth: CAPTURE_WIDTH,
          windowHeight: CAPTURE_HEIGHT,
          scrollX: 0,
          scrollY: 0,
          logging: false
        }).then(canvas => {
          if (document.body.contains(printClone)) document.body.removeChild(printClone);
          
          canvas.toBlob((blob) => {
            if (!blob) { showToast("ERRO AO GERAR IMAGEM"); return; }
            
            const siteUrl = window.location.origin + window.location.pathname;
            const file = new File([blob], 'minha-simulacao-copa-2026.png', { type: 'image/png' });
            
            const shareData = {
              title: 'Minha Simulação da Copa do Mundo 2026',
              text: '⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de montar meu chaveamento, monte o seu também!',
              url: siteUrl,
              files: [file]
            };
            
            if (navigator.canShare && navigator.canShare(shareData) && navigator.share) {
              navigator.share(shareData)
                .then(() => showToast("COMPARTILHADO COM SUCESSO!"))
                .catch(err => { if (err.name !== 'AbortError') fallbackShare(blob, siteUrl); });
            } else {
              fallbackShare(blob, siteUrl);
            }
          }, 'image/png');
        }).catch(err => {
          if (document.body.contains(printClone)) document.body.removeChild(printClone);
          console.error("Erro no html2canvas:", err);
          showToast("ERRO AO CAPTURAR TELA");
        });
      }, 300);
    });
  }

  function fallbackShare(blob, siteUrl) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'minha-simulacao-copa-2026.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 150);
    
    showToast("💾 IMAGEM SALVA! REDIRECIONANDO PARA O WHATSAPP...");
    
    const baseText = "⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de baixar a imagem do meu chaveamento, monte o seu também! ";
    setTimeout(() => window.open('https://wa.me/?text=' + encodeURIComponent(baseText + siteUrl), '_blank', 'noopener,noreferrer'), 1500);
  }

  return { share };
})();
