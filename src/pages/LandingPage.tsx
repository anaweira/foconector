import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Brain, Target, Zap, ArrowRight, CheckCircle2,
  GraduationCap, PenTool, Lightbulb, Map, Highlighter, BarChart3, TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

const studyModes = [
  {
    icon: GraduationCap, title: 'Ranked', subtitle: 'Concursos Públicos',
    desc: 'Suba o edital do seu concurso e receba automaticamente cadernos organizados por matéria, apuntes completos e questões no padrão exato da banca examinadora.',
    features: ['Análise automática do edital em segundos', '6 modelos de questão por ponto do conteúdo', 'Questões calibradas com provas anteriores da banca', 'Flashcards com revisão espaçada'],
    color: 'primary',
  },
  {
    icon: BookOpen, title: 'Sigma', subtitle: 'ENEM',
    desc: 'Conteúdo programático completo de todas as áreas do ENEM, com gerador de temas de redação baseado em assuntos da atualidade e correção detalhada por competência.',
    features: ['Linguagens, Humanas, Natureza e Matemática', 'Gerador ilimitado de temas de redação', 'Correção com nota por competência (0 a 1000)', 'Coletânea com textos motivadores'],
    color: 'chart-4',
  },
  {
    icon: Lightbulb, title: 'Genius', subtitle: 'Aprenda Qualquer Coisa',
    desc: 'Digite qualquer tema ou assunto e o sistema gera uma trilha de aprendizado completa: do nível zero ao domínio absoluto, com a mesma profundidade de um curso especializado.',
    features: ['Mapa mental interativo do conteúdo', 'Cadernos e apuntes gerados automaticamente', 'Questões com alternativas e revisão espaçada', 'Ideal para autodidatas e curiosos'],
    color: 'accent',
  },
];

const features = [
  { icon: Map, title: 'Mapa Mental Interativo', desc: 'Visualize todo o conteúdo programático conectado em um mapa visual, com zoom e navegação livre.' },
  { icon: Brain, title: 'Revisão Espaçada Científica', desc: 'Sistema de flashcards com revisão espaçada baseado na curva de esquecimento, garantindo retenção de longo prazo com o mínimo de repetições.' },
  { icon: Highlighter, title: 'Grifo e Anotações', desc: 'Selecione trechos do texto, marque com cores diferentes e adicione anotações diretamente no conteúdo.' },
  { icon: BarChart3, title: 'Estatísticas Detalhadas', desc: 'Acompanhe sua evolução por disciplina, taxa de acerto nos flashcards e dias consecutivos de estudo.' },
  { icon: Target, title: 'Questões com Alternativas', desc: 'Flashcards no formato de questão objetiva com 5 alternativas, simulando provas reais. Alternativas reembaralhadas a cada revisão.' },
  { icon: GraduationCap, title: 'Do Zero à Expertise', desc: 'O conteúdo é gerado com amplitude e profundidade total, sem simplificações. Você sai do zero ao domínio completo de qualquer assunto.' },
];

const steps = [
  { step: '01', title: 'Escolha seu modo de estudo', desc: 'Concurso público, ENEM ou qualquer tema que queira dominar.' },
  { step: '02', title: 'Receba cadernos organizados', desc: 'O sistema analisa o conteúdo e cria dezenas de cadernos por matéria automaticamente.' },
  { step: '03', title: 'Estude os apuntes', desc: 'Gere apuntes completos para cada ponto. Grife, comente e domine o conteúdo técnico.' },
  { step: '04', title: 'Revise com flashcards', desc: 'Questões com alternativas e revisão espaçada científica. Estude todos os dias e acompanhe seu progresso.' },
];

