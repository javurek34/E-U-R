import { readFile, writeFile } from 'node:fs/promises';

// GitHub Pages serves the repository root. Keep the static app in dist/.
const root = new URL('../', import.meta.url);
const source = await readFile(new URL('dist/index.html', root), 'utf8');
const entry = source
  .replace('href="style.css"', 'href="dist/style.css"')
  .replace('src="app.js"', 'src="dist/app.js"')
  .replaceAll('href="sources/', 'href="dist/sources/');
await writeFile(new URL('index.html', root), entry);
