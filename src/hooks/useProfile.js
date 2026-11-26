import { useContext } from 'react';
import { ProfileContext } from '../contexts/ProfileContext.jsx';

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile precisa estar dentro de <ProfileProvider>.');
  return context;
}