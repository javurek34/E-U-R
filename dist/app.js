'use strict';

const ASSET_BASE = new URL('.', document.currentScript.src);
const ASSET_VERSION = new URL(document.currentScript.src).search;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $('#app');

const PHASES = {
  E: {
    name: 'Evokace', short: 'Evokace', when: 'Začátek hodiny', step: '1',
    goal: 'Chci otevřít téma',
    lead: 'Vybavte, co žáci o tématu už vědí, vzbuďte zvědavost a nechte zaznít první otázky.',
    recommended: [9, 1, 51, 54, 5, 6]
  },
  U: {
    name: 'Uvědomění si významu', short: 'Uvědomění', when: 'Jádro hodiny', step: '2',
    goal: 'Chci jít do hloubky',
    lead: 'Žáci pracují s novými informacemi, objevují souvislosti a upravují své původní představy.',
    recommended: [12, 13, 16, 11, 60, 15]
  },
  R: {
    name: 'Reflexe', short: 'Reflexe', when: 'Závěr hodiny', step: '3',
    goal: 'Chci zjistit, co si odnášejí',
    lead: 'Žáci pojmenují, co se naučili, a vy zjistíte, co pochopili a co potřebují dál.',
    recommended: [38, 37, 26, 21, 32, 35]
  }
};
const PHASE_KEYS = ['E', 'U', 'R'];
const GROUPS = { alone: 'Samostatně', pairs: 'Ve dvojicích', group: 'Ve skupinách', class: 'Celá třída' };
const GROUP_SIZE = { alone: 1, pairs: 2, group: 3, class: 5 };
const TIMES = { 5: 'Do 5 min', 10: 'Do 10 min', long: 'Delší' };
const SIMPLE_MATERIALS = new Set(['Bez pomůcek', 'Papír a tužka', 'Lístek papíru']);
const LESSON_MINUTES = 45;
const SAMPLE_PLAN = { E: 9, U: 12, R: 38 };

const ICONS = {
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.500V12l3 2"/>',
  heart: '<path d="M12 20.500s-7.500-4.600-7.500-10.200A4.300 4.300 0 0 1 12 7.600a4.300 4.300 0 0 1 7.500 2.700c0 5.600-7.500 10.200-7.500 10.200Z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  search: '<circle cx="10.500" cy="10.500" r="6.500"/><path d="m16 16 4.500 4.500"/>',
  copy: '<rect x="8.500" y="8.500" width="11" height="11" rx="2.500"/><path d="M15.500 5.500v-.500a2 2 0 0 0-2-2H6a2.500 2.500 0 0 0-2.500 2.500V13a2 2 0 0 0 2 2h.500"/>',
  screen: '<rect x="3" y="4.500" width="18" height="12" rx="2.500"/><path d="M8.500 20.500h7M12 16.500v4"/>',
  print: '<path d="M7 8.500V4h10v4.500M7 17H5.500A2 2 0 0 1 3.500 15v-4.500a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2H17"/><rect x="7" y="13.500" width="10" height="6.500" rx="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>',
  box: '<path d="M4 8.500 12 4l8 4.500v7L12 20l-8-4.500v-7Z"/><path d="m4 8.500 8 4.500 8-4.500M12 13v7"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
const groupIcon = group => {
  const count = GROUP_SIZE[group];
  let dots = '';
  for (let i = 0; i < count; i++) dots += `<circle cx="${4 + i * 8}" cy="5" r="3"/>`;
  return `<svg class="people" viewBox="0 0 ${count * 8} 10" width="${count * 8}" height="10" aria-hidden="true">${dots}</svg>`;
};

const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const fold = text => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('cs');
const plural = n => n === 1 ? 'metoda' : n >= 2 && n <= 4 ? 'metody' : 'metod';

/* ---------- Stav ---------- */

let methods = null;
let byId = new Map();
let listState = null;
let lastList = '';
let lastHash = null;
let currentId = null;
const scrollMemo = new Map();

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* úložiště není dostupné */ }
}
function readSaved() {
  const data = readJson('eur-saved', []);
  return new Set(Array.isArray(data) ? data.filter(Number.isInteger) : []);
}
function readPlan() {
  const data = readJson('eur-plan', {});
  const plan = {};
  for (const key of PHASE_KEYS) plan[key] = data && Number.isInteger(data[key]) ? data[key] : null;
  return plan;
}
let saved = readSaved();
let plan = readPlan();

function cleanPlan(source) {
  const result = {};
  for (const key of PHASE_KEYS) {
    const m = byId.get(source[key]);
    result[key] = m && m.phase === key ? m.id : null;
  }
  return result;
}
const planSize = p => PHASE_KEYS.filter(key => p[key]).length;
const samePlan = (a, b) => PHASE_KEYS.every(key => a[key] === b[key]);
const planQuery = p => PHASE_KEYS.filter(key => p[key]).map(key => key.toLowerCase() + '=' + p[key]).join('&');

