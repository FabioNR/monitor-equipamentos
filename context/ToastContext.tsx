'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ToastTipo = 'sucesso' | 'erro' | 'info' | 'aviso';

export interface Toast {
  id: string;
  titulo: string;
  mensagem?: string;
  tipo: ToastTipo;
  duracao?: number; // ms, padrão 5000
}

interface ContextType {
  toasts: Toast[];
  adicionar: (toast: Omit<Toast, 'id'>) => void;
  remover: (id: string) => void;
}

const ToastContext = createContext<ContextType>({
  toasts: [],
  adicionar: () => {},
  remover: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remover = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const adicionar = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const novo: Toast = { ...toast, id };
    setToasts((prev) => [...prev, novo]);

    const duracao = toast.duracao ?? 5000;
    window.setTimeout(() => remover(id), duracao);
  }, [remover]);

  return (
    <ToastContext.Provider value={{ toasts, adicionar, remover }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/** Escuta eventos de tempo real e exibe toasts */
export function NotificacoesTempoReal() {
  const { adicionar } = useToast();

  useEffect(() => {
    function handler(event: Event) {
      const detail = (event as CustomEvent).detail;
      adicionar(detail);
    }
    window.addEventListener('equipamento-mudou-status', handler);
    return () => window.removeEventListener('equipamento-mudou-status', handler);
  }, [adicionar]);

  return null;
}