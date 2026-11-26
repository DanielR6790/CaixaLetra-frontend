# Frontend: CaixaLetra e organização de ideias

Aplicação web (React + Vite) com duas partes: um catálogo pessoal de filmes, séries,
animes e jogos (notas, reviews, listas e organização por ano e mês) e um espaço de
organização de ideias com quadros infinitos (textos, imagens e conexões).

- **Backend:** https://github.com/SEU-USUARIO/catalogo-ideias-backend
- **Site publicado:** https://SEU-SITE.vercel.app
- **API publicada:** https://SEU-BACKEND.onrender.com

## Tecnologias
React 18, React Router, Vite, Supabase (login e envio de imagens), React Flow
(quadro infinito) e CSS puro com variáveis (tema escuro e claro).

## Rodar localmente
```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env  (depois preencha)
npm run dev              # http://localhost:5173
```
O backend precisa estar rodando (veja o repositório do backend).

## Variáveis de ambiente
Todas começam com `VITE_` e ficam **visíveis no navegador**. Use apenas a chave pública
`anon`, nunca chaves secretas.

| Variável | Exemplo |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | chave pública `anon` |
| `VITE_API_URL` | `https://SEU-BACKEND.onrender.com/api` |

## Testes
`npm test` roda os testes automáticos da lógica (datas, fuso horário, agrupamento por
ano e mês, filtros, validações, cores e setas do quadro).

## Publicação (Vercel)
Framework: Vite · Build: `npm run build` · Saída: `dist`. O arquivo `vercel.json` faz as
rotas internas funcionarem ao recarregar a página.