/**
 * Share Module — Pré-geração + Share Sheet nativo
 *
 * Fluxo:
 * 1. init()        → pré-busca todas as bandeiras em background (base64 cache)
 * 2. preGenerate() → gera o PNG do bracket em background quando completo
 * 3. share()       → se PNG pronto, chama navigator.share() imediatamente
 *                    (mantém contexto de gesto → Share Sheet abre no iOS/Android)
 *
 * Proxy de imagens: images.weserv.nl — CORS nativo + converte SVG→PNG
 */
const ShareModule = (() => {

  const CAPTURE_WIDTH  = 1650;
  const CAPTURE_HEIGHT = 1050;

  // Cache de bandeiras: src original → PNG base64
  const _flagCache = {};
  let _flagPrefetchDone = false;

  // Cache do PNG gerado do bracket
  let _cachedBlob = null;
  let _cachedFile = null;
  let _generating  = false;
  let _genDebounce = null;

  // ── Proxy de imagens ───────────────────────────────────────────────────────
  // images.weserv.nl: proxy CORS-safe com conversão SVG→PNG nativa
  const toWeservUrl = (src) => {
    const url = src.replace(/^https?:\/\//, '');
    return 'https://images.weserv.nl/?url=' + encodeURIComponent(url) + '&output=png&w=60&h=45&fit=contain';
  };

  const FALLBACK_PROXIES = [
    (src) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(src),
    (src) => 'https://corsproxy.io/?' + encodeURIComponent(src),
  ];

  const blobToDataUrl = (blob) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });

  // Tenta buscar imagem como PNG base64, usando weserv como proxy principal
  const fetchAsPng = async (src) => {
    // 1. weserv.nl — proxy dedicado para imagens, CORS nativo, converte SVG→PNG
    try {
      const r = await fetch(toWeservUrl(src), { credentials: 'omit' });
      if (r.ok) {
        const blob = await r.blob();
        if (blob.size > 100) { // garante que não é resposta vazia
          const u = await blobToDataUrl(blob);
          if (u) return u;
        }
      }
    } catch (e) {}

    // 2. Fetch direto com CORS
    try {
      const r = await fetch(src, { mode: 'cors', credentials: 'omit', cache: 'force-cache' });
      if (r.ok) {
        const blob = await r.blob();
        const dataUrl = await blobToDataUrl(blob);
        if (dataUrl) {
          // Se SVG, converte para PNG para compatibilidade com html2canvas
          if (dataUrl.startsWith('data:image/svg')) return await svgDataUrlToPng(dataUrl);
          return dataUrl;
        }
      }
    } catch (e) {}

    // 3. Proxies genéricos
    for (const makeUrl of FALLBACK_PROXIES) {
      try {
        const r = await fetch(makeUrl(src), { credentials: 'omit' });
        if (r.ok) {
          const blob = await r.blob();
          const dataUrl = await blobToDataUrl(blob);
          if (dataUrl) {
            if (dataUrl.startsWith('data:image/svg')) return await svgDataUrlToPng(dataUrl);
            return dataUrl;
          }
        }
      } catch (e) {}
    }

    return null;
  };

  // Converte SVG data URL → PNG via canvas offscreen
  const svgDataUrlToPng = (dataUrl) => new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/svg')) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      const w = Math.max(img.naturalWidth  || img.width,  60);
      const h = Math.max(img.naturalHeight || img.height, 45);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      try { c.getContext('2d').drawImage(img, 0, 0, w, h); resolve(c.toDataURL('image/png')); }
      catch (e) { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

  const waitForImgDecode = (img) => new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) return resolve();
    const done = () => { img.onload = img.onerror = null; resolve(); };
    img.onload = img.onerror = done;
    setTimeout(done, 3000);
  });

  // ── Prefetch de todas as bandeiras ─────────────────────────────────────────
  // Roda em background quando a página carrega.
  // Quando o usuário terminar o bracket e clicar em compartilhar,
  // todas as bandeiras já estão em cache → captura é rápida e fiel.
  async function prefetchAllFlags() {
    if (!window.TEAMS) return;
    const srcs = [...new Set(
      Object.values(window.TEAMS || TEAMS)
        .map(t => t.svg)
        .filter(Boolean)
    )];

    // Busca em lotes de 6 para não sobrecarregar
    for (let i = 0; i < srcs.length; i += 6) {
      const batch = srcs.slice(i, i + 6);
      await Promise.all(batch.map(async (src) => {
        if (_flagCache[src]) return;
        const png = await fetchAsPng(src);
        if (png) _flagCache[src] = png;
      }));
    }
    _flagPrefetchDone = true;
  }

  // ── Converte imagens do clone para base64 ──────────────────────────────────
  const convertImagesToBase64 = async (cloneNode) => {
    const imgs = Array.from(cloneNode.querySelectorAll('img'));
    await Promise.all(imgs.map(async (img) => {
      const src = img.getAttribute('data-original-src') || img.src;
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;

      // Usa cache se disponível
      if (_flagCache[src]) {
        img.src = _flagCache[src];
        await waitForImgDecode(img);
        return;
      }

      // Busca e armazena em cache
      const png = await fetchAsPng(src);
      if (png) {
        _flagCache[src] = png;
        img.src = png;
        await waitForImgDecode(img);
      }
    }));
  };

  // ── Constrói clone do bracket para captura ─────────────────────────────────
  function buildClone() {
    const original = document.getElementById('bracket-wrap');
    if (!original) return null;

    const clone = original.cloneNode(true);
    clone.classList.add('capture-mode');

    // Salva src original em data attribute para busca no cache
    clone.querySelectorAll('img').forEach(img => {
      if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
        img.setAttribute('data-original-src', img.src);
      }
    });

    Object.assign(clone.style, {
      position: 'absolute', top: '-9999px', left: '-9999px',
      width: CAPTURE_WIDTH + 'px', minWidth: CAPTURE_WIDTH + 'px',
      height: CAPTURE_HEIGHT + 'px',
      padding: '40px 60px',
      backgroundColor: '#fdfcf8',
      transform: 'none', zoom: '1', boxSizing: 'border-box'
    });

    const bracketInner = clone.querySelector('#bracket');
    if (bracketInner) {
      Object.assign(bracketInner.style, {
        display: 'flex', flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'stretch',
        width: '100%', height: '100%', position: 'relative'
      });
      Array.from(bracketInner.children).forEach(col => {
        if (col.classList.contains('bk-column')) {
          col.style.cssText += ';position:relative;top:auto;left:auto;right:auto;bottom:auto';
        }
      });
    }

    const centerCol = clone.querySelector('.bk-center');
    if (centerCol) {
      Object.assign(centerCol.style, {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        width: '350px', position: 'relative', zIndex: '50'
      });
      const stack = centerCol.querySelector('.bk-center-stack');
      if (stack) Object.assign(stack.style, {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        width: '100%', position: 'static'
      });

      const parts = {
        trophyBox:    centerCol.querySelector('.bk-trophy-box'),
        taçaImg:      centerCol.querySelector('.bk-trophy'),
        championLine: centerCol.querySelector('.bk-champion-line'),
        finalWrap:    centerCol.querySelector('.bk-final-wrap'),
        thirdWrap:    centerCol.querySelector('.bk-third-wrap'),
      };

      if (parts.trophyBox) Object.assign(parts.trophyBox.style, {
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', bottom: 'auto', left: 'auto',
        transform: 'none', margin: '-90px 0 30px 0'
      });
      if (parts.taçaImg) {
        parts.taçaImg.style.width = '75px';
        parts.taçaImg.style.marginBottom = '8px';
      }
      if (parts.championLine) Object.assign(parts.championLine.style, {
        display: 'flex', flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        gap: '10px', marginTop: '0'
      });
      ['finalWrap', 'thirdWrap'].forEach(key => {
        const el = parts[key];
        if (!el) return;
        Object.assign(el.style, {
          position: 'relative', width: '210px',
          margin: key === 'finalWrap' ? '20px auto' : '30px auto 0 auto',
          top: 'auto', left: 'auto', transform: 'none'
        });
        const title = el.querySelector('.bk-round-title');
        if (title) {
          title.style.position = 'relative';
          title.style.top = 'auto';
          title.style.marginBottom = '8px';
        }
      });
    }

    // Marca d'água ATO
    const atoLogo = clone.querySelector('.bk-ato-watermark');
    if (atoLogo) {
      Object.assign(atoLogo.style, {
        position: 'absolute', top: '40px', left: '50%',
        transform: 'translateX(-50%)', width: '160px', height: '160px',
        opacity: '0.5', zIndex: '10'
      });
      clone.appendChild(atoLogo);
    }

    // Marca d'água Brasil
    const wm = document.createElement('img');
    wm.src = 'pngwing.com.png';
    Object.assign(wm.style, {
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: '0', opacity: '0.1', width: 'auto', height: '80%',
      objectFit: 'contain', pointerEvents: 'none'
    });
    clone.appendChild(wm);

    clone.querySelectorAll('img.bk-flag, img.bk-champ-flag').forEach(el => {
      el.style.opacity = '1';
    });

    return clone;
  }

  // ── Captura PNG do clone ───────────────────────────────────────────────────
  async function captureClone(clone) {
    document.body.appendChild(clone);
    try {
      // Converte todas as imagens para base64 (usa cache se disponível)
      await convertImagesToBase64(clone);

      // Aguarda layout assentar
      await new Promise(res => requestAnimationFrame(res));
      await new Promise(res => requestAnimationFrame(res));

      // Redesenha linhas SVG com posições corretas
      if (typeof BracketModule !== 'undefined' && BracketModule.drawLines) {
        BracketModule.drawLines(clone);
        clone.querySelectorAll('path[stroke]').forEach(line => {
          line.style.opacity = '1';
          line.setAttribute('opacity', '1');
          if (parseFloat(line.getAttribute('stroke-width') || '0') < 1.8)
            line.setAttribute('stroke-width', '1.8');
        });
      }

      await new Promise(res => setTimeout(res, 400));

      const canvas = await html2canvas(clone, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: '#fdfcf8',
        width: CAPTURE_WIDTH,
        height: CAPTURE_HEIGHT,
        windowWidth: CAPTURE_WIDTH,
        windowHeight: CAPTURE_HEIGHT,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 60000,
        logging: false,
        onclone: (doc) => {
          // Garante que imagens base64 no clone capturado sejam preservadas
          doc.querySelectorAll('img[data-original-src]').forEach(img => {
            const cached = _flagCache[img.getAttribute('data-original-src')];
            if (cached) img.src = cached;
          });
        }
      });

      return await new Promise(res => canvas.toBlob(res, 'image/png'));
    } finally {
      if (document.body.contains(clone)) document.body.removeChild(clone);
    }
  }

  // ── Pré-geração em background ──────────────────────────────────────────────
  // Chamado apenas quando bracket está completo (final + 3º lugar definidos).
  // Debounce de 1.5s para não gerar durante sequência de cliques.
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
    }, 1500);
  }

  // ── Share em cascata ───────────────────────────────────────────────────────
  async function doShare(blob, file) {
    const siteUrl   = window.location.origin + window.location.pathname;
    const shareText = '⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de montar meu chaveamento, monte o seu também!';

    // Nível 1: Share Sheet nativo COM arquivo (imagem + texto + URL)
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
          showToast('COMPARTILHADO COM SUCESSO!');
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
        }
      }
    }

    // Nível 2: Share Sheet nativo SEM arquivo (texto + URL)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Minha Simulação da Copa do Mundo 2026',
          text: shareText,
          url: siteUrl
        });
        showToast('COMPARTILHADO COM SUCESSO!');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Nível 3: Desktop — baixa imagem + abre WhatsApp Web
    const link = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'minha-simulacao-copa-2026.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 150);

    showToast('💾 IMAGEM SALVA! REDIRECIONANDO PARA O WHATSAPP...');
    setTimeout(() => window.open(
      'https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + siteUrl),
      '_blank', 'noopener,noreferrer'
    ), 1500);
  }

  // ── API pública ────────────────────────────────────────────────────────────
  function init() {
    // Inicia prefetch de bandeiras em background (silencioso)
    prefetchAllFlags().catch(() => {});
  }

  function share() {
    if (_cachedBlob && _cachedFile) {
      // Imagem pronta → share imediato dentro do gesto → Share Sheet abre
      doShare(_cachedBlob, _cachedFile);
      return;
    }

    if (_generating) {
      showToast('⏳ PREPARANDO IMAGEM... TENTE NOVAMENTE EM INSTANTES', 3000);
      return;
    }

    // Imagem não está no cache (ex: usuário não mudou o bracket desde o load)
    // Gera agora e pede para clicar novamente (necessário no iOS)
    showToast('📸 PREPARANDO IMAGEM... TOQUE EM COMPARTILHAR NOVAMENTE', 4000);
    _generating = true;
    const clone = buildClone();
    if (!clone) { _generating = false; showToast('ERRO AO GERAR IMAGEM'); return; }

    captureClone(clone).then(blob => {
      _generating = false;
      if (blob) {
        _cachedBlob = blob;
        _cachedFile = new File([blob], 'minha-simulacao-copa-2026.png', { type: 'image/png' });
        showToast('✅ IMAGEM PRONTA! TOQUE EM COMPARTILHAR.', 3500);
      } else {
        showToast('ERRO AO GERAR IMAGEM');
      }
    }).catch(() => {
      _generating = false;
      showToast('ERRO AO CAPTURAR TELA');
    });
  }

  return { init, share, preGenerate };
})();
