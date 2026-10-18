// ファイルが書き換わる前に、プロジェクト内の全ファイルを backup/yyyyMMddHHmmss/ にコピーする
//   node backup.js         … PreToolUse：その依頼で最初の書き換えの前に1回だけバックアップ
//   node backup.js --reset … UserPromptSubmit：新しい依頼が来たら「バックアップ済み」の印を消す
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const marker = path.join(root, '.claude', 'hooks', '.backup-done');
const EXCLUDE = new Set(['backup', '.claude', '.git', 'node_modules']);

if (process.argv.includes('--reset')) {
  fs.rmSync(marker, { force: true });
  process.exit(0);
}

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  // プロジェクト外のファイル（メモリ等）への書き込みではバックアップしない
  let target = '';
  try {
    const data = JSON.parse(input);
    target = (data.tool_input && (data.tool_input.file_path || data.tool_input.notebook_path)) || '';
  } catch (e) {}
  if (target) {
    const rel = path.relative(root, path.resolve(target));
    if (rel.startsWith('..') || path.isAbsolute(rel)) return;
  }

  // この依頼ですでにバックアップしていれば何もしない
  if (fs.existsSync(marker)) return;

  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  const dest = path.join(root, 'backup', stamp);

  const entries = fs.readdirSync(root).filter((name) => !EXCLUDE.has(name));
  if (entries.length && !fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of entries) {
      fs.cpSync(path.join(root, name), path.join(dest, name), { recursive: true });
    }
  }
  fs.writeFileSync(marker, stamp);
});
