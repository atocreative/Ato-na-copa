/**
 * Banner 3 - Grid Dinâmico de Ícones
 * Executa a lógica de matriz CSS, ordenação escalonada e exclusão de vizinhança
 */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("banner3-grid");
  if (!container) return;

  // Catálogo com todas as bases fornecidas
  const iconsBase = ['ato', 'bola', 'cadeira', 'chopp', 'garrafa', 'pandeiro', 'rumo', 'som'];

  // Padrão Escalonado de Cores
  const colorsMatrix = [
    ['bg-verde', 'bg-amarelo', 'bg-azul'], // Linha 1
    ['bg-azul', 'bg-verde', 'bg-amarelo'], // Linha 2
    ['bg-amarelo', 'bg-azul', 'bg-verde']  // Linha 3
  ];

  let resizeTimeout;

  function renderGrid() {
    container.innerHTML = ''; // Limpa a grade

    const containerWidth = container.clientWidth;
    // O breakpoint do mobile para a célula é de 80px (conforme CSS) e desktop é 120px
    const minCellWidth = window.innerWidth <= 768 ? 80 : 120;
    
    // CSS Grid auto-fill preenche a linha toda. O número real de colunas é:
    let cols = Math.floor(containerWidth / minCellWidth);
    if (cols < 1) cols = 1;

    // Matriz 2D para rastrear os ícones (exclusão de repetição)
    const gridChoices = Array.from({ length: 3 }, () => Array(cols).fill(null));

    // Preenchendo exatamente 3 linhas
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < cols; c++) {
        // Regra de Cores (Padrao Escalonado)
        const colorClass = colorsMatrix[r][c % 3];

        // Regra de Exclusão (Vizinhança)
        const forbidden = new Set();
        if (c > 0) forbidden.add(gridChoices[r][c - 1]); // Esquerda
        if (r > 0) forbidden.add(gridChoices[r - 1][c]); // Cima

        let allowedBases = iconsBase.filter(b => !forbidden.has(b));

        // Regra Especial da CBF (Apenas no Amarelo ou Azul)
        if ((colorClass === 'bg-amarelo' || colorClass === 'bg-azul') && !forbidden.has('cbf')) {
          allowedBases.push('cbf');
        }

        // Seleção Aleatória do Ícone (Heterogeneidade)
        const pick = allowedBases[Math.floor(Math.random() * allowedBases.length)];
        gridChoices[r][c] = pick;

        // Verificação de gênero da base para o sufixo
        const isFeminine = ['bola', 'cadeira', 'garrafa'].includes(pick);

        let filename = '';
        if (pick === 'cbf') {
          filename = 'cbf.png';
        } else {
          let suffix = '';
          if (colorClass === 'bg-verde') {
            suffix = isFeminine ? '-amarela.png' : '-amarelo.png';
          } else if (colorClass === 'bg-amarelo') {
            suffix = '-verde.png';
          } else if (colorClass === 'bg-azul') {
            suffix = isFeminine ? '-branca.png' : '-branco.png';
          }
          filename = `${pick}${suffix}`;
        }

        // Montagem e Injeção
        const cell = document.createElement('div');
        cell.className = `b3-cell ${colorClass}`;
        
        // Placeholder em SVG puro para o caso do arquivo físico ainda não estar na pasta assets/icons/
        const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='20' cy='20' r='18' fill='rgba(0,0,0,0.2)'/></svg>`;
        
        cell.innerHTML = `<img src="assets/icons/${filename}" alt="${pick}" onerror="this.onerror=null; this.src='${fallbackSvg}';" loading="lazy">`;
        container.appendChild(cell);
      }
    }
  }

  // Renderização Inicial
  renderGrid();

  // Escuta de Redimensionamento Responsivo (Debounce para recalcular grid sem estourar memória)
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(renderGrid, 150);
  });
});
