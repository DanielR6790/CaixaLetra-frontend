import { Link } from 'react-router-dom';
import Alert from '../../components/common/Alert.jsx';
import Icon from '../../components/common/Icon.jsx';
import { categories } from '../../config/categories.js';
import { useProfile } from '../../hooks/useProfile.js';

export default function HomePage() {
  const { profile, error, reload } = useProfile();

  return (
    <div className="main-content">
      <header className="page-header">
        <h1>{profile ? `Olá, ${profile.username}!` : 'Olá!'}</h1>
        <p>O que vamos organizar hoje?</p>
      </header>

      {error && (
        <Alert type="error">
          {error}{' '}
          <button type="button" className="link-button" onClick={reload}>
            Tentar novamente
          </button>
        </Alert>
      )}

      <h2 className="section-title">Catálogo</h2>
      <div className="card-grid">
        {categories.map((category) => (
          <Link key={category.slug} to={`/catalogo/${category.slug}`} className="tile">
            <span className="tile-icon">
              <Icon name={category.icon} size={22} />
            </span>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Quadro infinito</h2>
      <div className="card-grid">
        <Link to="/ideias" className="tile">
          <span className="tile-icon">
            <Icon name="lightbulb" size={22} />
          </span>
          <h3>Organização de ideias</h3>
          <p>Projetos com quadros infinitos para textos, imagens e conexões.</p>
        </Link>
      </div>
    </div>
  );
}