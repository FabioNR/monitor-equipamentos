export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'operador';
  criado_em: string;
}