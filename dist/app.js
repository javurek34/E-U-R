'use strict';
const $ = selector => document.querySelector(selector);
const PHASES = {
 E: {name:'Evokace',kicker:'01 / ZAČÁTEK HODINY',description:'Vyberte, jak otevřete téma a zjistíte, co už žáci vědí.',recommended:[9,1,51,54,5,6]},
 U: {name:'Uvědomění si významu',kicker:'02 / PRÁCE S NOVÝM UČIVEM',description:'Vyberte, jak budou žáci objevovat, zpracovávat a propojovat nové poznatky.',recommended:[12,13,16,11,60,15]},
 R: {name:'Reflexe',kicker:'03 / ZÁVĚR HODINY',description:'Vyberte, jak zjistíte, co žáci pochopili a co potřebují dál.',recommended:[38,37,26,21,32,35]}
};
const GROUPS = {alone:'Samostatně',pairs:'Ve dvojicích',group:'Ve skupinách',class:'Společně s třídou'};
const PAGE_SIZE = 6;
let methods = null, current = null, context = null, lastList = '', filtersExpanded = false;
function readSaved() {
 try {const data=JSON.parse(localStorage.getItem('eur-saved')||'[]');return new Set(Array.isArray(data)?data.filter(Number.isInteger):[]);} catch {return new Set();}
}
let saved=readSaved();
const fold=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs');
function element(tag,className,text) {const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function updateSavedCount() {$('#saved-count').textContent=saved.size;}
function persistSaved() {try{localStorage.setItem('eur-saved',JSON.stringify([...saved]));}catch{}updateSavedCount();}
function toggleSaved(id) {saved.has(id)?saved.delete(id):saved.add(id);persistSaved();if(current)updateSaveButton();}
function parseRoute() {
 const [path,query='']=location.hash.slice(1).split('?');
 return {path,params:new URLSearchParams(query)};
}
function listUrl(state) {
 const params=new URLSearchParams();
 if(state.q)params.set('q',state.q);
 if(state.time!=='all')params.set('cas',state.time);
 if(state.group!=='all')params.set('prace',state.group);
 if(state.page>1)params.set('strana',state.page);
 const query=params.toString();return '#'+(state.saved?'ulozene':'faze/'+state.phase)+(query?'?'+query:'');
}
function readListState(path,params) {
 const isSaved=path==='ulozene';
 const phase=path.split('/')[1];
 if(!isSaved&&!PHASES[phase])return null;
 const parsedPage=Number(params.get('strana'));
 return {saved:isSaved,phase:isSaved?null:phase,q:params.get('q')||'',time:['5','10','long'].includes(params.get('cas'))?params.get('cas'):'all',group:GROUPS[params.get('prace')]?params.get('prace'):'all',page:Number.isInteger(parsedPage)&&parsedPage>0?parsedPage:1};
}
function showView(id) {for(const name of ['home-view','list-view','detail-view','not-found'])$('#'+name).hidden=name!==id;}
function focusView(selector) {const target=$(selector);target.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
function setFiltersVisible(expanded) {filtersExpanded=expanded;$('#filters').hidden=!expanded;$('#filter-toggle').setAttribute('aria-expanded',expanded);$('#filter-toggle').lastElementChild.textContent=expanded?'−':'+';}
function prepareList(state) {
 context=state;current=null;
 showView('list-view');
 const p=PHASES[state.phase];
 $('#crumb-phase').textContent=state.saved?'Moje uložené':p.name;
 $('#list-title').textContent=state.saved?'Moje uložené':p.name;
 $('#list-kicker').textContent=state.saved?'METODY, KE KTERÝM SE CHCETE VRÁTIT':p.kicker;
 $('#list-description').textContent=state.saved?'Váš výběr pro příští hodiny. Uložení platí v tomto prohlížeči.':p.description;
 $('#list-letter').hidden=state.saved;
 $('#list-letter').textContent=state.phase||'';$('#list-letter').dataset.phase=state.phase||'';
 $('#phase-switch').hidden=state.saved;
 document.querySelectorAll('[data-phase]').forEach(a=>{if(a.dataset.phase===state.phase)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('#search').placeholder=state.saved?'Hledat v uložených metodách…':'Hledat v této fázi…';
 $('#search').value=state.q;$('#time-filter').value=state.time;$('#group-filter').value=state.group;
 setFiltersVisible(filtersExpanded||state.time!=='all'||state.group!=='all');
 document.title=(state.saved?'Moje uložené':p.name)+' | Metody do výuky';
 renderList();
}
function filteredMethods() {
 let result=methods.filter(m=>context.saved?saved.has(m.id):m.phase===context.phase);
 if(!context.saved){const recommended=PHASES[context.phase].recommended;result.sort((a,b)=>{const ai=recommended.indexOf(a.id),bi=recommended.indexOf(b.id);return (ai<0?999:ai)-(bi<0?999:bi)||a.id-b.id;});}
 const query=fold(context.q.trim());
 return result.filter(m=>(!query||fold([m.name,m.description,m.use,m.prompt,...m.steps].join(' ')).includes(query))&&(context.time==='all'||(context.time==='long'?m.minutes>10:m.minutes<=Number(context.time)))&&(context.group==='all'||m.group===context.group));
}
function renderList() {
 const filtered=filteredMethods(),pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
 context.page=Math.min(context.page,pages);
 lastList=listUrl(context);
 history.replaceState(null,'',lastList);
 const start=(context.page-1)*PAGE_SIZE;
 const list=$('#method-list');list.replaceChildren();list.hidden=!filtered.length;
 for(const [offset,m] of filtered.slice(start,start+PAGE_SIZE).entries()) {
  const link=element('a','method-row');link.href='#metoda/'+m.id;
  const number=element('span','row-number',String(start+offset+1).padStart(2,'0'));number.setAttribute('aria-hidden','true');
  const body=element('div','row-body'),title=element('h2','method-title',m.name);
  if(context.saved)title.append(element('span','row-phase',PHASES[m.phase].name));
  body.append(title,element('p','row-summary',m.description));
  const end=element('div','row-end'),arrow=element('span','row-arrow','↗');arrow.setAttribute('aria-hidden','true');
  end.append(element('span','row-time',m.minutes+' min'),arrow);
  link.append(number,body,end);list.append(link);
 }
 $('#results').textContent=filtered.length?`${start+1}–${Math.min(start+PAGE_SIZE,filtered.length)} z ${filtered.length} metod`:'0 metod';
 $('#empty').hidden=filtered.length>0;
 const noSaved=context.saved&&![...saved].some(id=>methods.some(m=>m.id===id));
 $('#empty-title').textContent=noSaved?'Zatím tu nic uloženého nemáte.':'Žádná metoda neodpovídá výběru.';
 $('#empty-description').textContent=noSaved?'Vyberte fázi hodiny, otevřete metodu a zvolte Uložit metodu.':'Zkuste změnit hledání nebo zrušit upřesnění.';
 $('#empty-reset').hidden=noSaved;$('#empty-home').hidden=!noSaved;
 renderPagination(pages,filtered.length);
}
function renderPagination(pages,total) {
 const nav=$('#pagination');nav.replaceChildren();nav.hidden=!total;
 const label=element('p','',pages>1?`Strana ${context.page} z ${pages}`:'To jsou všechny metody v tomto výběru.');nav.append(label);
 if(pages>1){const buttons=element('div');for(const [delta,text] of [[-1,'← Předchozí'],[1,'Další metody →']]){const button=element('button','page-button',text);button.disabled=delta<0?context.page===1:context.page===pages;button.onclick=()=>{location.hash=listUrl({...context,page:context.page+delta});};buttons.append(button);}nav.append(buttons);}
}
function changeFilters() {
 if(!context)return;
 context={...context,q:$('#search').value,time:$('#time-filter').value,group:$('#group-filter').value,page:1};
 renderList();
}
function resetFilters() {$('#search').value='';$('#time-filter').value='all';$('#group-filter').value='all';changeFilters();}
function updateSaveButton() {$('#detail-save').textContent=saved.has(current.id)?'✓ Uloženo · odebrat':'Uložit metodu';$('#detail-save').setAttribute('aria-pressed',saved.has(current.id));}
function showDetail(m) {
 current=m;context=null;showView('detail-view');
 const back=lastList||'#faze/'+m.phase;
 $('#back-to-list').href=back;$('#another-method').href=back;
 $('#detail-crumb').textContent=PHASES[m.phase].name;
 $('#detail-kicker').textContent=PHASES[m.phase].kicker+' / '+PHASES[m.phase].name.toLocaleUpperCase('cs');
 $('#detail-title').textContent=m.name;$('#detail-description').textContent=m.description;
 $('#detail-time').textContent='cca '+m.minutes+' minut';$('#detail-group').textContent=GROUPS[m.group];$('#detail-materials').textContent=m.materials;
 $('#detail-prompt').textContent=m.prompt;$('#detail-use').textContent=m.use;$('#detail-watch').textContent=m.watch;
 $('#detail-steps').replaceChildren(...m.steps.map(step=>element('li','',step)));
 $('#copy-status').textContent='';$('#copy-fallback').hidden=true;$('#copy-prompt').disabled=false;
 const added=m.origin==='added';
 $('#detail-source').textContent=added?'Doplněná metoda mimo dodané PDF. Popis, příklad, zadání a postup jsou metodický návrh pro praxi. Čas i organizaci přizpůsobte své třídě.':`Metoda z dodaného přehledu ${PHASES[m.phase].name}. Popis a zařazení vycházejí z PDF. Čas, organizace, pomůcky, zadání, postup a metodické tipy jsou doplněné návrhy pro praxi.${m.phase==='R'?' U reflexe je doplněné také využití a konkrétní příklad.':''}`;
 $('#detail-pdf').hidden=added;$('#detail-pdf').href=added?'#':'sources/'+m.source+'.pdf';
 const next={E:'U',U:'R',R:null}[m.phase];$('#next-phase').href=next?'#faze/'+next:'#';$('#next-phase').textContent=next?'Pokračovat: '+PHASES[next].name+' →':'Zpět k výběru fáze →';
 updateSaveButton();document.title=m.name+' | Metody do výuky';
}
function route(moveFocus=true) {
 if(!methods)return;
 const {path,params}=parseRoute();
 if(!path||path==='obsah') {current=null;context=null;showView('home-view');document.title='Metody do výuky | E–U–R';if(moveFocus)focusView('#obsah');return;}
 if(path.startsWith('faze/')||path==='ulozene') {const state=readListState(path,params);if(state){prepareList(state);if(moveFocus)focusView('#list-title');return;}}
 if(/^metoda\/\d+$/.test(path)){const m=methods.find(m=>m.id===Number(path.split('/')[1]));if(m){showDetail(m);if(moveFocus)focusView('#detail-title');return;}}
 current=null;context=null;showView('not-found');document.title='Metoda nenalezena | E–U–R';if(moveFocus)focusView('#obsah');
}
async function copyPrompt() {
 if(!current)return;const m=current;$('#copy-prompt').disabled=true;
 try {await navigator.clipboard.writeText(m.prompt);if(current?.id===m.id)$('#copy-status').textContent='Zadání zkopírováno.';}
 catch {if(current?.id===m.id){$('#copy-fallback').value=m.prompt;$('#copy-fallback').hidden=false;$('#copy-fallback').focus();$('#copy-fallback').select();$('#copy-status').textContent='Automatické kopírování není dostupné. Označený text zkopírujte pomocí Ctrl+C nebo nabídky kopírování.';}}
 finally {if(current?.id===m.id)$('#copy-prompt').disabled=false;}
}
async function load() {
 $('#load-error').hidden=true;
 try {const response=await fetch('methods.json');if(!response.ok)throw new Error('HTTP '+response.status);const data=await response.json();if(!Array.isArray(data)||!data.length||data.some(m=>!PHASES[m.phase]||!GROUPS[m.group]||!Array.isArray(m.steps)||!m.prompt||!m.watch||!Number.isFinite(m.minutes)))throw new Error('Invalid data');methods=data;
 saved=new Set([...saved].filter(id=>methods.some(m=>m.id===id)));persistSaved();
 for(const phase of Object.keys(PHASES))$('#count-'+phase).textContent=methods.filter(m=>m.phase===phase).length+' metod';
 route(false);
 }catch {$('#load-error').hidden=false;}
}
$('#search').addEventListener('input',changeFilters);$('#time-filter').addEventListener('change',changeFilters);$('#group-filter').addEventListener('change',changeFilters);
$('#filter-toggle').onclick=()=>setFiltersVisible(!filtersExpanded);$('#clear-filters').onclick=resetFilters;$('#empty-reset').onclick=resetFilters;
$('#detail-save').onclick=()=>{if(current)toggleSaved(current.id);};$('#print').onclick=()=>window.print();$('#copy-prompt').onclick=copyPrompt;$('#retry').onclick=load;
$('.skip').onclick=event=>{event.preventDefault();$('#obsah').focus();};
window.addEventListener('hashchange',()=>route());
window.addEventListener('storage',event=>{if(event.key==='eur-saved'){saved=readSaved();updateSavedCount();if(current)updateSaveButton();if(context?.saved)renderList();}});
updateSavedCount();load();