function updateBadges() {
  const savedBadge = $('#saved-count'), planBadge = $('#plan-count');
  savedBadge.textContent = saved.size; savedBadge.hidden = !saved.size;
  const size = planSize(plan);
  planBadge.textContent = size + '/3'; planBadge.hidden = !size;
}
function persistSaved() { writeJson('eur-saved', [...saved]); updateBadges(); }
function persistPlan() { writeJson('eur-plan', plan); updateBadges(); }

/* ---------- Oznámení ---------- */

let toastTimer = 0;
function toast(message, link) {
  const box = $('#toast');
  box.innerHTML = `<span>${esc(message)}</span>${link ? `<a href="${link.href}">${esc(link.label)}</a>` : ''}`;
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { box.hidden = true; }, 4500);
}

async function copyText(text, done) {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text; area.setAttribute('readonly', ''); area.className = 'visually-hidden';
    document.body.append(area); area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
    toast(ok ? done : 'Kopírování není dostupné. Označte text a zkopírujte ho ručně.');
    return ok;
  }
}

/* ---------- Stavební prvky ---------- */

function sortByPhase(list) {
  return [...list].sort((a, b) => {
    const phase = PHASE_KEYS.indexOf(a.phase) - PHASE_KEYS.indexOf(b.phase);
    if (phase) return phase;
    const rec = PHASES[a.phase].recommended;
    const ai = rec.indexOf(a.id), bi = rec.indexOf(b.id);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.id - b.id;
  });
}

function saveButton(m) {
  const on = saved.has(m.id);
  return `<button class="heart" type="button" data-save="${m.id}" aria-pressed="${on}" aria-label="${on ? 'Odebrat z uložených' : 'Uložit'}: ${esc(m.name)}">${icon('heart')}</button>`;
}

function card(m, tag = 'h3') {
  return `<article class="card" data-phase="${m.phase}">
    <div class="card-top">
      <span class="pill"><b>${m.phase}</b>${PHASES[m.phase].short}</span>
      ${saveButton(m)}
    </div>
    <${tag} class="card-title"><a href="#metoda/${m.id}">${esc(m.name)}</a></${tag}>
    <p class="card-text">${esc(m.description)}</p>
    <div class="card-meta">
      <span>${icon('clock')}${m.minutes} min</span>
      <span>${groupIcon(m.group)}${GROUPS[m.group]}</span>
    </div>
  </article>`;
}

function setView(html, title, nav) {
  app.innerHTML = html;
  document.title = title;
  for (const link of $$('[data-nav]')) {
    if (link.dataset.nav === nav) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }
}

/* ---------- Úvod ---------- */

