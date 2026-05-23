/**
 * Share Module — Refactored for direct WhatsApp API integration
 */
const ShareModule = (() => {

  function share() {
    // Texto pré-formatado exigido
    const copyText = "⚽ A Ato tá na Copa e fez o simulador perfeito para 2026! Acabei de montar meus palpites para a Fase de Grupos e o Chaveamento do Mata-Mata. Faça a sua Simulação da Copa do Mundo aqui: ";
    
    // Obter URL atual do site
    const currentUrl = window.location.href;
    
    // Montar string completa
    const fullText = copyText + currentUrl;
    
    // Encode para o formato de URL do WhatsApp
    const encodedText = encodeURIComponent(fullText);
    
    // Rota Universal do WhatsApp (wa.me) que redireciona automaticamente
    // para o app mobile ou para o web.whatsapp dependendo do device
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    // Abrir o redirecionamento em uma nova guia
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  return { share };
})();
