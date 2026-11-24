// Testa só a IA (token + provedor). Rode: npm run teste:ia
import {gen} from './api/_lib/ai.js';
console.log('Provedor:',process.env.AI_PROVIDER||'anthropic','| Modelo:',process.env.AI_MODEL||'(padrão)');
try{const r=await gen('Crie 1 receita simples usando: ovo, tomate, queijo mussarela.');
 console.log('\nOK, a IA respondeu:\n',r[0].nome,'-',r[0].tempo_min,'min,',r[0].dificuldade,'\n Ingredientes:',r[0].ingredientes.join('; '),'\n Passos:',r[0].passos.length)}
catch(e){console.log('\nFALHOU:',e.message);process.exit(1)}
