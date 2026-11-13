'use strict';

const ASSET_BASE = new URL('.', document.currentScript.src);
const ASSET_VERSION = new URL(document.currentScript.src).search;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $('#app');

const PHASES = {
  E: {
    name: 'Evokace', when: 'Začátek hodiny', step: '1', goal: 'Chci otevřít téma.',
    blurb: 'Zjistit, co už žáci vědí, a vzbudit jejich zájem.',
    ask: 'Jak otevřete téma?',
    lead: 'Evokace: žáci vybaví, co o tématu už vědí, a objeví, co by chtěli zjistit.',
    recommended: [9, 1, 51, 54, 67, 5, 66, 70, 6]
  },
  U: {
    name: 'Uvědomění si významu', when: 'Nové učivo', step: '2', goal: 'Chci jít do hloubky.',
    blurb: 'Pracovat s novými informacemi a chápat souvislosti.',
    ask: 'Jak žáci nové učivo zpracují?',
    lead: 'Uvědomění si významu: žáci pracují s novými informacemi a upravují své původní představy.',
    recommended: [12, 13, 79, 16, 11, 60, 80, 76]
  },
  R: {
    name: 'Reflexe', when: 'Závěr hodiny', step: '3', goal: 'Chci zjistit, co si odnášejí.',
    blurb: 'Pojmenovat, co se žáci naučili, a ověřit porozumění.',
    ask: 'Jak zjistíte, co si žáci odnášejí?',
    lead: 'Reflexe: žáci pojmenují, co pochopili, a vy zjistíte, co potřebují dál.',
    recommended: [38, 37, 26, 21, 32, 88, 35]
  }
};
const PHASE_KEYS = ['E', 'U', 'R'];
const GROUPS = { alone: 'Samostatně', pairs: 'Ve dvojicích', group: 'Ve skupinách', class: 'Celá třída' };
const TIMES = { 5: 'Do 5 minut', 10: 'Do 10 minut', long: 'Víc než 10 minut' };
const PAGE = 3;
const SEARCH_LIMIT = 10;

const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const fold = text => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('cs');
const plural = n => n === 1 ? 'metoda' : n >= 2 && n <= 4 ? 'metody' : 'metod';

/* ---------- Stav ---------- */

let methods = null;
let byId = new Map();
let view = null;          // stav stránky s výběrem metody
let lastList = '';        // adresa seznamu, ze kterého uživatel otevřel detail
let currentId = null;
const scrollMemo = new Map();
let lastHash = null;

function readSaved() {
  try {
    const data = JSON.parse(localStorage.getItem('eur-saved'));
    return new Set(Array.isArray(data) ? data.filter(Number.isInteger) : []);
  } catch { return new Set(); }
}
let saved = readSaved();
function persistSaved() {
  try { localStorage.setItem('eur-saved', JSON.stringify([...saved])); } catch { /* úložiště není dostupné */ }
  updateBadge();
}
function updateBadge() { $('#saved-count').textContent = saved.size; }

let toastTimer = 0;
function toast(message, link) {
  const box = $('#toast');
  box.innerHTML = `<span>${esc(message)}</span>${link ? `<a href="${link.href}">${esc(link.label)}</a>` : ''}`;
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { box.hidden = true; }, 4000);
}

async function copyText(text, done) {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    const area = document.createElement('textarea');
    area.value = text; area.setAttribute('readonly', ''); area.className = 'visually-hidden';
    document.body.append(area); area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
    toast(ok ? done : 'Kopírování není dostupné. Označte text a zkopírujte ho ručně.');
  }
}

/* ---------- Pomocné funkce ---------- */

function phaseMethods(key) {
  const rec = PHASES[key].recommended;
  return methods.filter(m => m.phase === key).sort((a, b) => {
    const ai = rec.indexOf(a.id), bi = rec.indexOf(b.id);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.id - b.id;
  });
}
const timeOk = (m, time) => time === 'all' || (time === 'long' ? m.minutes > 10 : m.minutes <= Number(time));
const groupOk = (m, group) => group === 'all' || m.group === group;

