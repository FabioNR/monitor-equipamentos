'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Equipamento, Status } from '@/types/equipamento';

function ordenar(lista: Equipamento[]) {
  return [...lista].sort((a, b) => a.nome.localeCompare(b.nome));
}

const TOAST_TIPO: Record<Status, 'sucesso' | 'aviso' | 'erro'> = {
  online: 'sucesso',
  atencao: 'aviso',
  offline: 'erro',
};

export function useEquipamentos() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [conectado, setConectado] = useState(false);

  // 🔑 Refetch reutilizável
  const recarregar = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('equipamentos')
      .select('*')
      .order('nome');
    if (!error) setEquipamentos(data ?? []);
  }, []);

  useEffect(() => {
    let ativo = true;
    const supabase = createClient();

    recarregar().then(() => ativo && setCarregando(false));

    const channel = supabase
      .channel(`equipamentos-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipamentos' },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT': {
              const novo = payload.new as Equipamento;
              setEquipamentos((prev) =>
                prev.some((e) => e.id === novo.id)
                  ? prev.map((e) => (e.id === novo.id ? novo : e))
                  : ordenar([...prev, novo])
              );
              break;
            }
            case 'UPDATE': {
              const atualizado = payload.new as Equipamento;
              const anterior = payload.old as { status?: Status } | null;

              if (anterior?.status && anterior.status !== atualizado.status) {
                window.dispatchEvent(
                  new CustomEvent('equipamento-mudou-status', {
                    detail: {
                      titulo: `${atualizado.nome}`,
                      mensagem: `Status alterado de "${anterior.status}" para "${atualizado.status}"`,
                      tipo: TOAST_TIPO[atualizado.status],
                    },
                  })
                );
              }

              setEquipamentos((prev) =>
                prev.map((e) => (e.id === atualizado.id ? atualizado : e))
              );
              break;
            }
            case 'DELETE': {
              const antigo = payload.old as Pick<Equipamento, 'id'>;
              setEquipamentos((prev) => prev.filter((e) => e.id !== antigo.id));
              break;
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConectado(true);
      });

    // 🔑 Refetch quando a janela retoma o foco (garante sincronização)
    const aoFocar = () => recarregar();
    window.addEventListener('focus', aoFocar);

    // 🔑 Backup: refetch leve a cada 30s caso o realtime esteja fora
    const intervalo = setInterval(recarregar, 30000);

    return () => {
      ativo = false;
      window.removeEventListener('focus', aoFocar);
      clearInterval(intervalo);
      supabase.removeChannel(channel);
    };
  }, [recarregar]);

  return { equipamentos, setEquipamentos, recarregar, carregando, conectado };
}