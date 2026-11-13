# E–U–R · Metody do výuky

Česká responzivní knihovna 49 výukových metod podle tří dodaných PDF: 10 pro evokaci, 9 pro uvědomění si významu a 30 pro reflexi.

## Spuštění

Web je statický, bez sestavování a bez instalace závislostí:

```sh
python3 -m http.server 8080 --directory dist
```

Otevřete http://localhost:8080. Stránku spouštějte přes HTTP, aby se načetl soubor `methods.json`.

## Funkce

- Filtry podle fáze a hledání bez ohledu na diakritiku.
- Detail metody s využitím, příkladem a postupem.
- Oblíbené metody v localStorage daného prohlížeče.
- Tisk detailu, ovládání klávesnicí a mobilní rozvržení.
- Odkazy na původní PDF v patičce obsahu.

## Obsah a úpravy

Data jsou v `dist/methods.json`, vzhled v `dist/style.css`, chování v `dist/app.js`. Zařazení odpovídá podkladům; některé metody mohou fungovat ve více fázích. Popisy jsou redakčně zkrácené. Postupy jsou doplněné návrhy pro praxi. U reflexe jsou doplněny také příklady a využití, které zdroj obsahoval jen nepřímo. Doplňky jsou v detailech označené.

Při zpřístupnění webu veřejnosti ověřte práva ke sdílení dodaných PDF. Aktuální Sites publikace je soukromá. Písma Google Fonts jsou volitelná; při nedostupnosti se použijí systémová písma.

## Hosting

Statický obsah je v `dist/`. Soubor `.openai/hosting.json` propojuje zdroj s privátním Sites webem. GitHub Pages může publikovat obsah `dist/` pomocí vlastního workflow; automatické veřejné nasazování zde není zapnuté.
