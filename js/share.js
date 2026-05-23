/**
 * Share Module — Refactored for html2canvas Screenshot + WhatsApp & Web Share API
 */
const ShareModule = (() => {

  function share() {
    const element = document.getElementById('bracket-container');
    if (!element) {
      showToast("ERRO: ÁRVORE MATA-MATA NÃO ENCONTRADA");
      return;
    }

    // Alerta de processamento premium
    showToast("📸 GERANDO IMAGEM DA SUA SIMULAÇÃO...", 2500);

    const options = {
      useCORS: true,
      backgroundColor: '#fdfcf8', // var(--bg-global)
      scale: 2, // Imagem nítida de alta resolução
      logging: false,
    };

    html2canvas(element, options).then((canvas) => {
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
      console.error("Erro no html2canvas:", err);
      showToast("ERRO AO CAPTURAR TELA");
    });
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
