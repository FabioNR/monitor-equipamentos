export type ChamadoStatus = 'aberto' | 'andamento' | 'fechado';
export type ChamadoOrigem = 'manual' | 'automatico';

export interface Chamado {
  id: string;
  equipamento_id: string | null;
  equipamento_nome: string;
  titulo: string;
  descricao: string | null;
  status: ChamadoStatus;
  origem: ChamadoOrigem;
  sla_horas: number;
  aberto_em: string;
  prazo_sla: string;
  previsao_resolucao: string | null;
  verificado_em_campo: string | null;
  aberto_por: string | null;
  aberto_por_email: string | null;
  responsavel_id: string | null;
  responsavel_email: string | null;
  fechado_em: string | null;
  fechado_por: string | null;
  fechado_por_email: string | null;
  atualizado_em: string;
}