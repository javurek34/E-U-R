import { readFile, writeFile } from 'node:fs/promises';

// GitHub Pages serves the repository root. Keep the static app in dist/.
// Bump the ?v= number in dist/index.html on every release so browsers never mix
// a cached old app.js or style.css with a new page.
const root = new URL('../', import.meta.url);
const source = await readFile(new URL('dist/index.html', root), 'utf8');
const entry = source
  .replace(/href="style\.css(\?[^"]*)?"/, 'href="dist/style.css$1"')
  .replace(/src="app\.js(\?[^"]*)?"/, 'src="dist/app.js$1"')
  .replaceAll('href="sources/', 'href="dist/sources/');
await writeFile(new URL('index.html', root), entry);
