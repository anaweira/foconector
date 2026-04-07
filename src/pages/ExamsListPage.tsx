import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, GraduationCap, BookOpen, ChevronRight, Lightbulb, Trash2, Pencil, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

export default function ExamsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exams, setExams] = useState<Tables<'exams'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('exams').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setExams(data || []);
      setLoading(false);
    });
  }, [user]);

  const examIcon = (type: string) => {
    if (type === 'enem') return <BookOpen className="h-5 w-5 text-chart-4" />;
    if (type === 'freeform') return <Lightbulb className="h-5 w-5 text-accent" />;
    return <GraduationCap className="h-5 w-5 text-primary" />;
  };

  const examBg = (type: string) => {
    if (type === 'enem') return 'bg-chart-4/10';
    if (type === 'freeform') return 'bg-accent/10';
    return 'bg-primary/10';
  };

  const examLabel = (type: string) => {
    if (type === 'enem') return 'ENEM';
    if (type === 'freeform') return 'Tema Livre';
    return 'Concurso';
  };

  const handleRename = async () => {
    if (!renameId || !renameName.trim()) return;
    await supabase.from('exams').update({ name: renameName.trim() }).eq('id', renameId);
    setExams(prev => prev.map(e => e.id === renameId ? { ...e, name: renameName.trim() } : e));
    setRenameId(null);
    toast({ title: 'Renomeado' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { data: notebooks } = await supabase.from('notebooks').select('id').eq('exam_id', deleteId);
    if (notebooks?.length) {
      const nbIds = notebooks.map(n => n.id);
      const { data: notes } = await supabase.from('study_notes').select('id').in('notebook_id', nbIds);
      if (notes?.length) {
        const noteIds = notes.map(n => n.id);
        const { data: flashcards } = await supabase.from('flashcards').select('id').in('study_note_id', noteIds);
        if (flashcards?.length) {
          await supabase.from('flashcard_reviews').delete().in('flashcard_id', flashcards.map(f => f.id));
          await supabase.from('flashcards').delete().in('study_note_id', noteIds);
        }
        await supabase.from('note_highlights').delete().in('study_note_id', noteIds);
        await supabase.from('study_notes').delete().in('notebook_id', nbIds);
      }
      await supabase.from('notebooks').delete().eq('exam_id', deleteId);
    }
    await supabase.from('essays').delete().eq('exam_id', deleteId);
    await supabase.from('exams').delete().eq('id', deleteId);
    setExams(prev => prev.filter(e => e.id !== deleteId));
    setDeleteId(null);
    toast({ title: 'Estudo excluído' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton-pulse h-8 w-48" />
        {[1, 2, 3].map(i => <div key={i} className="skeleton-pulse h-20 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Meus Estudos</h1>
        <Button onClick={() => navigate('/exams/new')}><Plus className="h-4 w-4 mr-1" /> Novo Estudo</Button>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Nenhum estudo cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-6">Comece adicionando um concurso, ENEM ou qualquer tema.</p>
          <Button onClick={() => navigate('/exams/new')}><Plus className="h-4 w-4 mr-1" /> Começar a Estudar</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div key={exam.id} className="group flex items-center gap-4 rounded-lg border bg-card p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => navigate(`/exams/${exam.id}`)}>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${examBg(exam.exam_type)}`}>{examIcon(exam.exam_type)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{exam.name}</h3>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">{examLabel(exam.exam_type)} · {new Date(exam.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => { setRenameId(exam.id); setRenameName(exam.name); }}><Pencil className="h-4 w-4 mr-2" /> Renomear</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(exam.id)}><Trash2 className="h-4 w-4 mr-2" /> Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!renameId} onOpenChange={() => setRenameId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renomear estudo</DialogTitle></DialogHeader>
          <Input value={renameName} onChange={e => setRenameName(e.target.value)} autoFocus />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameId(null)}>Cancelar</Button>
            <Button onClick={handleRename}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir estudo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Isso removerá permanentemente todos os cadernos, apuntes e flashcards deste estudo. Deseja continuar?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}