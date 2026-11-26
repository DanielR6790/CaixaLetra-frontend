// Guarda o usuário logado e oferece as ações de autenticação.
// A lógica do Supabase Auth fica SOMENTE aqui, longe dos componentes visuais.
import { createContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { translateAuthError } from '../utils/authErrors.js';

export const AuthContext = createContext(null);

const ok = (extra = {}) => ({ ok: true, ...extra });
const fail = (message) => ({ ok: false, message });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // true até saber se há alguém logado

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    // Avisa quando o usuário entra, sai ou o token é renovado
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const actions = useMemo(
    () => ({
      async signIn({ email, password }) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? fail(translateAuthError(error)) : ok();
      },

      async signUp({ username, email, password }) {
        // 1) O nome de usuário está livre?
        const { data: available, error: checkError } = await supabase.rpc(
          'is_username_available',
          { p_username: username }
        );
        if (checkError) {
          console.error('[Auth]', checkError);
          return fail('Não foi possível verificar o nome de usuário. Tente novamente.');
        }
        if (!available) return fail('Este nome de usuário já está em uso. Escolha outro.');

        // 2) Cria a conta. O perfil é criado pelo banco (gatilho do schema.sql).
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) return fail(translateAuthError(error));

        // E-mail já cadastrado (quando a confirmação por e-mail está ativada,
        // o Supabase devolve um usuário sem "identities")
        if (data.user && data.user.identities?.length === 0) {
          return fail('Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.');
        }

        // Sem sessão = o Supabase está exigindo confirmação por e-mail
        return ok({ needsConfirmation: !data.session });
      },

      async signOut() {
        const { error } = await supabase.auth.signOut();
        return error ? fail(translateAuthError(error)) : ok();
      },

      async requestPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });
        return error ? fail(translateAuthError(error)) : ok();
      },

      async updatePassword(newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return error ? fail(translateAuthError(error)) : ok();
      },
    }),
    []
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      ...actions,
    }),
    [session, loading, actions]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}