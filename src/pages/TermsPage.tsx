import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-panel border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img src={logo} alt="FoConector" className="h-8 w-8 rounded-full" />
            <span className="text-lg font-semibold tracking-tight">FoConector</span>
          </button>
          <ThemeToggle />
        </div>
      </nav>

      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>

        <h1 className="text-3xl font-bold tracking-tight mb-8">Termos de Uso</h1>

        <div className="prose prose-sm max-w-none dark:prose-invert font-body space-y-6">
          <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>

          <h2>1. Aceitação dos Termos</h2>
          <p>Ao acessar e utilizar o FoConector, você concorda integralmente com estes Termos de Uso. Caso não concorde, recomendamos que não utilize nossos serviços.</p>

          <h2>2. Descrição do Serviço</h2>
          <p>A FoConector é um ambiente de estudos que oferece cadernos organizados, apuntes completos, flashcards com revisão espaçada baseada na curva de esquecimento, redações com correção por critérios e ferramentas de acompanhamento de progresso.</p>

          <h2>3. Cadastro e Conta</h2>
          <p>Para utilizar os serviços, é necessário criar uma conta fornecendo informações verdadeiras e atualizadas. Você é responsável pela segurança de sua conta, incluindo senha e dados de acesso.</p>

          <h2>4. Período de Teste</h2>
          <p>Todo novo usuário tem direito a um período de teste gratuito de 3 (três) dias a partir da data de cadastro. Após esse período, o acesso completo requer uma assinatura ativa.</p>

          <h2>5. Assinatura e Pagamentos</h2>
          <p>A FoConector oferece planos de assinatura mensal e anual. Os pagamentos são processados via Stripe, e as condições de renovação, cancelamento e reembolso seguem a política da plataforma de pagamentos. O cancelamento pode ser feito a qualquer momento pelo painel do usuário.</p>

          <h2>6. Programa de Indicação</h2>
          <p>Os usuários podem indicar amigos por meio de código exclusivo. Cada indicação bem-sucedida (em que o indicado realiza uma assinatura) concede 1 (um) mês gratuito adicional ao indicador. Ao atingir 10 indicações bem-sucedidas, o indicador recebe 1 (um) ano de acesso gratuito. O indicado recebe 10% de desconto na primeira assinatura.</p>

          <h2>7. Conteúdo Educacional</h2>
          <p>O conteúdo educacional disponibilizado na FoConector tem caráter complementar. Recomendamos o uso em conjunto com fontes oficiais de estudo.</p>

          <h2>8. Propriedade Intelectual</h2>
          <p>Todo o conteúdo da plataforma, incluindo código, design, marcas e materiais didáticos, é de propriedade da FoConector ou licenciado a ela. O conteúdo gerado pelo usuário (redações, anotações, grifos) pertence ao próprio usuário.</p>

          <h2>9. Uso Adequado</h2>
          <p>É proibido: (a) compartilhar credenciais de acesso; (b) reproduzir ou distribuir o conteúdo da plataforma sem autorização; (c) tentar acessar dados de outros usuários; (d) utilizar a plataforma para fins ilícitos.</p>

          <h2>10. Limitação de Responsabilidade</h2>
          <p>A FoConector não se responsabiliza por resultados em provas, concursos ou exames. A plataforma é uma ferramenta de apoio aos estudos e o desempenho depende do empenho individual de cada usuário.</p>

          <h2>11. Alterações nos Termos</h2>
          <p>A FoConector reserva-se o direito de alterar estes Termos a qualquer momento, mediante aviso prévio na plataforma. A continuidade do uso após alterações implica aceitação dos novos termos.</p>

          <h2>12. Contato</h2>
          <p>Para dúvidas, sugestões ou reclamações:</p>
          <ul>
            <li><strong>E-mail:</strong> suporte@foconector.com.br</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
