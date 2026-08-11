import type { Status } from './equipamento';

export interface StatusLog {
  id: number;
  equipamento_id: string | null;
  equipamento_nome: string;
  status_anterior: Status | null;
  status_novo: Status;
  alterado_por: string | null;
  alterado_por_email: string;
  criado_em: string;
}