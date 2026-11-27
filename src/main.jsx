import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ConfigError from './components/common/ConfigError.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { isSupabaseConfigured } from './services/supabaseClient.js';
import { warmUpBackend } from './services/api.js';
import { applyBrand } from './config/app.config.js';
import './styles/variables.css';
import './styles/global.css';
import './styles/auth.css';
import './styles/layout.css';
import './styles/catalog.css';
import './styles/details.css';
import './styles/board.css';
import './styles/favorites.css';

applyBrand();
warmUpBackend();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      {isSupabaseConfigured ? (
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      ) : (
        <ConfigError />
      )}
    </ThemeProvider>
  </React.StrictMode>
);