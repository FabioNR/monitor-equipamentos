'use client';

import { useCallback, useEffect, useState } from 'react';
import UsuarioFormModal from './UsuarioFormModal';
import { excluirUsuario, listarUsuarios, type UsuarioAdmin } from './actions';
import { formatarDataHora } from '@/lib/utils';

export default function UsuariosManager() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);

  const [idParaExcluir, setIdParaExcluir] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErroCarga(null);
      setUsuarios(await listarUsuarios());
    } catch (e) {
      setErroCarga(e instanceof Error ? e.message : 'Erro ao carregar usuários.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function notificar(texto: string) {
    setMensagem(texto);
    setTimeout(() => setMensagem(null), 3500);
  }

  function aoSalvar(texto: string) {
    setModalAberto(false);
    notificar(texto);
    carregar();
  }

  async function confirmarExclusao(usuario: UsuarioAdmin) {
    setExcluindo(true);
    const resultado = await excluirUsuario(usuario.id);
    setExcluindo(false);
    setIdParaExcluir(null);

    if (resultado && 'erro' in resultado) {
      alert(resultado.erro);
      return;
    }
    notificar(`Usuário ${usuario.email} excluído.`);
    carregar();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-sm text-slate-400">Gerencie acessos e papéis do sistema</p>
        </div>
        <button
          onClick={() => {
            setEditando(null);
            setModalAberto(true);
          }}
          className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
        >
          + Novo usuário
        </button>
      </div>

      {mensagem && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {mensagem}
        </div>
      )}

      {erroCarga && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {erroCarga}
        </div>
      )}

      {carregando ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-900" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">E-mail</th>
                <th className="px-5 py-4">Papel</th>
                <th className="px-5 py-4">Criado em</th>
                <th className="px-5 py-4">Último acesso</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {usuarios.map((u) => (
                <tr key={u.id} className="transition hover:bg-slate-800/40">
                  <td className="px-5 py-4 font-semibold text-white">{u.email}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                        u.role === 'admin'
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-600 bg-slate-800 text-slate-300'
                      }`}
                    >
                      {u.role === 'admin' ? 'Admin' : 'Operador'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{formatarDataHora(u.criado_em)}</td>
                  <td className="px-5 py-4 text-slate-400">
                    {u.ultimo_acesso ? formatarDataHora(u.ultimo_acesso) : 'Nunca acessou'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {idParaExcluir === u.id ? (
                        <>
                          <button
                            onClick={() => confirmarExclusao(u)}
                            disabled={excluindo}
                            className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-400 disabled:opacity-50"
                          >
                            {excluindo ? 'Excluindo...' : 'Confirmar exclusão'}
                          </button>
                          <button
                            onClick={() => setIdParaExcluir(null)}
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditando(u);
                              setModalAberto(true);
                            }}
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setIdParaExcluir(u.id)}
                            className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <UsuarioFormModal
          usuario={editando}
          onSucesso={aoSalvar}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}