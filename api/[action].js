import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {db,configured} from './_lib/db.js';
import {ck,who,pub,limited} from './_lib/auth.js';
import {gen,askJSON} from './_lib/ai.js';
import {perfil,meta,prompt as dietPrompt,validDiet} from './_lib/diet.js';
const S=process.env.JWT_SECRET;
let IC=null,IT=0;
const CATS=['Qualquer','Café da manhã','Almoço / jantar','Lanche','Sobremesa'],LIM={generate:{gratis:20,premium:60},diet:{gratis:0,premium:5}};
const over=async(id,acao,pro)=>{const{count}=await db.from('usage_log').select('id',{count:'exact',head:true}).eq('user_id',id).eq('acao',acao).gte('criado_em',new Date(Date.now()-36e5).toISOString());return(count||0)>=LIM[acao][pro?'premium':'gratis']};
const all=async(t,c)=>{let o=[];for(let i=0;;i+=1000){const{data,error}=await db.from(t).select(c).order('id').range(i,i+999);if(error)throw error;o=o.concat(data);if(data.length<1000)return o}};
export default async function h(req,res){
 const a=req.query.action,b=req.body||{},id=who(req),o=(c,d)=>res.status(c).json(d);
 try{
 if(!configured||!S)return o(500,{erro:'Servidor sem configuração. Preencha o .env.local.'});
 if(a==='register'||a==='login'){
  if(limited(req))return o(429,{erro:'Muitas tentativas. Aguarde alguns minutos.'});
  const u=String(b.username||'').trim().toLowerCase(),p=String(b.password||'');
  if(!/^[a-z0-9_]{3,20}$/.test(u)||p.length<4||p.length>72)return o(400,{erro:'Usuário: 3 a 20 letras, números ou _. Senha: de 4 a 72 caracteres.'});
  let row;
  if(a==='register'){const{data,error}=await db.from('users').insert({username:u,password_hash:await bcrypt.hash(p,10)}).select().single();if(error)return o(400,{erro:'Esse usuário já existe. Escolha outro.'});row=data}
  else{const{data}=await db.from('users').select().eq('username',u).maybeSingle();if(!data||!(await bcrypt.compare(p,data.password_hash)))return o(401,{erro:'Usuário ou senha incorretos.'});row=data}
  res.setHeader('Set-Cookie',ck(req,jwt.sign({id:row.id},S,{expiresIn:'30d'}),2592000));return o(200,pub(row))}
 if(a==='logout'){res.setHeader('Set-Cookie',ck(req,'',0));return o(200,{})}
 if(!id)return o(401,{erro:'Faça login.'});
 const{data:U}=await db.from('users').select('username,plano').eq('id',id).maybeSingle();if(!U)return o(401,{});
 const pro=U.plano==='premium',sp=r=>{if(pro||!r)return r;const{calorias,proteina_g,carbo_g,gordura_g,...x}=r;return x},VIP=()=>o(403,{erro:'Recurso exclusivo do Premium.'});
 if(a==='me')return o(200,pub(U));
 if(a==='diet-get'){if(!pro)return VIP();const{data}=await db.from('diets').select('id,perfil,meta_kcal,plano,criado_em').eq('user_id',id).order('criado_em',{ascending:false}).limit(1).maybeSingle();return o(200,data||null)}
 if(a==='diet-generate'){if(!pro)return VIP();
  const p=perfil(b);if(p.erro)return o(400,{erro:p.erro});
  if(await over(id,'diet',pro))return o(429,{erro:'Limite de dietas por hora atingido. Tente mais tarde.'});
  const m=meta(p),{data:f}=await db.from('favorites').select('titulo').eq('user_id',id).order('criado_em',{ascending:false}).limit(15);
  const plano=await askJSON(dietPrompt(p,m,(f||[]).map(x=>x.titulo)),validDiet,6000);
  const{data}=await db.from('diets').insert({user_id:id,perfil:p,meta_kcal:m.kcal,plano}).select('id,perfil,meta_kcal,plano,criado_em').single();
  await db.from('usage_log').insert({user_id:id,acao:'diet'});return o(200,data)}
 if(a==='ingredients'){
  if(!IC||Date.now()-IT>6e5){const[I,A]=await Promise.all([all('ingredients','id,nome'),all('ingredient_aliases','ingredient_id,apelido')]);const m=new Map(I.map(x=>[x.id,{n:x.nome,a:[]}]));A.forEach(x=>m.get(x.ingredient_id)?.a.push(x.apelido));IC=[...m.values()];IT=Date.now()}
  return o(200,IC)}
 if(a==='ingredient-request'){const t=String(b.texto||'').trim().slice(0,60);if(t.length<2)return o(400,{erro:'Texto muito curto.'});await db.from('ingredient_requests').insert({texto:t,user_id:id});return o(200,{})}
 if(a==='generate'){
  const pedido=(Array.isArray(b.ingredientes)?b.ingredientes:[]).slice(0,20).map(x=>String(x).slice(0,60));
  if(!pedido.length)return o(400,{erro:'Adicione pelo menos um ingrediente.'});
  const{data:ok}=await db.from('ingredients').select('nome').in('nome',pedido);
  const ing=(ok||[]).map(x=>x.nome);
  if(!ing.length)return o(400,{erro:'Escolha os ingredientes pela lista de sugestões.'});
  if(await over(id,'generate',pro))return o(429,{erro:'Você atingiu o limite de receitas por hora. Tente de novo mais tarde.'});
  const cat=CATS.includes(b.categoria)?b.categoria:'Qualquer';
  const r=await gen(`Crie 4 receitas diferentes${cat!=='Qualquer'?' da categoria "'+cat+'"':''} usando principalmente estes ingredientes: ${ing.join(', ')}. ${b.outros?'Pode usar básicos de despensa (sal, óleo, temperos, água).':'Use apenas esses ingredientes, além de sal e água.'}`);
  await db.from('usage_log').insert({user_id:id,acao:'generate'});
  return o(200,r.map(x=>sp(cat!=='Qualquer'?{...x,categoria:cat}:x)))}
 if(a==='daily'){
  const dia=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
  const{data}=await db.from('daily_recipes').select('receita').eq('user_id',id).eq('dia',dia).maybeSingle();
  if(data)return o(200,sp(data.receita));
  const temas=['cozinha italiana','cozinha brasileira regional','prato rápido de 15 minutos','comfort food','algo leve e fresco','sobremesa simples','café da manhã diferente','cozinha asiática simples'];
  const r=(await gen(`Crie 1 receita aleatória surpreendente, tema: ${temas[Math.floor(Math.random()*temas.length)]}.`))[0];
  await db.from('daily_recipes').upsert({user_id:id,dia,receita:r});return o(200,sp(r))}
 if(a==='favorites'){const{data}=await db.from('favorites').select('id,titulo,receita').eq('user_id',id).order('criado_em',{ascending:false});return o(200,data.map(x=>({...x,receita:sp(x.receita)})))}
 if(a==='fav-add'){const r=b.receita||{};const{data}=await db.from('favorites').insert({user_id:id,titulo:String(r.nome||'').slice(0,100),categoria:r.categoria,receita:r}).select('id,titulo,receita').single();return o(200,data)}
 if(a==='fav-del'){await db.from('favorites').delete().eq('id',b.id).eq('user_id',id);return o(200,{})}
 o(404,{erro:'?'})}catch(e){console.error('ERRO:',e.message);o(500,{erro:e.config?'A IA ainda não foi configurada (AI_API_KEY).':e.status?'Não foi possível falar com a IA agora. Tente em instantes.':'Algo deu errado. Tente de novo.'})}}
