import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

export default function NotebookPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notebook, setNotebook] = useState<Tables<'notebooks'> | null>(null);
  const [notes, setNotes] = useState<Tables<'study_notes'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [genProgress, setGenProgress] = useState(0);

  const formatNotebookName = (name: string) => name.replace(/^caderno\s*\d+\s*[:\-–—]\s*/i, '').trim();

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const [nbRes, notesRes] = await Promise.all([
        supabase.from('notebooks').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('study_notes').select('*').eq('notebook_id', id).eq('user_id', user.id).order('sort_order'),
      ]);
      setNotebook(nbRes.data);
      setNotes(notesRes.data || []);
      setLoading(false);
    };
    load();
  }, [user, id]);

  const handleGenerateNote = async (noteId: string) => {
    setGenerating(noteId);
    setGenProgress(0);
    // Simulate progress
    const interval = setInterval(() => {
      setGenProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + Math.random() * 18;
      });
    }, 550);

    try {
      const { error } = await supabase.functions.invoke('generate-note', { body: { note_id: noteId } });
      if (error) throw error;
      clearInterval(interval);
      setGenProgress(100);
      const { data } = await supabase.from('study_notes').select('*').eq('notebook_id', id).eq('user_id', user!.id).order('sort_order');
      setNotes(data || []);
      toast({ title: 'Conteúdo gerado', description: 'Apunte pronto para estudo.' });
    } catch (err: any) {
      clearInterval(interval);
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(null);
      setGenProgress(0);
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pendente', color: 'bg-muted text-muted-foreground' },
      generating: { label: 'Gerando...', color: 'bg-chart-3/20 text-chart-3' },
      ready: { label: 'Pronto', color: 'bg-accent/20 text-accent' },
      studying: { label: 'Estudando', color: 'bg-chart-4/20 text-chart-4' },
      completed: { label: 'Concluído', color: 'bg-primary/20 text-primary' },
    };
    return map[status] || map.pending;
  };

  if (loading) {
    return (<div className="space-y-4"><div className="skeleton-pulse h-8 w-48" />{[1, 2, 3].map(i => <div key={i} className="skeleton-pulse h-16 rounded-lg" />)}</div>);
  }
  if (!notebook) return <p className="text-muted-foreground">Caderno não encontrado.</p>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{formatNotebookName(notebook.name)}</h1>
          {notebook.description && <p className="text-sm text-muted-foreground">{notebook.description}</p>}
        </div>
      </div>

      <div className="space-y-2">
        {notes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum apunte neste caderno ainda.</p>
          </div>
        ) : (
          notes.map((note) => {
            const st = statusLabel(note.status);
            const isGenerating = generating === note.id;
            return (
              <div key={note.id} className="group rounded-lg border bg-card p-4 hover:shadow-sm transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{note.title}</h3>
                    <span className={`inline-flex items-center mt-1 text-xs px-2 py-0.5 rounded-full font-mono ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {note.status === 'pending' && (
                      <Button size="sm" onClick={() => handleGenerateNote(note.id)} disabled={!!generating}>
                        {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Gerar
                      </Button>
                    )}
                    {(note.status === 'ready' || note.status === 'studying' || note.status === 'completed') && (
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/notes/${note.id}`)}>Ler <ChevronRight className="h-3 w-3" /></Button>
                    )}
                  </div>
                </div>
                {isGenerating && (
                  <div className="mt-3 space-y-1">
                    <Progress value={genProgress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">Gerando conteúdo completo... {Math.round(genProgress)}%</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