function setView(html, title) {
  app.innerHTML = html;
  document.title = title;
  const link = $('#saved-count').parentElement;
  if (location.hash.startsWith('#ulozene')) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
}

function pickRow(m, n, withPhase) {
  return `<li><a class="pick" data-phase="${m.phase}" href="#metoda/${m.id}">
    <span class="pick-n" aria-hidden="true">${n}</span>
    <span class="pick-body">
      <span class="pick-name">${esc(m.name)}</span>
      <span class="pick-desc">${esc(m.description)}</span>
    </span>
    <span class="pick-meta"><b>${m.minutes} min</b><span>${GROUPS[m.group]}</span>${withPhase ? `<span class="tag">${m.phase} · ${PHASES[m.phase].name}</span>` : ''}</span>
    <span class="pick-go" aria-hidden="true">→</span>
  </a></li>`;
}

/* ---------- Úvod ---------- */

function renderHome() {
  currentId = null; view = null; lastList = '';
  setView(`
  <section class="hero">
    <p class="kicker">Pro učitele · model E–U–R</p>
    <h1 id="view-title" tabindex="-1">Vyberte metodu <em>do své hodiny.</em></h1>
    <p class="lead">${methods.length} hotových aktivit pro začátek, nové učivo i závěr hodiny. Řeknete, co právě připravujete, a dostanete zadání pro žáky i postup, jak aktivitu vést.</p>
  </section>

  <section aria-labelledby="ask-title">
    <h2 id="ask-title" class="ask"><span>Krok 1</span> Co právě připravujete?</h2>
    <div class="phases">
      ${PHASE_KEYS.map(key => {
        const p = PHASES[key];
        return `<a class="phase" data-phase="${key}" href="#faze/${key}">
          <span class="phase-n">${p.step} · ${p.name}</span>
          <span class="phase-letter" aria-hidden="true">${key}</span>
          <span class="phase-title">${p.when}</span>
          <span class="phase-text"><strong>${p.goal}</strong> ${p.blurb}</span>
          <span class="phase-go">Vybrat metodu →</span>
        </a>`;
      }).join('')}
    </div>
  </section>

  <section class="find" aria-labelledby="find-title">
    <h2 id="find-title">Znáte název metody?</h2>
    <form id="find-form" role="search">
      <input id="find-q" name="q" type="search" aria-label="Hledat metodu podle názvu" placeholder="Třeba pětilístek nebo exit ticket" autocomplete="off">
      <button class="btn" type="submit">Najít</button>
    </form>
    <p class="find-alt">Nebo se nechte <button class="link" type="button" data-action="random">překvapit náhodnou metodou</button>.</p>
  </section>

  <details class="about">
    <summary>Co znamená E–U–R?</summary>
    <div class="about-body">
      <p><strong>Evokace</strong> propojí téma s tím, co žáci už vědí, a otevře otázky. Při <strong>uvědomění si významu</strong> žáci pracují s novými informacemi a upravují své představy. V <strong>reflexi</strong> pojmenují, co pochopili a jak budou pokračovat.</p>
      <p>Fázi vybírejte podle cíle. Některé metody se dají použít ve více částech hodiny; zde jsou zařazené tam, kde se používají nejčastěji.</p>
    </div>
  </details>`, 'Metody do výuky | E–U–R');
}

/* ---------- Výběr metody pro fázi ---------- */

function readPhase(key, params) {
  const offset = parseInt(params.get('od'), 10);
  return {
    phase: key,
    time: TIMES[params.get('cas')] ? params.get('cas') : 'all',
    group: GROUPS[params.get('prace')] ? params.get('prace') : 'all',
    offset: offset > 0 ? offset : 0
  };
}
function phaseUrl(state) {
  const params = new URLSearchParams();
  if (state.time !== 'all') params.set('cas', state.time);
  if (state.group !== 'all') params.set('prace', state.group);
  if (state.offset > 0) params.set('od', state.offset);
  const query = params.toString();
  return '#faze/' + state.phase + (query ? '?' + query : '');
}

