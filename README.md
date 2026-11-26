# Backend: CaixaLetra e organização de ideias

API REST (Node.js + Express) de uma plataforma com duas partes: um catálogo pessoal de
filmes, séries, animes e jogos (notas, reviews e listas) e um espaço de organização de
ideias com quadros infinitos.

- **Frontend:** https://github.com/DanielR6790/CaixaLetra-frontend
- **Site publicado:** https://SEU-SITE.vercel.app
- **API publicada:** https://SEU-BACKEND.onrender.com (teste: `/api/health`)

> A API roda no plano gratuito do Render: depois de 15 minutos sem uso ela "dorme", e a
> primeira requisição leva cerca de 1 minuto.

## Tecnologias
Node.js 20+, Express, Supabase (PostgreSQL, Auth e Storage), Zod (validação), Helmet,
CORS e limite de requisições. Busca em APIs externas: Cinemeta (filmes e séries),
AniList (animes) e IGDB (jogos).

## Como funciona a segurança
- O login é feito no frontend com o Supabase Auth. Esta API valida o token em cada rota
  privada e acessa o banco **em nome do usuário**, então o RLS do banco protege os dados
  de cada pessoa.
- As chaves privadas (IGDB) ficam só nas variáveis de ambiente deste serviço.
- `database/hardening.sql` limita tamanhos e quantidades diretamente no banco.

## Rodar localmente
```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env  (depois preencha)
npm run dev              # http://localhost:3001
```

## Banco de dados (Supabase)
Execute no SQL Editor, nesta ordem: `database/schema.sql`, `database/policies.sql`,
`database/storage.sql` e `database/hardening.sql`.

## Variáveis de ambiente
Veja `.env.example`: `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` e `NODE_ENV`.

## Testes de segurança
`npm run check:security` usa duas contas de teste (variáveis `TEST_A_*` e `TEST_B_*`) e
confere que uma conta não acessa os dados da outra.

## Publicação (Render)
Build: `npm install` · Start: `npm start` · Health check: `/api/health`.
