import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';

export default function PrivacyPage() {
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

        <h1 className="text-3xl font-bold tracking-tight mb-8">Política de Privacidade</h1>

        <div className="prose prose-sm max-w-none dark:prose-invert font-body space-y-6">
          <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>

          <h2>1. Dados Coletados</h2>
          <p>A FoConector coleta os seguintes dados pessoais:</p>
          <ul>
            <li><strong>Dados de cadastro:</strong> nome, e-mail e senha (criptografada).</li>
            <li><strong>Dados de uso:</strong> páginas acessadas, tempo de estudo, flashcards revisados, notas lidas, redações escritas.</li>
            <li><strong>Dados de pagamento:</strong> processados integralmente pelo Stripe. A FoConector não armazena números de cartão de crédito.</li>
          </ul>

          <h2>2. Finalidade do Tratamento</h2>
          <p>Os dados coletados são utilizados para:</p>
          <ul>
            <li>Fornecer e personalizar os serviços da plataforma;</li>
            <li>Calcular e exibir progresso de estudo, streak e gamificação;</li>
            <li>Processar assinaturas e pagamentos;</li>
            <li>Gerenciar o programa de indicações e comissões;</li>
            <li>Enviar comunicações essenciais sobre a conta;</li>
            <li>Melhorar a qualidade do conteúdo educacional.</li>
          </ul>

          <h2>3. Compartilhamento de Dados</h2>
          <p>A FoConector não vende, aluga ou compartilha dados pessoais com terceiros para fins comerciais. Os dados são compartilhados apenas com:</p>
          <ul>
            <li><strong>Stripe:</strong> para processamento de pagamentos;</li>
            <li><strong>Provedores de infraestrutura:</strong> para hospedagem e funcionamento da plataforma;</li>
            <li><strong>Autoridades legais:</strong> quando exigido por lei ou ordem judicial.</li>
          </ul>

          <h2>4. Segurança dos Dados</h2>
          <p>Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo:</p>
          <ul>
            <li>Criptografia de senhas;</li>
            <li>Políticas de segurança em nível de linha (RLS) no banco de dados;</li>
            <li>Transmissão de dados via HTTPS;</li>
            <li>Acesso restrito a dados pessoais pela equipe autorizada.</li>
          </ul>

          <h2>5. Seus Direitos (LGPD)</h2>
          <p>Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</p>
          <ul>
            <li>Acessar seus dados pessoais;</li>
            <li>Corrigir dados incompletos ou desatualizados;</li>
            <li>Solicitar a exclusão de seus dados;</li>
            <li>Revogar consentimento;</li>
            <li>Solicitar a portabilidade dos dados.</li>
          </ul>

          <h2>6. Cookies e Tecnologias de Rastreamento</h2>
          <p>Utilizamos cookies essenciais para manter sua sessão ativa e preferências (como tema claro/escuro). Não utilizamos cookies de rastreamento publicitário.</p>

          <h2>7. Retenção de Dados</h2>
          <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após exclusão da conta, os dados pessoais são removidos em até 30 dias, exceto quando a retenção for exigida por lei.</p>

          <h2>8. Alterações nesta Política</h2>
          <p>Podemos atualizar esta política periodicamente. Alterações significativas serão comunicadas por e-mail ou aviso na plataforma.</p>

          <h2>9. Contato do Encarregado de Dados</h2>
          <p>Para exercer seus direitos ou esclarecer dúvidas sobre privacidade:</p>
          <ul>
            <li><strong>E-mail:</strong> suporte@foconector.com.br</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
