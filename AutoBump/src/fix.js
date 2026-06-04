const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (file === '.cache' || file === '.bin') return; 
        walkSync(fullPath, filelist);
      } else if (file.endsWith('.js')) {
        filelist.push(fullPath);
      }
    });
  } catch (e) {
  }
  return filelist;
}

const allJs = walkSync(path.join(__dirname, 'node_modules'));
let patched = 0;

for (const file of allJs) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = content.replace(/['"]node:sqlite['"]/g, "'sqlite'");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`✓ ${path.basename(path.dirname(file))}/${path.basename(file)}`);
    patched++;
  }
}

console.log(`\n✅ ${patched} fichiers patchés. Maintenant lance : pkg main.js --targets node18-win-x64 --output main.exe`);