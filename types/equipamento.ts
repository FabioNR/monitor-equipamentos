export type Status = 'online' | 'offline' | 'atencao';

export interface Equipamento {
  id: string;
  nome: string;
  localizacao: string;
  status: Status;
  criado_em: string;
  atualizado_em: string;
}