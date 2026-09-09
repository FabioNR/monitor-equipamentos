'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { STATUS_CONFIG } from '@/lib/status';
import { formatarDataHora } from '@/lib/utils';
import type { Status } from '@/types/equipamento';
import type { StatusLog } from '@/types/statusLog';

export default function HistoricoPage() {
  const { isAdmin, carregando: carregandoAuth } = useAuth();
  const [logs, setLogs] = useState<StatusLog[]>([]);
  const [equipamentos, setEquipamentos] = useState<{ id: string; nome: string }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [conectado, setConectado] = useState(false);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    // Não carrega dados se não for admin
    if (!isAdmin || carregandoAuth) return;

    let ativo = true;
    const supabase = createClient();

    (async () => {
      const [resLogs, resEquip] = await Promise.all([
        supabase
          .from('status_logs')
          .select('*')
          .order('criado_em', { ascending: false })
          .limit(200),
        supabase.from('equipamentos').select('id, nome').order('nome'),
      ]);
      if (!ativo) return;
      if (!resLogs.error) setLogs(resLogs.data ?? []);
      if (!resEquip.error) setEquipamentos(resEquip.data ?? []);
      setCarregando(false);
    })();

    // Novos registros aparecem em tempo real
    const channel = supabase
      .channel(`status-logs-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'status_logs' },
        (payload) => {
          const novo = payload.new as StatusLog;
          setLogs((prev) =>
            prev.some((l) => l.id === novo.id) ? prev : [novo, ...prev].slice(0, 200)
          );
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConectado(true);
      });

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, [isAdmin, carregandoAuth]);

  const filtrados = useMemo(
    () => (filtro === 'todos' ? logs : logs.filter((l) => l.equipamento_id === filtro)),
    [logs, filtro]
  );

  // Tela de carregando enquanto verifica autenticação
  if (carregandoAuth) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-400">Verificando permissões...</p>
      </div>
    );
  }

  // Tela de acesso restrito para operadores
  if (!isAdmin) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
          <p className="mt-2 text-sm text-slate-400">
            Esta página está disponível apenas para administradores.
          </p>
        </div>
      </div>
    );
  }

  // Conteúdo normal para admin
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Histórico de Status</h1>
          <p className="text-sm text-slate-400">
            Registro automático de todas as mudanças de status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="todos">Todos os equipamentos</option>
            {equipamentos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.nome}
              </option>
            ))}
          </select>

          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              conectado
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${conectado ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`} />
            {conectado ? 'Ao vivo' : 'Conectando...'}
          </span>
        </div>
      </div>

      {carregando ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-900" />
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-400">
          Nenhuma mudança de status registrada ainda. Altere o status de um equipamento no
          dashboard para ver o registro aqui.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Data/Hora</th>
                <th className="px-5 py-4">Equipamento</th>
                <th className="px-5 py-4">Mudança</th>
                <th className="px-5 py-4">Alterado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtrados.map((log) => (
                <tr key={log.id} className="transition hover:bg-slate-800/40">
                  <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                    {formatarDataHora(log.criado_em)}
                  </td>
                  <td className="px-5 py-4 font-semibold text-white">{log.equipamento_nome}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {log.status_anterior ? (
                        <BadgeStatus status={log.status_anterior} />
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                      <span className="text-slate-500">→</span>
                      <BadgeStatus status={log.status_novo} />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{log.alterado_por_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BadgeStatus({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}