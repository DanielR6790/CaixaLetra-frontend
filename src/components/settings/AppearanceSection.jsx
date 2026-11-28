import { useEffect, useState } from 'react';
import TextField from '../common/TextField.jsx';
import { appConfig } from '../../config/app.config.js';
import { THEMES } from '../../contexts/ThemeContext.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import { contrastRatio, normalizeHex } from '../../utils/color.js';
import { THEME_BG, resolveAccent } from '../../utils/themeColors.js';

// Cores usadas só nas miniaturas dos temas (fixas, independentes do tema atual)
const PREVIEW = {
  dark: { bg: '#14181c', surface: '#1c2228', text: '#e8edf1', border: '#2f3943' },
  light: { bg: '#f4f6f8', surface: '#ffffff', text: '#16202a', border: '#d9e0e6' },
  slate: { bg: '#0f172a', surface: '#1e293b', text: '#f8fafc', border: '#334155' },
};

const PRESETS = [
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Violeta', hex: '#8b5cf6' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Laranja', hex: '#f97316' },
  { name: 'Amarelo', hex: '#eab308' },
  { name: 'Ciano', hex: '#06b6d4' },
  { name: 'Vermelho', hex: '#ef4444' },
];

const FULL_HEX = /^#?[0-9a-f]{6}$/i;

// Seção "Aparência": tema e cor de destaque.
export default function AppearanceSection() {
  return (
    <>
      <ThemeChoice />
      <AccentPicker />
    </>
  );
}

function ThemeChoice() {
  const { theme, setTheme, accent } = useTheme();

  return (
    <section className="settings-card">
      <h2>Tema</h2>
      <p className="muted">Escolha as cores gerais do site. A escolha fica salva neste navegador.</p>

      <div className="theme-grid" role="radiogroup" aria-label="Tema do site">
        {THEMES.map((option) => {
          const colors = PREVIEW[option.id];
          const previewAccent = resolveAccent(option.id, accent, appConfig.colors).accent;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={theme === option.id}
              className={theme === option.id ? 'theme-card theme-card-selected' : 'theme-card'}
              onClick={() => setTheme(option.id)}
            >
              <span
                className="theme-preview"
                style={{ background: colors.bg, borderColor: colors.border }}
                aria-hidden="true"
              >
                <span
                  className="theme-preview-card"
                  style={{ background: colors.surface, borderColor: colors.border }}
                >
                  <i style={{ background: colors.text }} />
                  <i className="short" style={{ background: colors.text }} />
                  <b style={{ background: previewAccent }} />
                </span>
              </span>
              <span className="theme-card-label">{option.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AccentPicker() {
  const { theme, accent, setAccent, effective } = useTheme();
  const [draft, setDraft] = useState(accent ?? effective.accent);
  const [error, setError] = useState('');

  // Sem cor personalizada, o campo mostra a cor do tema (e acompanha a troca de tema)
  useEffect(() => {
    if (accent === null) {
      setDraft(effective.accent);
      setError('');
    }
  }, [accent, effective.accent]);

  const lowContrast = contrastRatio(effective.accent, THEME_BG[theme]) < 3;

  function choose(hex) {
    setAccent(hex);
    setDraft(hex);
    setError('');
  }

  function handleType(value) {
    setDraft(value);
    // Aplica na hora quando o código está completo (#RRGGBB)
    if (FULL_HEX.test(value.trim())) {
      setAccent(value);
      setError('');
    }
  }

  // Ao sair do campo (ou apertar Enter): aceita também o formato curto (#RGB)
  function commit() {
    const normalized = normalizeHex(draft);
    if (normalized) {
      choose(normalized);
    } else if (draft.trim() === '') {
      setAccent(null);
    } else {
      setError('Use o formato #RRGGBB (por exemplo, #10B981).');
    }
  }

  return (
    <section className="settings-card">
      <h2>Cor de destaque</h2>
      <p className="muted">
        Define a cor dos botões, do item ativo no menu, das estrelas, dos selos e do logotipo. Vale para os
        três temas e fica salva neste navegador.
      </p>

      <div className="accent-row">
        <input
          type="color"
          className="accent-native"
          value={normalizeHex(draft) ?? effective.accent}
          onChange={(event) => choose(event.target.value)}
          aria-label="Escolher a cor de destaque"
        />
        <TextField
          id="accent-hex"
          label="Código da cor (hex)"
          value={draft}
          onChange={handleType}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
          }}
          error={error}
          placeholder="#10B981"
          maxLength={7}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="swatches" role="group" aria-label="Cores prontas">
        {PRESETS.map((preset) => (
          <button
            key={preset.hex}
            type="button"
            className={effective.accent === preset.hex ? 'swatch swatch-selected' : 'swatch'}
            style={{ background: preset.hex }}
            onClick={() => choose(preset.hex)}
            aria-label={`${preset.name} (${preset.hex})`}
            aria-pressed={effective.accent === preset.hex}
            title={`${preset.name} · ${preset.hex}`}
          />
        ))}
      </div>

      {lowContrast && (
        <p className="contrast-warning" role="status">
          Esta cor tem pouco contraste com o fundo do tema atual e pode ficar difícil de ver. Experimente uma
          mais clara ou mais escura.
        </p>
      )}

      <div className="accent-sample">
        <span className="muted">Exemplo:</span>
        <button type="button" className="btn btn-primary btn-sm" tabIndex={-1}>
          Botão
        </button>
        <span className="chip chip-active">Filtro ativo</span>
        <span className="accent-sample-link">Link</span>
      </div>

      <div className="settings-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setAccent(null);
            setError('');
          }}
          disabled={accent === null}
        >
          Usar a cor padrão do tema
        </button>
      </div>
    </section>
  );
}