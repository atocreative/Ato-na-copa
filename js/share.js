/**
 * Share Module — Refactored for html2canvas Screenshot + WhatsApp & Web Share API
 */
const ShareModule = (() => {

  function share() {
    const original = document.getElementById('bracket-wrap');
    if (!original) {
      showToast("ERRO: ÁRVORE MATA-MATA NÃO ENCONTRADA");
      return;
    }

    // Alerta de processamento premium
    showToast("📸 GERANDO IMAGEM DA SUA SIMULAÇÃO...", 2500);

    // Pequena janela de espera para processamento final de estilos e bandeiras
    setTimeout(() => {
      // 1. Clonar o bracket-container
      const clone = original.cloneNode(true);
      clone.classList.add('capture-mode');
      
      // 2. Estilos inline adicionais de segurança para o clone
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.zIndex = '-9999';
      
      // 3. Injetar a imagem de fundo do Brasil (watermark) diretamente no clone para sair nítida no print
      const watermarkImg = document.createElement('img');
      watermarkImg.src = 'pngwing.com.png';
      watermarkImg.alt = 'Brasil';
      watermarkImg.className = 'bracket-watermark';
      
      // Injetar estilos diretamente
      watermarkImg.style.position = 'absolute';
      watermarkImg.style.top = '50%';
      watermarkImg.style.left = '50%';
      watermarkImg.style.transform = 'translate(-50%, -50%)';
      watermarkImg.style.zIndex = '0';
      watermarkImg.style.opacity = '0.04';
      watermarkImg.style.width = '90%';
      watermarkImg.style.maxWidth = '800px';
      watermarkImg.style.height = 'auto';
      watermarkImg.style.objectFit = 'contain';
      watermarkImg.style.pointerEvents = 'none';
      
      clone.appendChild(watermarkImg);
      document.body.appendChild(clone);

      // 4. Recalcular e redesenhar as linhas de conexão no clone para a largura de 1200px!
      if (typeof BracketModule !== 'undefined' && BracketModule.drawLines) {
        BracketModule.drawLines(clone);
      }

      // Certificar que os handlers de imagens e fontes estejam prontos
      const options = {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: '#fdfcf8',
        windowWidth: 1200,  // Força viewport de desktop para o canvas — evita quebra no mobile
        windowHeight: 800,
        logging: false,
      };

      html2canvas(clone, options).then((canvas) => {
        // Remover o clone após captura
        document.body.removeChild(clone);

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

          // Verifica se a API de compartilhamento nativa suporta envio de arquivos (mobile/smartphones)
          if (navigator.canShare && navigator.canShare(shareData) && navigator.share) {
            navigator.share(shareData)
              .then(() => {
                showToast("COMPARTILHADO COM SUCESSO!");
              })
              .catch((err) => {
                // Se o usuário cancelou o menu nativo, não faz nada. Caso contrário, roda o fallback.
                if (err.name !== 'AbortError') {
                  console.warn("Erro ou cancelamento no compartilhamento nativo. Rodando fallback...", err);
                  fallbackShare(blob, siteUrl);
                }
              });
          } else {
            // Fallback para navegadores sem suporte (Desktop / navegadores antigos)
            fallbackShare(blob, siteUrl);
          }
        }, 'image/png');
      }).catch((err) => {
        // Remover o clone em caso de erro
        if (document.body.contains(clone)) {
          document.body.removeChild(clone);
        }
        console.error("Erro no html2canvas:", err);
        showToast("ERRO AO CAPTURAR TELA");
      });
    }, 150);
  }

  function fallbackShare(blob, siteUrl) {
    // 1. Download automático da imagem da simulação no dispositivo do usuário
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'minha-simulacao-copa-2026.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Suaviza liberação de memória
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 150);

    showToast("💾 IMAGEM SALVA! REDIRECIONANDO PARA O WHATSAPP...");

    // 2. Abrir o WhatsApp com a mensagem pré-definida com link do site
    const baseText = "⚽ Olha a minha Simulação da Copa do Mundo 2026 feita pela Ato! Acabei de baixar a imagem do meu chaveamento, monte o seu também! ";
    const fullText = baseText + siteUrl;
    const encodedText = encodeURIComponent(fullText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;

    // Redirecionamento amigável após download
    setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 1500);
  }

  return { share };
})();
