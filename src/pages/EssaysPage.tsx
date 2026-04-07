import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, PenTool, Loader2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import type { Tables } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

type EssayWithCollection = Tables<'essays'> & {
  collection_text?: string | null;
};

export default function EssaysPage() {
  const { id: examId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [essays, setEssays] = useState<EssayWithCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingTheme, setGeneratingTheme] = useState(false);
  const [activeEssay, setActiveEssay] = useState<EssayWithCollection | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [customTheme, setCustomTheme] = useState('');
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [creatingCustom, setCreatingCustom] = useState(false);
  const [showCollection, setShowCollection] = useState(true);

  useEffect(() => {
    if (!user || !examId) return;
    supabase.from('essays').select('*').eq('exam_id', examId).eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setEssays((data || []) as EssayWithCollection[]); setLoading(false); });
  }, [user, examId]);

  const generateTheme = async () => {
    if (!user || !examId) return;
    setGeneratingTheme(true);
    try {
      await supabase.functions.invoke('generate-essay-theme', { body: { exam_id: examId } });
      const { data } = await supabase.from('essays').select('*').eq('exam_id', examId).eq('user_id', user.id).order('created_at', { ascending: false });
      setEssays((data || []) as EssayWithCollection[]);
      toast({ title: 'Proposta gerada', description: 'Nova proposta de redação com coletânea disponível.' });
    } catch (err: any) { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); }
    finally { setGeneratingTheme(false); }
  };

  const createCustomEssay = async () => {
    if (!user || !examId || !customTheme.trim()) return;
    setCreatingCustom(true);
    try {
      await supabase.from('essays').insert({ exam_id: examId, user_id: user.id, theme: customTheme.trim(), status: 'draft' });
      const { data } = await supabase.from('essays').select('*').eq('exam_id', examId).eq('user_id', user.id).order('created_at', { ascending: false });
      setEssays((data || []) as EssayWithCollection[]);
      setCustomTheme(''); setCustomDialogOpen(false);
      toast({ title: 'Tema criado' });
    } catch (err: any) { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); }
    finally { setCreatingCustom(false); }
  };

  const submitEssay = async () => {
    if (!activeEssay || !content.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('essays').update({ content: content.trim(), status: 'submitted' }).eq('id', activeEssay.id);
      await supabase.functions.invoke('grade-essay', { body: { essay_id: activeEssay.id } });
      const { data: updated } = await supabase.from('essays').select('*').eq('id', activeEssay.id).single();
      if (updated) { setActiveEssay(updated as EssayWithCollection); setEssays(prev => prev.map(e => e.id === updated.id ? updated as EssayWithCollection : e)); }
      toast({ title: 'Redação corrigida' });
    } catch (err: any) { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  if (activeEssay) {
    const score = activeEssay.score as any;
    const collectionText = (activeEssay as any).collection_text;
    return (
      <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setActiveEssay(null); setContent(''); }}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-xl font-bold tracking-tight">Redação</h1>
        </div>

        {/* Theme */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-lg mb-3 text-primary">Tema</h3>
          <p className="font-body text-xl font-bold leading-relaxed">{activeEssay.theme}</p>
        </div>

        {/* Coletânea */}
        {collectionText && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <button onClick={() => setShowCollection(!showCollection)} className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
              <h3 className="font-semibold text-sm">📄 Coletânea e textos motivadores</h3>
              {showCollection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showCollection && (
              <div className="px-6 pb-6 prose prose-sm max-w-none dark:prose-invert font-body
                prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
                prose-h4:text-sm prose-h4:mt-4 prose-h4:mb-1
                prose-p:my-3 prose-p:leading-relaxed
                prose-blockquote:border-primary/30 prose-blockquote:my-4
                prose-hr:my-6
              ">
                <ReactMarkdown>{collectionText}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {activeEssay.status === 'graded' ? (
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Sua Redação</h3>
              <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{activeEssay.content}</p>
            </div>
            {score && (
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-6 text-2xl">Nota: <span className="text-primary">{score.total || 0}</span> / 1000</h3>
                {score.competencies && (
                  <div className="space-y-5">
                    {score.competencies.map((c: any, i: number) => (
                      <div key={i} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">C{i + 1}</span>
                            <span className="text-sm font-semibold">{c.name}</span>
                          </div>
                          <span className="text-lg font-mono font-bold text-primary">{c.score}/200</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 font-body">{c.feedback}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeEssay.feedback && (
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-3">Comentários Gerais</h3>
                <div className="prose prose-sm max-w-none dark:prose-invert font-body prose-p:my-3"><ReactMarkdown>{activeEssay.feedback}</ReactMarkdown></div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escreva sua redação aqui..." className="min-h-[400px] font-body text-base leading-relaxed" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">{content.split(/\s+/).filter(Boolean).length} palavras</span>
              <Button onClick={submitEssay} disabled={submitting || !content.trim()}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Corrigindo...</> : 'Enviar para Correção'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/exams/${examId}`)}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1"><h1 className="text-2xl font-bold tracking-tight">Redação ENEM</h1><p className="text-sm text-muted-foreground">Pratique com propostas completas e receba correção por competência.</p></div>
        <div className="flex gap-2">
          <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><PenTool className="h-4 w-4 mr-1" /> Tema Livre</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Redação com tema personalizado</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4"><p className="text-sm text-muted-foreground">Digite o tema sobre o qual deseja escrever:</p><Textarea value={customTheme} onChange={(e) => setCustomTheme(e.target.value)} placeholder="Ex: A importância da educação financeira para jovens brasileiros" className="min-h-[100px]" /></div>
              <DialogFooter><Button onClick={createCustomEssay} disabled={creatingCustom || !customTheme.trim()}>{creatingCustom ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}Criar Redação</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={generateTheme} disabled={generatingTheme}>
            {generatingTheme ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Gerar Proposta
          </Button>
        </div>
      </div>

      {essays.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <PenTool className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Nenhuma redação ainda. Gere uma proposta completa com coletânea.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setCustomDialogOpen(true)}><PenTool className="h-4 w-4 mr-1" /> Tema Livre</Button>
            <Button onClick={generateTheme} disabled={generatingTheme}>{generatingTheme ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Gerar Proposta</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {essays.map((essay) => (
            <div key={essay.id} className="rounded-lg border bg-card p-4 cursor-pointer hover:shadow-sm transition-all" onClick={() => { setActiveEssay(essay); setContent(essay.content || ''); }}>
              <p className="font-medium text-sm line-clamp-2">{essay.theme}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${essay.status === 'graded' ? 'bg-accent/20 text-accent' : essay.status === 'submitted' ? 'bg-chart-3/20 text-chart-3' : 'bg-muted text-muted-foreground'}`}>
                  {essay.status === 'graded' ? 'Corrigida' : essay.status === 'submitted' ? 'Enviada' : 'Rascunho'}
                </span>
                {essay.status === 'graded' && (essay.score as any)?.total && <span className="text-xs font-mono font-bold">{(essay.score as any).total}/1000</span>}
                {(essay as any).collection_text && <span className="text-xs text-muted-foreground">📄 Com coletânea</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
