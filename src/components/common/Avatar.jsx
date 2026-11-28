import { useEffect, useState } from 'react';

// Foto de perfil redonda. Sem foto (ou se ela não carregar), mostra a inicial do nome.
export default function Avatar({ url, name, size = 32 }) {
  const [failed, setFailed] = useState(false);

  // Se a foto mudar, tenta carregar de novo
  useEffect(() => {
    setFailed(false);
  }, [url]);

  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  const initial = (name ?? '').trim().charAt(0).toUpperCase() || '?';

  if (url && !failed) {
    return <img className="avatar-img" src={url} alt="" style={style} onError={() => setFailed(true)} />;
  }
  return (
    <span className="avatar" style={style} aria-hidden="true">
      {initial}
    </span>
  );
}