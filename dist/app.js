'use strict';
const $ = selector => document.querySelector(selector);
const phases = {E:'Evokace',U:'Uvědomění si významu',R:'Reflexe'};
let methods = [], phase = 'all', onlySaved = false, current = null;
let saved;
try { saved = new Set(JSON.parse(localStorage.getItem('eur-saved') || '[]').filter(Number.isInteger)); } catch { saved = new Set(); }
const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('cs');
function saveState() { try { localStorage.setItem('eur-saved', JSON.stringify([...saved])); } catch {} $('#saved-count').textContent=saved.size; }
function element(tag, className, text) { const el=document.createElement(tag); if(className) el.className=className; if(text!==undefined) el.textContent=text; return el; }
function toggleSave(id) { saved.has(id)?saved.delete(id):saved.add(id); saveState(); render(); if(current) updateDetailSave(); }
function render() {
 const query=fold($('#search').value.trim());
 const filtered=methods.filter(m=>(phase==='all'||m.phase===phase)&&(!onlySaved||saved.has(m.id))&&fold([m.name,m.description,m.use,m.example,...m.steps].join(' ')).includes(query));
 $('#cards').replaceChildren();
 $('#results').textContent=`Zobrazeno ${filtered.length} z ${methods.length} metod${onlySaved?' · uložené metody':''}`;
 $('#empty').hidden=filtered.length>0;
 for(const m of filtered) {
  const card=element('article','card');
  const top=element('div','card-top');
  top.append(element('span',`tag tag-${m.phase}`,phases[m.phase]));
  const save=element('button','bookmark',saved.has(m.id)?'♥':'♡');save.setAttribute('aria-label',`${saved.has(m.id)?'Odebrat z uložených':'Uložit'}: ${m.name}`);save.setAttribute('aria-pressed',saved.has(m.id));save.onclick=()=>toggleSave(m.id);top.append(save);
  const example=element('div','card-example');example.append(element('strong','','VYZKOUŠEJTE V HODINĚ'),document.createTextNode(m.example));
  const bottom=element('div','card-bottom');bottom.append(element('span','',m.phase==='E'?'Probudit zvědavost':m.phase==='U'?'Objevovat souvislosti':'Ohlédnout se za učením'));
  const more=element('button','','Detail metody ↗');more.setAttribute('aria-label',`Detail metody ${m.name}`);more.onclick=()=>openDetail(m);bottom.append(more);
  card.append(top,element('h3','',m.name),element('p','card-description',m.description),example,bottom);$('#cards').append(card);
 }
 $('#saved-filter').setAttribute('aria-pressed',onlySaved);$('#saved-filter').textContent=onlySaved?'♥ Jen uložené':'♡ Jen uložené';
 document.querySelectorAll('[data-phase]').forEach(b=>{b.classList.toggle('active',b.dataset.phase===phase);b.setAttribute('aria-pressed',b.dataset.phase===phase);});
}
function updateDetailSave() { $('#detail-save').textContent=saved.has(current.id)?'♥ Odebrat z uložených':'♡ Uložit metodu';$('#detail-save').setAttribute('aria-pressed',saved.has(current.id)); }
function openDetail(m) {
 current=m;$('#detail-phase').className=`tag tag-${m.phase}`;$('#detail-phase').textContent=phases[m.phase];
 const content=$('#detail-content');content.replaceChildren();const title=element('h2','',m.name);title.id='detail-title';
 content.append(title,element('p','',m.description),element('h3','','Kdy se hodí'),element('p','',m.use),element('h3','','Příklad do výuky'),element('p','detail-example',m.example),element('h3','','Jak na to · návrh pro praxi'));
 const steps=element('ol');m.steps.forEach(step=>steps.append(element('li','',step)));content.append(steps);
 content.append(element('p','detail-source',`Zdroj: ${m.phase==='E'?'Tahák – metody evokace':m.phase==='U'?'Metody uvědomění – podrobné anotace':'REFLEXE – metody'}. Popis a zařazení vycházejí z PDF. ${m.phase==='R'?'Využití a příklad jsou doplněné náměty. ':''}Postup je doplněný návrh pro praxi.`));
 updateDetailSave();$('#detail').showModal();$('#detail').scrollTop=0;document.body.classList.add('modal-open');
}
async function load() { $('#error').hidden=true;try { const response=await fetch('methods.json');if(!response.ok) throw new Error('HTTP '+response.status);methods=await response.json();render(); } catch { $('#results').textContent='Načtení se nezdařilo';$('#error').hidden=false;$('#empty').hidden=true; } }
$('#search').addEventListener('input',render);
document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>{phase=b.dataset.phase;render();});
$('#saved-filter').onclick=()=>{onlySaved=!onlySaved;render();};
$('#saved-nav').onclick=()=>{onlySaved=true;phase='all';$('#search').value='';render();$('#katalog').scrollIntoView({behavior:'smooth'});};
$('#reset').onclick=()=>{phase='all';onlySaved=false;$('#search').value='';render();};
$('#retry').onclick=load;
$('#close-detail').onclick=()=>$('#detail').close();
$('#detail').addEventListener('close',()=>{document.body.classList.remove('modal-open');current=null;});
$('#detail').addEventListener('click',event=>{if(event.target===$('#detail')) {const r=$('#detail').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) $('#detail').close();}});
$('#detail-save').onclick=()=>toggleSave(current.id);
$('#print').onclick=()=>window.print();
saveState();load();
