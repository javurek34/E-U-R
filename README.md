# E–U–R · Metody do výuky

Veřejný web: https://javurek34.github.io/E-U-R/

Český průvodce výběrem výukové metody podle třífázového modelu učení E–U–R (evokace, uvědomění si významu, reflexe).

## Co web umí

Učitel postupuje ve třech krocích a nic se nevypisuje najednou:

1. **Fáze hodiny** (úvod): začátek hodiny (evokace), nové učivo (uvědomění si významu) nebo závěr hodiny (reflexe).
2. **Upřesnění** (nepovinné): kolik má času a jak budou žáci pracovat. U každé volby je vidět počet vyhovujících metod a volby bez výsledku jsou zakázané, takže se nelze dostat do slepé uličky.
3. **Návrhy**: tři metody najednou, tlačítko „Ukázat další návrhy“ a „Překvap mě“. Detail otevře zadání pro žáky, postup, příklad a tipy.

Dále: hledání podle názvu (bez ohledu na diakritiku), uložené metody, kopírování zadání, tisk a promítnutí zadání přes celou obrazovku s odpočtem.

Adresy: `#faze/U?cas=10&prace=pairs` (výběr), `#metoda/38` (detail), `#ulozene`, `#hledat?q=text`. Starší odkazy `#faze/E`, `#metody?faze=U` a `#metoda/<id>` dál fungují. Uložené metody se ukládají do localStorage v konkrétním prohlížeči.

## Spuštění

Statický web bez instalace závislostí a sestavování:

```sh
python3 -m http.server 8080
```

Otevřete http://localhost:8080. Web vyžaduje HTTP kvůli načtení `methods.json`. Po úpravě `dist/index.html` aktualizujte vstup pro GitHub Pages příkazem `node scripts/sync-entry.mjs`. Při každém vydání změn zvyšte číslo verze `?v=` u `style.css` a `app.js` v `dist/index.html`, jinak může prohlížeč spojit novou stránku se starým skriptem z mezipaměti. Ostatní soubory zůstávají v `dist/` a používají se přímo, bez kopírování.

## Obsah

Knihovna obsahuje 90 metod:

- 25 pro evokaci (10 z podkladů, 15 doplněných),
- 27 pro uvědomění si významu (9 z podkladů, 18 doplněných),
- 38 pro reflexi (30 z podkladů, 8 doplněných).

Základ tvoří tři dodané přehledy PDF v `dist/sources/`. Jejich zařazení metod je zachováno. Některé metody mohou sloužit ve více fázích. Popisy jsou redakčně zkrácené. Původ každé metody je uveden v detailu: metoda z PDF, nebo doplněná metoda.

Čas, organizace práce, pomůcky, přímé zadání pro žáky, kroky a metodické tipy jsou návrhy pro praxi, nikoli přímé citace zdrojů. Časové údaje jsou orientační.

## Úpravy

- `dist/index.html`: kostra stránky (hlavička, patička, okno promítání). Obsah pohledů vykresluje `app.js`.
- `dist/style.css`: vzhled, barvy fází, responzivní a tiskové styly.
- `dist/app.js`: směrování, výběr metody po krocích, detail, hledání, promítání s odpočtem, ukládání.
- `dist/fonts/`: písma Bricolage Grotesque a Figtree (licence SIL OFL, přiložena). Web nenačítá nic z cizích serverů.
- `dist/methods.json`: obsah. Při přidávání zachovejte jedinečné `id`; hodnoty `phase` jsou `E`, `U`, `R`, hodnoty `group` jsou `alone`, `pairs`, `group`, `class`. Pole `origin` rozlišuje `pdf` a `added`. Původní `id` neměňte kvůli uloženým metodám a sdíleným odkazům.

## Hosting a ověření

GitHub Pages publikuje větev `main` z kořene repozitáře na https://javurek34.github.io/E-U-R/. Kořenový `index.html` odkazuje na soubory v `dist/`. Soubor `.nojekyll` vypíná zpracování Jekyllem.

Statický obsah v `dist/` zůstává použitelný také samostatně; `.openai/hosting.json` propojuje zdroj s dřívějším soukromým Sites webem.

Vzhled a funkce byly ověřeny v prohlížeči Chromium na šířkách 320 až 1280 px: výběr po krocích s filtry a listováním návrhů, návrat z detailu se zachováním výběru, hledání, ukládání, náhodná metoda, promítání s odpočtem, staré odkazy a tisk.
