import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Brain, Map, ChevronRight, Loader2, PenTool } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exam, setExam] = useState<Tables<'exams'> | null>(null);
  const [notebooks, setNotebooks] = useState<Tables<'notebooks'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});

  const formatNotebookName = (name: string) => name.replace(/^caderno\s*\d+\s*[:\-–—]\s*/i, '').trim();

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const [examRes, notebooksRes] = await Promise.all([
        supabase.from('exams').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('notebooks').select('*').eq('exam_id', id).eq('user_id', user.id).order('sort_order'),
      ]);
      setExam(examRes.data);
      setNotebooks(notebooksRes.data || []);
      if (notebooksRes.data?.length) {
        const counts: Record<string, number> = {};
        for (const nb of notebooksRes.data) {
          const { count } = await supabase.from('study_notes').select('*', { count: 'exact', head: true }).eq('notebook_id', nb.id);
          counts[nb.id] = count || 0;
        }
        setNoteCounts(counts);
      }
      setLoading(false);
    };
    load();
  }, [user, id]);

  const examTypeLabel = (type: string) => {
    if (type === 'enem') return 'ENEM';
    if (type === 'freeform') return 'Tema Livre';
    return 'Concurso';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton-pulse h-8 w-64" />
        <div className="skeleton-pulse h-4 w-32" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-pulse h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Estudo não encontrado.</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mt-4">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{exam.name}</h1>
          <p className="text-sm text-muted-foreground font-mono uppercase">{examTypeLabel(exam.exam_type)} · {notebooks.length} caderno{notebooks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(exam.syllabus || exam.mind_map) && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/exams/${id}/mindmap`)}><Map className="h-4 w-4 mr-1" /> Mapa Mental</Button>
        )}
        {exam.exam_type === 'enem' && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/exams/${id}/essays`)}><PenTool className="h-4 w-4 mr-1" /> Redação</Button>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Cadernos</h2>
        {notebooks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {exam.syllabus ? 'Nenhum caderno encontrado.' : 'O conteúdo programático ainda está sendo processado. Recarregue em alguns instantes.'}
            </p>
            {!exam.syllabus && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}><Loader2 className="h-4 w-4 mr-1" /> Recarregar</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notebooks.map((nb) => (
              <div key={nb.id} className="group rounded-lg border bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => navigate(`/notebooks/${nb.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{formatNotebookName(nb.name)}</h3>
                    {nb.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{nb.description}</p>}
                    <p className="text-xs font-mono text-muted-foreground mt-2">{noteCounts[nb.id] || 0} apunte{(noteCounts[nb.id] || 0) !== 1 ? 's' : ''}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}