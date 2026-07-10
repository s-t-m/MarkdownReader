// Bundles the renderer JS (marked, highlight.js, katex) into a single file.
// CSS (katex) is emitted to dist/renderer.bundle.css with fonts copied alongside.
const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: [path.join(__dirname, 'src', 'renderer.js')],
  bundle: true,
  platform: 'browser',
  target: ['chrome120'],
  format: 'iife',
  outfile: path.join(__dirname, 'dist', 'renderer.bundle.js'),
  loader: { '.woff2': 'file', '.woff': 'file', '.ttf': 'file', '.eot': 'file' },
  minify: false,
  sourcemap: false,
  logLevel: 'info'
}).then(() => {
  console.log('Renderer bundle built -> dist/renderer.bundle.js');
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
