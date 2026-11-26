import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import PublicOnlyRoute from './components/common/PublicOnlyRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import HomePage from './pages/catalog/HomePage.jsx';
import CategoryPage from './pages/catalog/CategoryPage.jsx';
import TimelinePage from './pages/catalog/TimelinePage.jsx';
import IdeasPage from './pages/ideas/IdeasPage.jsx';
import ProjectBoardPage from './pages/ideas/ProjectBoardPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Só para quem NÃO está logado */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
      </Route>

      {/* Link do e-mail de recuperação (cria uma sessão temporária) */}
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

      {/* Só para quem está logado (com menu lateral) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogo/:slug" element={<CategoryPage />} />
          <Route path="/linha-do-tempo" element={<TimelinePage />} />
          <Route path="/ideias" element={<IdeasPage />} />
          <Route path="/ideias/:projectId" element={<ProjectBoardPage />} />
        </Route>
      </Route>

      {/* Qualquer outro endereço volta para o início */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}