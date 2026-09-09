'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Equipamento } from '@/types/equipamento';

interface Props {
  onSucesso: (mensagem: string) => void;
  onFechar: () => void;
}

export default function ChamadoFormModal({ onSucesso, onFechar }: Props) {
  const { user } = useAuth();
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [equipamentoId, setEquipamentoId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('equipamentos')
      .select('*')
      .order('nome')
      .then(({ data }) => setEquipamentos(data ?? []));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!equipamentoId || !titulo.trim()) return;
    setSalvando(true);
    setErro(null);

    const eq = equipamentos.find((x) => x.id === equipamentoId);
    const supabase = createClient();
    const { error } = await supabase.from('chamados').insert([
      {
        equipamento_id: equipamentoId,
        equipamento_nome: eq?.nome ?? '',
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        status: 'aberto',
        origem: 'manual',
        aberto_por: user?.id ?? null,
        aberto_por_email: user?.email ?? null,
      },
    ]);

    if (error) {
      setSalvando(false);
      setErro(error.message);
      return;
    }

    // 📧 Chama a API Route que envia o e-mail para o osTicket (roda no servidor)
    let emailEnviado = false;
    try {
      const resp = await fetch('/api/enviar-email-chamado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipamentoNome: eq?.nome ?? '',
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          origem: 'manual',
          abertoPorEmail: user?.email ?? null,
          abertoEm: new Date().toISOString(),
        }),
      });

      const resultado = await resp.json();
      emailEnviado = resultado.ok === true;

      if (!resultado.ok) {
        console.warn('[ChamadoFormModal] E-mail não enviado:', resultado.error);
      }
    } catch (err) {
      console.error('[ChamadoFormModal] Falha ao chamar API de e-mail:', err);
    }

    setSalvando(false);

    const mensagem = emailEnviado
      ? 'Chamado aberto e e-mail enviado para o osTicket!'
      : 'Chamado aberto! (E-mail para o osTicket não foi enviado — verifique os logs)';

    onSucesso(mensagem);
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
        <h2 className="text-xl font-bold text-white">Abrir chamado</h2>
        <p className="mt-1 text-sm text-slate-400">
          Descreva o que precisa ser feito no equipamento.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Equipamento</label>
            <select
              value={equipamentoId}
              onChange={(e) => setEquipamentoId(e.target.value)}
              required
              className={input}
            >
              <option value="">Selecione...</option>
              {equipamentos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nome} — {eq.localizacao}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Trocar fonte de alimentação"
              required
              className={input}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Descrição do que deve ser feito
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Detalhe o problema e as ações necessárias..."
              className={`${input} resize-none`}
            />
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
              {salvando ? 'Abrindo...' : 'Abrir chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}