function renderPhase(state) {
  currentId = null; view = state;
  const p = PHASES[state.phase];
  setView(`
  <a class="back" href="#">← Jiná část hodiny</a>
  <section class="phase-head" data-phase="${state.phase}">
    <div class="phase-head-letter" aria-hidden="true">${state.phase}</div>
    <div>
      <p class="kicker">${p.step} z 3 · ${p.when}</p>
      <h1 id="view-title" tabindex="-1">${p.ask}</h1>
      <p class="lead">${p.lead}</p>
    </div>
  </section>
  <section class="chooser" data-phase="${state.phase}" aria-labelledby="chooser-title">
    <h2 id="chooser-title" class="ask"><span>Krok 2</span> Upřesněte, co vám vyhovuje <small>(nepovinné)</small></h2>
    <div id="chooser"></div>
  </section>
  <section class="results" id="results" data-phase="${state.phase}" aria-labelledby="results-title"></section>`,
  p.name + ' | Metody do výuky');
  paintPhase();
}

function optionButtons(key, options, current, countFor) {
  const all = { value: 'all', label: 'Je to jedno' };
  const entries = [all, ...Object.entries(options).map(([value, label]) => ({ value, label }))];
  return entries.map(({ value, label }) => {
    const count = countFor(value);
    const on = current === value;
    return `<button type="button" class="opt" data-set="${key}" data-value="${value}" aria-pressed="${on}"${count === 0 && !on ? ' disabled' : ''}>${label} <small>${count}</small></button>`;
  }).join('');
}

const phaseList = state => phaseMethods(state.phase).filter(m => timeOk(m, state.time) && groupOk(m, state.group));

function paintPhase() {
  const state = view;
  const all = phaseMethods(state.phase);
  const list = phaseList(state);
  const start = list.length ? Math.min(state.offset, Math.floor((list.length - 1) / PAGE) * PAGE) : 0;
  state.offset = start;
  const shown = list.slice(start, start + PAGE);
  const end = start + shown.length;

  $('#chooser').innerHTML = `
    <div class="q"><p class="q-title" id="q-time">Kolik máte času?</p>
      <div class="opts" role="group" aria-labelledby="q-time">${optionButtons('time', TIMES, state.time, v => all.filter(m => timeOk(m, v) && groupOk(m, state.group)).length)}</div></div>
    <div class="q"><p class="q-title" id="q-group">Jak budou žáci pracovat?</p>
      <div class="opts" role="group" aria-labelledby="q-group">${optionButtons('group', GROUPS, state.group, v => all.filter(m => timeOk(m, state.time) && groupOk(m, v)).length)}</div></div>`;

  const filtered = state.time !== 'all' || state.group !== 'all';
  $('#results').innerHTML = list.length ? `
    <h2 id="results-title" class="ask" tabindex="-1"><span>Krok 3</span> Vyberte si z návrhů</h2>
    <p class="count" role="status" aria-live="polite">${list.length > PAGE ? `Návrhy ${start + 1}–${end} z ${list.length}` : `${list.length} ${plural(list.length)}`}${filtered ? ' podle vašeho výběru' : ''}</p>
    <ol class="picks">${shown.map((m, i) => pickRow(m, start + i + 1)).join('')}</ol>
    <div class="more-row">
      ${start > 0 ? '<button class="btn btn-line" type="button" data-page="prev">← Předchozí návrhy</button>' : ''}
      ${list.length > PAGE ? `<button class="btn" type="button" data-page="next">${end < list.length ? 'Ukázat další návrhy →' : 'Znovu od začátku ↺'}</button>` : ''}
      <button class="btn btn-line" type="button" data-action="random">Překvap mě</button>
      ${filtered ? '<button class="link" type="button" data-action="reset">Zrušit výběr</button>' : ''}
    </div>` : `
    <h2 id="results-title" class="ask" tabindex="-1">Pro tuto kombinaci nemáme metodu</h2>
    <p class="lead">Zkuste jiný čas nebo jinou formu práce.</p>
    <div class="more-row"><button class="btn" type="button" data-action="reset">Zrušit výběr</button></div>`;

  lastList = phaseUrl(state);
  history.replaceState(null, '', lastList);
  lastHash = location.hash;
}