function renderHome() {
  currentId = null; listState = null;
  const counts = Object.fromEntries(PHASE_KEYS.map(key => [key, methods.filter(m => m.phase === key).length]));
  const sample = cleanPlan(SAMPLE_PLAN);
  const sampleTotal = PHASE_KEYS.reduce((sum, key) => sum + (byId.get(sample[key])?.minutes || 0), 0);
  const starters = PHASE_KEYS.flatMap(key => PHASES[key].recommended.slice(1, 3)).map(id => byId.get(id)).filter(Boolean);

  setView(`
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Třífázový model učení E–U–R</p>
      <h1 id="view-title" tabindex="-1">Metoda pro <em>každou část</em> hodiny.</h1>
      <p class="lead">${methods.length} aktivit pro evokaci, uvědomění si významu a reflexi. Každá má zadání pro žáky, postup i tipy, takže ji můžete vzít rovnou do třídy.</p>
      <form id="hero-search" class="search search-large" role="search">
        ${icon('search')}
        <input name="q" type="search" placeholder="Hledat metodu, třeba pětilístek…" aria-label="Hledat metodu" autocomplete="off">
        <button type="submit" class="button button-primary">Hledat</button>
      </form>
      <div class="quick">
        <span>Rychlý výběr:</span>
        <a class="chip" href="#metody?cas=5">${icon('clock')}Do 5 minut</a>
        <a class="chip" href="#metody?papir=1">${icon('box')}Stačí papír a tužka</a>
        <button class="chip" type="button" data-action="random">${icon('dice')}Náhodná metoda</button>
      </div>
    </div>
    <div class="hero-art">
      <div class="lesson-card">
        <div class="lesson-card-head"><span>Ukázková hodina</span><b>${sampleTotal} min</b></div>
        <ol class="lesson-blocks">
          ${PHASE_KEYS.map(key => {
            const m = byId.get(sample[key]);
            return m ? `<li data-phase="${key}" style="--weight:${m.minutes}"><b>${key}</b><div><small>${PHASES[key].when}</small><a href="#metoda/${m.id}">${esc(m.name)}</a></div><span>${m.minutes} min</span></li>` : '';
          }).join('')}
        </ol>
        <a class="lesson-card-link" href="#hodina?${planQuery(sample)}">Otevřít v plánovači ${icon('arrow')}</a>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="phases-title">
    <div class="section-head">
      <h2 id="phases-title">Kterou část hodiny připravujete?</h2>
      <a class="more" href="#metody">Všech ${methods.length} metod ${icon('arrow')}</a>
    </div>
    <div class="phase-grid">
      ${PHASE_KEYS.map(key => {
        const p = PHASES[key];
        const picks = p.recommended.slice(0, 3).map(id => byId.get(id)).filter(Boolean);
        return `<a class="phase-card" data-phase="${key}" href="#metody?faze=${key}">
          <span class="phase-card-step">${p.step}. ${p.when}</span>
          <span class="phase-card-letter" aria-hidden="true">${key}</span>
          <h3>${p.name}</h3>
          <p>${p.lead}</p>
          <ul aria-label="Například">${picks.map(m => `<li>${esc(m.name)}</li>`).join('')}</ul>
          <span class="phase-card-foot"><b>${counts[key]} ${plural(counts[key])}</b>${icon('arrow')}</span>
        </a>`;
      }).join('')}
    </div>
  </section>

  <section class="planner-promo" aria-labelledby="promo-title">
    <div>
      <p class="eyebrow">Plánovač hodiny</p>
      <h2 id="promo-title">Poskládejte si celou hodinu.</h2>
      <p>Vyberte jednu metodu do každé fáze. Hned uvidíte, kolik času zaberou, a hotový plán si vytisknete nebo pošlete kolegům odkazem.</p>
      <a class="button button-light" href="#hodina">Otevřít moji hodinu ${icon('arrow')}</a>
    </div>
    <ol class="promo-steps" aria-hidden="true">
      <li data-phase="E"><b>E</b><span>Otevřít téma</span></li>
      <li data-phase="U"><b>U</b><span>Pracovat s novým</span></li>
      <li data-phase="R"><b>R</b><span>Ohlédnout se</span></li>
    </ol>
  </section>

  <section class="section" aria-labelledby="starters-title">
    <div class="section-head">
      <h2 id="starters-title">Tipy na rozjezd</h2>
      <a class="more" href="#metody">Projít všechny ${icon('arrow')}</a>
    </div>
    <div class="grid">${starters.map(m => card(m)).join('')}</div>
  </section>`, 'Metody do výuky | E–U–R', 'home');
}

/* ---------- Seznam metod ---------- */

function readListState(path, params) {
  const phase = params.get('faze');
  const time = params.get('cas'), group = params.get('prace');
  return {
    saved: path === 'ulozene',
    phase: PHASES[phase] ? phase : 'all',
    q: params.get('q') || '',
    time: TIMES[time] ? time : 'all',
    group: GROUPS[group] ? group : 'all',
    paper: params.get('papir') === '1'
  };
}
function listUrl(state) {
  const params = new URLSearchParams();
  if (state.phase !== 'all') params.set('faze', state.phase);
  if (state.q) params.set('q', state.q);
  if (state.time !== 'all') params.set('cas', state.time);
  if (state.group !== 'all') params.set('prace', state.group);
  if (state.paper) params.set('papir', '1');
  const query = params.toString();
  return '#' + (state.saved ? 'ulozene' : 'metody') + (query ? '?' + query : '');
}
const hasFilters = state => Boolean(state.q || state.time !== 'all' || state.group !== 'all' || state.paper);

function matches(m, state, ignorePhase) {
  if (state.saved && !saved.has(m.id)) return false;
  if (!ignorePhase && state.phase !== 'all' && m.phase !== state.phase) return false;
  if (state.time !== 'all' && !(state.time === 'long' ? m.minutes > 10 : m.minutes <= Number(state.time))) return false;
  if (state.group !== 'all' && m.group !== state.group) return false;
  if (state.paper && !SIMPLE_MATERIALS.has(m.materials)) return false;
  const query = fold(state.q.trim());
  return !query || fold([m.name, m.description, m.use, m.example, m.prompt, m.materials, ...m.steps].join(' ')).includes(query);
}

