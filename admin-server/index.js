import express from 'express';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const CONTENT = join(ROOT, 'content');

const app = express();
app.use(express.json({ limit: '2mb' }));

const TYPES = ['casos', 'servicios', 'paginas', 'seo'];

function typeDir(type) {
  if (!TYPES.includes(type)) return null;
  return join(CONTENT, type);
}

app.get('/api/content/:type', (req, res) => {
  const dir = typeDir(req.params.type);
  if (!dir || !existsSync(dir)) return res.status(404).json({ error: 'type not found' });
  const items = readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      return { slug: data.slug, cliente: data.cliente || data.title || data.slug };
    });
  res.json({ items });
});

app.get('/api/content/:type/:slug', (req, res) => {
  const dir = typeDir(req.params.type);
  if (!dir) return res.status(404).json({ error: 'type not found' });
  const file = join(dir, `${req.params.slug}.json`);
  if (!existsSync(file)) return res.status(404).json({ error: 'slug not found' });
  res.json(JSON.parse(readFileSync(file, 'utf8')));
});

app.put('/api/content/:type/:slug', (req, res) => {
  const dir = typeDir(req.params.type);
  if (!dir) return res.status(404).json({ error: 'type not found' });
  const file = join(dir, `${req.params.slug}.json`);
  const data = req.body;
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'invalid body' });
  data.slug = req.params.slug;
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  res.json({ ok: true, slug: req.params.slug });
});

app.post('/api/content/build', (req, res) => {
  const proc = spawn('node', ['scripts/build-pages.js'], { cwd: ROOT });
  let out = '', err = '';
  proc.stdout.on('data', d => out += d.toString());
  proc.stderr.on('data', d => err += d.toString());
  proc.on('close', code => {
    res.json({ ok: code === 0, code, stdout: out, stderr: err });
  });
});

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd: ROOT, ...opts });
    let out = '', err = '';
    proc.stdout.on('data', d => out += d.toString());
    proc.stderr.on('data', d => err += d.toString());
    proc.on('close', code => resolve({ ok: code === 0, code, stdout: out, stderr: err, cmd: `${cmd} ${args.join(' ')}` }));
  });
}

app.post('/api/git/commit', async (req, res) => {
  const message = (req.body && req.body.message) || 'chore(cms): admin edits';
  const remote = (req.body && req.body.remote) || 'fork';
  const status = await runCmd('git', ['status', '--porcelain']);
  if (!status.stdout.trim()) return res.json({ ok: true, empty: true, message: 'no changes' });
  const add = await runCmd('git', ['add', '.']);
  if (!add.ok) return res.status(500).json({ ok: false, step: 'add', ...add });
  const commit = await runCmd('git', ['commit', '-m', message]);
  if (!commit.ok) return res.status(500).json({ ok: false, step: 'commit', ...commit });
  const branchResult = await runCmd('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  const branch = branchResult.stdout.trim();
  const push = await runCmd('git', ['push', remote, branch]);
  res.json({ ok: push.ok, branch, remote, commit: commit.stdout, push_out: push.stdout, push_err: push.stderr });
});

app.post('/api/deploy/preview', async (req, res) => {
  const hook = process.env.VERCEL_DEPLOY_HOOK;
  if (!hook) return res.status(400).json({ ok: false, error: 'VERCEL_DEPLOY_HOOK env var no configurado' });
  try {
    const r = await fetch(hook, { method: 'POST' });
    const text = await r.text();
    res.json({ ok: r.ok, status: r.status, body: text });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.ADMIN_PORT || 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`admin-server: http://127.0.0.1:${PORT}`);
});
