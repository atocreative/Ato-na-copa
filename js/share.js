/**
 * Share Module — Pré-geração em background + Share Sheet nativo
 *
 * Problema: navigator.share() exige "gesto do usuário" ativo.
 * Após Promises longas (html2canvas + fetch), o browser anula o contexto
 * de gesto e o Share Sheet não abre — principalmente no iOS Safari.
 *
 * Solução: gerar a imagem em background sempre que o chaveamento muda,
 * e na hora do clique a imagem já está pronta → share é chamado
 * imediatamente, dentro do gesto.
 */
const ShareModule = (() => {

  const CAPTURE_WIDTH  = 1650;
  const CAPTURE_HEIGHT = 1050;

  // Cache da última imagem gerada
  let _cachedBlob = null;
  let _cachedFile = null;
  let _generating  = false;
  let _genDebounce = null;

  // ── CORS / Base64 Pipeline ─────────────────────────────────────────────────
  const CORS_PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
  ];

  const blobToDataUrl = (blob) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });

  const fetchAsDataUrl = async (src) => {
    try {
      const r = await fetch(src, { mode: "cors", credentials: "omit", cache: "force-cache" });
      if (r.ok) { const u = await blobToDataUrl(await r.blob()); if (u) return u; }
    } catch (e) {}

    for (const proxy of CORS_PROXIES) {
      try {
        const r = await fetch(proxy + encodeURIComponent(src), { credentials: "omit" });
        if (r.ok) { const u = await blobToDataUrl(await r.blob()); if (u) return u; }
      } catch (e) {}
    }
    return null;
  };

  // SVG → PNG: html2canvas tem suporte limitado a SVG
  const svgDataUrlToPng = (dataUrl) => new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image/svg")) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      const w = Math.max(img.naturalWidth  || img.width,  40);
      const h = Math.max(img.naturalHeight || img.height, 30);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      try { c.getContext("2d").drawImage(img, 0, 0, w, h); resolve(c.toDataURL("image/png")); }
      catch (e) { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

  const waitForImgDecode = (img) => new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) return resolve();
    const done = () => { img.onload = img.onerror = null; resolve(); };
    img.onload = img.onerror = done;
    setTimeout(done, 2000);
  });

  const convertImagesToBase64 = async (cloneNode) => {
    const imgs = Array.from(cloneNode.querySelectorAll("img"));
    await Promise.all(imgs.map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      let dataUrl = await fetchAsDataUrl(src);
      if (dataUrl) dataUrl = await svgDataUrlToPng(dataUrl);
      if (dataUrl) { img.src = dataUrl; await waitForImgDecode(img); }
    }));
  };

  // ── Monta clone e captura PNG ──────────────────────────────────────────────
  function buildClone() {
    const original = document.getElementById('bracket-wrap');
    if (!original) return null;

    const clone = original.cloneNode(true);
    clone.classList.add('capture-mode');

    Object.assign(clone.style, {
      position: "absolute", top: "-9999px", left: "-9999px",
      width: CAPTURE_WIDTH + "px", minWidth: CAPTURE_WIDTH + "px",
      height: CAPTURE_HEIGHT + "px",
      padding: "40px 60px",
      backgroundColor: "#fdfcf8",
      transform: "none", zoom: "1", boxSizing: "border-box"
    });

    const bracketInner = clone.querySelector('#bracket');
    if (bracketInner) {
      Object.assign(bracketInner.style, {
        display: "flex", flexDirection: "row",
        justifyContent: "space-between", alignItems: "stretch",
        width: "100%", height: "100%", position: "relative"
      });
      Array.from(bracketInner.children).forEach(col => {
        if (col.classList.contains('bk-column')) {
          col.style.cssText += ";position:relative;top:auto;left:auto;right:auto;bottom:auto";
        }
      });
    }

    const centerCol = clone.querySelector('.bk-center');
    if (centerCol) {
      Object.assign(centerCol.style, {
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        width: "350px", position: "relative", zIndex: "50"
      });
      const stack = centerCol.querySelector('.bk-center-stack');
      if (stack) Object.assign(stack.style, {
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        width: "100%", position: "static"
      });

      const trophyBox    = centerCol.querySelector(".bk-trophy-box");
      const taçaImg      = centerCol.querySelector(".bk-trophy");
      const championLine = centerCol.querySelector(".bk-champion-line");
      const finalWrap    = centerCol.querySelector(".bk-final-wrap");
      const thirdWrap    = centerCol.querySelector(".bk-third-wrap");

      if (trophyBox) Object.assign(trophyBox.style, {
        position: "relative", display: "flex", flexDirection: "column",
        alignItems: "center", bottom: "auto", left: "auto",
        transform: "none", margin: "-90px 0 30px 0"
      });
      if (taçaImg)      { taçaImg.style.width = "75px"; taçaImg.style.marginBottom = "8px"; }
      if (championLine) Object.assign(championLine.style, {
        display: "flex", flexDirection: "row",
        alignItems: "center", justifyContent: "center",
        gap: "10px", marginTop: "0"
      });
      if (finalWrap) {
        Object.assign(finalWrap.style, {
          position: "relative", width: "210px",
          margin: "20px auto", top: "auto", left: "auto", transform: "none"
        });
        const t = finalWrap.querySelector(".bk-round-title");
        if (t) { t.style.position = "relative"; t.style.top = "auto"; t.style.marginBottom = "8px"; }
      }
      if (thirdWrap) {
        Object.assign(thirdWrap.style, {
          position: "relative", width: "210px",
          margin: "30px auto 0 auto", top: "auto", left: "auto", transform: "none"
        });
        const t = thirdWrap.querySelector(".bk-round-title");
        if (t) { t.style.position = "relative"; t.style.top = "auto"; t.style.marginBottom = "8px"; }
      }
    }

    // Marca d'água ATO
    const atoLogo = clone.querySelector(".bk-ato-watermark");
    if (atoLogo) {
      Object.assign(atoLogo.style, {
        position: "absolute", top: "40px", left: "50%",
        transform: "translateX(-50%)", width: "160px", height: "160px",
        opacity: "0.5", zIndex: "10"
      });
      clone.appendChild(atoLogo);
    }

    // Marca d'água Brasil
    const wm = document.createElement('img');
    wm.src = 'pngwing.com.png';
    Object.assign(wm.style, {
      position: "absolute", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: "0", opacity: "0.1", width: "auto", height: "80%",
      objectFit: "contain", pointerEvents: "none"
    });
    clone.appendChild(wm);

    clone.querySelectorAll("img.bk-flag, img.bk-champ-flag").forEach(el => {
      el.style.opacity = "1";
    });

    return clone;
  }

  async function captureClone(clone) {
    document.body.appendChild(clone);
    try {
      await convertImagesToBase64(clone);

      await new Promise(res => requestAnimationFrame(res));

      // Redesenha linhas SVG após layout assentar
      if (typeof BracketModule !== 'undefined' && BracketModule.drawLines) {
        BracketModule.drawLines(clone);
        clone.querySelectorAll('path[stroke]').forEach(line => {
          line.style.opacity = '1';
          line.setAttribute('opacity', '1');
          if (parseFloat(line.getAttribute('stroke-width') || '0') < 1.8)
            line.setAttribute('stroke-width', '1.8');
        });
      }

      await new Promise(res => setTimeout(res, 300));

      const canvas = await html2canvas(clone, {
        useCORS: true, allowTaint: false, scale: 2,
        backgroundColor: "#fdfcf8",
        width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT,
        windowWidth: CAPTURE_WIDTH, windowHeight: CAPTURE_HEIGHT,
        scrollX: 0, scrollY: 0,
        imageTimeout: 30000, logging: false
      });

      return await new Promise(res => canvas.toBlob(res, 'image/png'));
    } finally {
      if (document.body.contains(clone)) document.body.removeChild(clone);
    }
  }

  // ── Pré-geração em background ──────────────────────────────────────────────
  // Chamado sempre que o chaveamento muda. Debounced para não gerar
  // a cada clique em sequência rápida.
  function preGenerate() {
    clearTimeout(_genDebounce);
    _genDebounce = setTimeout(() => {
      if (_generating) return;
      _generating = true;
      _cachedBlob = null;
      _cachedFile = null;

      const clone = buildClone();
      if (!clone) { _generating = false; return; }

      captureClone(clone).then(blob => {
        _generating = false;
        if (blob) {
          _cachedBlob = blob;
          _cachedFile = new File([blob], 'minha-simulacao-copa-2026.png', { type: 'image/png' });
        }
      }).catch(() => { _generating = false; });
    }, 1200); // espera 1.2s após última mudança para não gerar desnecessariamente
  }

  // ── Share em cascata ───────────────────────────────────────────────────────
  // Nível 1: Web Share API com arquivo  → abre Share Sheet nativo com imagem
  // Nível 2: Web Share API sem arquivo  → abre Share Sheet nativo sem imagem
  // Nível 3: download + WhatsApp Web    → desktop sem suporte
  async function doShare(blob, file) {
    const siteUrl   = window.location.origin + window.location.pathname;
    const shareText = '⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de montar meu chaveamento, monte o seu também!';

    if (navigator.share && navigator.canShare) {
      const dataWithFile = {
        title: 'Minha Simulação da Copa do Mundo 2026',
        text: shareText, url: siteUrl, files: [file]
      };
      if (navigator.canShare(dataWithFile)) {
        try {
          await navigator.share(dataWithFile);
          showToast("COMPARTILHADO COM SUCESSO!");
          return;
        } catch (err) {
          if (err.name === 'AbortError') return; // usuário cancelou
        }
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Minha Simulação da Copa do Mundo 2026',
          text: shareText, url: siteUrl
        });
        showToast("COMPARTILHADO COM SUCESSO!");
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Desktop: baixa + WhatsApp Web
    const link = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'minha-simulacao-copa-2026.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 150);

    showToast("💾 IMAGEM SALVA! REDIRECIONANDO PARA O WHATSAPP...");
    setTimeout(() => window.open(
      'https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + siteUrl),
      '_blank', 'noopener,noreferrer'
    ), 1500);
  }

  // ── Ponto de entrada público ───────────────────────────────────────────────
  function share() {
    if (_cachedBlob && _cachedFile) {
      // Imagem já pronta → share imediato dentro do gesto do usuário
      doShare(_cachedBlob, _cachedFile);
      return;
    }

    if (_generating) {
      // Ainda gerando → avisa e pede para tentar de novo em instantes
      showToast("⏳ PREPARANDO IMAGEM... TENTE NOVAMENTE EM INSTANTES", 3000);
      return;
    }

    // Não há cache nem geração em andamento (primeiro uso):
    // gera agora, e como provavelmente vai perder o contexto de gesto
    // no iOS, avisa o usuário para clicar de novo.
    showToast("📸 PREPARANDO IMAGEM... TOQUE EM COMPARTILHAR NOVAMENTE", 4000);
    _generating = true;
    const clone = buildClone();
    if (!clone) { _generating = false; showToast("ERRO AO GERAR IMAGEM"); return; }

    captureClone(clone).then(blob => {
      _generating = false;
      if (blob) {
        _cachedBlob = blob;
        _cachedFile = new File([blob], 'minha-simulacao-copa-2026.png', { type: 'image/png' });
        showToast("✅ IMAGEM PRONTA! TOQUE EM COMPARTILHAR.", 3500);
      } else {
        showToast("ERRO AO GERAR IMAGEM");
      }
    }).catch(() => {
      _generating = false;
      showToast("ERRO AO CAPTURAR TELA");
    });
  }

  return { share, preGenerate };
})();
