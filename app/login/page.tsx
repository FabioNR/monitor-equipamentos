'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setPendente(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });

    if (error) {
      const msgAmigavel: Record<string, string> = {
        invalid_credentials: 'E-mail ou senha inválidos.',
        email_not_confirmed: 'E-mail ainda não foi confirmado.',
        too_many_requests: 'Muitas tentativas. Aguarde alguns minutos.',
      };
      setErro(msgAmigavel[error.code ?? ''] ?? error.message);
      setPendente(false);
      return;
    }

    // 🔑 Recarrega a página inteira para resetar TODO o estado React
    // Isso garante que o AuthProvider pegue a nova sessão do zero
    window.location.href = '/';
  }

  const input =
    'w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500';

  return (
    <div className="mx-auto mt-14 w-full max-w-sm">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
        <h1 className="text-xl font-bold text-white">Entrar</h1>
        <p className="mt-1 text-sm text-slate-400">Acesse o painel de monitoramento</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="voce@empresa.com"
              className={input}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="••••••••"
              className={input}
            />
          </div>

          {erro && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{erro}</p>
          )}

          <button
            type="submit"
            disabled={pendente}
            className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {pendente ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}