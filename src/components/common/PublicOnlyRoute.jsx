import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import Loading from './Loading.jsx';

// Login e cadastro: quem já está logado vai direto para a página principal
// (ou para a página que tentou abrir antes de ser enviado ao login).
export default function PublicOnlyRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading fullscreen />;
  if (session) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;
  return <Outlet />;
}