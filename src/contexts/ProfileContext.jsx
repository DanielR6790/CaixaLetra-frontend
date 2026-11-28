// Carrega o perfil do usuário logado UMA vez e compartilha com o menu e as páginas.
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getMe } from '../services/userService.js';

export const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMe();
      setProfile(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Usada depois de salvar o perfil: troca os dados na hora, em todo o site
  const applyProfile = useCallback((next) => {
    setProfile(next);
    setError('');
  }, []);

  const value = useMemo(
    () => ({ profile, loading, error, reload, applyProfile }),
    [profile, loading, error, reload, applyProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}