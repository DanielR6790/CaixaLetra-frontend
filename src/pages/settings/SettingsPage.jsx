import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Alert from '../../components/common/Alert.jsx';
import Icon from '../../components/common/Icon.jsx';
import AppearanceSection from '../../components/settings/AppearanceSection.jsx';
import DataSection from '../../components/settings/DataSection.jsx';
import ProfileSection from '../../components/settings/ProfileSection.jsx';
import SecuritySection from '../../components/settings/SecuritySection.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import '../../styles/settings.css';

const SECTIONS = [
  { id: 'perfil', label: 'Perfil', icon: 'user', View: ProfileSection },
  { id: 'aparencia', label: 'Aparência', icon: 'palette', View: AppearanceSection },
  { id: 'seguranca', label: 'Segurança', icon: 'shield', View: SecuritySection },
  { id: 'dados', label: 'Meus dados', icon: 'download', View: DataSection },
];

// Configurações: a seção aberta fica no endereço (?secao=aparencia),
// então F5 e o botão "voltar" do navegador funcionam direito.
export default function SettingsPage() {
  const { signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  const active = SECTIONS.find((section) => section.id === searchParams.get('secao')) ?? SECTIONS[0];
  const { View } = active;

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError('');
    const result = await signOut();
    // Em caso de sucesso, as rotas protegidas levam ao login sozinhas
    if (!result.ok) {
      setSignOutError(result.message);
      setSigningOut(false);
    }
  }

  return (
    <div className="main-content">
      <header className="page-header">
        <h1>Configurações</h1>
        <p>Gerencie seu perfil, a aparência do site e os seus dados.</p>
      </header>

      <div className="settings">
        <nav className="settings-nav" aria-label="Seções das configurações">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className="settings-nav-btn"
              aria-current={section.id === active.id ? 'page' : undefined}
              onClick={() => setSearchParams({ secao: section.id }, { replace: true })}
            >
              <Icon name={section.icon} size={18} />
              {section.label}
            </button>
          ))}

          <button
            type="button"
            className="settings-nav-btn settings-signout"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <Icon name="logout" size={18} />
            {signingOut ? 'Saindo…' : 'Sair da conta'}
          </button>
        </nav>

        <div className="settings-content" key={active.id}>
          {signOutError && <Alert type="error">{signOutError}</Alert>}
          <View />
        </div>
      </div>
    </div>
  );
}