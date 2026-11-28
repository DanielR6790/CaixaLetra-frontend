// Recorta a imagem em um quadrado (pelo centro) e a reduz para a foto de perfil.
// Devolve um JPEG pequeno (cerca de 20 a 40 KB). GIFs animados viram a primeira imagem.
export function resizeToSquareJpeg(file, size = 256, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      if (!side) {
        reject(new Error('Não foi possível ler a imagem.'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff'; // fundo para imagens com transparência
      context.fillRect(0, 0, size, size);
      context.drawImage(
        image,
        (image.naturalWidth - side) / 2,
        (image.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size
      );

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível processar a imagem.'))),
        'image/jpeg',
        quality
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem.'));
    };

    image.src = url;
  });
}