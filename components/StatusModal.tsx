'use client';

import { useEffect } from 'react';
import { Equipamento, Status } from '@/types/equipamento';
import { STATUS_CONFIG, TODOS_STATUS } from '@/lib/status';
import { formatarDataHora } from '@/lib/utils';

interface Props {
  equipamento: Equipamento;
  salvando: boolean;
  onAlterar: (status: Status) => void;
  onFechar: () => void;
}

export default function StatusModal({ equipamento, salvando, onAlterar, onFechar }: Props) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onFechar]);

  const cfgAtual = STATUS_CONFIG[equipamento.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{equipamento.nome}</h2>
            <p className="mt-1 text-sm text-slate-400">📍 {equipamento.localizacao}</p>
          </div>
          <button
            onClick={onFechar}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-slate-800/60 p-4 text-sm">
          <span className="text-slate-400">Status atual: </span>
          <span className={`font-bold ${cfgAtual.texto}`}>{cfgAtual.label}</span>
          <p className="mt-1 text-xs text-slate-500">
            Atualizado em {formatarDataHora(equipamento.atualizado_em)}
          </p>
        </div>

        <p className="mt-5 text-sm font-medium text-slate-300">Alterar status para:</p>
        <div className="mt-2 grid gap-2">
          {TODOS_STATUS.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const ativo = equipamento.status === s;
            return (
              <button
                key={s}
                disabled={salvando || ativo}
                onClick={() => onAlterar(s)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${cfg.opcao}`}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
                {ativo && <span className="text-xs font-normal opacity-70">atual</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}