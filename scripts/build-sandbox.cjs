#!/usr/bin/env node
// Build reproducible de Calendario sin Vite (el sandbox bloquea pipes de procesos).
// Fuente única: src/. Genera .build_src/ y dist/. Sale con código != 0 si algo falla.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
const TMP = path.join(RAIZ, '.build_src');
const DIST = path.join(RAIZ, 'dist');
const ESBUILD = path.join(RAIZ, 'node_modules', '@esbuild', 'win32-x64', 'esbuild.exe');
const TAILWIND = path.join(RAIZ, 'node_modules', 'tailwindcss', 'lib', 'cli.js');

function fallar(msg) { console.error('[build] ERROR: ' + msg); process.exit(1); }
function ejecutar(comando, args, opciones = {}) {
  const r = spawnSync(comando, args, { stdio: 'inherit', cwd: RAIZ, ...opciones });
  if (r.error) fallar(comando + ': ' + r.error.message);
  if (r.status !== 0) fallar(comando + ' terminó con código ' + r.status);
}
function copiar(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copiar(s, d); else fs.copyFileSync(s, d);
  }
}
// Solo se reescribe el código copiado, nunca src/.
function adaptar(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { n += adaptar(p); continue; }
    if (!/\.(jsx?|mjs)$/.test(e.name)) continue;
    const t = fs.readFileSync(p, 'utf8');
    if (!t.includes('import.meta.env')) continue;
    fs.writeFileSync(p, t.replace(/import\.meta\.env\.BASE_URL/g, "'/calendario/'").replace(/import\.meta\.env/g, '({})'), 'utf8');
    n++;
  }
  return n;
}

if (!fs.existsSync(ESBUILD)) fallar('no existe esbuild: ' + ESBUILD);
if (!fs.existsSync(TAILWIND)) fallar('no existe tailwind: ' + TAILWIND);
if (!fs.existsSync(path.join(SRC, 'main.jsx'))) fallar('no existe src/main.jsx');

console.log('[build] limpiando salidas');
fs.rmSync(TMP, { recursive: true, force: true });
fs.rmSync(DIST, { recursive: true, force: true });

console.log('[build] copiando src -> .build_src');
copiar(SRC, TMP);
const adaptados = adaptar(TMP);
console.log('[build] archivos adaptados (import.meta.env):', adaptados);

fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });

console.log('[build] esbuild');
ejecutar(ESBUILD, [
  path.join(TMP, 'main.jsx'),
  '--bundle', '--loader:.jsx=jsx', '--jsx=automatic', '--minify',
  '--define:process.env.NODE_ENV="production"',
  '--outfile=' + path.join(DIST, 'assets', 'app.js'),
  '--log-level=error', '--metafile=' + path.join(DIST, 'meta.json'),
]);

console.log('[build] tailwind');
ejecutar(process.execPath, [
  TAILWIND, '-i', path.join(SRC, 'index.css'),
  '-o', path.join(DIST, 'assets', 'app.css'),
  '--minify', '--content', path.join(SRC, '**', '*.{js,jsx}'),
]);

const PUBLIC = path.join(RAIZ, 'public');
if (fs.existsSync(PUBLIC)) {
  for (const f of fs.readdirSync(PUBLIC)) {
    const s = path.join(PUBLIC, f);
    if (fs.statSync(s).isFile()) fs.copyFileSync(s, path.join(DIST, f));
  }
  console.log('[build] recursos public copiados');
}

fs.writeFileSync(path.join(DIST, 'index.html'), `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Calendario Sami</title>
<link rel="stylesheet" href="/assets/app.css" />
</head>
<body>
<div id="root"></div>
<script type="module" src="/assets/app.js"></script>
</body>
</html>
`, 'utf8');

const js = fs.statSync(path.join(DIST, 'assets', 'app.js')).size;
const css = fs.statSync(path.join(DIST, 'assets', 'app.css')).size;
if (js < 100000) fallar('bundle JS sospechosamente pequeño: ' + js);
if (css < 5000) fallar('CSS sospechosamente pequeño: ' + css);
const bundle = fs.readFileSync(path.join(DIST, 'assets', 'app.js'), 'utf8');
const paginas = ['Planificación de hoy', 'Qué hacer primero', 'Tu día, en orden', 'Eventos próximos', 'Asignaturas', 'Actividades'];
const faltan = paginas.filter((p) => !bundle.includes(p));
if (faltan.length) console.log('[build] aviso: textos no encontrados en el bundle ->', faltan.join(', '));
console.log('[build] OK  app.js=' + Math.round(js / 1024) + ' KB  app.css=' + Math.round(css / 1024) + ' KB');
