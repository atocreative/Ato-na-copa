/**
 * Share Module — Print Engine v7 (Flex Simétrico + Base64 + Centro Absoluto)
 * Mantém o chaveamento limpo usando flexbox do HTML original e isola o miolo
 * matematicamente no centro para evitar esmagamento.
 */
const ShareModule = (() => {

  const CAPTURE_WIDTH = 1650;
  const CAPTURE_HEIGHT = 1050;

  // ── 3. FUNÇÃO BASE64 CONSERVADA (MANTÉM AS BANDEIRAS VISÍVEIS) ─────────────
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

    // ── 1. Reset e Estilização Flexbox Simétrica para o Clone ───────────────
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

    // ── 4. LIMPEZA DE LINHAS TORTAS NAS SEÇÕES LATERAIS ─────────────────────
    // Devolvemos o layout flex original para as colunas, usando space-between
    // para garantir que esquerda e direita fiquem nas pontas.
    const bracketInner = printClone.querySelector('#bracket');
    if (bracketInner) {
      Object.assign(bracketInner.style, {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "stretch",
        width: "100%",
        position: "relative"
      });
    }

    // ── 2. ISOLAMENTO E CENTRALIZAÇÃO MATEMÁTICA DO MIOLO CENTRAL ───────────
    const centerCol = printClone.querySelector('.bk-center');
    if (centerCol) {
      Object.assign(centerCol.style, {
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: "50",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "350px",
        pointerEvents: "none"
      });

      // Zera o width flex das colunas adjacentes para elas não esmagarem
      centerCol.classList.remove('bk-column'); 
    }

    // Ajustes finos de espaçamento interno no miolo centralizado
    const trophyBox = printClone.querySelector(".bk-trophy-box");
    const championLine = printClone.querySelector(".bk-champion-line");
    const thirdWrap = printClone.querySelector(".bk-third-wrap");
    const finalWrap = printClone.querySelector(".bk-final-wrap");

    if (trophyBox) {
      Object.assign(trophyBox.style, {
        position: "absolute",
        top: "160px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "0"
      });
    }

    if (championLine) {
      Object.assign(championLine.style, {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        marginTop: "16px"
      });
    }

    if (finalWrap) {
      Object.assign(finalWrap.style, {
        position: "absolute",
        top: "420px",
        width: "240px",
        left: "50%",
        transform: "translateX(-50%)",
        margin: "0"
      });
    }

    if (thirdWrap) {
      Object.assign(thirdWrap.style, {
        position: "absolute",
        top: "660px",
        width: "240px",
        left: "50%",
        transform: "translateX(-50%)",
        margin: "0"
      });
    }

    // Watermark
    const watermarkImg = printClone.querySelector(".bk-ato-watermark");
    if (!watermarkImg) {
      const img = document.createElement('img');
      img.src = 'pngwing.com.png';
      Object.assign(img.style, {
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: "0", opacity: "0.04", width: "90%", maxWidth: "800px", objectFit: "contain", pointerEvents: "none"
      });
      printClone.appendChild(img);
    }

    // Forçar opacidade nas marcações estáticas
    printClone.querySelectorAll("img, .flag-placeholder").forEach(el => el.style.opacity = "1");

    document.body.appendChild(printClone);

    // Redesenha as linhas SVG com o novo layout estabilizado (space-between)
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
