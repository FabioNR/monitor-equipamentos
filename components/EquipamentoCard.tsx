'use client';

import { Equipamento } from '@/types/equipamento';
import { STATUS_CONFIG } from '@/lib/status';

// Cor do texto conforme o status
const COR_TEXTO: Record<Equipamento['status'], string> = {
  online: 'text-emerald-300',
  atencao: 'text-amber-300',
  offline: 'text-rose-300',
};

interface Props {
  equipamento: Equipamento;
  interativo: boolean; // true apenas para admin
  onClick: (equipamento: Equipamento) => void;
}

export default function EquipamentoCard({ equipamento, interativo, onClick }: Props) {
  const cfg = STATUS_CONFIG[equipamento.status];
  const corTexto = COR_TEXTO[equipamento.status];

  return (
    <button
      onClick={() => interativo && onClick(equipamento)}
      title={`${equipamento.nome} — ${equipamento.localizacao}${
        interativo ? ' (clique para alterar o status)' : ' (somente leitura)'
      }`}
      className={`w-full rounded-lg border p-2.5 text-left transition ${cfg.card} ${
        interativo ? 'hover:-translate-y-0.5 hover:shadow-lg' : 'cursor-default'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${cfg.dot}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
        </span>
        <h3 className={`truncate text-sm font-semibold ${corTexto}`}>{equipamento.nome}</h3>
      </div>
      <p className={`mt-1 truncate pl-4 text-xs ${corTexto}`}>{equipamento.localizacao}</p>
    </button>
  );
}