let U=null;
const IMG={cafe:'/img/cafe.svg',almoco:'/img/almoco.svg',lanche:'/img/lanche.svg',sobremesa:'/img/sobremesa.svg'},LBL={cafe:'Café da manhã',almoco:'Almoço / jantar',lanche:'Lanche',sobremesa:'Sobremesa'};
const catKey=c=>{c=String(c||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return c.includes('caf')?'cafe':c.includes('sobrem')||c.includes('doce')?'sobremesa':c.includes('lanch')?'lanche':'almoco'};
const pic=(r,x='')=>{const k=catKey(r.categoria);return `<div class="ph${x}"><img src="${IMG[k]}" alt="" loading="lazy"><span>${LBL[k]}</span></div>`};
const SK='<div class="grid">'+'<div class="rc sk"></div>'.repeat(4)+'</div>';
const $=s=>document.querySelector(s),api=async(a,b)=>{let r,d={};try{r=await fetch('/api/'+a,{method:b?'POST':'GET',headers:{'Content-Type':'application/json'},body:b&&JSON.stringify(b)});d=await r.json()}catch{}if(r&&r.status===401&&!['login','register','me'].includes(a))return location.reload();if(!r||!r.ok)throw d.erro?d:{erro:'Servidor indisponível. Tente novamente.'};return d};
const CATS=['Qualquer','Café da manhã','Almoço / jantar','Lanche','Sobremesa'];
let ing=[],cat='Qualquer',favs=[],list=[],cur=null,daily=null;
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function view(v){document.querySelectorAll('.view').forEach(e=>e.classList.toggle('hide',e.id!==v));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));if(v==='favs')showFavs()}
const card=(r,i)=>`<button class="rc" data-i="${i}">${pic(r)}<div class="rb"><h4>${esc(r.nome)}</h4><div>${esc(r.descricao)}</div><div class="meta">${esc(r.tempo_min)} min · ${esc(r.dificuldade)}${r.calorias?' · '+esc(r.calorias)+' kcal':''}</div></div></button>`;
const isFav=r=>favs.find(f=>f.titulo===r.nome);
function open(r){cur=r;$('#mbody').innerHTML=`${pic(r,' big')}<h2>${esc(r.nome)}</h2><p class="muted">${esc(r.descricao)}</p><div class="pills"><span>${esc(r.tempo_min)} min</span><span>${esc(r.dificuldade)}</span><span>${esc(r.porcoes)} ${r.porcoes==1?'porção':'porções'}</span>${r.calorias?`<span>${esc(r.calorias)} kcal por porção (aprox.)</span>`:''}${r.proteina_g?`<span>P ${esc(r.proteina_g)}g · C ${esc(r.carbo_g)}g · G ${esc(r.gordura_g)}g</span>`:''}</div>${!r.calorias&&!(U&&U.plano==='premium')?'<button class="link" data-up>Ver as calorias com o Premium</button>':''}<h3>Ingredientes</h3><ul>${(r.ingredientes||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3>Modo de preparo</h3><ol>${(r.passos||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;$('#mstar').textContent=isFav(r)?'Favorita':'Favoritar';$('#modal').classList.remove('hide')}
function chips(){$('#chips').innerHTML=ing.map((x,i)=>`<button class="chip" data-r="${i}" aria-label="Remover ${esc(x)}">${esc(x)} ×</button>`).join('');$('#cats').innerHTML=CATS.map(c=>`<button class="chip ${c===cat?'on':''}" data-c="${c}">${c}</button>`).join('')}
let ING=[],hi=-1,shown=[];
const nz=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
async function loadIng(){try{ING=(await api('ingredients')).map(x=>({n:x.n,nb:nz(x.n),a:x.a.map(t=>({t,b:nz(t)}))}))}catch{}}
function search(q){q=nz(q);if(!q)return[];const q2=q.length>3&&q.endsWith('s')?q.slice(0,-1):q,r=[];
 const t=b=>b.startsWith(q)||b.startsWith(q2)?2:b.includes(' '+q)||b.includes(' '+q2)?1:0;
 for(const it of ING){if(ing.includes(it.n))continue;let s=t(it.nb),via='';if(!s)for(const a of it.a){const k=t(a.b);if(k>s){s=k;via=a.t}}if(s)r.push({n:it.n,s,via})}
 return r.sort((x,y)=>y.s-x.s||x.n.length-y.n.length).slice(0,8)}
function sug(){const q=$('#ing').value.trim(),box=$('#sug');shown=search(q);hi=shown.length?0:-1;
 if(!q){box.classList.add('hide');return}
 box.innerHTML=shown.map((x,i)=>`<button class="sg ${i===hi?'on':''}" data-n="${esc(x.n)}"><span>${esc(x.n)}</span>${x.via?`<small>${esc(x.via)}</small>`:''}</button>`).join('')+(shown.length?'':`<button class="sg req" data-q="${esc(q)}">Não encontrei "${esc(q)}". Pedir para adicionar</button>`);
 box.classList.remove('hide')}
function pick(n){if(n&&!ing.includes(n)&&ing.length<20)ing.push(n);$('#ing').value='';$('#sug').classList.add('hide');chips();$('#ing').focus()}
async function showFavs(){favs=await api('favorites');list=favs.map(f=>f.receita);$('#favlist').innerHTML=favs.length?`<div class="grid">${list.map(card).join('')}</div>`:'<p class="muted">Nenhuma favorita ainda. Abra uma receita e toque na estrela.</p>'}
async function enter(u){$('#auth').classList.add('hide');$('#app').classList.remove('hide');U=u;chips();view('home');loadIng();setPlan();favs=await api('favorites').catch(()=>[]);
 try{daily=await api('daily');$('#daily').className='';$('#daily').innerHTML=`${pic(daily)}<h4>${esc(daily.nome)}</h4><p>${esc(daily.descricao)}</p><button class="btn" id="dopen">Ver receita</button>`;$('#dopen').onclick=()=>open(daily)}catch{$('#daily').textContent='Não foi possível carregar agora.'}}
async function auth(a){const L=$('#login'),R=$('#reg'),E=$('#aerr'),u=$('#u').value.trim().toLowerCase(),p=$('#p').value;E.textContent='';
 if(!/^[a-z0-9_]{3,20}$/.test(u)){E.textContent='Usuário: 3 a 20 letras, números ou _ (sem espaço e sem acento).';return}
 if(p.length<4){E.textContent='A senha precisa ter pelo menos 4 caracteres.';return}
 L.disabled=R.disabled=true;try{enter(await api(a,{username:u,password:p}))}catch(e){E.textContent=e.erro||'Erro.'}L.disabled=R.disabled=false}
$('#login').onclick=()=>auth('login');$('#u').onkeydown=$('#p').onkeydown=e=>{if(e.key==='Enter')auth('login')};$('#reg').onclick=()=>auth('register');
$('#ing').addEventListener('input',sug);$('#ing').addEventListener('blur',()=>setTimeout(()=>$('#sug').classList.add('hide'),150));
$('#ing').addEventListener('keydown',e=>{const b=$('#sug');if(b.classList.contains('hide')||!shown.length)return;
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();hi=(hi+(e.key==='ArrowDown'?1:-1)+shown.length)%shown.length;[...b.children].forEach((c,i)=>c.classList.toggle('on',i===hi))}
 else if(e.key==='Enter'){e.preventDefault();pick(shown[hi].n)}else if(e.key==='Escape')b.classList.add('hide')});
$('#sug').addEventListener('mousedown',async e=>{const b=e.target.closest('.sg');if(!b)return;e.preventDefault();
 if(b.dataset.n)return pick(b.dataset.n);
 try{await api('ingredient-request',{texto:b.dataset.q});toast('Pedido enviado. Obrigado!')}catch{toast('Não foi possível enviar.')}$('#ing').value='';$('#sug').classList.add('hide')});
$('#chips').onclick=e=>{const b=e.target.closest('[data-r]');if(b){ing.splice(b.dataset.r,1);chips()}};
$('#cats').onclick=e=>{const b=e.target.closest('[data-c]');if(b){cat=b.dataset.c;chips()}};
$('#go').onclick=async()=>{$('#gerr').textContent='';if(!ing.length){$('#gerr').textContent='Adicione pelo menos um ingrediente.';return}
 $('#go').disabled=true;$('#go').textContent='Montando receitas...';
 $('#res').innerHTML=SK;$('#res').scrollIntoView({behavior:'smooth'});try{list=await api('generate',{ingredientes:ing,categoria:cat,outros:$('#outros').checked});$('#res').innerHTML=`<h2>Olha o que dá pra preparar</h2><div class="grid">${list.map(card).join('')}</div>`;$('#res').scrollIntoView({behavior:'smooth'})}catch(e){$('#res').innerHTML='';$('#gerr').textContent=e.erro||'Erro ao gerar.'}
 $('#go').disabled=false;$('#go').textContent='Gerar receitas'};
document.addEventListener('click',e=>{const c=e.target.closest('.rc');if(c)open(list[c.dataset.i])});
$('#mx').onclick=()=>$('#modal').classList.add('hide');$('#modal').onclick=e=>{if(e.target.id==='modal')e.target.classList.add('hide')};
$('#mstar').onclick=async()=>{const f=isFav(cur);try{if(f){await api('fav-del',{id:f.id});favs=favs.filter(x=>x.id!==f.id);toast('Removida das favoritas')}else{favs.unshift(await api('fav-add',{receita:cur}));toast('Salva nas favoritas!')}$('#mstar').textContent=isFav(cur)?'Favorita':'Favoritar';if(!$('#favs').classList.contains('hide'))showFavs()}catch{toast('Erro ao salvar.')}};
document.querySelector('nav').onclick=e=>{const b=e.target.closest('[data-v]');if(b)view(b.dataset.v)};
$('#sub').onclick=()=>toast('O pagamento ainda não está ativo. Teste com a conta demo_premium.');
$('#out').onclick=async()=>{await api('logout',{});location.reload()};
api('me').then(enter).catch(()=>$('#auth').classList.remove('hide'));

const pro=()=>U&&U.plano==='premium',RES=['vegetariano','vegano','sem lactose','sem glúten','low carb'];
function setPlan(){$('#pitch').classList.toggle('hide',!!pro());$('#pro').classList.toggle('hide',!pro());if(pro())loadDiet()}
$('#d_res').innerHTML=RES.map(x=>`<button type="button" class="chip" data-x="${x}">${x[0].toUpperCase()+x.slice(1)}</button>`).join('');
$('#d_res').onclick=e=>{const b=e.target.closest('[data-x]');if(b)b.classList.toggle('on')};
$('#d_ref').innerHTML=[3,4,5,6].map(n=>`<option ${n===4?'selected':''}>${n}</option>`).join('');
document.addEventListener('click',e=>{if(e.target.closest('[data-up]')){$('#modal').classList.add('hide');view('premium')}});
function dietHTML(d){const p=d.plano;return `<div class="meta-box">Meta: ${esc(d.meta_kcal)} kcal por dia</div><div class="days">${p.dias.map(x=>`<div class="card day"><h4>${esc(x.dia)}</h4>${x.refeicoes.map(m=>`<div class="meal"><b>${esc(m.nome)}</b> <small>${esc(m.kcal)} kcal</small><ul>${m.itens.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}<p class="muted small">Total aproximado: ${esc(x.total_kcal)} kcal</p></div>`).join('')}</div>${p.dicas.length?`<h3 style="margin-top:22px">Dicas</h3><ul>${p.dicas.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}<p class="muted small">Estimativas aproximadas. Este cardápio não substitui o acompanhamento de nutricionista ou médico.</p>`}
function fillForm(p){const m={d_obj:p.objetivo,d_sex:p.sexo,d_idade:p.idade,d_peso:p.peso,d_alt:p.altura,d_atv:p.atividade,d_ref:p.refeicoes,d_alg:p.alergias,d_evi:p.evitar};for(const k in m)if(m[k]!=null)$('#'+k).value=m[k];document.querySelectorAll('#d_res .chip').forEach(c=>c.classList.toggle('on',(p.restricoes||[]).includes(c.dataset.x)))}
async function loadDiet(){try{const d=await api('diet-get');if(d){fillForm(d.perfil);$('#dres').innerHTML=dietHTML(d)}}catch{}}
$('#dgo').onclick=async()=>{const B=$('#dgo'),E=$('#derr');E.textContent='';B.disabled=true;B.textContent='Montando seu cardápio...';
 try{const d=await api('diet-generate',{objetivo:$('#d_obj').value,sexo:$('#d_sex').value,idade:$('#d_idade').value,peso:$('#d_peso').value,altura:$('#d_alt').value,atividade:$('#d_atv').value,refeicoes:$('#d_ref').value,restricoes:[...document.querySelectorAll('#d_res .on')].map(c=>c.dataset.x),alergias:$('#d_alg').value,evitar:$('#d_evi').value,saude:$('#d_sau').checked});$('#dres').innerHTML=dietHTML(d);$('#dres').scrollIntoView({behavior:'smooth'})}catch(e){E.textContent=e.erro||'Erro ao gerar a dieta.'}
 B.disabled=false;B.textContent='Gerar minha dieta'};

addEventListener('keydown',e=>{if(e.key==='Escape')$('#modal').classList.add('hide')});
addEventListener('offline',()=>toast('Você está sem internet.'));
let DP=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();DP=e;$('#inst').classList.remove('hide')});
$('#inst').onclick=async()=>{if(!DP)return;DP.prompt();await DP.userChoice;DP=null;$('#inst').classList.add('hide')};
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
