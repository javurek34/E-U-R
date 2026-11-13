# E–U–R · Metody do výuky

Veřejný web: https://javurek34.github.io/E-U-R/

Český průvodce výběrem výukové metody podle třífázového modelu učení E–U–R (evokace, uvědomění si významu, reflexe).

## Co web umí

- **Úvod**: hledání napříč všemi metodami, rychlý výběr, tři fáze hodiny a ukázková hodina.
- **Metody** (`#metody`): karty všech metod s přepínáním fáze, hledáním bez ohledu na diakritiku a filtry podle času, formy práce a pomůcek. Filtry jsou součástí URL, např. `#metody?faze=U&cas=10&prace=pairs`.
- **Detail** (`#metoda/38`): zadání pro žáky, postup, příklad, tipy, tisk a kopírování zadání.
- **Promítání s odpočtem**: zadání přes celou obrazovku s časovačem a zvukovým signálem na konci.
- **Moje hodina** (`#hodina`): jedna metoda pro každou fázi, součet času vůči 45 minutám, tisk plánu a sdílení odkazem (`#hodina?e=9&u=12&r=38`).
- **Uložené** (`#ulozene`): oblíbené metody. Uložené metody, hodina i volba vzhledu se ukládají do localStorage v konkrétním prohlížeči.
- Světlý i tmavý vzhled, rozložení pro telefon a tiskové styly.

Starší odkazy `#faze/E`, `#faze/U` a `#faze/R` dál fungují.

## Spuštění

Statický web bez instalace závislostí a sestavování:

```sh
python3 -m http.server 8080
```

Otevřete http://localhost:8080. Web vyžaduje HTTP kvůli načtení `methods.json`. Po úpravě `dist/index.html` aktualizujte vstup pro GitHub Pages příkazem `node scripts/sync-entry.mjs`. Při každém vydání změn zvyšte číslo verze `?v=` u `style.css` a `app.js` v `dist/index.html`, jinak může prohlížeč spojit novou stránku se starým skriptem z mezipaměti. Ostatní soubory zůstávají v `dist/` a používají se přímo, bez kopírování.

## Obsah

Knihovna obsahuje 65 metod:

- 16 pro evokaci (10 z podkladů, 6 doplněných),
- 15 pro uvědomění si významu (9 z podkladů, 6 doplněných),
- 34 pro reflexi (30 z podkladů, 4 doplněné).

Základ tvoří tři dodané přehledy PDF v `dist/sources/`. Jejich zařazení metod je zachováno. Některé metody mohou sloužit ve více fázích. Popisy jsou redakčně zkrácené. Původ každé metody je uveden v rozbalovacím bloku detailu: metoda z PDF, nebo doplněná metoda.

Čas, organizace práce, pomůcky, přímé zadání pro žáky, kroky a metodické tipy jsou návrhy pro praxi, nikoli přímé citace zdrojů. Časové údaje jsou orientační. U původních metod reflexe jsou doplněné také příklady a využití, které PDF obsahovalo jen nepřímo.

## Úpravy

- `dist/index.html`: kostra stránky (hlavička, patička, okno promítání). Obsah pohledů vykresluje `app.js`.
- `dist/style.css`: vzhled, barvy fází, tmavý režim, responzivní a tiskové styly.
- `dist/app.js`: směrování, seznam a filtry, detail, plánovač hodiny, promítání s odpočtem, ukládání.
- `dist/fonts/`: písma Bricolage Grotesque a Figtree (licence SIL OFL, přiložena). Web nenačítá nic z cizích serverů.
- `dist/methods.json`: obsah. Při přidávání zachovejte jedinečné `id`; hodnoty `phase` jsou `E`, `U`, `R`, hodnoty `group` jsou `alone`, `pairs`, `group`, `class`. Pole `origin` rozlišuje `pdf` a `added`. Původní `id` neměňte kvůli uloženým metodám a sdíleným odkazům.

## Hosting a ověření

GitHub Pages publikuje větev `main` z kořene repozitáře na https://javurek34.github.io/E-U-R/. Kořenový `index.html` odkazuje na soubory v `dist/`. Soubor `.nojekyll` vypíná zpracování Jekyllem.

Statický obsah v `dist/` zůstává použitelný také samostatně; `.openai/hosting.json` propojuje zdroj s dřívějším soukromým Sites webem.

Vzhled a funkce byly ověřeny v prohlížeči Chromium na šířkách 320 až 1280 px: hledání, filtry, návrat z detailu, ukládání, plánovač a sdílení hodiny, promítání s odpočtem, tmavý režim a tisk.
