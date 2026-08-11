'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Chamado, ChamadoStatus } from '@/types/chamado';
import {
  CHAMADO_STATUS_CONFIG,
  estaAtrasado,
  formatarTempoRestante,
  isoParaDatetimeLocal,
} from '@/lib/chamado';
import { formatarDataHora } from '@/lib/utils';

interface Props {
  chamado: Chamado;
  agora: Date;
  onFechar: () => void;
}

export default function ChamadoModal({ chamado, agora, onFechar }: Props) {
  const { user, isAdmin } = useAuth();
  const [salvando, setSalvando] = useState(false);
  const [mudandoStatus, setMudandoStatus] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Estado de edição (admin)
  const [titulo, setTitulo] = useState(chamado.titulo);
  const [descricao, setDescricao] = useState(chamado.descricao ?? '');
  const [verificacao, setVerificacao] = useState(chamado.verificado_em_campo ?? '');
  const [previsao, setPrevisao] = useState(isoParaDatetimeLocal(chamado.previsao_resolucao));

  // Re-sincroniza ao trocar de chamado
  useEffect(() => {
    setTitulo(chamado.titulo);
    setDescricao(chamado.descricao ?? '');
    setVerificacao(chamado.verificado_em_campo ?? '');
    setPrevisao(isoParaDatetimeLocal(chamado.previsao_resolucao));
    setErro(null);
    setMensagem(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamado.id]);

  const cfg = CHAMADO_STATUS_CONFIG[chamado.status];
  const atrasado = estaAtrasado(chamado, agora);

  async function mudarStatus(novoStatus: ChamadoStatus) {
    setMudandoStatus(true);
    setErro(null);
    const supabase = createClient();

    const payload: Record<string, unknown> = { status: novoStatus };
    if (novoStatus === 'fechado') {
      payload.fechado_em = new Date().toISOString();
      payload.fechado_por = user?.id ?? null;
      payload.fechado_por_email = user?.email ?? null;
    } else {
      payload.fechado_em = null;
      payload.fechado_por = null;
      payload.fechado_por_email = null;
    }

    const { error } = await supabase.from('chamados').update(payload).eq('id', chamado.id);
    setMudandoStatus(false);

    if (error) {
      setErro(error.message);
      return;
    }
    if (novoStatus === 'fechado') onFechar();
  }

  async function salvarEdicao() {
    setSalvando(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase
      .from('chamados')
      .update({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        verificado_em_campo: verificacao.trim() || null,
        previsao_resolucao: previsao ? new Date(previsao).toISOString() : null,
      })
      .eq('id', chamado.id);
    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }
    setMensagem('Alterações salvas!');
    setTimeout(() => setMensagem(null), 2500);
  }

  const input =
    'w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onFechar}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white">{chamado.titulo}</h2>
              {atrasado && (
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  Em atraso
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">🖥️ {chamado.equipamento_nome}</p>
          </div>
          <button
            onClick={onFechar}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Status e SLA */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cfg.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className="text-xs text-slate-500">
            Origem: {chamado.origem === 'automatico' ? 'Automático' : 'Manual'}
          </span>
          {chamado.status !== 'fechado' && (
            <span className={`text-xs font-semibold ${atrasado ? 'text-rose-400' : 'text-slate-300'}`}>
              SLA: {formatarTempoRestante(chamado.prazo_sla, agora)}
            </span>
          )}
        </div>

        {/* Informações */}
        <div className="mt-4 space-y-3 rounded-xl bg-slate-800/50 p-4 text-sm">
          <Info label="Aberto por" valor={`${chamado.aberto_por_email ?? 'sistema'} • ${formatarDataHora(chamado.aberto_em)}`} />
          <Info label="Descrição" valor={chamado.descricao || '—'} />
          <Info label="Prazo SLA" valor={formatarDataHora(chamado.prazo_sla)} />
          {chamado.previsao_resolucao && (
            <Info label="Previsão de resolução" valor={formatarDataHora(chamado.previsao_resolucao)} />
          )}
          {chamado.verificado_em_campo && (
            <Info label="Verificação em campo" valor={chamado.verificado_em_campo} />
          )}
          {chamado.fechado_em && (
            <Info
              label="Fechado"
              valor={`${formatarDataHora(chamado.fechado_em)} por ${chamado.fechado_por_email ?? '—'}`}
            />
          )}
        </div>

        {/* Mensagens */}
        {mensagem && (
          <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {mensagem}
          </p>
        )}
        {erro && (
          <p className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{erro}</p>
        )}

        {/* Painel do admin */}
        {isAdmin ? (
          <div className="mt-5 space-y-4 border-t border-slate-800 pt-5">
            <p className="text-sm font-semibold text-slate-300">Ações do administrador</p>

            {/* Transição de status */}
            <div className="flex flex-wrap gap-2">
              {chamado.status === 'aberto' && (
                <button
                  onClick={() => mudarStatus('andamento')}
                  disabled={mudandoStatus}
                  className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
                >
                  ▶ Iniciar atendimento
                </button>
              )}
              {chamado.status === 'andamento' && (
                <button
                  onClick={() => mudarStatus('fechado')}
                  disabled={mudandoStatus}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  ✓ Fechar chamado
                </button>
              )}
              {chamado.status === 'fechado' && (
                <button
                  onClick={() => mudarStatus('aberto')}
                  disabled={mudandoStatus}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  ↺ Reabrir chamado
                </button>
              )}
            </div>

            {/* Campos de edição */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Título</label>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={input} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className={`${input} resize-none`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Ocorrido após verificação em campo
              </label>
              <textarea
                value={verificacao}
                onChange={(e) => setVerificacao(e.target.value)}
                rows={3}
                placeholder="Descreva o que foi encontrado e feito em campo..."
                className={`${input} resize-none`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Previsão de resolução
              </label>
              <input
                type="datetime-local"
                value={previsao}
                onChange={(e) => setPrevisao(e.target.value)}
                className={input}
              />
            </div>

            <button
              onClick={salvarEdicao}
              disabled={salvando}
              className="w-full rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-600 disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        ) : (
          <p className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-500">
            🔒 Somente administradores podem editar, iniciar ou fechar chamados.
          </p>
        )}
      </div>
    </div>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-slate-200">{valor}</p>
    </div>
  );
}