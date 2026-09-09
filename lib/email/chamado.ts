// lib/email/chamado.ts
import { Resend } from 'resend';

// Instancia apenas no lado do servidor
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface DadosChamado {
  equipamentoNome: string;
  titulo: string;
  descricao: string | null;
  origem: 'manual' | 'automatico';
  abertoPorEmail: string | null;
  abertoEm: string;
}

export async function enviarEmailChamado(dados: DadosChamado): Promise<{ ok: boolean; error?: string }> {
  const destinatario = process.env.EMAIL_DESTINATARIO;
  const remetente = process.env.EMAIL_REMETENTE || 'onboarding@resend.dev';

  if (!destinatario) {
    console.warn('[Email] EMAIL_DESTINATARIO não configurado');
    return { ok: false, error: 'EMAIL_DESTINATARIO não configurado' };
  }

  if (!resend) {
    console.warn('[Email] RESEND_API_KEY não configurada');
    return { ok: false, error: 'RESEND_API_KEY não configurada' };
  }

  const origemTexto =
    dados.origem === 'automatico'
      ? '🤖 Chamado aberto automaticamente (equipamento offline)'
      : '👤 Chamado aberto manualmente';

  const corpoHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">🖥️ Novo Chamado de Equipamento</h2>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Equipamento:</strong> ${dados.equipamentoNome}</p>
        <p><strong>Título:</strong> ${dados.titulo}</p>
        <p><strong>Origem:</strong> ${origemTexto}</p>
        <p><strong>Aberto em:</strong> ${new Date(dados.abertoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
        <p><strong>Aberto por:</strong> ${dados.abertoPorEmail || 'sistema'}</p>
      </div>

      <div style="margin: 20px 0;">
        <h3>Descrição</h3>
        <p>${dados.descricao || 'Sem descrição adicional.'}</p>
      </div>

      <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
        <h4>📋 Ações esperadas</h4>
        <ol>
          <li>Verificar o equipamento em campo</li>
          <li>Registrar o ocorrido no sistema interno</li>
          <li>Fechar este chamado após resolução</li>
        </ol>
      </div>

      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        Este e-mail foi gerado automaticamente pelo Monitor de Equipamentos.
      </p>
    </div>
  `;

  const corpoTexto = [
    `EQUIPAMENTO: ${dados.equipamentoNome}`,
    `TÍTULO: ${dados.titulo}`,
    `ORIGEM: ${origemTexto}`,
    `ABERTO EM: ${new Date(dados.abertoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    `ABERTO POR: ${dados.abertoPorEmail || 'sistema'}`,
    '',
    'DESCRIÇÃO:',
    dados.descricao || 'Sem descrição adicional.',
  ].join('\n');

  try {
    const { error } = await resend.emails.send({
      from: `Monitor Equipamentos <${remetente}>`,
      to: [destinatario],
      subject: `[${dados.equipamentoNome}] ${dados.titulo}`,
      html: corpoHtml,
      text: corpoTexto,
    });

    if (error) {
      console.error('[Email] Erro ao enviar:', error);
      return { ok: false, error: error.message };
    }

    console.log(`[Email] ✅ E-mail enviado para ${destinatario}`);
    return { ok: true };
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : String(err);
    console.error('[Email] Falha ao enviar:', mensagem);
    return { ok: false, error: mensagem };
  }
}