'use client';

import { useToast, type ToastTipo } from '@/context/ToastContext';

const cores: Record<ToastTipo, string> = {
  sucesso: 'border-emerald-500/60 bg-emerald-500/15 text-emerald-100',
  erro: 'border-rose-500/60 bg-rose-500/15 text-rose-100',
  aviso: 'border-amber-500/60 bg-amber-500/15 text-amber-100',
  info: 'border-sky-500/60 bg-sky-500/15 text-sky-100',
};

const icones: Record<ToastTipo, string> = {
  sucesso: '✓',
  erro: '✕',
  aviso: '⚠',
  info: 'ℹ',
};

export default function Toasts() {
  const { toasts, remover } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur ${cores[t.tipo]}`}
          style={{
            animation: 'toast-entrar 0.25s ease-out',
          }}
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold">
            {icones[t.tipo]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t.titulo}</p>
            {t.mensagem && <p className="mt-0.5 text-xs opacity-80">{t.mensagem}</p>}
          </div>
          <button
            onClick={() => remover(t.id)}
            className="ml-2 shrink-0 rounded p-1 text-xs opacity-70 transition hover:bg-white/10 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}