function renderList(state) {
  currentId = null; listState = state;
  const chips = (key, options) => Object.entries(options).map(([value, label]) =>
    `<button class="chip" type="button" data-filter="${key}" data-value="${value}" aria-pressed="false">${label}</button>`).join('');

  setView(`
  <header id="list-head" class="page-head"></header>
  <div class="toolbar">
    <div class="tabs" role="group" aria-label="Fáze hodiny">
      <button type="button" data-filter="phase" data-value="all" aria-pressed="false">Vše <small></small></button>
      ${PHASE_KEYS.map(key => `<button type="button" data-filter="phase" data-value="${key}" data-phase="${key}" aria-pressed="false"><b>${key}</b><span>${PHASES[key].short}</span> <small></small></button>`).join('')}
    </div>
    <label class="search">
      ${icon('search')}
      <input id="search" type="search" placeholder="Hledat podle názvu nebo obsahu…" aria-label="Hledat metodu" autocomplete="off" value="${esc(state.q)}">
    </label>
    <div class="filter-row">
      <div class="filter-group" role="group" aria-label="Čas"><span>Čas</span>${chips('time', TIMES)}</div>
      <div class="filter-group" role="group" aria-label="Forma práce"><span>Forma</span>${chips('group', GROUPS)}</div>
      <div class="filter-group" role="group" aria-label="Pomůcky"><span>Pomůcky</span><button class="chip" type="button" data-filter="paper" data-value="1" aria-pressed="false">Stačí papír a tužka</button></div>
    </div>
  </div>
  <div class="results-bar">
    <p id="results" role="status" aria-live="polite"></p>
    <button id="clear-filters" class="link-button" type="button" data-action="clear-filters" hidden>${icon('close')}Zrušit filtry</button>
  </div>
  <div id="grid" class="grid"></div>
  <div id="empty" class="empty" hidden></div>`, '', state.saved ? 'ulozene' : 'metody');

  $('#search').addEventListener('input', event => { listState.q = event.target.value; syncList(); });
  syncList();
}

function syncList() {
  const state = listState;
  const p = PHASES[state.phase];
  const title = state.saved ? 'Uložené metody' : p ? p.name : 'Všechny metody';
  const lead = state.saved
    ? 'Váš výběr pro příští hodiny. Uložení platí v tomto prohlížeči.'
    : p ? p.lead : 'Vyberte fázi hodiny, nebo hledejte napříč celou knihovnou.';
  const head = $('#list-head');
  head.dataset.phase = state.saved || !p ? '' : state.phase;
  const hadFocus = document.activeElement?.id === 'view-title';
  head.innerHTML = `
    ${p && !state.saved ? `<span class="page-head-letter" aria-hidden="true">${state.phase}</span>` : ''}
    <div>
      <p class="eyebrow">${state.saved ? 'Moje knihovna' : p ? `${p.step}. ${p.when} · ${p.goal}` : 'Knihovna metod'}</p>
      <h1 id="view-title" tabindex="-1">${title}</h1>
      <p class="lead">${lead}</p>
    </div>`;
  if (hadFocus) $('#view-title').focus({ preventScroll: true });
  document.title = title + ' | Metody do výuky';

  for (const button of $$('[data-filter]')) {
    const key = button.dataset.filter;
    const active = key === 'paper' ? state.paper : state[key] === button.dataset.value;
    button.setAttribute('aria-pressed', active);
    if (key === 'phase') {
      const value = button.dataset.value;
      $('small', button).textContent = methods.filter(m => matches(m, state, true) && (value === 'all' || m.phase === value)).length;
    }
  }

  const found = sortByPhase(methods.filter(m => matches(m, state)));
  const grid = $('#grid'), empty = $('#empty');
  grid.innerHTML = found.map(m => card(m, 'h2')).join('');
  grid.hidden = !found.length;
  $('#results').textContent = `${found.length} ${plural(found.length)}`;
  $('#clear-filters').hidden = !hasFilters(state);

  empty.hidden = found.length > 0;
  if (!found.length) {
    const nothingSaved = state.saved && !saved.size;
    empty.innerHTML = nothingSaved
      ? `<span class="empty-icon">${icon('heart')}</span><h2>Zatím tu nic nemáte.</h2><p>U každé metody najdete srdíčko. Klepnutím si ji uložíte na později.</p><a class="button button-primary" href="#metody">Projít metody</a>`
      : `<span class="empty-icon">${icon('search')}</span><h2>Tomuhle výběru nic neodpovídá.</h2><p>Zkuste jiné slovo, jinou fázi nebo uberte některý filtr.</p><button class="button button-primary" type="button" data-action="clear-all">Zobrazit vše</button>`;
  }

  lastList = listUrl(state);
  if (location.hash !== lastList) history.replaceState(null, '', lastList);
  lastHash = location.hash;
}

function setFilter(key, value) {
  if (!listState) return;
  if (key === 'paper') listState.paper = !listState.paper;
  else if (key === 'phase') listState.phase = value;
  else listState[key] = listState[key] === value ? 'all' : value;
  syncList();
}

/* ---------- Detail metody ---------- */

