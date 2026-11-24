// Servidor local simples (sem Vercel). Rode: npm start
import http from 'http';import fs from 'fs';import path from 'path';
import h from './api/[action].js';
const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url.replace(/^\/+/,'/'),'http://x');
 if(u.pathname.startsWith('/api/')){
  let b='';for await(const c of req)b+=c;
  req.query={action:u.pathname.slice(5)};try{req.body=b?JSON.parse(b):{}}catch{req.body={}}
  res.status=c=>{res.statusCode=c;return res};
  res.json=d=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(d))};
  return h(req,res);
 }
 const f=path.join('public',u.pathname==='/'?'index.html':path.normalize(u.pathname));
 fs.readFile(f,(e,d)=>{if(e){res.statusCode=404;return res.end('404')}res.setHeader('Content-Type',T[path.extname(f)]||'application/octet-stream');res.end(d)})
}catch(e){console.error('ERRO:',e.message);if(!res.headersSent)res.statusCode=400;res.end('erro')}}).listen(3000,()=>console.log('Piatto rodando em http://localhost:3000'));
