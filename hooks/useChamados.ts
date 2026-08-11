'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Chamado } from '@/types/chamado';

export function useChamados() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    let ativo = true;
    const supabase = createClient();

    (async () => {
      const { data, error } = await supabase.from('chamados').select('*');
      if (!ativo) return;
      if (!error) setChamados(data ?? []);
      setCarregando(false);
    })();

    const channel = supabase
      .channel(`chamados-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chamados' },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT': {
              const novo = payload.new as Chamado;
              setChamados((prev) =>
                prev.some((c) => c.id === novo.id) ? prev : [novo, ...prev]
              );
              // Notifica abertura automática
              if (novo.origem === 'automatico') {
                window.dispatchEvent(
                  new CustomEvent('chamado-criado', {
                    detail: {
                      titulo: 'Chamado aberto automaticamente',
                      mensagem: `${novo.equipamento_nome}: ${novo.titulo}`,
                      tipo: 'erro',
                    },
                  })
                );
              }
              break;
            }
            case 'UPDATE': {
              const atualizado = payload.new as Chamado;
              setChamados((prev) =>
                prev.map((c) => (c.id === atualizado.id ? atualizado : c))
              );
              break;
            }
            case 'DELETE': {
              const antigo = payload.old as Pick<Chamado, 'id'>;
              setChamados((prev) => prev.filter((c) => c.id !== antigo.id));
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

  return { chamados, carregando, conectado };
}