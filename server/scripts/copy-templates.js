const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'templates');
const destDir = path.join(__dirname, '..', 'dist', 'templates');

if (!fs.existsSync(srcDir)) {
  console.warn(`[copy-templates] Source directory not found: ${srcDir}`);
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
fs.cpSync(srcDir, destDir, { recursive: true });

console.log(`[copy-templates] Copied templates to ${destDir}`);
