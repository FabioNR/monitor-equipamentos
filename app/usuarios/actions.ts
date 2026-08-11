'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type UsuarioActionResult = { erro: string } | { ok: true } | null;

export interface UsuarioAdmin {
  id: string;
  email: string;
  role: 'admin' | 'operador';
  criado_em: string;
  ultimo_acesso: string | null;
}

/** Valida sessão + papel admin de quem está chamando (nunca confie no cliente) */
async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sessão expirada. Faça login novamente.');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    throw new Error('Acesso negado: esta área é exclusiva para administradores.');
  }
  return user;
}

export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  await exigirAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(error.message);

  const { data: perfis } = await admin.from('profiles').select('id, role');
  const papeis = new Map((perfis ?? []).map((p) => [p.id, p.role]));

  return (data.users ?? [])
    .map((u) => ({
      id: u.id,
      email: u.email ?? '(sem e-mail)',
      role: (papeis.get(u.id) as 'admin' | 'operador') ?? 'operador',
      criado_em: u.created_at ?? '',
      ultimo_acesso: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function criarUsuario(
  _prev: UsuarioActionResult,
  formData: FormData
): Promise<UsuarioActionResult> {
  try {
    await exigirAdmin();

    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const senha = String(formData.get('senha') ?? '');
    const role = formData.get('role') === 'admin' ? 'admin' : 'operador';

    if (!email || !email.includes('@')) return { erro: 'Informe um e-mail válido.' };
    if (senha.length < 6) return { erro: 'A senha deve ter pelo menos 6 caracteres.' };

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // já pode fazer login
    });
    if (error) {
      return {
        erro: error.message.toLowerCase().includes('already')
          ? 'Este e-mail já está cadastrado.'
          : error.message,
      };
    }

    // O trigger já criou o perfil como "operador"; garantimos o papel escolhido
    await admin.from('profiles').upsert({ id: data.user.id, email, role });

    revalidatePath('/', 'layout');

    return { ok: true };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'Erro inesperado.' };
  }
}

export async function atualizarUsuario(
  _prev: UsuarioActionResult,
  formData: FormData
): Promise<UsuarioActionResult> {
  try {
    const atual = await exigirAdmin();

    const id = String(formData.get('id') ?? '');
    const role = formData.get('role') === 'admin' ? 'admin' : 'operador';
    const senha = String(formData.get('senha') ?? '');

    if (!id) return { erro: 'Usuário inválido.' };
    if (senha && senha.length < 6) return { erro: 'A nova senha deve ter pelo menos 6 caracteres.' };
    if (atual.id === id && role !== 'admin') {
      return { erro: 'Você não pode remover o próprio acesso de admin.' };
    }

    const admin = createAdminClient();

    if (senha) {
      const { error } = await admin.auth.admin.updateUserById(id, { password: senha });
      if (error) return { erro: error.message };
    }

    const { error: erroPerfil } = await admin.from('profiles').update({ role }).eq('id', id);
    if (erroPerfil) return { erro: erroPerfil.message };

    revalidatePath('/', 'layout');

    return { ok: true };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'Erro inesperado.' };
  }
}

export async function excluirUsuario(id: string): Promise<UsuarioActionResult> {
  try {
    const atual = await exigirAdmin();
    if (atual.id === id) return { erro: 'Você não pode excluir o próprio usuário.' };

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return { erro: error.message };
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'Erro inesperado.' };
  }
}