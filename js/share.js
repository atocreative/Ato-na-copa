/**
 * Share Module — Print Engine v8 (Grid Fixo 9-Colunas + Miolo Absoluto na Coluna 5)
 * Engenharia gráfica definitiva: tabela estática isolada em memória.
 * 9 colunas matemáticas (4 esquerda | 350px centro | 4 direita) impedem que o
 * html2canvas amasse o layout em telas pequenas. Base64 garante bandeiras coloridas.
 */
const ShareModule = (() => {

  const CAPTURE_WIDTH = 1650;
  const CAPTURE_HEIGHT = 1050;

  // ── 4. FUNÇÃO BASE64 PRESERVADA (BANDEIRAS COLORIDAS GARANTIDAS) ───────────
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
    const bracketElement = document.getElementById('bracket-wrap');
    if (!bracketElement) {
      showToast("ERRO: ÁRVORE MATA-MATA NÃO ENCONTRADA");
      return;
    }

    showToast("📸 GERANDO IMAGEM DA SUA SIMULAÇÃO...", 3000);

    // ── 1. CLONAGEM PROFUNDA E RESET ABSOLUTO DE ESTILOS FLUIDOS ─────────────
    const printClone = bracketElement.cloneNode(true);
    printClone.className = "bracket-print-snapshot";

    Object.assign(printClone.style, {
      position: "absolute",
      top: "-9999px",
      left: "-9999px",
      width: CAPTURE_WIDTH + "px",
      minWidth: CAPTURE_WIDTH + "px",
      height: CAPTURE_HEIGHT + "px",
      minHeight: CAPTURE_HEIGHT + "px",
      backgroundColor: "#fdfcf8",
      padding: "40px 60px",
      boxSizing: "border-box",
      transform: "none",
      zoom: "1",
      overflow: "visible"
    });

    // O #bracket é o container real das 9 colunas. Aplicamos o grid rígido nele.
    const bracketInner = printClone.querySelector('#bracket');
    if (bracketInner) {
      Object.assign(bracketInner.style, {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr 350px 1fr 1fr 1fr 1fr",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        position: "relative",
        gap: "0",
        padding: "0",
        minHeight: "unset"
      });
    }

    // ── 2. TRAVAMENTO DAS COLUNAS LATERAIS COMO BLOCOS VERTICAIS FIXOS ───────
    const columns = bracketInner ? bracketInner.children : [];
    Array.from(columns).forEach(col => {
      if (!col.classList.contains("bk-center")) {
        Object.assign(col.style, {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          height: "100%",
          width: "auto",
          position: "relative"
        });
        const matchesDiv = col.querySelector('.bk-matches');
        if (matchesDiv) {
          Object.assign(matchesDiv.style, {
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            height: "100%",
            flex: "1"
          });
        }
      }
    });

    // ── 3. ANCORAGEM ABSOLUTA E MILIMÉTRICA DO MIOLO CENTRAL (COLUNA 5) ──────
    const centerColumn = printClone.querySelector('.bk-center');
    if (centerColumn) {
      Object.assign(centerColumn.style, {
        gridColumn: "5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        height: "100%",
        width: "100%",
        padding: "40px 0",
        boxSizing: "border-box",
        position: "relative",
        left: "auto",
        right: "auto",
        transform: "none"
      });

      // O .bk-center-stack é o filho real que organiza os 3 blocos verticais
      const centerStack = centerColumn.querySelector('.bk-center-stack');
      if (centerStack) {
        Object.assign(centerStack.style, {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          height: "100%",
          width: "100%",
          position: "static"
        });
      }

      // Mapeia os elementos internos do miolo
      const trophyBox = centerColumn.querySelector(".bk-trophy-box");
      const taçaImg = centerColumn.querySelector(".bk-trophy");
      const campeaoBox = centerColumn.querySelector(".bk-champion-line");
      const labelFinal = centerColumn.querySelector(".bk-final-wrap");
      const disputaBronze = centerColumn.querySelector(".bk-third-wrap");

      // Reset do trophy-box: tirar do absolute, deixar empilhado no topo do miolo
      if (trophyBox) {
        Object.assign(trophyBox.style, {
          position: "static",
          top: "auto",
          bottom: "auto",
          left: "auto",
          right: "auto",
          transform: "none",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          margin: "0",
          marginBottom: "10px"
        });
      }

      // Taça com dimensão fixa e bruta para o print não amassar
      if (taçaImg) {
        Object.assign(taçaImg.style, {
          width: "130px",
          height: "auto",
          margin: "0 auto",
          marginBottom: "16px",
          display: "block"
        });
      }

      // ── 5. ALINHAMENTO HORIZONTAL ESTRITO: BANDEIRA | NOME | CAMPEÃ/CAMPEÃO ──
      if (campeaoBox) {
        Object.assign(campeaoBox.style, {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#012562",
          marginTop: "12px",
          whiteSpace: "nowrap",
          flexWrap: "nowrap"
        });
      }

      // FINAL no meio, isolada
      if (labelFinal) {
        Object.assign(labelFinal.style, {
          position: "static",
          top: "auto",
          left: "auto",
          transform: "none",
          margin: "15px 0",
          width: "240px"
        });
      }

      // 3º LUGAR rigorosamente abaixo, isolada do campeão
      if (disputaBronze) {
        Object.assign(disputaBronze.style, {
          position: "static",
          top: "auto",
          left: "auto",
          transform: "none",
          marginTop: "30px",
          width: "240px"
        });
      }
    }

    // Watermark Ato (preserva fundo discreto)
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

    // Força opacidade total em bandeiras (evita estado loser do mata-mata sumir no print)
    printClone.querySelectorAll("img, .flag-placeholder").forEach(el => el.style.opacity = "1");

    // Injeta o clone fora da viewport e dispara o motor de captura
    document.body.appendChild(printClone);

    // Redesenha as linhas SVG com o novo layout em grid estabilizado
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