function planButton(m) {
  const inPlan = plan[m.phase] === m.id;
  const other = !inPlan && byId.get(plan[m.phase]);
  return `<button class="button ${inPlan ? 'button-soft' : 'button-primary'}" type="button" data-plan="${m.id}" aria-pressed="${inPlan}">
    ${icon(inPlan ? 'check' : 'plus')}${inPlan ? 'V mojí hodině' : other ? 'Vyměnit v mojí hodině' : 'Přidat do hodiny'}</button>`;
}
function detailSaveButton(m) {
  const on = saved.has(m.id);
  return `<button class="button button-outline save-toggle" type="button" data-save="${m.id}" aria-pressed="${on}">${icon('heart')}${on ? 'Uloženo' : 'Uložit'}</button>`;
}

function renderDetail(m) {
  currentId = m.id; listState = null;
  const p = PHASES[m.phase];
  const back = lastList || '#metody?faze=' + m.phase;
  const siblings = sortByPhase(methods.filter(x => x.phase === m.phase));
  const index = siblings.findIndex(x => x.id === m.id);
  const related = [1, 2, 3].map(offset => siblings[(index + offset) % siblings.length]).filter(x => x.id !== m.id);
  const nextPhase = { E: 'U', U: 'R' }[m.phase];
  const added = m.origin === 'added';
  const source = added
    ? 'Doplněná metoda mimo dodané PDF. Popis, příklad, zadání a postup jsou metodický návrh pro praxi.'
    : `Metoda z dodaného přehledu „${p.name}“. Popis a zařazení vycházejí z PDF; čas, organizace, pomůcky, zadání, postup a tipy jsou doplněné návrhy pro praxi.`;

  setView(`
  <article class="detail" data-phase="${m.phase}">
    <nav class="crumbs" aria-label="Drobečková navigace">
      <a href="${esc(back)}">${icon('back')}Zpět na metody</a>
    </nav>
    <header class="detail-head">
      <span class="detail-letter" aria-hidden="true">${m.phase}</span>
      <p class="pill pill-solid"><b>${m.phase}</b>${p.name} · ${p.when.toLocaleLowerCase('cs')}</p>
      <h1 id="view-title" tabindex="-1">${esc(m.name)}</h1>
      <p class="lead">${esc(m.description)}</p>
      <dl class="facts">
        <div>${icon('clock')}<dt>Čas</dt><dd>asi ${m.minutes} min</dd></div>
        <div>${groupIcon(m.group)}<dt>Forma</dt><dd>${GROUPS[m.group]}</dd></div>
        <div>${icon('box')}<dt>Pomůcky</dt><dd>${esc(m.materials)}</dd></div>
      </dl>
      <div class="detail-actions">
        <span id="plan-slot">${planButton(m)}</span>
        <span id="save-slot">${detailSaveButton(m)}</span>
        <button class="button button-outline" type="button" data-action="print">${icon('print')}Vytisknout</button>
      </div>
    </header>

    <div class="detail-body">
      <div class="detail-main">
        <section class="prompt-card" aria-labelledby="prompt-title">
          <h2 id="prompt-title">Zadání pro žáky</h2>
          <p id="prompt-text" class="prompt-text">${esc(m.prompt)}</p>
          <div class="prompt-actions">
            <button class="button button-dark" type="button" data-action="stage">${icon('screen')}Promítnout s odpočtem</button>
            <button class="button button-ghost" type="button" data-action="copy-prompt">${icon('copy')}Kopírovat</button>
          </div>
        </section>

        <section aria-labelledby="steps-title">
          <h2 id="steps-title">Postup krok za krokem</h2>
          <ol class="steps">${m.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
        </section>

        ${m.example ? `<section class="example" aria-labelledby="example-title">
          <h2 id="example-title">Jak to může vypadat</h2>
          <p>${esc(m.example)}</p>
        </section>` : ''}
      </div>

      <aside class="detail-aside">
        <section class="note"><h2>Kdy se hodí</h2><p>${esc(m.use)}</p></section>
        <section class="note note-watch"><h2>Na co myslet</h2><p>${esc(m.watch)}</p></section>
        <section class="note note-plain"><h2>O metodě</h2><p>${source} Čas je orientační, přizpůsobte ho své třídě.</p>
          ${added ? '' : `<a class="more" href="${new URL('sources/' + m.source + '.pdf', ASSET_BASE).href}" target="_blank" rel="noopener">Otevřít podklad v PDF ${icon('arrow')}</a>`}
        </section>
      </aside>
    </div>
  </article>

  <section class="section related" aria-labelledby="related-title">
    <div class="section-head">
      <h2 id="related-title">Další metody pro ${m.phase === 'U' ? 'uvědomění' : m.phase === 'E' ? 'evokaci' : 'reflexi'}</h2>
      ${nextPhase
        ? `<a class="more" href="#metody?faze=${nextPhase}">Pokračovat na fázi ${PHASES[nextPhase].short} ${icon('arrow')}</a>`
        : `<a class="more" href="#hodina">Zobrazit moji hodinu ${icon('arrow')}</a>`}
    </div>
    <div class="grid">${related.map(x => card(x)).join('')}</div>
  </section>`, m.name + ' | Metody do výuky', 'metody');
}

