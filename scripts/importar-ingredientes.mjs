// Lê data/ingredientes.txt e grava no Supabase. Rode: npm run ingredientes
// Para só conferir sem gravar: npm run ingredientes -- --dry
import fs from 'fs';
import {createClient} from '@supabase/supabase-js';
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const ok=a=>a.split(' ').length<=4&&!/ (para|com|sem) /.test(' '+norm(a)+' ');
const items=new Map();let cat='Outros';
for(const raw of fs.readFileSync('data/ingredientes.txt','utf8').split(/\r?\n/)){
  const l=raw.trim();if(!l||l.startsWith('##'))continue;
  if(l.startsWith('# ')){cat=l.slice(2).trim();continue}
  const [nome,al='',flag='']=l.split('|'),n=nome.trim(),k=norm(n);if(!n)continue;
  const it=items.get(k)||{nome:n,nome_busca:k,categoria:cat,basico:false,aliases:new Map()};
  if(flag.trim()==='b')it.basico=true;
  for(const a of al.split(',').map(x=>x.trim()).filter(Boolean)){const ak=norm(a);if(ak!==k&&ok(a)&&it.aliases.size<10)it.aliases.set(ak,a)}
  items.set(k,it);
}
const list=[...items.values()],nAl=list.reduce((s,i)=>s+i.aliases.size,0);
console.log(`${list.length} ingredientes, ${nAl} apelidos, ${new Set(list.map(i=>i.categoria)).size} categorias`);
if(process.argv.includes('--dry'))process.exit(0);
if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_KEY){console.log('Faltam SUPABASE_URL e SUPABASE_SERVICE_KEY no .env.local');process.exit(1)}
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY);
const chunk=(a,n)=>Array.from({length:Math.ceil(a.length/n)},(_,i)=>a.slice(i*n,i*n+n));
const ids=new Map();
for(const c of chunk(list,400)){
  const {data,error}=await db.from('ingredients').upsert(c.map(({nome,nome_busca,categoria,basico})=>({nome,nome_busca,categoria,basico})),{onConflict:'nome'}).select('id,nome');
  if(error){console.log('Erro nos ingredientes:',error.message);process.exit(1)}
  data.forEach(r=>ids.set(r.nome,r.id));
}
const rows=list.flatMap(i=>[...i.aliases].map(([ab,a])=>({ingredient_id:ids.get(i.nome),apelido:a,apelido_busca:ab})));
for(const c of chunk(rows,1000)){
  const {error}=await db.from('ingredient_aliases').upsert(c,{onConflict:'ingredient_id,apelido_busca',ignoreDuplicates:true});
  if(error){console.log('Erro nos apelidos:',error.message);process.exit(1)}
}
console.log('Importação concluída.');
