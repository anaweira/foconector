import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateSRS } from '@/lib/srs';
import { useToast } from '@/hooks/use-toast';
import { useStudyTracker } from '@/hooks/useStudyTracker';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import type { Tables } from '@/integrations/supabase/types';

type FlashcardWithAlts = Tables<'flashcards'> & {
  alternatives?: { text: string; correct: boolean }[] | null;
};

type ExamInfo = { id: string; name: string; exam_type: string };

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Quality buttons matching Anki's 4-button system
const QUALITY_BUTTONS = [
  { quality: 1, label: 'De Novo', color: 'border-destructive/40 text-destructive hover:bg-destructive/10' },
  { quality: 2, label: 'Difícil', color: 'border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10' },
  { quality: 3, label: 'Bom', color: 'border-accent/40 text-accent hover:bg-accent/10' },
  { quality: 4, label: 'Fácil', color: 'border-primary/40 text-primary hover:bg-primary/10' },
];

function formatInterval(days: number): string {
  if (days < 1) return '< 1 min';
  if (days === 1) return '1 dia';
  if (days < 30) return `${days} dias`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? '1 mês' : `${months} meses`;
  }
  const years = (days / 365).toFixed(1);
  return `${years} ano${Number(years) !== 1 ? 's' : ''}`;
}

