# Piatto

Site de receitas com IA. Front em HTML/CSS/JS, back-end em funções da Vercel, banco no Supabase.

```
public/            site (index.html, style.css, app.js, piatto.jpg)
api/[action].js    rotas: register, login, logout, me, generate, daily, favorites, fav-add, fav-del
api/_lib/          db.js (Supabase), auth.js (sessão), ai.js (IA)
supabase/schema.sql  tabelas
.env.local         chaves (NÃO vai pro GitHub)
```

## Rodar local
1. Supabase: crie o projeto e rode `supabase/schema.sql` no SQL Editor.
2. Preencha o `.env.local` (SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, AI_API_KEY).
3. `npm install` e depois `npm start` (abre em http://localhost:3000).

## Deploy
Suba para o GitHub, importe na Vercel e copie as mesmas variáveis em Settings > Environment Variables.

## Premium e contas de demonstração
Rode no Supabase, nesta ordem: `supabase/schema.sql`, `ingredientes.sql`, `02-uso.sql`, `03-premium.sql`.
O `03-premium.sql` cria as contas `demo_premium` e `demo_gratis` (senha das duas: `demo1234`). Apague antes de abrir ao público.
Para tornar alguém premium: `update users set plano = 'premium' where username = 'fulano';`
