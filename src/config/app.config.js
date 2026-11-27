// =====================================================================
// IDENTIDADE DA PLATAFORMA
// Para mudar o nome, o logotipo ou as cores, edite SOMENTE este arquivo.
// =====================================================================
export const appConfig = {
  // Nome provisório. Aparece no título da aba, no login e no menu.
  name: 'CaixaLetra',
  tagline: 'Catálogo, avaliação e organização de ideais em um só lugar',

  // Logotipo: enquanto não houver imagem, usa-se este texto curto.
  logoText: 'CL',
  // Para usar uma imagem, coloque o arquivo em frontend/public e informe
  // o caminho aqui. Exemplo: '/logo.svg' 
  logoUrl: null,

  // Cores da marca (valem para o tema escuro e para o claro)
  colors: {
    accent: '#3ddc97', // botões e destaques
    accentHover: '#2fbf82', // botões ao passar o mouse
    accentText: '#04130c', // texto sobre o botão
  },
};

// Aplica o nome e as cores ao site. Chamada uma vez ao iniciar.
export function applyBrand() {
  document.title = appConfig.name;
  const style = document.documentElement.style;
  style.setProperty('--accent', appConfig.colors.accent);
  style.setProperty('--accent-hover', appConfig.colors.accentHover);
  style.setProperty('--accent-text', appConfig.colors.accentText);
}