/* ---------- Detail metody ---------- */

function saveButton(m) {
  const on = saved.has(m.id);
  return `<button class="btn btn-line" type="button" data-save="${m.id}" aria-pressed="${on}">${on ? '✓ Uloženo' : 'Uložit na později'}</button>`;
}

function renderDetail(m) {
  currentId = m.id; view = null;
  const p = PHASES[m.phase];
  const back = lastList || '#faze/' + m.phase;
  const fromSaved = back.startsWith('#ulozene'), fromSearch = back.startsWith('#hledat');
  const backText = fromSaved ? '← Zpět na uložené' : fromSearch ? '← Zpět na hledání' : '← Zpět na návrhy';
  const moreText = fromSaved ? '← Zpět na uložené' : fromSearch ? '← Zpět na hledání' : '← Vybrat jinou metodu';
  const next = { E: 'U', U: 'R' }[m.phase];
  const added = m.origin === 'added';
  const source = added
    ? 'Doplněná metoda mimo dodané PDF. Popis, příklad, zadání i postup jsou metodický návrh pro praxi.'
    : `Metoda z dodaného přehledu „${p.name}“. Popis a zařazení vycházejí z PDF; čas, organizace, pomůcky, zadání, postup a tipy jsou doplněné návrhy pro praxi.`;

  setView(`
  <article class="detail" data-phase="${m.phase}">
    <a class="back" href="${esc(back)}">${backText}</a>
    <header class="d-head">
      <p class="d-tag"><b>${m.phase}</b> ${p.name} · ${p.when.toLocaleLowerCase('cs')}</p>
      <h1 id="view-title" tabindex="-1">${esc(m.name)}</h1>
      <p class="lead">${esc(m.description)}</p>
      <dl class="facts">
        <div><dt>Čas</dt><dd>asi ${m.minutes} min</dd></div>
        <div><dt>Forma práce</dt><dd>${GROUPS[m.group]}</dd></div>
        <div><dt>Co připravit</dt><dd>${esc(m.materials)}</dd></div>
      </dl>
    </header>

    <section class="say" aria-labelledby="say-title">
      <h2 id="say-title">Řekněte žákům</h2>
      <p class="say-text">${esc(m.prompt)}</p>
      <div class="btn-row">
        <button class="btn btn-dark" type="button" data-action="stage">Promítnout s odpočtem</button>
        <button class="btn btn-line" type="button" data-action="copy-prompt">Kopírovat zadání</button>
      </div>
    </section>

    <section aria-labelledby="steps-title">
      <h2 id="steps-title" class="h2">Jak aktivitu vést</h2>
      <ol class="steps">${m.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
    </section>

    <div class="notes">
      ${m.example ? `<section><h2>Příklad</h2><p>${esc(m.example)}</p></section>` : ''}
      <section><h2>Kdy se hodí</h2><p>${esc(m.use)}</p></section>
      <section class="notes-watch"><h2>Na co myslet</h2><p>${esc(m.watch)}</p></section>
    </div>

    <div class="btn-row d-actions">
      <span id="save-slot">${saveButton(m)}</span>
      <button class="btn btn-line" type="button" data-action="print">Vytisknout</button>
    </div>

    <nav class="d-next" aria-label="Další kroky">
      <a class="btn" href="${esc(back)}">${moreText}</a>
      ${next ? `<a class="btn btn-line" href="#faze/${next}">Další část hodiny: ${PHASES[next].when} →</a>` : '<a class="btn btn-line" href="#">Začít znovu →</a>'}
    </nav>
    <p class="source">${source}${added ? '' : ` <a href="${new URL('sources/' + m.source + '.pdf', ASSET_BASE).href}" target="_blank" rel="noopener">Otevřít podklad v PDF</a>`}</p>
  </article>`, m.name + ' | Metody do výuky');
}

