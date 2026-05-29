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

// 2. Safe JS Minifier (Preserves ASI and URLs)
function minifyJS(js) {
  // Remove block comments
  let cleaned = js.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Split into lines to safely remove line comments and preserve newlines (ASI protection)
  let lines = cleaned.split(/\r?\n/);
  
  let processedLines = lines.map(line => {
    // Remove line comments safely (only if not preceded by http: or https: to protect URLs)
    let noComment = line.replace(/(?<!http:|https:)\/\/.*/g, '');
    return noComment.trim();
  }).filter(line => line.length > 0); // remove empty lines
  
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
