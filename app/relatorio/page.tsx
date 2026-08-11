'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { STATUS_CONFIG } from '@/lib/status';
import { formatarDataHora } from '@/lib/utils';
import type { Status } from '@/types/equipamento';

interface EquipRelatorio {
  id: string;
  nome: string;
  status_atual: Status;
  total_online_segundos: number;
  total_atencao_segundos: number;
  total_offline_segundos: number;
  total_observado_segundos: number;
  ultima_mudanca: string | null;
  qtd_mudancas: number;
}

function segParaTexto(seg: number): string {
  if (!seg || seg < 60) return `${Math.floor(seg)}s`;
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = Math.floor(seg % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function calcularRelatorio(logs: any[]): EquipRelatorio[] {
  const agora = new Date();
  const porEquip = new Map<string, any[]>();

  for (const log of logs) {
    if (!porEquip.has(log.equipamento_id)) porEquip.set(log.equipamento_id, []);
    porEquip.get(log.equipamento_id)!.push(log);
  }

  const resultado: EquipRelatorio[] = [];

  for (const [id, listaLogs] of porEquip) {
    // Ordena cronologicamente (ascendente)
    const ordenados = [...listaLogs].sort(
      (a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
    );

    let online = 0;
    let atencao = 0;
    let offline = 0;

    for (let i = 0; i < ordenados.length; i++) {
      const log = ordenados[i];
      const prox = ordenados[i + 1];
      const inicio = new Date(log.criado_em);
      const fim = prox ? new Date(prox.criado_em) : agora;
      const duracao = Math.max(0, (fim.getTime() - inicio.getTime()) / 1000);

      if (log.status_novo === 'online') online += duracao;
      else if (log.status_novo === 'atencao') atencao += duracao;
      else if (log.status_novo === 'offline') offline += duracao;
    }

    const ultimoLog = ordenados[ordenados.length - 1];

    resultado.push({
      id,
      nome: ultimoLog.equipamento_nome,
      status_atual: ultimoLog.status_novo,
      total_online_segundos: online,
      total_atencao_segundos: atencao,
      total_offline_segundos: offline,
      total_observado_segundos: online + atencao + offline,
      ultima_mudanca: ultimoLog.criado_em,
      qtd_mudancas: ordenados.length,
    });
  }

  return resultado.sort((a, b) => a.nome.localeCompare(b.nome));
}

export default function RelatorioPage() {
  const [relatorio, setRelatorio] = useState<EquipRelatorio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dias, setDias] = useState(7);

  async function carregar(periodo: number) {
    setCarregando(true);
    const supabase = createClient();
    const desde = new Date(Date.now() - periodo * 86400000).toISOString();
    const { data, error } = await supabase
      .from('status_logs')
      .select('*')
      .gte('criado_em', desde)
      .order('criado_em', { ascending: true });
    if (!error) setRelatorio(calcularRelatorio(data ?? []));
    setCarregando(false);
  }

  useEffect(() => {
    carregar(dias);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalOnline = relatorio.reduce((s, r) => s + r.total_online_segundos, 0);
  const totalObservado = relatorio.reduce((s, r) => s + r.total_observado_segundos, 0);
  const disponibilidadeGeral =
    totalObservado > 0 ? (totalOnline / totalObservado) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatório de Disponibilidade</h1>
          <p className="text-sm text-slate-400">
            Cálculo automático a partir do histórico de mudanças de status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Período:</span>
          {[
            { label: '24h', valor: 1 },
            { label: '7 dias', valor: 7 },
            { label: '30 dias', valor: 30 },
            { label: '90 dias', valor: 90 },
          ].map((p) => (
            <button
              key={p.valor}
              onClick={() => {
                setDias(p.valor);
                carregar(p.valor);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                dias === p.valor
                  ? 'bg-emerald-500 text-slate-950'
                  : 'border border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs gerais */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi titulo="Equipamentos monitorados" valor={String(relatorio.length)} />
        <Kpi titulo="Tempo online total" valor={segParaTexto(totalOnline)} />
        <Kpi titulo="Total de mudanças"
          valor={String(relatorio.reduce((s, r) => s + r.qtd_mudancas, 0))} />
        <Kpi
          titulo="Disponibilidade geral"
          valor={`${disponibilidadeGeral.toFixed(1)}%`}
          cor={
            disponibilidadeGeral >= 95
              ? 'text-emerald-400'
              : disponibilidadeGeral >= 80
                ? 'text-amber-400'
                : 'text-rose-400'
          }
        />
      </div>

      {carregando ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-900" />
      ) : relatorio.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-400">
          Sem mudanças de status no período. Faça alterações no dashboard para gerar o
          relatório.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Equipamento</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Disponibilidade</th>
                <th className="px-5 py-4">Online / Atenção / Offline</th>
                <th className="px-5 py-4">Mudanças</th>
                <th className="px-5 py-4">Última mudança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {relatorio.map((r) => {
                const perc =
                  r.total_observado_segundos > 0
                    ? (r.total_online_segundos / r.total_observado_segundos) * 100
                    : 0;
                const total = r.total_online_segundos + r.total_atencao_segundos + r.total_offline_segundos || 1;
                const cfg = STATUS_CONFIG[r.status_atual];
                return (
                  <tr key={r.id} className="transition hover:bg-slate-800/40">
                    <td className="px-5 py-4 font-semibold text-white">{r.nome}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${perc}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            perc >= 95
                              ? 'text-emerald-400'
                              : perc >= 80
                                ? 'text-amber-400'
                                : 'text-rose-400'
                          }`}
                        >
                          {perc.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex h-2 w-48 overflow-hidden rounded-full">
                        <div
                          className="bg-emerald-500"
                          style={{ width: `${(r.total_online_segundos / total) * 100}%` }}
                          title={`Online: ${segParaTexto(r.total_online_segundos)}`}
                        />
                        <div
                          className="bg-amber-500"
                          style={{ width: `${(r.total_atencao_segundos / total) * 100}%` }}
                          title={`Atenção: ${segParaTexto(r.total_atencao_segundos)}`}
                        />
                        <div
                          className="bg-rose-500"
                          style={{ width: `${(r.total_offline_segundos / total) * 100}%` }}
                          title={`Offline: ${segParaTexto(r.total_offline_segundos)}`}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{r.qtd_mudancas}</td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {r.ultima_mudanca ? formatarDataHora(r.ultima_mudanca) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Kpi({
  titulo,
  valor,
  cor = 'text-white',
}: {
  titulo: string;
  valor: string;
  cor?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs text-slate-400">{titulo}</p>
      <p className={`mt-1 text-2xl font-bold ${cor}`}>{valor}</p>
    </div>
  );
}