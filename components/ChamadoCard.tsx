'use client';

import type { Chamado } from '@/types/chamado';
import {
  CHAMADO_STATUS_CONFIG,
  estaAtrasado,
  formatarTempoRestante,
  progressoSla,
} from '@/lib/chamado';
import { formatarDataHora } from '@/lib/utils';

interface Props {
  chamado: Chamado;
  agora: Date;
  onClick: (chamado: Chamado) => void;
}

export default function ChamadoCard({ chamado, agora, onClick }: Props) {
  const cfg = CHAMADO_STATUS_CONFIG[chamado.status];
  const atrasado = estaAtrasado(chamado, agora);
  const progresso = progressoSla(chamado, agora);
  const fechado = chamado.status === 'fechado';

  return (
    <button
      onClick={() => onClick(chamado)}
      className={`w-full rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
        fechado
          ? 'border-slate-800 bg-slate-900/40 opacity-70'
          : atrasado
            ? 'border-rose-500/50 bg-rose-500/10'
            : 'border-slate-700 bg-slate-900/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-white">{chamado.titulo}</h3>
            {atrasado && (
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Em atraso
              </span>
            )}
            {chamado.origem === 'automatico' && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                Automático
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">🖥️ {chamado.equipamento_nome}</p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${cfg.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>Aberto por {chamado.aberto_por_email ?? 'sistema'}</span>
        <span>Em {formatarDataHora(chamado.aberto_em)}</span>
        {chamado.previsao_resolucao && (
          <span className="text-sky-400">
            Previsão: {formatarDataHora(chamado.previsao_resolucao)}
          </span>
        )}
      </div>

      {!fechado && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">SLA ({chamado.sla_horas}h)</span>
            <span className={atrasado ? 'font-bold text-rose-400' : 'text-slate-300'}>
              {formatarTempoRestante(chamado.prazo_sla, agora)}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                atrasado ? 'bg-rose-500' : progresso > 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {fechado && chamado.fechado_em && (
        <p className="mt-3 text-xs text-emerald-400">
          Fechado em {formatarDataHora(chamado.fechado_em)} por {chamado.fechado_por_email ?? '—'}
        </p>
      )}
    </button>
  );
}