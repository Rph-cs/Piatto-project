const call=async(url,o)=>{const r=await fetch(url,{...o,signal:AbortSignal.timeout(60000)});const j=await r.json().catch(()=>({}));
 if(!r.ok)throw Object.assign(new Error(`IA respondeu ${r.status}: ${j.error?.message||JSON.stringify(j).slice(0,200)}`),{status:r.status});return j};
async function ai(prompt,max=4000){
 const k=process.env.AI_API_KEY,p=(k||'').startsWith('gsk_')?'groq':(process.env.AI_PROVIDER||'anthropic'),m=process.env.AI_MODEL,J={'content-type':'application/json'};
 if(!k||k.startsWith('COLE_'))throw Object.assign(new Error('AI_API_KEY não foi preenchida no .env.local'),{config:true});
 const oai=async(url,mod,extra={})=>(await call(url,{method:'POST',headers:{...J,Authorization:'Bearer '+k},body:JSON.stringify({model:mod,messages:[{role:'user',content:prompt}],...extra})})).choices[0].message.content||'';
 if(p==='groq'){const mod=m||'openai/gpt-oss-120b';return oai('https://api.groq.com/openai/v1/chat/completions',mod,{max_completion_tokens:max+2000,...(/gpt-oss/.test(mod)?{reasoning_effort:'low'}:{})})}
 if(p==='openai')return oai('https://api.openai.com/v1/chat/completions',m||'gpt-4o-mini');
 if(p==='gemini')return(await call(`https://generativelanguage.googleapis.com/v1beta/models/${m||'gemini-2.0-flash'}:generateContent`,{method:'POST',headers:{...J,'x-goog-api-key':k},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})})).candidates[0].content.parts[0].text;
 return(await call('https://api.anthropic.com/v1/messages',{method:'POST',headers:{...J,'x-api-key':k,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:m||'claude-haiku-5-5',max_tokens:max,messages:[{role:'user',content:prompt}]})})).content[0].text}
// Pede JSON à IA, valida com ok(json) e tenta de novo uma vez se vier torto
export async function askJSON(q,ok,max){let e;
 for(let i=0;i<2;i++){try{const t=await ai(q,max),r=ok(JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1)));if(r)return r;e=new Error('A IA devolveu um formato incompleto')}catch(x){if(x.status||x.config)throw x;e=x}}
 throw e}
const FMT='Responda SOMENTE com JSON, sem texto fora dele, no formato {"receitas":[{"nome":"","categoria":"Café da manhã|Almoço / jantar|Lanche|Sobremesa","tempo_min":0,"dificuldade":"Fácil|Média|Difícil","porcoes":0,"descricao":"uma frase","calorias":0,"proteina_g":0,"carbo_g":0,"gordura_g":0,"ingredientes":["quantidade + item"],"passos":["um passo por item"]}]}. Calorias e macros são estimativas POR PORÇÃO. Português do Brasil, receitas caseiras e realistas, com quantidade em todos os ingredientes.';
const S=(x,n)=>String(x??'').trim().slice(0,n),L=(x,n,m)=>(Array.isArray(x)?x:[]).map(i=>S(i,m)).filter(Boolean).slice(0,n),N=x=>Math.round(+x)>0?Math.round(+x):null;
const catOf=c=>{c=String(c||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return c.includes('caf')?'Café da manhã':c.includes('sobrem')||c.includes('doce')?'Sobremesa':c.includes('lanch')?'Lanche':'Almoço / jantar'};
const clean=r=>({nome:S(r?.nome,80),categoria:catOf(r?.categoria),tempo_min:Math.round(+r?.tempo_min)||30,dificuldade:['Fácil','Média','Difícil'].find(d=>d.toLowerCase()===String(r?.dificuldade).trim().toLowerCase())||'Média',porcoes:Math.round(+r?.porcoes)||2,descricao:S(r?.descricao,200),calorias:N(r?.calorias),proteina_g:N(r?.proteina_g),carbo_g:N(r?.carbo_g),gordura_g:N(r?.gordura_g),ingredientes:L(r?.ingredientes,40,120),passos:L(r?.passos,30,400)});
export const gen=q=>askJSON(q+' '+FMT,j=>{const rs=(Array.isArray(j?.receitas)?j.receitas:[]).map(clean).filter(r=>r.nome&&r.ingredientes.length&&r.passos.length);return rs.length&&rs},4000);
