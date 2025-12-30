const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix pattern: ${error.message} to use instanceof check (when error is catch param)
  const oldPattern = /\$\{error\.message\}/g;
  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, '${error instanceof Error ? error.message : String(error)}');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts')) {
      fixFile(filePath);
    }
  }
}

walkDir('src/services/tools');
console.log('Done!');

