'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/profile';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  carregando: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  carregando: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // 🔑 Cria o cliente dentro do effect para ler o cookie atualizado
    const supabase = createClient();

    async function buscarPerfil(u: User | null): Promise<Profile | null> {
      if (!u) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();
      return data ?? null;
    }

    async function atualizar(u: User | null) {
      setUser(u);
      setProfile(await buscarPerfil(u));
    }

    // Carga inicial
    supabase.auth.getSession().then(async ({ data }) => {
      await atualizar(data.session?.user ?? null);
      setCarregando(false);
    });

    // Reage a mudanças de auth
    const { data: sub } = supabase.auth.onAuthStateChange(async (evento, sessao) => {
      const novoUsuario = sessao?.user ?? null;

      if (evento === 'SIGNED_OUT' || evento === 'USER_DELETED') {
        setUser(null);
        setProfile(null);
        return;
      }

      await atualizar(novoUsuario);
    });

    // 🔑 Watchdog: revalida quando a aba volta a ficar visível
    async function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        const { data } = await supabase.auth.getSession();
        const sessaoUsuario = data.session?.user ?? null;
        if (sessaoUsuario?.id !== user?.id) {
          await atualizar(sessaoUsuario);
        }
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      sub.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === 'admin',
        carregando,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}