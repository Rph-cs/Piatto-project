import jwt from 'jsonwebtoken';
export const ck=(r,t,a)=>`s=${t}; HttpOnly;${r.headers['x-forwarded-proto']==='https'?' Secure;':''} SameSite=Lax; Path=/; Max-Age=${a}`;
export const who=r=>{const m=(r.headers.cookie||'').match(/(?:^|; )s=([^;]+)/);try{return m&&jwt.verify(m[1],process.env.JWT_SECRET).id}catch{return null}};
export const pub=u=>({username:u.username});
const hits=new Map();
export const limited=r=>{const ip=(r.headers['x-forwarded-for']||'').split(',')[0]||'local',n=Date.now(),h=(hits.get(ip)||[]).filter(t=>n-t<6e5);h.push(n);hits.set(ip,h);return h.length>20};
