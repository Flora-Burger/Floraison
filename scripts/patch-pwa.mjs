import fs from 'fs';
import path from 'path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const assetsDir = path.join(root, 'assets');

if (!fs.existsSync(distDir)) {
  console.error('patch-pwa: dist/ introuvable — lancez expo export -p web avant.');
  process.exit(1);
}

for (const file of ['icon-192.png', 'icon-512.png']) {
  fs.copyFileSync(path.join(assetsDir, file), path.join(distDir, file));
}

const manifest = {
  name: 'Floraison',
  short_name: 'Floraison',
  description: 'Suivi menstruel',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#FBF7F2',
  theme_color: '#B85C6E',
  icons: [
    {
      src: '/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
  ],
};

fs.writeFileSync(
  path.join(distDir, 'manifest.webmanifest'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const pwaHead = [
  '<link rel="manifest" href="/manifest.webmanifest" />',
  '<link rel="apple-touch-icon" href="/icon-512.png" />',
  '<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />',
  '<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-title" content="Floraison" />',
].join('\n  ');

html = html.replace(
  /<link rel="icon" href="\/favicon\.ico" \/>/,
  pwaHead,
);

if (!html.includes('manifest.webmanifest')) {
  html = html.replace('</head>', `  ${pwaHead}\n</head>`);
}

fs.writeFileSync(indexPath, html);
console.log('patch-pwa: manifest + icônes 192/512 ajoutés à dist/');
