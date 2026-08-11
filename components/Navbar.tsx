'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

function Brand() {
  return (
    <span className="flex items-center gap-2 font-bold text-white">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
        ⚡
      </span>
      Monitor de Equipamentos
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, carregando } = useAuth();

  async function handleLogout() {
    const supabase = createClient();
    // 1. Faz logout no cliente (limpa sessão em memória E cookie)
    await supabase.auth.signOut();
    // 2. Recarrega a página inteira — garante reset total do estado React
    window.location.href = '/login';
  }

  if (pathname === '/login') {
    return (
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-4">
          <Brand />
        </div>
      </header>
    );
  }

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/equipamentos', label: 'Equipamentos' },
    { href: '/historico', label: 'Histórico' },
    { href: '/relatorio', label: 'Relatório' },
    ...(!carregando && isAdmin ? [{ href: '/usuarios', label: 'Usuários' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/">
          <Brand />
        </Link>

        <nav className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === l.href
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!carregando && user && (
            <>
              <div className="hidden text-right sm:block">
                <p className="max-w-[180px] truncate text-xs font-medium text-slate-300">
                  {user.email}
                </p>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wide ${
                    isAdmin ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'Operador'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}