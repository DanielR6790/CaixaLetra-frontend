// Conversões entre os elementos do banco e os "nós" do quadro (React Flow).
export const DEFAULT_TEXT_DATA = {
  text: '',
  fontSize: 18,
  color: null, // null = automática: branco no fundo preto, preto no fundo branco
  background: null, // null = sem fundo
  align: 'left',
  bold: false,
  italic: false,
};

export const DEFAULT_TEXT_SIZE = { width: 260, height: 110 };
export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 96];

const IMAGE_MAX_SIDE = 420; // tamanho inicial máximo de uma imagem nova (pixels do quadro)

const round = (value) => Math.round(value * 100) / 100;

// Mantém só os campos que vão para o banco (descarta marcas temporárias, como "isNew")
export function pickTextData(data = {}) {
  return {
    text: data.text ?? DEFAULT_TEXT_DATA.text,
    fontSize: data.fontSize ?? DEFAULT_TEXT_DATA.fontSize,
    color: data.color ?? null,
    background: data.background ?? null,
    align: data.align ?? DEFAULT_TEXT_DATA.align,
    bold: Boolean(data.bold),
    italic: Boolean(data.italic),
  };
}

export function pickImageData(data = {}) {
  return { url: data.url ?? '', storagePath: data.storagePath ?? '' };
}

// Tamanho inicial de uma imagem nova, mantendo a proporção original
export function fitImageSize(naturalWidth, naturalHeight) {
  const scale = Math.min(1, IMAGE_MAX_SIDE / naturalWidth, IMAGE_MAX_SIDE / naturalHeight);
  return {
    width: Math.max(40, Math.round(naturalWidth * scale)),
    height: Math.max(40, Math.round(naturalHeight * scale)),
  };
}

export function elementToNode(element) {
  const isImage = element.type === 'image';
  return {
    id: element.id,
    type: isImage ? 'image' : 'text',
    position: { x: element.x, y: element.y },
    width: element.width,
    height: element.height,
    zIndex: element.zIndex,
    data: isImage ? pickImageData(element.data) : { ...DEFAULT_TEXT_DATA, ...element.data },
  };
}

export function nodeToPayload(node) {
  const isImage = node.type === 'image';
  return {
    id: node.id,
    type: isImage ? 'image' : 'text',
    x: round(node.position.x),
    y: round(node.position.y),
    width: round(node.width ?? node.measured?.width ?? DEFAULT_TEXT_SIZE.width),
    height: round(node.height ?? node.measured?.height ?? DEFAULT_TEXT_SIZE.height),
    zIndex: node.zIndex ?? 0,
    data: isImage ? pickImageData(node.data) : pickTextData(node.data),
  };
}

// Nova caixa: já nasce selecionada e em modo de edição ("isNew" é só local)
export function createTextNode({ position, zIndex }) {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    position: { x: round(position.x), y: round(position.y) },
    width: DEFAULT_TEXT_SIZE.width,
    height: DEFAULT_TEXT_SIZE.height,
    zIndex,
    selected: true,
    data: { ...DEFAULT_TEXT_DATA, isNew: true },
  };
}

export function createImageNode({ position, zIndex, width, height, url, storagePath }) {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    position: { x: round(position.x), y: round(position.y) },
    width,
    height,
    zIndex,
    selected: true,
    data: { url, storagePath },
  };
}