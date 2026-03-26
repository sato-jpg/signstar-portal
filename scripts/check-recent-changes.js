const fs = require('fs');
const path = require('path');

const targetDir = 'c:\\Users\\soulh\\.gemini\\antigravity\\scratch\\signstar-portal';
const timeLimit = 30 * 60 * 1000; // 30 minutes in ms
const now = Date.now();

function getFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git') continue;
    
    const fullPath = path.join(dir, file);
    try {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        getFiles(fullPath);
      } else {
        if (now - stats.mtimeMs < timeLimit) {
          console.log(`${fullPath} - ${stats.mtime.toLocaleString()}`);
        }
      }
    } catch (e) {
      // Ignore errors for specific files
    }
  }
}

console.log(`Checking files modified in the last 30 minutes in: ${targetDir}`);
getFiles(targetDir);
