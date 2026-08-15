'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-yellow-400 font-bold mb-4 inline-block">← Voltar</Link>
        <h1 className="text-2xl font-black mb-4">Política de Privacidade</h1>
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>1. <strong>Dados coletados:</strong> Nome, CPF, telefone, e-mail, dados bancários/PIX e histórico de transações.</p>
          <p>2. <strong>Finalidade:</strong> Os dados são usados para autenticação, processamento de pagamentos, suporte e prevenção de fraudes.</p>
          <p>3. <strong>Proteção:</strong> Utilizamos criptografia e boas práticas de segurança para proteger suas informações.</p>
          <p>4. <strong>Compartilhamento:</strong> Dados não são vendidos. Podem ser compartilhados com gateways de pagamento e autoridades quando exigido por lei.</p>
          <p>5. <strong>Cookies:</strong> Usamos cookies para manter a sessão e melhorar a experiência.</p>
          <p>6. <strong>Direitos:</strong> Você pode solicitar acesso, correção ou exclusão dos seus dados entrando em contato com o suporte.</p>
          <p>7. <strong>Retenção:</strong> Mantemos os dados pelo tempo necessário para cumprimento legal e operacional.</p>
          <p>8. <strong>Alterações:</strong> Esta política pode ser atualizada; avisos serão publicados na plataforma.</p>
        </div>
      </div>
    </div>
  );
}
