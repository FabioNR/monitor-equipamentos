import { NextRequest, NextResponse } from 'next/server';
import { enviarEmailChamado } from '@/lib/email/chamado';

// Esta rota roda APENAS no servidor (Next.js API Route)
// Por isso tem acesso às variáveis sem NEXT_PUBLIC_

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    if (!body.equipamentoNome || !body.titulo) {
      return NextResponse.json(
        { ok: false, error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const resultado = await enviarEmailChamado({
      equipamentoNome: body.equipamentoNome,
      titulo: body.titulo,
      descricao: body.descricao ?? null,
      origem: body.origem ?? 'manual',
      abertoPorEmail: body.abertoPorEmail ?? null,
      abertoEm: body.abertoEm ?? new Date().toISOString(),
    });

    if (!resultado.ok) {
      return NextResponse.json(
        { ok: false, error: resultado.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] Erro ao enviar e-mail:', err);
    return NextResponse.json(
      { ok: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}