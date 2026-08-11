import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { NotificacoesTempoReal, ToastProvider } from '@/context/ToastContext';
import Toasts from '@/components/Toasts';

export const metadata: Metadata = {
  title: 'Monitor de Equipamentos',
  description: 'Dashboard de equipamentos em tempo real com Supabase',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <AuthProvider>
          <ToastProvider>
            <NotificacoesTempoReal />
            <Toasts />
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}