/* ---------- Moje hodina ---------- */

function renderPlan(params) {
  currentId = null; listState = null;
  const fromUrl = cleanPlan({ E: Number(params.get('e')), U: Number(params.get('u')), R: Number(params.get('r')) });
  let shared = false, view = plan;
  if (planSize(fromUrl) && !samePlan(fromUrl, plan)) {
    if (planSize(plan)) { shared = true; view = fromUrl; }
    else { plan = fromUrl; view = plan; persistPlan(); }
  }
  const items = PHASE_KEYS.map(key => byId.get(view[key]) || null);
  const total = items.reduce((sum, m) => sum + (m ? m.minutes : 0), 0);
  const filled = items.filter(Boolean).length;
  const scale = Math.max(LESSON_MINUTES, total);
  const rest = LESSON_MINUTES - total;
  const verdict = !filled ? 'Zatím prázdná. Začněte třeba evokací.'
    : rest < 0 ? `O ${-rest} min delší než běžná hodina. Zkuste některou metodu zkrátit nebo vyměnit.`
    : filled < 3 ? `Vybráno ${filled} ze 3 fází, zbývá ${rest} min.`
    : `Zbývá ${rest} min na organizaci, přechody a vaše vlastní vstupy.`;

  setView(`
  <header class="page-head">
    <div>
      <p class="eyebrow">Plánovač hodiny</p>
      <h1 id="view-title" tabindex="-1">${shared ? 'Sdílená hodina' : 'Moje hodina'}</h1>
      <p class="lead">Jedna metoda pro každou fázi. Plán se ukládá v tomto prohlížeči a můžete ho poslat odkazem.</p>
    </div>
  </header>

  ${shared ? `<div class="banner">
    <p><strong>Díváte se na hodinu z odkazu.</strong> Vaše vlastní hodina zůstává uložená.</p>
    <div><button class="button button-primary" type="button" data-action="adopt-plan">Použít místo mojí</button><a class="button button-outline" href="#hodina">Zpět k mojí hodině</a></div>
  </div>` : ''}

  <section class="budget ${rest < 0 ? 'is-over' : ''}" aria-label="Časový rozpočet hodiny">
    <div class="budget-head"><p><b>${total}</b> z ${LESSON_MINUTES} minut</p><p>${verdict}</p></div>
    <div class="budget-bar" role="img" aria-label="Metody zabírají ${total} z ${LESSON_MINUTES} minut">
      ${items.map((m, i) => m ? `<span data-phase="${PHASE_KEYS[i]}" style="width:${m.minutes / scale * 100}%">${m.minutes}</span>` : '').join('')}
    </div>
  </section>

  <ol class="plan">
    ${PHASE_KEYS.map((key, i) => {
      const p = PHASES[key], m = items[i];
      return `<li class="slot ${m ? '' : 'slot-empty'}" data-phase="${key}">
        <div class="slot-rail"><b>${key}</b></div>
        <div class="slot-body">
          <p class="slot-phase">${p.step}. ${p.when} · ${p.name}</p>
          ${m ? `
            <div class="slot-title"><h2><a href="#metoda/${m.id}">${esc(m.name)}</a></h2><span class="slot-time">${icon('clock')}${m.minutes} min</span></div>
            <p class="slot-facts">${groupIcon(m.group)}${GROUPS[m.group]} · ${esc(m.materials)}</p>
            <blockquote>${esc(m.prompt)}</blockquote>
            <ol class="steps steps-small">${m.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
            ${shared ? '' : `<div class="slot-actions">
              <a class="link-button" href="#metody?faze=${key}">Vyměnit</a>
              <button class="link-button" type="button" data-unplan="${key}">Odebrat</button>
            </div>`}`
          : `<p class="slot-hint">${p.lead}</p>
            ${shared ? '' : `<a class="button button-outline" href="#metody?faze=${key}">${icon('plus')}Vybrat metodu</a>`}`}
        </div>
      </li>`;
    }).join('')}
  </ol>

  ${filled && !shared ? `<div class="plan-actions">
    <button class="button button-primary" type="button" data-action="print">${icon('print')}Vytisknout plán</button>
    <button class="button button-outline" type="button" data-action="share-plan">${icon('link')}Kopírovat odkaz</button>
    <button class="link-button" type="button" data-action="clear-plan">Vymazat hodinu</button>
  </div>` : ''}`, (shared ? 'Sdílená hodina' : 'Moje hodina') + ' | Metody do výuky', 'hodina');

  if (!shared) {
    const query = planQuery(plan), url = '#hodina' + (query ? '?' + query : '');
    if (location.hash !== url) history.replaceState(null, '', url);
    lastHash = location.hash;
  }
}

