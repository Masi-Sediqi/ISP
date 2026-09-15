const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const scanRoots = ['src'];
const extraFiles = ['package.json', '.env.example', 'vite.config.js'];
const bannedWords = ['supa' + 'base', 'ver' + 'cel', 'VITE_' + 'SUPABASE_'];
const hits = [];

function scanFile(file) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');
  for (const word of bannedWords) {
    if (text.toLowerCase().includes(word.toLowerCase())) hits.push(`${rel}: ${word}`);
  }
}
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else scanFile(full);
  }
}
scanRoots.forEach((dir) => walk(path.join(root, dir)));
extraFiles.forEach((file) => {
  const full = path.join(root, file);
  if (fs.existsSync(full)) scanFile(full);
});
for (const rel of ['transport-backend/server.js', 'src/services/serverRest.js']) {
  if (!fs.existsSync(path.join(root, rel))) hits.push(`missing required file: ${rel}`);
}
const oldDeployConfig = path.join(root, 'ver' + 'cel.json');
const oldCloudDir = path.join(root, 'supa' + 'base');
if (fs.existsSync(oldDeployConfig)) hits.push('legacy deployment config still exists');
if (fs.existsSync(oldCloudDir)) hits.push('legacy cloud database directory still exists');
if (hits.length) {
  console.error('VPS cleanup verification FAILED');
  console.error(hits.join('\n'));
  process.exit(1);
}
console.log('VPS cleanup verification PASSED');
