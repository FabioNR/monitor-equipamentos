'use client';

import { useState } from 'react';
import EquipamentoFormModal from '@/components/EquipamentoFormModal';
import { useAuth } from '@/context/AuthContext';
import { useEquipamentos } from '@/hooks/useEquipamentos';
import { STATUS_CONFIG } from '@/lib/status';
import { createClient } from '@/lib/supabase/client';
import { formatarDataHora } from '@/lib/utils';
import { Equipamento, Status } from '@/types/equipamento';

export default function EquipamentosPage() {
  const { equipamentos, carregando } = useEquipamentos();
  const { isAdmin, carregando: authCarregando } = useAuth();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Equipamento | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [idParaExcluir, setIdParaExcluir] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  function notificar(texto: string) {
    setMensagem(texto);
    setTimeout(() => setMensagem(null), 3500);
  }

  function abrirNovo() {
    setEditando(null);
    setErroForm(null);
    setModalAberto(true);
  }

  function abrirEdicao(eq: Equipamento) {
    setEditando(eq);
    setErroForm(null);
    setModalAberto(true);
  }

  async function salvar(dados: { nome: string; localizacao: string; status: Status; mqtt_id: string | null }) {
    const supabase = createClient();
    setSalvando(true);
    setErroForm(null);

    const { error } = editando
      ? await supabase.from('equipamentos').update(dados).eq('id', editando.id)
      : await supabase.from('equipamentos').insert([dados]);

    setSalvando(false);
    if (error) {
      setErroForm(error.message);
      return;
    }
    setModalAberto(false);
    notificar(editando ? 'Equipamento atualizado com sucesso!' : 'Equipamento adicionado com sucesso!');
  }

  async function excluir(id: string) {
    const supabase = createClient();
    setExcluindo(true);
    const { error } = await supabase.from('equipamentos').delete().eq('id', id);
    setExcluindo(false);
    setIdParaExcluir(null);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
      return;
    }
    notificar('Equipamento excluído.');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipamentos</h1>
          <p className="text-sm text-slate-400">
            {isAdmin ? 'Cadastre, edite e exclua equipamentos' : 'Lista de equipamentos cadastrados'}
          </p>
        </div>
        {!authCarregando && isAdmin && (
          <button
            onClick={abrirNovo}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            + Novo equipamento
          </button>
        )}
      </div>

      {!authCarregando && !isAdmin && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
          🔒 Modo somente leitura — apenas administradores podem adicionar, editar ou excluir equipamentos.
        </div>
      )}

      {mensagem && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {mensagem}
        </div>
      )}

      {carregando ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-900" />
      ) : equipamentos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-400">
          Nenhum equipamento cadastrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Localização</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Atualizado em</th>
                {isAdmin && <th className="px-5 py-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {equipamentos.map((eq) => {
                const cfg = STATUS_CONFIG[eq.status];
                return (
                  <tr key={eq.id} className="transition hover:bg-slate-800/40">
                    <td className="px-5 py-4 font-semibold text-white">{eq.nome}</td>
                    <td className="px-5 py-4 text-slate-300">{eq.localizacao}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${cfg.badge}`}>
                        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{formatarDataHora(eq.atualizado_em)}</td>
                    {isAdmin && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {idParaExcluir === eq.id ? (
                            <>
                              <button
                                onClick={() => excluir(eq.id)}
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
                                onClick={() => abrirEdicao(eq)}
                                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setIdParaExcluir(eq.id)}
                                className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && isAdmin && (
        <EquipamentoFormModal
          equipamento={editando}
          salvando={salvando}
          erro={erroForm}
          onSalvar={salvar}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}