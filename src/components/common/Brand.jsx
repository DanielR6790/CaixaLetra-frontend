import { appConfig } from '../../config/app.config.js';

// Logotipo + nome. Tudo vem do app.config.js.
export default function Brand({ size = 'md' }) {
  return (
    <div className={`brand brand-${size}`}>
      {appConfig.logoUrl ? (
        <img className="brand-logo" src={appConfig.logoUrl} alt="" />
      ) : (
        <span className="brand-mark" aria-hidden="true">
          {appConfig.logoText}
        </span>
      )}
      <span className="brand-name">{appConfig.name}</span>
    </div>
  );
}