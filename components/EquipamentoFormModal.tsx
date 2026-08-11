'use client';

import { FormEvent, useState } from 'react';
import { Equipamento, Status } from '@/types/equipamento';
import { STATUS_CONFIG, TODOS_STATUS } from '@/lib/status';

interface Props {
  equipamento: Equipamento | null; // null = novo
  salvando: boolean;
  erro: string | null;
  onSalvar: (dados: { nome: string; localizacao: string; status: Status }) => void;
  onFechar: () => void;
}

export default function EquipamentoFormModal({
  equipamento, salvando, erro, onSalvar, onFechar,
}: Props) {
  const [nome, setNome] = useState(equipamento?.nome ?? '');
  const [localizacao, setLocalizacao] = useState(equipamento?.localizacao ?? '');
  const [status, setStatus] = useState<Status>(equipamento?.status ?? 'offline');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !localizacao.trim()) return;
    onSalvar({ nome: nome.trim(), localizacao: localizacao.trim(), status });
  }

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
          {equipamento ? 'Editar equipamento' : 'Novo equipamento'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Servidor Principal"
              required
              autoFocus
              className={input}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Localização</label>
            <input
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Ex.: Sala de TI · Rack 01"
              required
              className={input}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {TODOS_STATUS.map((s) => {
                const cfg = STATUS_CONFIG[s];
                const ativo = status === s;
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      ativo
                        ? cfg.opcao
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {erro && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{erro}</p>
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
              disabled={salvando}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : equipamento ? 'Salvar alterações' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}