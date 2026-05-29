/**
 * Share Module — Print Engine (Flexbox Simétrico + Miolo Flow + Base64)
 * Mantém o chaveamento limpo usando flexbox do HTML original, corrigindo
 * linhas tortas, alinhando cards ao centro e preservando bandeiras.
 */
const ShareModule = (() => {

  const CAPTURE_WIDTH = 1650;
  const CAPTURE_HEIGHT = 1050;

  // ── PIPELINE DE BANDEIRAS ──────────────────────────────────────────────────
  // Tentativas em ordem:
  // 1) fetch direto com CORS
  // 2) allorigins.win (proxy confiável para SVGs de CDN)
  // 3) corsproxy.io como fallback
  // Se tudo falhar, a bandeira fica cinza (aceitável)
  const CORS_PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
  ];

  const blobToDataUrl = (blob) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });

  const fetchAsDataUrl = async (src) => {
    // Tentativa 1: fetch direto com CORS
    try {
      const r = await fetch(src, { mode: "cors", credentials: "omit", cache: "force-cache" });
      if (r.ok) {
        const blob = await r.blob();
        const url = await blobToDataUrl(blob);
        if (url) return url;
      }
    } catch (e) { /* continua */ }

    // Tentativas 2+: proxies CORS
    for (const proxy of CORS_PROXIES) {
      try {
        const r = await fetch(proxy + encodeURIComponent(src), { credentials: "omit" });
        if (r.ok) {
          const blob = await r.blob();
          const url = await blobToDataUrl(blob);
          if (url) return url;
        }
      } catch (e) { /* continua */ }
    }

    return null;
  };

  // Converte data URL de SVG para PNG via canvas.
  // html2canvas tem suporte limitado a SVG — PNG é mais confiável.
  const svgDataUrlToPng = (dataUrl) => new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image/svg")) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      const w = Math.max(img.naturalWidth || img.width, 40);
      const h = Math.max(img.naturalHeight || img.height, 30);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      try {
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/png"));
      } catch (e) {
        resolve(dataUrl); // fallback: mantém SVG
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

  const waitForImgDecode = (img) => new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) return resolve();
    const done = () => { img.onload = null; img.onerror = null; resolve(); };
    img.onload = done;
    img.onerror = done;
    setTimeout(done, 2000);
  });

  const convertImagesToBase64 = async (cloneNode) => {
    const images = cloneNode.querySelectorAll("img");
    const promises = Array.from(images).map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;

      let dataUrl = await fetchAsDataUrl(src);

      if (dataUrl) {
        // Converte SVG → PNG para compatibilidade com html2canvas
        dataUrl = await svgDataUrlToPng(dataUrl);
      }

      if (dataUrl) {
        img.src = dataUrl;
        await waitForImgDecode(img);
      }
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
        justifyContent: "center",
        width: "350px",
        position: "relative",
        zIndex: "50"
      });

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
          margin: "-90px 0 30px 0"
        });
      }

      if (taçaImg) {
        taçaImg.style.width = "75px";
        taçaImg.style.marginBottom = "8px";
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
          width: "210px",
          margin: "20px auto",
          top: "auto", left: "auto", transform: "none"
        });
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
          width: "210px",
          margin: "30px auto 0 auto",
          top: "auto", left: "auto", transform: "none"
        });
        const thirdTitle = thirdWrap.querySelector(".bk-round-title");
        if (thirdTitle) {
          thirdTitle.style.position = "relative";
          thirdTitle.style.top = "auto";
          thirdTitle.style.marginBottom = "8px";
        }
      }
    }

    // ── 3. Marcas d'água ────────────────────────────────────────────────────
    const atoLogo = printClone.querySelector(".bk-ato-watermark");
    if (atoLogo) {
      Object.assign(atoLogo.style, {
        position: "absolute",
        top: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "160px",
        height: "160px",
        opacity: "0.5",
        zIndex: "10"
      });
      printClone.appendChild(atoLogo);
    }

    const watermarkImg = document.createElement('img');
    watermarkImg.src = 'pngwing.com.png';
    watermarkImg.className = "print-watermark";
    Object.assign(watermarkImg.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: "0",
      opacity: "0.1",
      width: "auto",
      height: "80%",
      objectFit: "contain",
      pointerEvents: "none"
    });
    printClone.appendChild(watermarkImg);

    // Força opacidade das bandeiras
    printClone.querySelectorAll("img.bk-flag, img.bk-champ-flag, .flag-placeholder").forEach(el => {
      el.style.opacity = "1";
    });

    document.body.appendChild(printClone);

    // ── 4. Converte imagens → Base64 (SVG convertido para PNG) ───────────────
    // Depois desenha as linhas dentro de rAF para garantir layout computado
    convertImagesToBase64(printClone).then(() => {
      requestAnimationFrame(() => {
        // Desenha linhas APÓS o layout estar computado pelo browser
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

        // Captura após as linhas estarem desenhadas
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
            imageTimeout: 30000,
            logging: false
          }).then(canvas => {
            if (document.body.contains(printClone)) document.body.removeChild(printClone);

            canvas.toBlob((blob) => {
              if (!blob) { showToast("ERRO AO GERAR IMAGEM"); return; }

              const siteUrl = window.location.origin + window.location.pathname;
              const file = new File([blob], 'minha-simulacao-copa-2026.png', { type: 'image/png' });
              doShare(blob, file, siteUrl);
            }, 'image/png');
          }).catch(err => {
            if (document.body.contains(printClone)) document.body.removeChild(printClone);
            console.error("Erro no html2canvas:", err);
            showToast("ERRO AO CAPTURAR TELA");
          });
        }, 400);
      });
    });
  }

  // Cascata de compartilhamento:
  // 1) Web Share API com arquivo (abre folha nativa do SO com imagem)
  // 2) Web Share API só com texto+URL (abre folha nativa sem imagem)
  // 3) Último recurso: baixa imagem + abre WhatsApp Web (desktop sem suporte)
  async function doShare(blob, file, siteUrl) {
    const shareText = '⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de montar meu chaveamento, monte o seu também!';

    // Nível 1: share com arquivo
    if (navigator.share && navigator.canShare) {
      const dataWithFile = {
        title: 'Minha Simulação da Copa do Mundo 2026',
        text: shareText,
        url: siteUrl,
        files: [file]
      };
      if (navigator.canShare(dataWithFile)) {
        try {
          await navigator.share(dataWithFile);
          showToast("COMPARTILHADO COM SUCESSO!");
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
        }
      }
    }

    // Nível 2: share só com texto + URL (sem arquivo)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Minha Simulação da Copa do Mundo 2026',
          text: shareText,
          url: siteUrl
        });
        showToast("COMPARTILHADO COM SUCESSO!");
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Nível 3: baixa imagem + abre WhatsApp Web (desktop)
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'minha-simulacao-copa-2026.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 150);

    showToast("💾 IMAGEM SALVA! REDIRECIONANDO PARA O WHATSAPP...");
    setTimeout(() => window.open('https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + siteUrl), '_blank', 'noopener,noreferrer'), 1500);
  }

  return { share };
})();