export default function ReviewPage() {
  const { user } = useAuth();
  const { trackActivity } = useStudyTracker();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const noteId = searchParams.get('note');
  const { toast } = useToast();
  const [cardsByExam, setCardsByExam] = useState<Record<string, { exam: ExamInfo; cards: FlashcardWithAlts[] }>>({});
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [cards, setCards] = useState<FlashcardWithAlts[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  const [showResult, setShowResult] = useState(false);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (noteId) {
        const { data } = await supabase.from('flashcards').select('*').eq('user_id', user.id).eq('study_note_id', noteId).lte('next_review', new Date().toISOString()).order('next_review').limit(50);
        setCards((data || []) as FlashcardWithAlts[]);
        setSelectedExamId('single');
        setLoading(false);
        return;
      }

      const { data: allCards } = await supabase.from('flashcards').select('*').eq('user_id', user.id).lte('next_review', new Date().toISOString()).order('next_review').limit(200);

      if (!allCards || allCards.length === 0) {
        setLoading(false);
        return;
      }

      const noteIds = [...new Set(allCards.map(c => c.study_note_id))];
      const { data: notes } = await supabase.from('study_notes').select('id, notebook_id').in('id', noteIds);
      const notebookIds = [...new Set((notes || []).map(n => n.notebook_id))];
      const { data: notebooks } = await supabase.from('notebooks').select('id, exam_id').in('id', notebookIds);
      const examIds = [...new Set((notebooks || []).map(nb => nb.exam_id))];
      const { data: exams } = await supabase.from('exams').select('id, name, exam_type').in('id', examIds);

      const noteToNotebook: Record<string, string> = {};
      (notes || []).forEach(n => { noteToNotebook[n.id] = n.notebook_id; });
      const notebookToExam: Record<string, string> = {};
      (notebooks || []).forEach(nb => { notebookToExam[nb.id] = nb.exam_id; });
      const examMap: Record<string, ExamInfo> = {};
      (exams || []).forEach(e => { examMap[e.id] = e as ExamInfo; });

      const grouped: Record<string, { exam: ExamInfo; cards: FlashcardWithAlts[] }> = {};
      for (const card of allCards) {
        const nbId = noteToNotebook[card.study_note_id];
        const examId = nbId ? notebookToExam[nbId] : 'unknown';
        if (!grouped[examId]) {
          grouped[examId] = { exam: examMap[examId] || { id: examId, name: 'Outros', exam_type: 'unknown' }, cards: [] };
        }
        grouped[examId].cards.push(card as FlashcardWithAlts);
      }

      setCardsByExam(grouped);
      setLoading(false);
    };
    load();
  }, [user, noteId]);

  const examTypeLabel = (type: string) => {
    if (type === 'enem') return 'Sigma';
    if (type === 'freeform') return 'Genius';
    return 'Ranked';
  };

  const startExamReview = (examId: string) => {
    const group = cardsByExam[examId];
    if (!group) return;
    setCards(group.cards);
    setSelectedExamId(examId);
    setCurrentIndex(0);
    setCompleted(false);
    setStats({ correct: 0, incorrect: 0 });
    setShowResult(false);
    setFlipped(false);
  };

  const card = cards[currentIndex];

  const shuffledAlts = useMemo(() => {
    if (!card) return [];
    const alts = (card as any).alternatives;
    if (alts && Array.isArray(alts) && alts.length > 0) {
      return shuffleArray(alts);
    }
    return [];
  }, [card?.id, currentIndex]);

  const hasAlternatives = shuffledAlts.length > 0;

  // Preview intervals for all 4 quality levels
  const previewIntervals = useMemo(() => {
    if (!card) return [];
    return QUALITY_BUTTONS.map(btn => {
      const result = calculateSRS(btn.quality, card.repetitions, card.interval_days, card.ease_factor);
      return { ...btn, interval: result.interval };
    });
  }, [card?.id, card?.repetitions, card?.interval_days, card?.ease_factor]);

  const handleNext = useCallback(async (quality: number) => {
    if (!user || !card) return;
    const result = calculateSRS(quality, card.repetitions, card.interval_days, card.ease_factor);
    await supabase.from('flashcards').update({
      interval_days: result.interval, repetitions: result.repetitions,
      ease_factor: result.easeFactor, next_review: result.nextReview.toISOString()
    }).eq('id', card.id);
    await supabase.from('flashcard_reviews').insert({ flashcard_id: card.id, user_id: user.id, quality });
    trackActivity('flashcard_reviewed');
    setStats(prev => ({
      correct: prev.correct + (quality >= 3 ? 1 : 0),
      incorrect: prev.incorrect + (quality < 3 ? 1 : 0),
    }));
    setShowResult(false);
    setFlipped(false);
    if (currentIndex + 1 >= cards.length) setCompleted(true);
    else setCurrentIndex(prev => prev + 1);
  }, [cards, currentIndex, user, card]);

  const goBack = () => {
    if (noteId) return navigate(-1);
    if (selectedExamId && selectedExamId !== 'single') {
      setSelectedExamId(null);
      setCards([]);
      setCurrentIndex(0);
      setCompleted(false);
      return;
    }
    navigate('/dashboard');
  };

  // --- 4-button quality rating component ---
  const QualityButtons = () => (
    <div className="grid grid-cols-4 gap-2">
      {previewIntervals.map((btn) => (
        <button
          key={btn.quality}
          onClick={() => handleNext(btn.quality)}
          className={`flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-3 transition-colors ${btn.color}`}
        >
          <span className="text-[10px] font-mono opacity-70">{formatInterval(btn.interval)}</span>
          <span className="text-xs font-semibold">{btn.label}</span>
        </button>
      ))}
    </div>
  );

  if (loading) return (<div className="max-w-2xl mx-auto space-y-4"><div className="skeleton-pulse h-8 w-48" /><div className="skeleton-pulse h-72 rounded-lg" /></div>);

  // Exam selection screen
  if (!noteId && !selectedExamId) {
    const examEntries = Object.entries(cardsByExam);
    if (examEntries.length === 0) {
      return (
        <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4"><Check className="h-8 w-8 text-accent" /></div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Tudo em dia!</h2>
          <p className="text-muted-foreground mb-6">Nenhum flashcard pendente para revisão agora.</p>
          <Button onClick={() => navigate('/dashboard')}>Voltar ao Painel</Button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4 mr-1" /> Painel</Button>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Revisões do Dia</h1>
        <p className="text-muted-foreground mb-6">Selecione um estudo para revisar os flashcards pendentes.</p>
        <div className="space-y-3">
          {examEntries.map(([examId, group]) => (
            <div key={examId} className="rounded-lg border bg-card p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => startExamReview(examId)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-2 w-2 rounded-full ${group.exam.exam_type === 'enem' ? 'bg-chart-4' : group.exam.exam_type === 'freeform' ? 'bg-accent' : 'bg-primary'}`} />
                    <span className="text-xs font-mono uppercase text-muted-foreground">{examTypeLabel(group.exam.exam_type)}</span>
                  </div>
                  <h3 className="font-semibold">{group.exam.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{group.cards.length} flashcard{group.cards.length !== 1 ? 's' : ''} pendente{group.cards.length !== 1 ? 's' : ''}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4"><Check className="h-8 w-8 text-accent" /></div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Tudo em dia!</h2>
        <p className="text-muted-foreground mb-6">{noteId ? 'Nenhum flashcard pendente para este apunte.' : 'Nenhum flashcard pendente para revisão agora.'}</p>
        <Button onClick={goBack}>Voltar</Button>
      </div>
    );
  }

  if (completed) {
    const total = stats.correct + stats.incorrect;
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4"><Check className="h-8 w-8 text-accent" /></div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Sessão concluída!</h2>
        <div className="flex justify-center gap-8 my-6">
          <div className="text-center"><div className="text-3xl font-bold font-mono text-accent">{stats.correct}</div><div className="text-xs text-muted-foreground">Acertos</div></div>
          <div className="text-center"><div className="text-3xl font-bold font-mono text-destructive">{stats.incorrect}</div><div className="text-xs text-muted-foreground">Erros</div></div>
        </div>
        <p className="text-muted-foreground mb-6">Taxa de acerto: {total > 0 ? Math.round((stats.correct / total) * 100) : 0}%</p>
        <Button onClick={goBack}>Voltar</Button>
      </div>
    );
  }

  const correctAlternative = shuffledAlts.find((alt: any) => alt.correct);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
        <span className="text-sm font-mono text-muted-foreground">{currentIndex + 1} / {cards.length}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((currentIndex) / cards.length) * 100}%` }} />
      </div>

      {hasAlternatives ? (
        <div className="space-y-4">
          <div className="rounded-xl border-2 bg-card p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-muted-foreground uppercase">QUESTÃO</span>
              <Badge variant="secondary" className="text-xs font-mono">Flashcard</Badge>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert font-body">
              <ReactMarkdown>{card.front}</ReactMarkdown>
            </div>
            <div className="mt-6 space-y-3">
              {shuffledAlts.map((alt: any, idx: number) => (
                <div key={idx} className="rounded-lg border bg-background p-4 text-sm leading-relaxed">
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-0">
                    <ReactMarkdown>{alt.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-mono text-muted-foreground mb-2 uppercase">Resposta correta</p>
                <div className="prose prose-sm max-w-none dark:prose-invert font-body text-sm prose-p:my-0">
                  <ReactMarkdown>{correctAlternative?.text || card.back}</ReactMarkdown>
                </div>
              </div>
              <QualityButtons />
            </motion.div>
          )}

          {!showResult && (
            <Button onClick={() => setShowResult(true)} className="w-full" size="lg">
              Ver resposta <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="relative cursor-pointer" onClick={() => !flipped && setFlipped(true)} style={{ perspective: '1000px' }}>
            <AnimatePresence mode="wait">
              <motion.div key={`${card.id}-${flipped}`} initial={{ rotateY: flipped ? -90 : 0, opacity: flipped ? 0 : 1 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.25 }} className="rounded-xl border-2 bg-card p-6 sm:p-8 min-h-[320px] flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-muted-foreground uppercase">{flipped ? 'RESPOSTA' : 'QUESTÃO'}</span>
                  <Badge variant="secondary" className="text-xs font-mono">Flashcard</Badge>
                </div>
                <div className="flex-1 font-body text-sm sm:text-base leading-relaxed">
                  {flipped ? (
                    <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                      <div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown>{card.back}</ReactMarkdown></div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown>{card.front}</ReactMarkdown></div>
                  )}
                </div>
                {!flipped && <p className="text-xs text-muted-foreground mt-4 text-center">Toque para ver a resposta</p>}
              </motion.div>
            </AnimatePresence>
          </div>
          {flipped && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <QualityButtons />
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}