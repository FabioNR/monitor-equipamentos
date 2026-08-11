'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import EquipamentoCard from '@/components/EquipamentoCard';
import StatusModal from '@/components/StatusModal';
import { useAuth } from '@/context/AuthContext';
import { useEquipamentos } from '@/hooks/useEquipamentos';
import { createClient } from '@/lib/supabase/client';
import { Equipamento, Status } from '@/types/equipamento';

type Filtro = Status | 'todos';

export default function DashboardPage() {

  const { equipamentos, setEquipamentos, carregando, conectado } = useEquipamentos();
  const { isAdmin, carregando: authCarregando } = useAuth();

  const [selecionado, setSelecionado] = useState<Equipamento | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  // Mantém o modal sincronizado com o realtime
  useEffect(() => {
    if (!selecionado) return;
    const versaoAtual = equipamentos.find((e) => e.id === selecionado.id);
    if (!versaoAtual) setSelecionado(null);
    else if (versaoAtual.atualizado_em !== selecionado.atualizado_em) setSelecionado(versaoAtual);
  }, [equipamentos, selecionado]);

  // async function alterarStatus(novoStatus: Status) {
  //   if (!selecionado || !isAdmin || salvando) return;
  //   const supabase = createClient();
  //   setSalvando(true);
  //   const { error } = await supabase
  //     .from('equipamentos')
  //     .update({ status: novoStatus })
  //     .eq('id', selecionado.id);
  //   setSalvando(false);

  //   if (error) {
  //     alert('Erro ao alterar o status: ' + error.message);
  //     return;
  //   }
  //   setSelecionado(null);
  // }

  async function alterarStatus(novoStatus: Status) {
    if (!selecionado || salvando) return;
    const supabase = createClient();

    const idAlterado = selecionado.id;
    const statusAnterior = selecionado.status;

    // 🔑 Atualização otimista: muda a UI imediatamente
    setEquipamentos((prev) =>
      prev.map((e) => (e.id === idAlterado ? { ...e, status: novoStatus } : e))
    );
    setSelecionado(null);
    setSalvando(true);

    const { error } = await supabase
      .from('equipamentos')
      .update({ status: novoStatus })
      .eq('id', idAlterado);

    setSalvando(false);
    if (error) {
      alert('Erro ao alterar o status: ' + error.message);
      // Reverte a atualização otimista
      setEquipamentos((prev) =>
        prev.map((e) => (e.id === idAlterado ? { ...e, status: statusAnterior } : e))
      );
    }
  }

  const contagem = {
    total: equipamentos.length,
    online: equipamentos.filter((e) => e.status === 'online').length,
    atencao: equipamentos.filter((e) => e.status === 'atencao').length,
    offline: equipamentos.filter((e) => e.status === 'offline').length,
  };

  const filtrados =
    filtro === 'todos' ? equipamentos : equipamentos.filter((e) => e.status === filtro);

  function alternarFiltro(novo: Filtro) {
    setFiltro((atual) => (atual === novo ? 'todos' : novo));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard de Equipamentos</h1>
          <p className="text-sm text-slate-400">
            {isAdmin
              ? 'Clique em um card para alterar o status'
              : 'Modo visualização — apenas administradores alteram o status'}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${conectado
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}
        >
          <span className={`h-2 w-2 rounded-full ${conectado ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`} />
          {conectado ? 'Tempo real conectado' : 'Conectando...'}
        </span>
      </div>

      {/* Contadores clicáveis = filtro */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TileResumo titulo="Total" valor={contagem.total} cor="text-white"
          ativo={filtro === 'todos'} onClick={() => setFiltro('todos')} />
        <TileResumo titulo="Online" valor={contagem.online} cor="text-emerald-400"
          ativo={filtro === 'online'} onClick={() => alternarFiltro('online')} />
        <TileResumo titulo="Atenção" valor={contagem.atencao} cor="text-amber-400"
          ativo={filtro === 'atencao'} onClick={() => alternarFiltro('atencao')} />
        <TileResumo titulo="Offline" valor={contagem.offline} cor="text-rose-400"
          ativo={filtro === 'offline'} onClick={() => alternarFiltro('offline')} />
      </div>

      {carregando ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-900" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-14 text-center">
          {equipamentos.length === 0 ? (
            <>
              <p className="text-slate-400">Nenhum equipamento cadastrado.</p>
              {isAdmin && (
                <Link
                  href="/equipamentos"
                  className="mt-3 inline-block rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400"
                >
                  Cadastrar equipamento
                </Link>
              )}
            </>
          ) : (
            <p className="text-slate-400">Nenhum equipamento com esse status.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {filtrados.map((eq) => (
            <EquipamentoCard
              key={eq.id}
              equipamento={eq}
              interativo={!authCarregando && isAdmin}
              onClick={setSelecionado}
            />
          ))}
        </div>
      )}

      {selecionado && (
        <StatusModal
          equipamento={selecionado}
          salvando={salvando}
          onAlterar={alterarStatus}
          onFechar={() => setSelecionado(null)}
        />
      )}
    </div>
  );
}

function TileResumo({
  titulo,
  valor,
  cor,
  ativo,
  onClick,
}: {
  titulo: string;
  valor: number;
  cor: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${ativo
        ? 'border-emerald-500/60 bg-slate-900 ring-1 ring-emerald-500/40'
        : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
        }`}
    >
      <p className="text-xs text-slate-400">{titulo}</p>
      <p className={`mt-0.5 text-2xl font-bold ${cor}`}>{valor}</p>
    </button>
  );
}