'use client';

import { useEffect, useMemo, useState } from 'react';
import ChamadoCard from '@/components/ChamadoCard';
import ChamadoFormModal from '@/components/ChamadoFormModal';
import ChamadoModal from '@/components/ChamadoModal';
import { useChamados } from '@/hooks/useChamados';
import { estaAtrasado } from '@/lib/chamado';
import { useEquipamentos } from '@/hooks/useEquipamentos';
import type { Chamado } from '@/types/chamado';

type FiltroStatus = 'ativos' | 'aberto' | 'andamento' | 'atrasado' | 'fechado' | 'todos';

export default function ChamadosPage() {
  const { chamados, carregando, conectado } = useChamados();
  const { equipamentos } = useEquipamentos();

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('ativos');
  const [busca, setBusca] = useState('');
  const [filtroEquipamento, setFiltroEquipamento] = useState('todos');
  const [selecionado, setSelecionado] = useState<Chamado | null>(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Relógio para recalcular SLA/atraso a cada minuto
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Mantém o modal sincronizado com atualizações realtime
  useEffect(() => {
    if (!selecionado) return;
    const versao = chamados.find((c) => c.id === selecionado.id);
    if (!versao) setSelecionado(null);
    else if (versao.atualizado_em !== selecionado.atualizado_em) setSelecionado(versao);
  }, [chamados, selecionado]);

  const filtrados = useMemo(() => {
    let lista = [...chamados];

    // Filtro de status (padrão "ativos" oculta os fechados)
    if (filtroStatus === 'ativos') lista = lista.filter((c) => c.status !== 'fechado');
    else if (filtroStatus === 'aberto') lista = lista.filter((c) => c.status === 'aberto');
    else if (filtroStatus === 'andamento') lista = lista.filter((c) => c.status === 'andamento');
    else if (filtroStatus === 'fechado') lista = lista.filter((c) => c.status === 'fechado');
    else if (filtroStatus === 'atrasado')
      lista = lista.filter((c) => c.status !== 'fechado' && estaAtrasado(c, agora));
    // 'todos' não filtra

    if (filtroEquipamento !== 'todos')
      lista = lista.filter((c) => c.equipamento_id === filtroEquipamento);

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (c) =>
          c.titulo.toLowerCase().includes(termo) ||
          c.equipamento_nome.toLowerCase().includes(termo) ||
          (c.descricao ?? '').toLowerCase().includes(termo)
      );
    }

    // Ordenação: ativos por prazo SLA (mais próximo do vencimento primeiro);
    // fechados vão para o final, ordenados por data de fechamento.
    return lista.sort((a, b) => {
      const aFechado = a.status === 'fechado';
      const bFechado = b.status === 'fechado';
      if (aFechado !== bFechado) return aFechado ? 1 : -1;
      if (aFechado && bFechado)
        return (
          new Date(b.fechado_em ?? 0).getTime() - new Date(a.fechado_em ?? 0).getTime()
        );
      return new Date(a.prazo_sla).getTime() - new Date(b.prazo_sla).getTime();
    });
  }, [chamados, filtroStatus, filtroEquipamento, busca, agora]);

  function contar(f: FiltroStatus): number {
    switch (f) {
      case 'ativos':
        return chamados.filter((c) => c.status !== 'fechado').length;
      case 'aberto':
        return chamados.filter((c) => c.status === 'aberto').length;
      case 'andamento':
        return chamados.filter((c) => c.status === 'andamento').length;
      case 'atrasado':
        return chamados.filter((c) => c.status !== 'fechado' && estaAtrasado(c, agora)).length;
      case 'fechado':
        return chamados.filter((c) => c.status === 'fechado').length;
      default:
        return chamados.length;
    }
  }

  const opcoesFiltro: { valor: FiltroStatus; label: string }[] = [
    { valor: 'ativos', label: 'Ativos' },
    { valor: 'aberto', label: 'Abertos' },
    { valor: 'andamento', label: 'Em andamento' },
    { valor: 'atrasado', label: 'Em atraso' },
    { valor: 'fechado', label: 'Fechados' },
    { valor: 'todos', label: 'Todos' },
  ];

  function notificar(texto: string) {
    setMensagem(texto);
    setTimeout(() => setMensagem(null), 3000);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Chamados</h1>
          <p className="text-sm text-slate-400">
            Ordenados pelo mais próximo do fim do SLA • fechados ficam ocultos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${conectado
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}
          >
            <span className={`h-2 w-2 rounded-full ${conectado ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`} />
            {conectado ? 'Ao vivo' : 'Conectando...'}
          </span>
          <button
            onClick={() => setNovoAberto(true)}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            + Abrir chamado
          </button>
        </div>
      </div>

      {mensagem && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {mensagem}
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {opcoesFiltro.map((op) => (
            <button
              key={op.valor}
              onClick={() => setFiltroStatus(op.valor)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filtroStatus === op.valor
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                }`}
            >
              {op.label} ({contar(op.valor)})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, equipamento ou descrição..."
            className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 sm:w-auto sm:flex-1"
          />
          <select
            value={filtroEquipamento}
            onChange={(e) => setFiltroEquipamento(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="todos">Todos os equipamentos</option>
            {equipamentos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-900" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-400">
          {filtroStatus === 'fechado'
            ? 'Nenhum chamado fechado.'
            : 'Nenhum chamado encontrado com os filtros atuais.'}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtrados.map((c) => (
            <ChamadoCard key={c.id} chamado={c} agora={agora} onClick={setSelecionado} />
          ))}
        </div>
      )}

      {/* Modais */}
      {novoAberto && (
        <ChamadoFormModal
          onSucesso={(msg) => {
            setNovoAberto(false);
            notificar(msg);
          }}
          onFechar={() => setNovoAberto(false)}
        />
      )}

      {selecionado && (
        <ChamadoModal chamado={selecionado} agora={agora} onFechar={() => setSelecionado(null)} />
      )}
    </div>
  );
}