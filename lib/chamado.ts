import type { Chamado, ChamadoStatus } from '@/types/chamado';

export const CHAMADO_STATUS_CONFIG: Record<
  ChamadoStatus,
  { label: string; badge: string; dot: string }
> = {
  aberto: {
    label: 'Aberto',
    badge: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    dot: 'bg-rose-400',
  },
  andamento: {
    label: 'Em andamento',
    badge: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
    dot: 'bg-sky-400',
  },
  fechado: {
    label: 'Fechado',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    dot: 'bg-emerald-400',
  },
};

export function estaAtrasado(chamado: Chamado, agora: Date = new Date()): boolean {
  if (chamado.status === 'fechado') return false;
  return new Date(chamado.prazo_sla).getTime() < agora.getTime();
}

export function formatarTempoRestante(prazoIso: string, agora: Date = new Date()): string {
  const diff = new Date(prazoIso).getTime() - agora.getTime();
  const abs = Math.abs(diff);
  const dias = Math.floor(abs / 86400000);
  const horas = Math.floor((abs % 86400000) / 3600000);
  const minutos = Math.floor((abs % 3600000) / 60000);

  const texto =
    dias > 0 ? `${dias}d ${horas}h` : horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;

  return diff >= 0 ? `${texto} restantes` : `Atrasado há ${texto}`;
}

/** Percentual do SLA já decorrido (0 a 100). >= 100 significa atraso. */
export function progressoSla(chamado: Chamado, agora: Date = new Date()): number {
  const inicio = new Date(chamado.aberto_em).getTime();
  const fim = new Date(chamado.prazo_sla).getTime();
  if (fim <= inicio) return 100;
  const pct = ((agora.getTime() - inicio) / (fim - inicio)) * 100;
  return Math.min(100, Math.max(0, pct));
}

/** Converte ISO para o formato do input datetime-local */
export function isoParaDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}