// Teste rápido do login. Rode: npm run teste
import h from './api/[action].js';
import {db} from './api/_lib/db.js';
const call=async(action,body,cookie)=>{const res={setHeader(k,v){this.ck=v},status(c){this.s=c;return this},json(d){this.d=d;return this}};
 await h({query:{action},body,headers:{cookie:cookie||''}},res);return res};
let falhas=0;const t=(nome,ok,extra='')=>{console.log((ok?'OK     ':'FALHOU ')+nome+(ok?'':'  ->  '+extra));if(!ok)falhas++};
const u='teste_'+Date.now().toString(36).slice(-6);
const a=await call('register',{username:u,password:'1234'});
t('criar conta',a.s===200&&a.d.username===u,JSON.stringify(a.d));
if(a.s===500){console.log('\nO .env.local não foi lido ou está incompleto.');process.exit(1)}
const b=await call('register',{username:u.toUpperCase(),password:'1234'});
t('nome repetido e bloqueado (mesmo com maiúsculas)',b.s===400,JSON.stringify(b.d));
const c=await call('login',{username:u,password:'errada'});
t('senha errada e recusada',c.s===401,JSON.stringify(c.d));
const d=await call('login',{username:u,password:'1234'});
t('login com a senha certa',d.s===200&&!!d.ck,JSON.stringify(d.d));
const ck=(d.ck||'').split(';')[0];
const e=await call('me',{},ck);t('sessao (cookie) funciona',e.s===200&&e.d.username===u,JSON.stringify(e.d));
const f=await call('me',{});t('sem cookie e barrado',f.s===401);
const g=await call('register',{username:'a b',password:'1234'});t('nome invalido e recusado',g.s===400);
await db.from('users').delete().eq('username',u);console.log('\n(usuario de teste apagado do banco)');
console.log(falhas?`${falhas} teste(s) falharam`:'LOGIN OK');process.exit(falhas?1:0);
