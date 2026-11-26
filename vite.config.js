import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Se a porta 5173 estiver ocupada, falha em vez de trocar de porta
    // (o backend só aceita chamadas vindas de http://localhost:5173)
    strictPort: true,
  },
});