/* ---------- Promítání a odpočet ---------- */

const stage = $('#stage');
const timer = { total: 300, left: 300, end: 0, tick: 0 };
const formatTime = seconds => Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');

function paintTimer() {
  $('#timer-display').textContent = formatTime(timer.left);
  $('#timer-toggle').textContent = timer.tick ? 'Pozastavit' : timer.left === 0 ? 'Čas vypršel' : timer.left < timer.total ? 'Pokračovat' : 'Spustit odpočet';
  $('#timer-toggle').disabled = timer.left === 0;
  stage.classList.toggle('is-done', timer.left === 0);
  stage.classList.toggle('is-running', Boolean(timer.tick));
}
function stopTimer() { clearInterval(timer.tick); timer.tick = 0; }
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach(at => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.frequency.value = 880; osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.25);
      osc.start(ctx.currentTime + at); osc.stop(ctx.currentTime + at + 0.3);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch { /* zvuk není dostupný */ }
}
function startTimer() {
  timer.end = Date.now() + timer.left * 1000;
  timer.tick = setInterval(() => {
    timer.left = Math.max(0, Math.round((timer.end - Date.now()) / 1000));
    if (timer.left === 0) { stopTimer(); beep(); $('#timer-status').textContent = 'Čas vypršel.'; }
    paintTimer();
  }, 250);
  paintTimer();
}
function adjustTimer(delta) {
  timer.left = Math.min(90 * 60, Math.max(60, timer.left + delta));
  if (timer.tick) timer.end = Date.now() + timer.left * 1000; else timer.total = timer.left;
  paintTimer();
}
function openStage(m) {
  stopTimer();
  timer.total = timer.left = m.minutes * 60;
  stage.dataset.phase = m.phase;
  $('#stage-title').textContent = m.name;
  $('#stage-prompt').textContent = m.prompt;
  $('#stage-prompt').classList.toggle('is-long', m.prompt.length > 110);
  $('#timer-status').textContent = '';
  $('#stage-full').hidden = !stage.requestFullscreen;
  paintTimer();
  stage.showModal();
  $('#timer-toggle').focus();
}
$('#timer-toggle').onclick = () => { if (timer.tick) { stopTimer(); paintTimer(); } else startTimer(); };
$('#timer-reset').onclick = () => { stopTimer(); timer.left = timer.total; $('#timer-status').textContent = ''; paintTimer(); };
$('#timer-plus').onclick = () => adjustTimer(60);
$('#timer-minus').onclick = () => adjustTimer(-60);
$('#stage-close').onclick = () => stage.close();
$('#stage-full').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else stage.requestFullscreen().catch(() => {}); };
stage.addEventListener('close', () => { stopTimer(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); });

/* ---------- Směrování ---------- */

function route(initial = false) {
  if (!methods) return;
  if (lastHash !== null) scrollMemo.set(lastHash, window.scrollY);
  const previous = lastHash;
  if (stage.open) stage.close();
  $('#toast').hidden = true;

  const [path, query = ''] = location.hash.slice(1).split('?');
  const params = new URLSearchParams(query);
  lastHash = location.hash;
  let restore = 0;

  if (!path) renderHome();
  else if (path === 'metody' || path === 'ulozene') {
    renderList(readListState(path, params));
    if (previous && previous.startsWith('#metoda/') && scrollMemo.has(location.hash)) restore = scrollMemo.get(location.hash);
  } else if (/^faze\/[EUR]$/.test(path)) {
    params.set('faze', path.slice(5));
    renderList(readListState('metody', params));
  } else if (path === 'hodina') renderPlan(params);
  else if (/^metoda\/\d+$/.test(path) && byId.has(Number(path.slice(7)))) renderDetail(byId.get(Number(path.slice(7))));
  else {
    currentId = null; listState = null;
    setView(`<div class="empty"><span class="empty-icon">${icon('search')}</span><h1 id="view-title" tabindex="-1">Tuhle stránku tu nemáme.</h1><p>Odkaz je možná starý. Zkuste to přes přehled metod.</p><a class="button button-primary" href="#metody">Projít metody</a></div>`, 'Nenalezeno | Metody do výuky', '');
  }

  if (!initial) $('#view-title')?.focus({ preventScroll: true });
  window.scrollTo({ top: restore, behavior: 'instant' });
}

/* ---------- Akce ---------- */

function toggleSaved(id) {
  const m = byId.get(id);
  if (!m) return;
  if (saved.has(id)) saved.delete(id); else saved.add(id);
  persistSaved();
  if (listState?.saved) { syncList(); return; }
  const on = saved.has(id);
  for (const button of $$(`.heart[data-save="${id}"]`)) {
    button.setAttribute('aria-pressed', on);
    button.setAttribute('aria-label', `${on ? 'Odebrat z uložených' : 'Uložit'}: ${m.name}`);
  }
  if (currentId === id) { $('#save-slot').innerHTML = detailSaveButton(m); $('#save-slot button').focus(); }
  if (on) toast('Uloženo.', { href: '#ulozene', label: 'Zobrazit uložené' });
}

