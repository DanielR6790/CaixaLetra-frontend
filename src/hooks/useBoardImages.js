// Envia imagens ao Storage e as coloca no quadro.
// Aceita vários arquivos de uma vez (botão, Ctrl + V ou arrastar e soltar).
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth.js';
import {
  BOARD_IMAGE_MAX_BYTES,
  removeUploadedBoardImage,
  uploadBoardImage,
  validateImageFile,
} from '../services/storageService.js';
import { fitImageSize } from '../utils/boardElements.js';

// Lê as dimensões originais para manter a proporção no quadro
function readImageSize(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    image.src = objectUrl;
  });
}

// "addImage" vem do useBoardElements. "center" = ponto do quadro onde centralizar.
export function useBoardImages({ projectId, addImage }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');

  const addFiles = useCallback(
    async (files, center) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      setError('');
      const problems = [];

      for (let index = 0; index < list.length; index += 1) {
        const file = list[index];
        const label = file.name || 'Imagem';

        const problem = validateImageFile(file, BOARD_IMAGE_MAX_BYTES);
        if (problem) {
          problems.push(`${label}: ${problem}`);
          continue;
        }

        setUploading((count) => count + 1);
        let uploaded = null;
        try {
          const natural = await readImageSize(file);
          if (!natural || !natural.width || !natural.height) {
            throw new Error('Não foi possível ler a imagem.');
          }

          uploaded = await uploadBoardImage(file, user.id, projectId);
          const size = fitImageSize(natural.width, natural.height);

          addImage({
            // várias imagens de uma vez ficam levemente deslocadas, em escada
            position: {
              x: center.x - size.width / 2 + index * 28,
              y: center.y - size.height / 2 + index * 28,
            },
            width: size.width,
            height: size.height,
            url: uploaded.url,
            storagePath: uploaded.path,
          });
        } catch (err) {
          // Não deixa um arquivo "solto" no Storage se a imagem não entrou no quadro
          if (uploaded) removeUploadedBoardImage(uploaded.path);
          problems.push(`${label}: ${err.message}`);
        } finally {
          setUploading((count) => count - 1);
        }
      }

      if (problems.length > 0) setError(problems.join(' '));
    },
    [addImage, projectId, user]
  );

  const dismissError = useCallback(() => setError(''), []);

  return { uploading, error, addFiles, dismissError };
}