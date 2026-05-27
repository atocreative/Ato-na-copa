/**
 * Share Module — Print Engine v6 (Absolute Layout & Base64 Injector)
 * Fim dos cortes laterais, desalinhamentos e bandeiras sumidas.
 */
const ShareModule = (() => {

  const CAPTURE_WIDTH = 1650;
  const CAPTURE_HEIGHT = 1050;

  // ── ENGENHARIA DE CONVERSÃO DE IMAGENS EM BASE64 ─────────────────────────
  const convertImagesToBase64 = async (cloneNode) => {
    const images = cloneNode.querySelectorAll("img");
    const promises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        const src = img.src;
        if (!src || src.startsWith("data:")) return resolve();

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const tempImg = new Image();
        tempImg.crossOrigin = "anonymous"; // Resolve CORS do GitHub
        
        tempImg.onload = () => {
          canvas.width = tempImg.naturalWidth || tempImg.width || 40;
          canvas.height = tempImg.naturalHeight || tempImg.height || 40;
          ctx.drawImage(tempImg, 0, 0);
          try {
            img.src = canvas.toDataURL("image/png");
          } catch (e) {
            console.error("Erro ao converter imagem para Base64:", e);
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
    const masterBracket = document.querySelector("#bracket-wrap");
    if (!masterBracket) {
      showToast("ERRO: ÁRVORE MATA-MATA NÃO ENCONTRADA");
      return;
    }

    showToast("📸 GERANDO IMAGEM DA SUA SIMULAÇÃO...", 3000);

    // 1. Cria um clone profundo para manipulação isolada
    const printClone = masterBracket.cloneNode(true);
    printClone.classList.add('capture-mode');

    // 2. Estilização rígida de proporção estendida e layout travado em pixels
    Object.assign(printClone.style, {
      position: "absolute",
      top: "-9999px",
      left: "-9999px",
      width: "1650px",
      minWidth: "1650px",
      height: "1050px",
      display: "block",
      backgroundColor: "#fdfcf8",
      transform: "none",
      zoom: "1"
    });

    // Remove o flexbox original do #bracket para o absolute funcionar perfeitamente
    const bracketInner = printClone.querySelector('#bracket');
    if (bracketInner) {
      Object.assign(bracketInner.style, {
        display: "block",
        position: "relative",
        width: "100%",
        height: "100%"
      });
    }

    // 3. Forçar dimensões explícitas nas tags <img> do clone
    printClone.querySelectorAll("img").forEach(img => {
      if (img.classList.contains('bk-champ-flag')) {
        img.style.width = "48px";
        img.style.height = "34px";
      } else if (img.classList.contains('bk-flag')) {
        // As bandeiras nos matchs finais sao um pouco maiores
        const isFinal = img.closest('.bk-final-wrap');
        img.style.width = isFinal ? "40px" : "26px";
        img.style.height = isFinal ? "28px" : "18px";
      }
      img.style.display = "block";
      img.style.opacity = "1";
    });

    // 4. CORREÇÃO DE POSICIONAMENTO ESTATICAMENTE TRAVADO (COLUNAS LATERAIS)
    // Travando eixos X para alinhamento 100% perfeito
    const colsL1 = printClone.querySelectorAll(".left-col[data-round='1']");
    const colsL2 = printClone.querySelectorAll(".left-col[data-round='2']");
    const colsL3 = printClone.querySelectorAll(".left-col[data-round='3']");
    const colsL4 = printClone.querySelectorAll(".left-col[data-round='4']");

    const colsR1 = printClone.querySelectorAll(".right-col[data-round='1']");
    const colsR2 = printClone.querySelectorAll(".right-col[data-round='2']");
    const colsR3 = printClone.querySelectorAll(".right-col[data-round='3']");
    const colsR4 = printClone.querySelectorAll(".right-col[data-round='4']");

    const applyAbsoluteCol = (nodes, direction, value) => {
      nodes.forEach(col => {
        Object.assign(col.style, {
          position: "absolute",
          top: "80px", // Margem superior
          height: "880px", // Altura útil
          [direction]: value
        });
      });
    };

    applyAbsoluteCol(colsL1, 'left', '20px');
    applyAbsoluteCol(colsL2, 'left', '220px');
    applyAbsoluteCol(colsL3, 'left', '420px');
    applyAbsoluteCol(colsL4, 'left', '620px');

    applyAbsoluteCol(colsR1, 'right', '20px');
    applyAbsoluteCol(colsR2, 'right', '220px');
    applyAbsoluteCol(colsR3, 'right', '420px');
    applyAbsoluteCol(colsR4, 'right', '620px');

    // 5. CORREÇÃO DE CENTRALIZAÇÃO DO MIOLO CENTRAL
    // Desestrutura o bk-center e posiciona seus filhos diretamente
    const centerWrap = printClone.querySelector(".bk-center");
    if (centerWrap) {
      Object.assign(centerWrap.style, {
        position: "absolute",
        left: "0",
        top: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none"
      });
    }

    const centerElements = [
      printClone.querySelector(".bk-trophy-box"), // Inclui a taça e o campeão
      printClone.querySelector(".bk-final-wrap"),
      printClone.querySelector(".bk-third-wrap")
    ].filter(Boolean);

    centerElements.forEach(el => {
      Object.assign(el.style, {
        position: "absolute",
        left: "825px", // Metade matemática de 1650px
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "240px",
        margin: "0" // Zera margens conflitantes
      });
    });

    // Ajustes finos verticais do miolo
    const trophyBox = printClone.querySelector(".bk-trophy-box");
    const finalWrap = printClone.querySelector(".bk-final-wrap");
    const thirdWrap = printClone.querySelector(".bk-third-wrap");

    if (trophyBox) trophyBox.style.top = "180px";
    if (finalWrap) finalWrap.style.top = "460px";
    if (thirdWrap) thirdWrap.style.top = "660px";

    // 6. Watermark de fundo absoluto
    const watermarkImg = document.createElement('img');
    watermarkImg.src = 'pngwing.com.png';
    watermarkImg.alt = 'Brasil';
    Object.assign(watermarkImg.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: "0",
      opacity: "0.04",
      width: "90%",
      maxWidth: "800px",
      height: "auto",
      objectFit: "contain",
      pointerEvents: "none"
    });
    printClone.appendChild(watermarkImg);

    // 7. Forçar opacidade nas marcações estáticas
    printClone.querySelectorAll(".flag-placeholder").forEach(el => el.style.opacity = "1");

    // 8. Injeta o clone temporariamente no DOM
    document.body.appendChild(printClone);

    // 9. Redesenha as linhas SVG após o layout estático estar no DOM
    if (typeof BracketModule !== 'undefined' && BracketModule.drawLines) {
      BracketModule.drawLines(printClone);
      
      // Reforço explícito nas linhas
      printClone.querySelectorAll('path[stroke]').forEach(line => {
        line.setAttribute('opacity', '1');
        line.style.opacity = '1';
        if (parseFloat(line.getAttribute('stroke-width') || '0') < 1.8) {
          line.setAttribute('stroke-width', '1.8');
        }
      });
    }

    // 10. Executa conversão Base64 e captura canvas
    convertImagesToBase64(printClone).then(() => {
      setTimeout(() => {
        html2canvas(printClone, {
          useCORS: true,
          allowTaint: false,
          scale: 2, 
          backgroundColor: "#fdfcf8",
          width: 1650,
          height: 1050,
          windowWidth: 1650,
          scrollX: 0,
          scrollY: 0,
          logging: false
        }).then(canvas => {
          if (document.body.contains(printClone)) {
            document.body.removeChild(printClone);
          }
          
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
      }, 300); // Aguarda renderização CSS das imagens Base64
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
