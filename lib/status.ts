import { Status } from '@/types/equipamento';

export const TODOS_STATUS: Status[] = ['online', 'atencao', 'offline'];

export const STATUS_CONFIG: Record<
  Status,
  { label: string; texto: string; dot: string; card: string; badge: string; opcao: string }
> = {
  online: {
    label: 'Online',
    texto: 'text-emerald-400',
    dot: 'bg-emerald-400',
    card: 'border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-400/80 hover:shadow-emerald-500/10',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    opcao: 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25',
  },
  atencao: {
    label: 'Atenção',
    texto: 'text-amber-400',
    dot: 'bg-amber-400',
    card: 'border-amber-500/40 bg-amber-500/10 hover:border-amber-400/80 hover:shadow-amber-500/10',
    badge: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    opcao: 'border-amber-500/60 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25',
  },
  offline: {
    label: 'Offline',
    texto: 'text-rose-400',
    dot: 'bg-rose-400',
    card: 'border-rose-500/40 bg-rose-500/10 hover:border-rose-400/80 hover:shadow-rose-500/10',
    badge: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    opcao: 'border-rose-500/60 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25',
  },
};