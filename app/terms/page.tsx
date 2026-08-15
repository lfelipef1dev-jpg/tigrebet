'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-yellow-400 font-bold mb-4 inline-block">← Voltar</Link>
        <h1 className="text-2xl font-black mb-4">Termos de Uso</h1>
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>1. <strong>Idade mínima:</strong> É proibido o uso da plataforma por menores de 18 anos.</p>
          <p>2. <strong>Jogo responsável:</strong> Aposte apenas o que pode perder. Utilize os limites de depósito e sessão.</p>
          <p>3. <strong>Conta:</strong> Cada usuário pode possuir apenas uma conta. Dados devem ser verdadeiros.</p>
          <p>4. <strong>Depósitos e saques:</strong> O processamento ocorre em horário comercial, podendo levar até 48 horas úteis.</p>
          <p>5. <strong>Bônus e promoções:</strong> Estão sujeitos a regras de rollover e podem ser alterados.</p>
          <p>6. <strong>Propriedade intelectual:</strong> Todos os jogos e marcas são de propriedade da plataforma.</p>
          <p>7. <strong>Responsabilidade:</strong> A plataforma não se responsabiliza por perdas decorrentes de problemas de conexão ou dispositivo.</p>
          <p>8. <strong>Moderação:</strong> Reservamos o direito de suspender contas que violarem estes termos.</p>
          <p>9. <strong>Legislação:</strong> O uso está sujeito às leis do Brasil.</p>
          <p>10. <strong>Alterações:</strong> Os termos podem ser atualizados a qualquer momento.</p>
        </div>
      </div>
    </div>
  );
}
