// CATEGORIAS DO CATÁLOGO.
// O "slug" precisa ser igual ao da tabela "categories" do banco de dados.
// Para mudar nomes e textos do site, edite aqui.
export const categories = [
  {
    slug: 'filmes',
    name: 'Filmes',
    icon: 'film',
    description: 'Os filmes que você assistiu e os que ainda quer ver.',
    futureTitle: 'Lista para assistir',
    futureVerb: 'assistir',
  },
  {
    slug: 'series',
    name: 'Séries',
    icon: 'tv',
    description: 'Acompanhe, avalie e organize suas séries.',
    futureTitle: 'Lista para assistir',
    futureVerb: 'assistir',
  },
  {
    slug: 'animes',
    name: 'Animes',
    icon: 'sparkles',
    description: 'Seu histórico e sua lista de animes.',
    futureTitle: 'Lista para assistir',
    futureVerb: 'assistir',
  },
  {
    slug: 'jogos',
    name: 'Jogos',
    icon: 'gamepad',
    description: 'Os jogos que você zerou e os que estão na fila.',
    futureTitle: 'Lista para jogar',
    futureVerb: 'jogar',
  },
  {
    slug: 'outros',
    name: 'Outros',
    icon: 'grid',
    description: 'Livros, quadrinhos e qualquer outra mídia.',
    futureTitle: 'Lista para consumir',
    futureVerb: 'consumir',
  },
];

export const getCategoryBySlug = (slug) => categories.find((item) => item.slug === slug) ?? null;