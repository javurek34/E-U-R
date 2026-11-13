# E–U–R · Metody do výuky

Český průvodce výběrem výukové metody podle fáze hodiny. Úvod obsahuje jen tři volby: evokace, uvědomění si významu a reflexe. Výběr fáze otevře stručný seznam po šesti metodách. Postup, pomůcky a zadání se zobrazí až v detailu konkrétní metody.

## Spuštění

Statický web bez instalace závislostí a sestavování:

```sh
python3 -m http.server 8080 --directory dist
```

Otevřete http://localhost:8080. Web vyžaduje HTTP kvůli načtení `methods.json`.

## Použití

1. Vyberte fázi hodiny.
2. Otevřete metodu; volitelně použijte hledání nebo upřesněte čas a formu práce.
3. Zkopírujte zadání, projděte postup nebo si detail vytiskněte.

Na úvodní stránce se jednotlivé metody nevypisují. Seznamy zobrazují nejvýše šest položek na stránku. Volba jiné fáze je dostupná i z přehledu metod.

Vyhledávání ignoruje diakritiku. Filtry a stránka jsou součástí URL, takže návrat z detailu zachová předchozí výběr. Příklady odkazů: `#faze/E`, `#faze/U?cas=10&prace=pairs`, `#metoda/38`. Uložené metody využívají localStorage v konkrétním prohlížeči. Pokud automatické kopírování není dostupné, stránka nabídne označený text pro ruční kopírování.

## Obsah

Knihovna obsahuje 65 metod:

- 16 pro evokaci (10 z podkladů, 6 doplněných),
- 15 pro uvědomění si významu (9 z podkladů, 6 doplněných),
- 34 pro reflexi (30 z podkladů, 4 doplněné).

Základ tvoří tři dodané přehledy PDF v `dist/sources/`. Jejich zařazení metod je zachováno. Některé metody mohou sloužit ve více fázích. Popisy jsou redakčně zkrácené. Původ každé metody je uveden v rozbalovacím bloku detailu: metoda z PDF, nebo doplněná metoda.

Čas, organizace práce, pomůcky, přímé zadání pro žáky, kroky a metodické tipy jsou návrhy pro praxi, nikoli přímé citace zdrojů. Časové údaje jsou orientační. U původních metod reflexe jsou doplněné také příklady a využití, které PDF obsahovalo jen nepřímo.

## Úpravy

- `dist/index.html`: úvod a struktura tří pohledů.
- `dist/style.css`: vzhled a responzivní i tiskové styly, bez externích písem a knihoven.
- `dist/app.js`: navigace, stránkování, filtry, kopírování a oblíbené metody.
- `dist/methods.json`: obsah. Při přidávání zachovejte jedinečné `id`; hodnoty `phase` jsou `E`, `U`, `R`, hodnoty `group` jsou `alone`, `pairs`, `group`, `class`. Pole `origin` rozlišuje `pdf` a `added`. Původní `id` neměňte kvůli uloženým metodám a sdíleným odkazům.

## Hosting a ověření

Statický obsah je v `dist/`; `.openai/hosting.json` propojuje zdroj se stávajícím Sites webem. Publikace je soukromá. Automatické veřejné nasazování GitHub Pages není nastavené.

Kontroly při úpravě zahrnovaly syntaxi JavaScriptu, úplnost dat, lokální odkazy a interakční testy navigace, šestipoložkového stránkování, filtrů, návratu z detailu, uložení a kopírování včetně zamítnuté schránky. Vizuální kontrola v prohlížeči nebyla v prostředí dostupná.
