// Envio de imagens para o Supabase Storage.
//   covers        -> capas das obras (até 5 MB)
//   board-images  -> imagens dos quadros de ideias (até 10 MB)
//   avatars       -> fotos de perfil (até 2 MB, já reduzidas pelo site)
// Cada usuário só grava na própria pasta (regra do storage.sql).
import { supabase } from './supabaseClient.js';

const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const COVER_MAX_BYTES = 5 * 1024 * 1024; // mesmo limite do bucket "covers"
export const BOARD_IMAGE_MAX_BYTES = 10 * 1024 * 1024; // mesmo limite do bucket "board-images"
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // mesmo limite do bucket "avatars"
export const AVATAR_INPUT_MAX_BYTES = 5 * 1024 * 1024; // foto escolhida antes de ser reduzida

export const ACCEPTED_IMAGE_TYPES = Object.keys(EXTENSIONS).join(',');

// Devolve o texto do erro, ou '' quando o arquivo é válido
export function validateImageFile(file, maxBytes = COVER_MAX_BYTES) {
  if (!file || !EXTENSIONS[file.type]) {
    return 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.';
  }
  if (file.size > maxBytes) {
    return `A imagem é grande demais. O limite é ${Math.round(maxBytes / 1024 / 1024)} MB.`;
  }
  return '';
}

// "register: false" = não anota o arquivo na tabela storage_files (usado pelos avatares)
async function upload({ bucket, maxBytes, file, userId, extra = {}, register = true }) {
  const problem = validateImageFile(file, maxBytes);
  if (problem) throw new Error(problem);

  // Nome aleatório: a URL é impossível de adivinhar
  const path = `${userId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    console.error('[Storage]', error.message);
    throw new Error('Não foi possível enviar a imagem. Tente novamente.');
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  // Registro do arquivo (usado para limpezas futuras). Falhar aqui não impede o envio.
  if (register) {
    const { error: registerError } = await supabase.from('storage_files').insert({
      user_id: userId,
      bucket,
      path,
      mime_type: file.type,
      size_bytes: file.size,
      ...extra,
    });
    if (registerError) console.warn('[Storage] Registro do arquivo falhou:', registerError.message);
  }

  return { url: data.publicUrl, path };
}

async function removeUploaded(bucket, path, registered = true) {
  try {
    await supabase.storage.from(bucket).remove([path]);
    if (registered) {
      await supabase.from('storage_files').delete().eq('bucket', bucket).eq('path', path);
    }
  } catch {
    // limpeza "melhor esforço"
  }
}

export const uploadCover = (file, userId) =>
  upload({ bucket: 'covers', maxBytes: COVER_MAX_BYTES, file, userId });

export const uploadBoardImage = (file, userId, projectId) =>
  upload({
    bucket: 'board-images',
    maxBytes: BOARD_IMAGE_MAX_BYTES,
    file,
    userId,
    extra: { project_id: projectId },
  });

export const uploadAvatar = (file, userId) =>
  upload({ bucket: 'avatars', maxBytes: AVATAR_MAX_BYTES, file, userId, register: false });

// Usados para desfazer um envio quando o cadastro/salvamento falha
export const removeUploadedCover = (path) => removeUploaded('covers', path);
export const removeUploadedBoardImage = (path) => removeUploaded('board-images', path);
export const removeUploadedAvatar = (path) => removeUploaded('avatars', path, false);