'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let ativo = true;
    const supabase = createClient();

    (async () => {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .order('nome');
      if (!ativo) return;
      if (!error) setEquipamentos(data ?? []);
      setCarregando(false);
    })();

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

              // Notifica SOMENTE se o status realmente mudou
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

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { equipamentos, carregando, conectado };
}