const stats = [
  { value: '50.000+', label: 'Flashcards gerados' },
  { value: '87%', label: 'Taxa de acerto média' },
  { value: '3', label: 'Modos de estudo' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-panel border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="FoConector" className="h-8 w-8 rounded-full" />
            <span className="text-lg font-semibold tracking-tight">FoConector</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button variant="default" size="sm" onClick={() => navigate('/dashboard')}>Painel</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Entrar</Button>
                <Button variant="hero" size="default" onClick={() => navigate('/auth')}>Começar Grátis</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground">
            <Zap className="h-3.5 w-3.5" /> Processamento de conteúdo automatizado
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Domine qualquer conteúdo com{' '}<span className="text-gradient">profundidade total.</span>
          </h1>
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.24em] text-primary">Conectando seu foco à aprovação</p>
          <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
            Concursos públicos, ENEM ou qualquer assunto: receba cadernos organizados, apuntes completos, questões com alternativas e revisão espaçada científica.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" onClick={() => navigate('/auth')}>Começar Agora <ArrowRight className="h-5 w-5" /></Button>
            <Button variant="outline" size="xl" onClick={() => document.getElementById('modes')?.scrollIntoView({ behavior: 'smooth' })}>Ver Modos de Estudo</Button>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y bg-secondary/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold font-mono text-primary">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modes */}
      <section id="modes" className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Três modos de estudo poderosos</h2>
          <p className="mt-4 text-muted-foreground">Escolha como quer estudar. Cada modo foi projetado para levar você do zero ao domínio completo.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {studyModes.map((mode, i) => (
            <motion.div key={mode.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15, duration: 0.5 }} viewport={{ once: true }} className="rounded-xl border bg-card p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-${mode.color}/10`}>
                <mode.icon className={`h-6 w-6 text-${mode.color}`} />
              </div>
              <h3 className="mb-1 text-xl font-bold">{mode.title}</h3>
              <p className="text-sm text-primary/70 font-medium mb-3">{mode.subtitle}</p>
              <p className="text-sm text-muted-foreground mb-6">{mode.desc}</p>
              <ul className="space-y-3">
                {mode.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 text-${mode.color}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Spaced Repetition / Forgetting Curve Section */}
      <section className="border-t bg-card/50 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <TrendingDown className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Por que flashcards com revisão espaçada?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A ciência da memória mostra que esquecemos até 80% do que estudamos em apenas 48 horas. A revisão espaçada resolve esse problema de forma definitiva.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-12">
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold text-lg mb-3 text-destructive">❌ Estudo tradicional</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Relê o material inteiro antes da prova</li>
                  <li>• Esquece 80% em 48h (Curva de Ebbinghaus)</li>
                  <li>• Sensação de saber que não resiste ao teste</li>
                  <li>• Horas desperdiçadas revisando tudo de novo</li>
                </ul>
              </div>
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
                <h3 className="font-semibold text-lg mb-3 text-primary">✅ Revisão espaçada (FoConector)</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Revisa no momento exato antes de esquecer</li>
                  <li>• Intervalos crescentes: 1 dia, 3, 7, 15, 30+</li>
                  <li>• Retenção de 90%+ a longo prazo comprovada</li>
                  <li>• Estuda menos, lembra mais</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Como funciona a Curva de Esquecimento</h3>
              <div className="space-y-4 text-sm text-muted-foreground font-body">
                <p>
                  Em 1885, o psicólogo Hermann Ebbinghaus descobriu que a memória humana decai exponencialmente após o aprendizado. Esse fenômeno ficou conhecido como <strong className="text-foreground">Curva de Esquecimento</strong>. Sem revisão, retemos apenas 20% do conteúdo após uma semana.
                </p>
                <p>
                  A <strong className="text-foreground">revisão espaçada</strong> combate esse efeito programando revisões nos momentos ideais. Cada vez que você revisa com sucesso, o intervalo até a próxima revisão aumenta. Com o tempo, a informação é consolidada na memória de longo prazo.
                </p>
                <p>
                  No FoConector, nosso algoritmo analisa seu desempenho em cada flashcard e calcula automaticamente quando você deve revisar. Acertou fácil? O intervalo aumenta. Errou? Revisa novamente em breve. É a forma mais eficiente de estudar comprovada pela neurociência.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary/20 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Ferramentas que fazem a diferença</h2>
            <p className="mt-4 text-muted-foreground">Cada funcionalidade foi pensada para maximizar sua retenção e eficiência nos estudos.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.4 }} viewport={{ once: true }} className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Como funciona</h2>
            <p className="mt-4 text-muted-foreground">Quatro passos simples para começar a estudar com profundidade.</p>
          </div>
          <div className="mx-auto max-w-3xl space-y-8">
            {steps.map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }} viewport={{ once: true }} className="flex gap-6 items-start">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-mono font-bold text-primary-foreground">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5 py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Pronto para dominar qualquer conteúdo?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Sua aprovação começa com organização. Crie sua conta gratuita e comece a estudar agora mesmo.</p>
          <Button variant="hero" size="xl" onClick={() => navigate('/auth')}>Criar Conta Grátis <ArrowRight className="h-5 w-5" /></Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <img src={logo} alt="FoConector" className="h-5 w-5 rounded-full" />
              <span>FoConector © {new Date().getFullYear()}</span>
            </div>
            <div className="text-center sm:text-left">
              <div>suporte@foconector.com.br</div>
              <div className="text-xs">Conectando seu foco à aprovação</div>
            </div>
            <div className="flex gap-4">
              <Link to="/terms" className="hover:text-foreground transition-colors">Termos</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
