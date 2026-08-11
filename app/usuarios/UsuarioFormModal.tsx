'use client';

import { useActionState, useEffect, useState } from 'react';
import { atualizarUsuario, criarUsuario, type UsuarioAdmin } from './actions';

interface Props {
  usuario: UsuarioAdmin | null; // null = novo usuário
  onSucesso: (mensagem: string) => void;
  onFechar: () => void;
}

export default function UsuarioFormModal({ usuario, onSucesso, onFechar }: Props) {
  const ehEdicao = usuario !== null;
  const acao = ehEdicao ? atualizarUsuario : criarUsuario;
  const [estado, formAction, pendente] = useActionState(acao, null);
  const [role, setRole] = useState<'admin' | 'operador'>(usuario?.role ?? 'operador');

  useEffect(() => {
    if (estado && 'ok' in estado) {
      onSucesso(ehEdicao ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const input =
    'w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white">
          {ehEdicao ? 'Editar usuário' : 'Novo usuário'}
        </h2>

        <form action={formAction} className="mt-5 space-y-4">
          {ehEdicao && <input type="hidden" name="id" value={usuario!.id} />}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">E-mail</label>
            {ehEdicao ? (
              <input value={usuario!.email} disabled className={`${input} opacity-60`} />
            ) : (
              <input
                type="email"
                name="email"
                required
                placeholder="usuario@empresa.com"
                className={input}
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              {ehEdicao ? 'Nova senha (opcional)' : 'Senha'}
            </label>
            <input
              type="password"
              name="senha"
              required={!ehEdicao}
              minLength={6}
              placeholder={ehEdicao ? 'Deixe em branco para manter a atual' : 'Mínimo 6 caracteres'}
              className={input}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Papel</label>
            <input type="hidden" name="role" value={role} />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('operador')}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  role === 'operador'
                    ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block text-sm font-semibold">Operador</span>
                <span className="block text-xs opacity-70">somente visualiza</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  role === 'admin'
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block text-sm font-semibold">Admin</span>
                <span className="block text-xs opacity-70">controle total</span>
              </button>
            </div>
          </div>

          {estado && 'erro' in estado && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{estado.erro}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pendente}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {pendente ? 'Salvando...' : ehEdicao ? 'Salvar alterações' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}