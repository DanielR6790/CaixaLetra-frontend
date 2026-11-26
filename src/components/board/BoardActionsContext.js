// Compartilha com as caixas do quadro o tema e a ação de alterar dados,
// sem precisar passar tudo por propriedades de componente em componente.
import { createContext, useContext } from 'react';

export const BoardActionsContext = createContext(null);

export function useBoardActions() {
  const context = useContext(BoardActionsContext);
  if (!context) throw new Error('useBoardActions precisa estar dentro do quadro.');
  return context;
}