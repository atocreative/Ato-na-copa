const fs = require('fs');
const path = require('path');

// 1. Safe CSS Minifier
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\s+/g, ' ') // compress spaces
    .replace(/\s*([\{\}:;,])\s*/g, '$1') // remove spaces around delimiters
    .trim();
}

// 2. Safe JS Minifier — only removes block comments and compresses whitespace
//    Does NOT strip line comments (//) because our naive regex approach
//    destroys regex literals like /^https?:\/\// in the source code.
function minifyJS(js) {
  // Remove block comments only (safe — never inside regex literals)
  let cleaned = js.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Split into lines, trim each, remove empty
  let lines = cleaned.split(/\r?\n/);
  let processedLines = lines.map(line => line.trim()).filter(line => line.length > 0);
  
  return processedLines.join('\n');
}

const rootDir = __dirname;

// Read and minify CSS
const cssPath = path.join(rootDir, 'css', 'styles.css');
const minCssPath = path.join(rootDir, 'css', 'styles.min.css');
if (fs.existsSync(cssPath)) {
  const css = fs.readFileSync(cssPath, 'utf8');
  const minCss = minifyCSS(css);
  fs.writeFileSync(minCssPath, minCss, 'utf8');
  console.log('CSS minificado com sucesso! De: ' + css.length + ' bytes -> Para: ' + minCss.length + ' bytes');
}

// Combine and minify JS files
const jsFiles = [
  'js/data.js',
  'js/groups.js',
  'js/thirds.js',
  'js/bracket.js',
  'js/share.js',
  'js/app.js',
  'js/banner3.js'
];

let combinedJS = '';
jsFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    combinedJS += fs.readFileSync(filePath, 'utf8') + '\n';
  } else {
    console.error('Aviso: Arquivo nao encontrado: ' + file);
  }
});

const minJsPath = path.join(rootDir, 'js', 'app.min.js');
const minJS = minifyJS(combinedJS);
fs.writeFileSync(minJsPath, minJS, 'utf8');
console.log('JS minificado com sucesso! De: ' + combinedJS.length + ' bytes -> Para: ' + minJS.length + ' bytes');
