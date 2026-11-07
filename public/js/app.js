import { deck, spreads } from './deck.js';
const $ = (s) => document.querySelector(s);
const toast = (msg) => { const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),3300); };
let count=3, selected=[], currentAnalysis='', voiceUrl=null, voiceAudio=null, deckFilter='all', imageMap=new Map();
const fallbackImage = (card) => {
  const majorNum=Number(card.id.slice(1));
  if(card.id.startsWith('m')) return `https://petaloverflow.github.io/tarot-api/cards/ar${String(majorNum).padStart(2,'0')}.jpg`;
  const [suit,rank]=card.id.split('-').map(Number); const suitNames=['wands','cups','swords','pentacles'];
  const rankName=String(rank+1).padStart(2,'0');
  return `https://petaloverflow.github.io/tarot-api/cards/${suitNames[suit]}${rankName}.jpg`;
};
const getImage = (card) => imageMap.get(norm(card.imgName)) || fallbackImage(card);
function norm(s){return String(s||'').toLowerCase().replace(/the /g,'').replace(/[^a-z0-9]/g,'');}
async function loadImages(){
  try{
    const r=await fetch('https://petaloverflow.github.io/tarot-api/cards.json'); if(!r.ok) throw Error('deck api');
    const data=await r.json();
    for(const c of data){ if(c.name && c.image) imageMap.set(norm(c.name),c.image); }
  }catch(e){ console.warn('Using direct public-domain image paths',e); }
  renderDeck();
}
function renderDeck(){
  const q=norm($('#deckSearch').value); const list=deck.filter(c=>(deckFilter==='all'||(deckFilter==='major'?c.id.startsWith('m'):!c.id.startsWith('m')))&&(!q||norm(c.name+c.vi).includes(q)));
  $('#deckGrid').innerHTML=list.map(c=>`<article class="deck-item" data-id="${c.id}"><img loading="lazy" src="${getImage(c)}" alt="${c.vi} — ${c.name}" onerror="this.style.opacity='.25'"><strong>${c.vi}</strong><small>${c.name}</small></article>`).join('');
  $('#deckGrid').querySelectorAll('.deck-item').forEach(el=>el.addEventListener('click',()=>openCard(deck.find(c=>c.id===el.dataset.id))));
}
function openCard(c){$('#modalImage').src=getImage(c);$('#modalImage').alt=c.vi;$('#modalArcana').textContent=c.arcana;$('#modalTitle').textContent=`${c.vi} · ${c.name}`;$('#modalKeywords').textContent=`Từ khóa: ${c.keywords.join(' · ')}`;$('#cardModal').classList.remove('hidden');}
function pickCards(){const pool=[...deck];selected=[];for(let i=0;i<count;i++){const idx=Math.floor(Math.random()*pool.length);const card=pool.splice(idx,1)[0];selected.push({...card,reversed:Math.random()<.28,position:spreads[count][i]});} }
function renderDrawn(){ $('#drawnCards').innerHTML=selected.map((c,i)=>`<article class="drawn-card ${c.reversed?'reversed':''}" data-index="${i}"><img src="${getImage(c)}" alt="${c.vi}" onerror="this.style.opacity='.25'"><strong>${c.vi}</strong><small>${c.position} · ${c.reversed?'Đảo ngược':'Chính vị'}</small></article>`).join(''); $('#drawnCards').querySelectorAll('.drawn-card').forEach(el=>el.addEventListener('click',()=>openCard(selected[Number(el.dataset.index)]))); }
function formatMarkdown(md){
  const escaped=md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return escaped.split('\n').map(line=>{const s=line.trim();if(!s)return '';if(/^###\s/.test(s))return `<h3>${s.replace(/^###\s/,'')}</h3>`;if(/^##\s/.test(s))return `<h2>${s.replace(/^##\s/,'')}</h2>`;if(/^#\s/.test(s))return `<h2>${s.replace(/^#\s/,'')}</h2>`;if(/^[-*]\s/.test(s))return `<p>✧ ${s.replace(/^[-*]\s/,'')}</p>`;return `<p>${s.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</p>`;}).join('');
}
$('#draw').addEventListener('click',()=>{if(!$('#question').value.trim()){toast('Bạn hãy viết một câu hỏi trước khi rút bài nhé.');$('#question').focus();return;}pickCards();renderDrawn();$('#drawStage').classList.remove('hidden');$('#analysis').classList.add('hidden');$('#drawSub').textContent='Lật mở từng lá bài để khám phá câu chuyện của trải bài.';$('#drawStage').scrollIntoView({behavior:'smooth',block:'center'});});
$('#redraw').addEventListener('click',()=>{pickCards();renderDrawn();$('#analysis').classList.add('hidden');});
$('#analyze').addEventListener('click',async()=>{
  const btn=$('#analyze');btn.disabled=true;btn.textContent='Luna đang kết nối những thông điệp…';
  try{
    const r=await fetch('/api/reading',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:$('#question').value,topic:$('#topic').value,cards:selected.map(c=>({name:`${c.vi} (${c.name})`,position:c.position,reversed:c.reversed,keywords:c.keywords}))})});
    const data=await r.json();if(!r.ok)throw Error(data.error||'Không thể phân tích.');
    currentAnalysis=data.analysis;$('#analysisContent').innerHTML=formatMarkdown(currentAnalysis);$('#analysis').classList.remove('hidden');$('#analysis').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){toast(e.message);}finally{btn.disabled=false;btn.innerHTML='Luna luận giải trải bài <span>✧</span>';}
});
async function speak(){if(!currentAnalysis){toast('Hãy để Luna luận giải trải bài trước nhé.');return;}const btn=$('#speak');btn.disabled=true;btn.textContent='Đang tạo giọng đọc Luna…';$('#voiceStatus').textContent='Đang tạo bản đọc AI…';try{const r=await fetch('/api/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:currentAnalysis.slice(0,4100)})});if(!r.ok){const d=await r.json();throw Error(d.error||'Không tạo được giọng đọc.');}const blob=await r.blob();if(voiceUrl)URL.revokeObjectURL(voiceUrl);voiceUrl=URL.createObjectURL(blob);if(voiceAudio)voiceAudio.pause();voiceAudio=new Audio(voiceUrl);voiceAudio.onended=()=>{$('#voiceStatus').textContent='Luna đã đọc xong';btn.disabled=false;btn.innerHTML='▶ &nbsp; Nghe lại Luna';};voiceAudio.play();$('#voiceStatus').textContent='Luna đang đọc · Giọng AI';btn.innerHTML='♫ &nbsp; Đang phát…';}catch(e){toast(e.message);$('#voiceStatus').textContent='Chưa cấu hình giọng AI';btn.disabled=false;btn.innerHTML='▶ &nbsp; Nghe Luna đọc';}}
$('#speak').addEventListener('click',speak);$('#stopSpeak').addEventListener('click',()=>{if(voiceAudio)voiceAudio.pause();$('#voiceStatus').textContent='Đã dừng';$('#speak').disabled=false;$('#speak').innerHTML='▶ &nbsp; Nghe lại Luna';});
document.querySelectorAll('.spread-option').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.spread-option').forEach(x=>x.classList.remove('active'));b.classList.add('active');count=Number(b.dataset.count);}));
document.querySelectorAll('.deck-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.deck-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');deckFilter=b.dataset.filter;renderDeck();}));
$('#deckSearch').addEventListener('input',renderDeck);$('#modalClose').addEventListener('click',()=>$('#cardModal').classList.add('hidden'));$('.modal-backdrop').addEventListener('click',()=>$('#cardModal').classList.add('hidden'));$('.menu-toggle').addEventListener('click',()=>$('.nav nav').classList.toggle('open'));document.querySelectorAll('.nav nav a').forEach(a=>a.addEventListener('click',()=>$('.nav nav').classList.remove('open')));
const audio=new Audio('/assets/audio/celestial-ambient.mp3');audio.loop=true;audio.volume=.22;let musicOn=false;
const musicButton=document.createElement('button');musicButton.className='music-fab';musicButton.innerHTML='♫ <span>Nhạc nền</span>';musicButton.setAttribute('aria-label','Bật hoặc tắt nhạc nền');document.body.append(musicButton);musicButton.addEventListener('click',async()=>{try{if(!musicOn){await audio.play();musicOn=true;musicButton.classList.add('playing');musicButton.innerHTML='♫ <span>Đang phát</span>';}else{audio.pause();musicOn=false;musicButton.classList.remove('playing');musicButton.innerHTML='♫ <span>Nhạc nền</span>';}}catch(e){toast('Thiết bị chưa cho phép phát nhạc. Bạn thử chạm lại nhé.');}});
fetch('/api/status').then(r=>r.json()).then(s=>{if(s.voice)$('#voiceStatus').textContent='Giọng đọc AI đã sẵn sàng';if(!s.ai)toast('Để bật AI luận giải, hãy cấu hình OPENAI_API_KEY trong file .env.');}).catch(()=>{});
loadImages();