function togglePlan(id) {
  const m = byId.get(id);
  if (!m) return;
  const removing = plan[m.phase] === id;
  plan[m.phase] = removing ? null : id;
  persistPlan();
  if (currentId === id) { $('#plan-slot').innerHTML = planButton(m); $('#plan-slot button').focus(); }
  toast(removing ? 'Odebráno z hodiny.' : `${PHASES[m.phase].short}: přidáno do hodiny.`, { href: '#hodina', label: 'Zobrazit hodinu' });
}

const ACTIONS = {
  random() {
    const m = methods[Math.floor(Math.random() * methods.length)];
    location.hash = '#metoda/' + m.id;
  },
  print() { window.print(); },
  stage() { const m = byId.get(currentId); if (m) openStage(m); },
  'copy-prompt'() { const m = byId.get(currentId); if (m) copyText(m.prompt, 'Zadání zkopírováno.'); },
  'clear-filters'() {
    Object.assign(listState, { q: '', time: 'all', group: 'all', paper: false });
    $('#search').value = ''; syncList(); $('#search').focus();
  },
  'clear-all'() {
    Object.assign(listState, { phase: 'all', q: '', time: 'all', group: 'all', paper: false });
    $('#search').value = ''; syncList(); $('#search').focus();
  },
  'share-plan'() {
    const url = new URL(location.href);
    url.hash = '#hodina?' + planQuery(plan);
    copyText(url.href, 'Odkaz na hodinu zkopírován.');
  },
  'clear-plan'() {
    plan = { E: null, U: null, R: null }; persistPlan();
    renderPlan(new URLSearchParams());
    toast('Hodina vymazána.');
    $('#view-title').focus({ preventScroll: true });
  },
  'adopt-plan'() {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    plan = cleanPlan({ E: Number(params.get('e')), U: Number(params.get('u')), R: Number(params.get('r')) });
    persistPlan(); renderPlan(params);
    toast('Hodina je teď vaše.');
    $('#view-title').focus({ preventScroll: true });
  }
};

document.addEventListener('click', event => {
  const target = event.target.closest('[data-save],[data-plan],[data-unplan],[data-filter],[data-action]');
  if (!target || !methods) return;
  const data = target.dataset;
  if (data.save) toggleSaved(Number(data.save));
  else if (data.plan) togglePlan(Number(data.plan));
  else if (data.unplan) { plan[data.unplan] = null; persistPlan(); renderPlan(new URLSearchParams()); $('#view-title').focus({ preventScroll: true }); }
  else if (data.filter) setFilter(data.filter, data.value);
  else if (ACTIONS[data.action]) ACTIONS[data.action]();
});

document.addEventListener('submit', event => {
  if (event.target.id !== 'hero-search') return;
  event.preventDefault();
  const q = new FormData(event.target).get('q').trim();
  location.hash = '#metody' + (q ? '?q=' + encodeURIComponent(q) : '');
});

$('#theme-toggle').onclick = () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('eur-theme', root.dataset.theme); } catch { /* úložiště není dostupné */ }
};

$('.skip').onclick = event => { event.preventDefault(); $('#obsah').focus(); };
window.addEventListener('hashchange', () => route());
window.addEventListener('storage', event => {
  if (event.key !== 'eur-saved' && event.key !== 'eur-plan') return;
  saved = readSaved(); plan = cleanPlan(readPlan()); updateBadges();
  if (methods && !stage.open) { lastHash = null; route(true); }
});

/* ---------- Načtení ---------- */

async function load() {
  try {
    const response = await fetch(new URL('methods.json' + ASSET_VERSION, ASSET_BASE));
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    const valid = Array.isArray(data) && data.length && data.every(m => Number.isInteger(m.id) && PHASES[m.phase] && GROUPS[m.group] && Array.isArray(m.steps) && m.name && m.prompt && m.watch && Number.isFinite(m.minutes));
    if (!valid) throw new Error('Invalid data');
    methods = data;
    byId = new Map(data.map(m => [m.id, m]));
    saved = new Set([...saved].filter(id => byId.has(id)));
    plan = cleanPlan(plan);
    updateBadges();
    route(true);
  } catch {
    app.innerHTML = `<div class="empty" role="alert"><h1>Metody se nepodařilo načíst.</h1><p>Zkontrolujte připojení a zkuste to znovu.</p><button id="retry" class="button button-primary" type="button">Zkusit znovu</button></div>`;
    $('#retry').onclick = () => { app.innerHTML = '<p class="loading">Načítám metody…</p>'; load(); };
  }
}
load();
