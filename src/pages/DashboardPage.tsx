import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CalendarCheck, BookOpen, Brain, Plus, ArrowRight, Zap, Flame, Gift } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

export default function DashboardPage() {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Tables<'exams'>[]>([]);
  const [dueFlashcards, setDueFlashcards] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [examsRes, flashcardsRes, notesRes, goalsRes] = await Promise.all([
        supabase.from('exams').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('flashcards').select('id').eq('user_id', user.id).lte('next_review', new Date().toISOString()),
        supabase.from('study_notes').select('id').eq('user_id', user.id),
        supabase.from('user_goals').select('current_streak, total_xp').eq('user_id', user.id).maybeSingle(),
      ]);
      setExams(examsRes.data || []);
      setDueFlashcards(flashcardsRes.data?.length || 0);
      setTotalNotes(notesRes.data?.length || 0);
      if (goalsRes.data) {
        setStreak((goalsRes.data as any).current_streak || 0);
        setTotalXp((goalsRes.data as any).total_xp || 0);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const examTypeLabel = (type: string) => {
    if (type === 'enem') return 'Sigma';
    if (type === 'freeform') return 'Genius';
    return 'Ranked';
  };

  const trialDaysLeft = subscription?.trial_end
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / 86400000))
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton-pulse h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-pulse h-28 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel de Estudos</h1>
        <p className="text-muted-foreground mt-1">Seu plano de batalha de hoje.</p>
      </div>

      {subscription?.lifetime && (
        <div className="rounded-lg border-2 border-primary bg-primary text-primary-foreground p-5">
          <h2 className="font-semibold">Acesso vitalício ativo</h2>
          <p className="text-sm text-primary-foreground/80 mt-1">
            Sua conta possui acesso completo permanente à plataforma.
          </p>
        </div>
      )}

      {subscription?.in_trial && trialDaysLeft > 0 && (
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Seu período gratuito está ativo</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Restam {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'} para testar a plataforma com acesso completo.
              </p>
            </div>
            <Button onClick={() => navigate('/paywall')}>Assinar Agora</Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/review')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Brain className="h-4 w-4 text-primary" /></div>
            <span className="text-sm font-medium text-muted-foreground">Revisões Hoje</span>
          </div>
          <div className="text-3xl font-bold font-mono">{dueFlashcards}</div>
          <p className="text-xs text-muted-foreground mt-1">flashcards pendentes</p>
        </div>

        <div className="rounded-lg border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5 p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/goals')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center"><Flame className="h-4 w-4 text-orange-500" /></div>
            <span className="text-sm font-medium text-muted-foreground">Streak</span>
          </div>
          <div className="text-3xl font-bold font-mono text-orange-500">{streak}</div>
          <p className="text-xs text-muted-foreground mt-1">{totalXp} XP total</p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center"><BookOpen className="h-4 w-4 text-accent" /></div>
            <span className="text-sm font-medium text-muted-foreground">Apuntes</span>
          </div>
          <div className="text-3xl font-bold font-mono">{totalNotes}</div>
          <p className="text-xs text-muted-foreground mt-1">apuntes criados</p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-chart-3/10 flex items-center justify-center"><Zap className="h-4 w-4 text-chart-3" /></div>
            <span className="text-sm font-medium text-muted-foreground">Estudos Ativos</span>
          </div>
          <div className="text-3xl font-bold font-mono">{exams.length}</div>
          <p className="text-xs text-muted-foreground mt-1">trilhas de estudo</p>
        </div>
      </div>

      {dueFlashcards > 0 && (
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Você tem {dueFlashcards} flashcard{dueFlashcards > 1 ? 's' : ''} para revisar</h3>
              <p className="text-sm text-muted-foreground mt-1">A consistência é o segredo da aprovação.</p>
            </div>
            <Button onClick={() => navigate('/review')}>
              Começar Revisão <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Referral CTA */}
      <div
        className="rounded-lg border-2 border-accent/20 bg-accent/5 p-5 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/referral')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Ganhe até 1 ano de acesso gratuito</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Indique amigos e acumule meses grátis</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-accent" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Meus Estudos</h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/exams/new')}>
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        </div>

        {exams.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <CalendarCheck className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Nenhum estudo cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-6">Comece subindo o edital do seu concurso, escolha ENEM ou aprenda qualquer assunto.</p>
            <Button onClick={() => navigate('/exams/new')}>
              <Plus className="h-4 w-4 mr-1" /> Começar a Estudar
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-lg border bg-card p-4 cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
                onClick={() => navigate(`/exams/${exam.id}`)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-2 w-2 rounded-full ${
                    exam.exam_type === 'enem' ? 'bg-chart-4'
                    : exam.exam_type === 'freeform' ? 'bg-accent'
                    : 'bg-primary'
                  }`} />
                  <span className="text-xs font-mono uppercase text-muted-foreground">
                    {examTypeLabel(exam.exam_type)}
                  </span>
                </div>
                <h3 className="font-semibold truncate">{exam.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Criado em {new Date(exam.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}