/* ---------- Uložené a hledání ---------- */

function renderSaved() {
  currentId = null; view = null; lastList = '#ulozene';
  const list = [...saved].map(id => byId.get(id)).filter(Boolean)
    .sort((a, b) => PHASE_KEYS.indexOf(a.phase) - PHASE_KEYS.indexOf(b.phase) || a.id - b.id);
  setView(`
  <a class="back" href="#">← Na začátek</a>
  <section class="plain-head"><h1 id="view-title" tabindex="-1">Uložené metody</h1>
  <p class="lead">Váš výběr pro příští hodiny. Uložení platí jen v tomto prohlížeči.</p></section>
  ${list.length
    ? `<ol class="picks">${list.map((m, i) => pickRow(m, i + 1, true)).join('')}</ol>`
    : `<div class="empty"><p>Zatím tu nic nemáte.</p><p>V detailu každé metody najdete tlačítko Uložit na později.</p><a class="btn" href="#">Vybrat metodu</a></div>`}`,
  'Uložené metody | Metody do výuky');
}

function renderSearch(q) {
  currentId = null; view = null; lastList = '#hledat?q=' + encodeURIComponent(q);
  const words = fold(q.trim()).split(/\s+/).filter(Boolean);
  const hits = words.length ? methods.filter(m => {
    const text = fold([m.name, m.description, m.use, m.example, m.prompt, m.materials, ...m.steps].join(' '));
    return words.every(w => text.includes(w));
  }).sort((a, b) => {
    const an = words.every(w => fold(a.name).includes(w)) ? 0 : 1, bn = words.every(w => fold(b.name).includes(w)) ? 0 : 1;
    return an - bn || PHASE_KEYS.indexOf(a.phase) - PHASE_KEYS.indexOf(b.phase) || a.id - b.id;
  }) : [];
  const shown = hits.slice(0, SEARCH_LIMIT);
  setView(`
  <a class="back" href="#">← Na začátek</a>
  <section class="plain-head"><h1 id="view-title" tabindex="-1">Hledání metody</h1>
  <form id="find-form" role="search"><input id="find-q" name="q" type="search" aria-label="Hledat metodu" value="${esc(q)}" autocomplete="off"><button class="btn" type="submit">Najít</button></form></section>
  ${shown.length
    ? `<p class="count" role="status">${hits.length > SEARCH_LIMIT ? `Zobrazeno prvních ${SEARCH_LIMIT} z ${hits.length} metod. Zkuste hledání upřesnit.` : `${hits.length} ${plural(hits.length)}`}</p><ol class="picks">${shown.map((m, i) => pickRow(m, i + 1, true)).join('')}</ol>`
    : `<div class="empty"><p>${words.length ? 'Nic jsme nenašli.' : 'Napište název nebo slovo z popisu metody.'}</p><a class="btn" href="#">Vybrat podle fáze hodiny</a></div>`}`,
  'Hledání | Metody do výuky');
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

  // staré odkazy
  if (path === 'metody' || path === 'hodina') {
    const phase = PHASES[params.get('faze')] ? params.get('faze') : '';
    history.replaceState(null, '', phase ? '#faze/' + phase : '#');
    return route(initial);
  }

  lastHash = location.hash;
  let restore = 0;
  if (!path) renderHome();
  else if (/^faze\/[EUR]$/.test(path)) {
    renderPhase(readPhase(path.slice(5), params));
    if (previous && previous.startsWith('#metoda/') && scrollMemo.has(lastHash)) restore = scrollMemo.get(lastHash);
  } else if (/^metoda\/\d+$/.test(path) && byId.has(Number(path.slice(7)))) renderDetail(byId.get(Number(path.slice(7))));
  else if (path === 'ulozene') renderSaved();
  else if (path === 'hledat') renderSearch(params.get('q') || '');
  else {
    currentId = null; view = null;
    setView(`<div class="empty"><h1 id="view-title" tabindex="-1">Tuhle stránku tu nemáme.</h1><p>Odkaz je možná starý.</p><a class="btn" href="#">Vybrat metodu</a></div>`, 'Nenalezeno | Metody do výuky');
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
  if (currentId === id) {
    $('#save-slot').innerHTML = saveButton(m);
    $('#save-slot button').focus();
  }
  toast(saved.has(id) ? 'Uloženo.' : 'Odebráno z uložených.', saved.has(id) ? { href: '#ulozene', label: 'Zobrazit uložené' } : null);
}

const ACTIONS = {
  random() {
    const pool = view ? phaseMethods(view.phase).filter(m => timeOk(m, view.time) && groupOk(m, view.group)) : methods;
    const m = (pool.length ? pool : methods)[Math.floor(Math.random() * (pool.length || methods.length))];
    location.hash = '#metoda/' + m.id;
  },
  reset() { Object.assign(view, { time: 'all', group: 'all', offset: 0 }); paintPhase(); $('#results-title').focus({ preventScroll: true }); },
  print() { window.print(); },
  stage() { const m = byId.get(currentId); if (m) openStage(m); },
  'copy-prompt'() { const m = byId.get(currentId); if (m) copyText(m.prompt, 'Zadání zkopírováno.'); }
};

document.addEventListener('click', event => {
  const target = event.target.closest('[data-set],[data-page],[data-save],[data-action]');
  if (!target || !methods) return;
  const data = target.dataset;
  if (data.set) {
    view[data.set] = data.value; view.offset = 0; paintPhase();
    $(`[data-set="${data.set}"][data-value="${data.value}"]`)?.focus({ preventScroll: true });
  } else if (data.page) {
    const total = phaseList(view).length;
    if (data.page === 'prev') view.offset = Math.max(0, view.offset - PAGE);
    else view.offset = view.offset + PAGE >= total ? 0 : view.offset + PAGE;   // za posledním návrhem začíná seznam znovu
    paintPhase();
    $('#results-title').focus({ preventScroll: true });
    $('#results').scrollIntoView({ block: 'nearest', behavior: 'instant' });
  } else if (data.save) toggleSaved(Number(data.save));
  else if (ACTIONS[data.action]) ACTIONS[data.action]();
});

document.addEventListener('submit', event => {
  if (event.target.id !== 'find-form') return;
  event.preventDefault();
  const q = new FormData(event.target).get('q').trim();
  location.hash = q ? '#hledat?q=' + encodeURIComponent(q) : '#hledat';
});

$('.skip').onclick = event => { event.preventDefault(); $('#obsah').focus(); };
window.addEventListener('hashchange', () => route());
window.addEventListener('storage', event => {
  if (event.key !== 'eur-saved') return;
  saved = readSaved(); updateBadge();
  if (methods && location.hash.startsWith('#ulozene')) { lastHash = null; route(true); }
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
    persistSaved();
    const own = data.filter(m => m.origin === 'pdf').length;
    $('#foot-text').textContent = `Průvodce výběrem metod podle modelu E–U–R. Základem je ${own} metod ze tří dodaných přehledů, dalších ${data.length - own} je doplněných a označených v detailu. Časy, zadání a tipy jsou návrhy pro praxi.`;
    route(true);
  } catch {
    app.innerHTML = `<div class="empty" role="alert"><h1>Metody se nepodařilo načíst.</h1><p>Zkontrolujte připojení a zkuste to znovu.</p><button id="retry" class="btn" type="button">Zkusit znovu</button></div>`;
    $('#retry').onclick = () => { app.innerHTML = '<p class="loading">Načítám metody…</p>'; load(); };
  }
}
updateBadge();
load();
