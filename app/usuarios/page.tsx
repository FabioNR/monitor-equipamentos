import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import UsuariosManager from './UsuariosManager';

export default async function UsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-12 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-3 text-lg font-bold text-white">Acesso restrito</h1>
        <p className="mt-1 text-sm text-slate-400">
          Apenas administradores podem gerenciar usuários.
        </p>
      </div>
    );
  }

  return <UsuariosManager />;
}