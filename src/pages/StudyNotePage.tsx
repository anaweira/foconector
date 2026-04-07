import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Brain, Loader2, MessageSquare, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { useStudyTracker } from '@/hooks/useStudyTracker';
import type { Tables } from '@/integrations/supabase/types';

const HIGHLIGHT_COLORS = [
  { name: 'Amarelo', value: 'yellow', bg: 'rgba(250, 204, 21, 0.4)', dark: 'rgba(234, 179, 8, 0.3)' },
  { name: 'Verde', value: 'green', bg: 'rgba(74, 222, 128, 0.4)', dark: 'rgba(34, 197, 94, 0.3)' },
  { name: 'Azul', value: 'blue', bg: 'rgba(96, 165, 250, 0.4)', dark: 'rgba(59, 130, 246, 0.3)' },
  { name: 'Rosa', value: 'pink', bg: 'rgba(244, 114, 182, 0.4)', dark: 'rgba(236, 72, 153, 0.3)' },
];

const COLOR_BG_MAP: Record<string, string> = {
  yellow: 'rgba(250, 204, 21, 0.4)',
  green: 'rgba(74, 222, 128, 0.4)',
  blue: 'rgba(96, 165, 250, 0.4)',
  pink: 'rgba(244, 114, 182, 0.4)',
};

const COLOR_BTN_MAP: Record<string, string> = {
  yellow: 'bg-yellow-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  pink: 'bg-pink-400',
};

type HighlightWithAnnotation = Tables<'note_highlights'> & {
  annotation?: string | null;
};

const sanitizeGeneratedMarkdown = (content: string) => content
  .replace(/\r\n/g, '\n')
  .replace(/[—–]/g, ',')
  .replace(/^Prezado\(a\)[\s\S]*?Vamos começar\.\s*/i, '')
  .replace(/^Seja bem-vindo\(a\)[\s\S]*?\n\n/im, '')
  .replace(/^Como seu professor,[\s\S]*?\n\n/im, '')
  .replace(/^Nosso objetivo[\s\S]*?\n\n/im, '')
  .replace(/^Este apunte[\s\S]*?\n\n/im, '')
  .replace(/\n*Estou à disposição[\s\S]*$/i, '')
  .replace(/\n*Bons estudos[\s\S]*$/i, '')
  .replace(/([^\n])\n(#{2,4}\s)/g, '$1\n\n$2')
  .replace(/(#{2,4}[^\n]+)\n([^\n])/g, '$1\n\n$2')
  .replace(/([^\n])\n([-*]\s)/g, '$1\n\n$2')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export default function StudyNotePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [note, setNote] = useState<Tables<'study_notes'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingCards, setGeneratingCards] = useState(false);
  const [cardProgress, setCardProgress] = useState(0);
  const { trackActivity } = useStudyTracker();
  const [hasFlashcards, setHasFlashcards] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [highlights, setHighlights] = useState<HighlightWithAnnotation[]>([]);
  const [selectionPopup, setSelectionPopup] = useState<{ x: number; y: number; text: string; startOffset: number; endOffset: number } | null>(null);
  const [annotationPopup, setAnnotationPopup] = useState<{ highlightId: string; text: string; x: number; y: number } | null>(null);
  const [annotationInput, setAnnotationInput] = useState('');
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const [noteRes, cardsRes, dueRes, highlightsRes] = await Promise.all([
        supabase.from('study_notes').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('study_note_id', id),
        supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('study_note_id', id).lte('next_review', new Date().toISOString()),
        supabase.from('note_highlights').select('*').eq('study_note_id', id).eq('user_id', user.id),
      ]);
      setNote(noteRes.data);
      setHasFlashcards((cardsRes.count || 0) > 0);
      setDueCount(dueRes.count || 0);
      setHighlights((highlightsRes.data || []) as HighlightWithAnnotation[]);
      if (noteRes.data && noteRes.data.status === 'ready') {
        await supabase.from('study_notes').update({ status: 'studying' }).eq('id', id);
        trackActivity('note_read');
      }
      setLoading(false);
    };
    load();
  }, [user, id]);

  // Apply highlights to rendered DOM
  useEffect(() => {
    if (!articleRef.current || !note?.content || highlights.length === 0) return;
    const timer = setTimeout(() => {
      applyHighlightsToDOM();
    }, 200);
    return () => clearTimeout(timer);
  }, [highlights, note?.content]);

  const applyHighlightsToDOM = () => {
    if (!articleRef.current) return;
    // Remove existing highlights
    articleRef.current.querySelectorAll('.user-highlight').forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    });

    const sortedHighlights = [...highlights].sort((a, b) => b.start_offset - a.start_offset);

    const getTextNodes = () => {
      const walker = document.createTreeWalker(articleRef.current!, NodeFilter.SHOW_TEXT);
      const nodes: Array<{ node: Text; start: number; end: number }> = [];
      let currentOffset = 0;
      let currentNode;
      while ((currentNode = walker.nextNode())) {
        const textNode = currentNode as Text;
        const text = textNode.textContent || '';
        nodes.push({ node: textNode, start: currentOffset, end: currentOffset + text.length });
        currentOffset += text.length;
      }
      return nodes;
    };

    for (const h of sortedHighlights) {
      const textNodes = getTextNodes();
      const startNode = textNodes.find((entry) => h.start_offset >= entry.start && h.start_offset <= entry.end);
      const endNode = textNodes.find((entry) => h.end_offset >= entry.start && h.end_offset <= entry.end);
      if (!startNode || !endNode) continue;

      const range = document.createRange();
      range.setStart(startNode.node, Math.max(0, h.start_offset - startNode.start));
      range.setEnd(endNode.node, Math.max(0, h.end_offset - endNode.start));

      const span = document.createElement('span');
      span.className = 'user-highlight cursor-pointer relative';
      span.style.backgroundColor = COLOR_BG_MAP[h.color] || COLOR_BG_MAP.yellow;
      span.style.borderRadius = '2px';
      span.style.padding = '1px 0';
      span.dataset.highlightId = h.id;

      const fragment = range.extractContents();
      span.appendChild(fragment);

      if ((h as any).annotation) {
        const icon = document.createElement('span');
        icon.className = 'ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]';
        icon.textContent = '✎';
        span.appendChild(icon);
      }

      range.insertNode(span);

      span.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = span.getBoundingClientRect();
        const articleRect = articleRef.current!.getBoundingClientRect();
        setAnnotationPopup({
          highlightId: h.id,
          text: (h as any).annotation || '',
          x: rect.left - articleRect.left + rect.width / 2,
          y: rect.top - articleRect.top - 8,
        });
        setAnnotationInput((h as any).annotation || '');
      });
    }
  };

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !articleRef.current) { setSelectionPopup(null); return; }
    const text = selection.toString().trim();
    if (!text || text.length < 3) { setSelectionPopup(null); return; }
    const range = selection.getRangeAt(0);
    const preRange = document.createRange();
    preRange.setStart(articleRef.current, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + text.length;
    const rect = range.getBoundingClientRect();
    const articleRect = articleRef.current.getBoundingClientRect();
    setSelectionPopup({ x: rect.left - articleRect.left + rect.width / 2, y: rect.top - articleRect.top - 8, text, startOffset, endOffset });
    setAnnotationPopup(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    return () => { document.removeEventListener('mouseup', handleTextSelection); document.removeEventListener('touchend', handleTextSelection); };
  }, [handleTextSelection]);

  const saveHighlight = async (color: string) => {
    if (!user || !id || !selectionPopup) return;
    const { data, error } = await supabase.from('note_highlights').insert({
      study_note_id: id, user_id: user.id, text: selectionPopup.text,
      start_offset: selectionPopup.startOffset, end_offset: selectionPopup.endOffset, color,
    }).select().single();
    if (error) { toast({ title: 'Erro ao salvar grifo', description: error.message, variant: 'destructive' }); }
    else if (data) { setHighlights(prev => [...prev, data as HighlightWithAnnotation]); toast({ title: 'Grifo salvo' }); }
    setSelectionPopup(null);
    window.getSelection()?.removeAllRanges();
  };

  const removeHighlight = async (highlightId: string) => {
    await supabase.from('note_highlights').delete().eq('id', highlightId);
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
    setAnnotationPopup(null);
    toast({ title: 'Grifo removido' });
  };

  const saveAnnotation = async () => {
    if (!annotationPopup) return;
    await supabase.from('note_highlights').update({ annotation: annotationInput.trim() || null } as any).eq('id', annotationPopup.highlightId);
    setHighlights(prev => prev.map(h => h.id === annotationPopup.highlightId ? { ...h, annotation: annotationInput.trim() || null } : h));
    setAnnotationPopup(null);
    toast({ title: annotationInput.trim() ? 'Anotação salva' : 'Anotação removida' });
  };

  const handleGenerateFlashcards = async () => {
    if (!note) return;
    setGeneratingCards(true);
    setCardProgress(8);
    const interval = setInterval(() => {
      setCardProgress((prev) => (prev >= 92 ? prev : prev + Math.random() * 10));
    }, 700);
    try {
      const { error } = await supabase.functions.invoke('generate-flashcards', { body: { note_id: note.id } });
      if (error) throw error;
      clearInterval(interval);
      setCardProgress(100);
      setHasFlashcards(true);
      const { count } = await supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('study_note_id', note.id).lte('next_review', new Date().toISOString());
      setDueCount(count || 0);
      await supabase.from('study_notes').update({ status: 'completed' }).eq('id', note.id);
      toast({ title: 'Questões geradas', description: 'Flashcards prontos para revisão.' });
    } catch (err: any) {
      clearInterval(interval);
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingCards(false);
      setTimeout(() => setCardProgress(0), 400);
    }
  };

  if (loading) {
    return (<div className="space-y-4 max-w-3xl mx-auto"><div className="skeleton-pulse h-8 w-64" /><div className="skeleton-pulse h-96 rounded-lg" /></div>);
  }
  if (!note) return <p className="text-muted-foreground">Apunte não encontrado.</p>;

  const formattedContent = note.content ? sanitizeGeneratedMarkdown(note.content) : '';

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{note.title}</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {highlights.length > 0 ? `${highlights.length} grifo${highlights.length !== 1 ? 's' : ''}` : 'Selecione texto para grifar e anotar'}
          </p>
        </div>
      </div>

      <article ref={articleRef} className="relative font-body text-base leading-relaxed rounded-xl border bg-card p-6 sm:p-10 shadow-sm mb-6">
        {/* Color picker popup */}
        {selectionPopup && (
          <div className="absolute z-50 flex gap-1.5 bg-popover border rounded-lg shadow-lg p-2 -translate-x-1/2 -translate-y-full" style={{ left: selectionPopup.x, top: selectionPopup.y }}>
            {HIGHLIGHT_COLORS.map(c => (
              <button key={c.value} className={`w-7 h-7 rounded-full border-2 border-transparent transition-transform hover:scale-110 ${COLOR_BTN_MAP[c.value]}`} title={c.name} onClick={(e) => { e.stopPropagation(); saveHighlight(c.value); }} />
            ))}
          </div>
        )}

        {/* Annotation popup */}
        {annotationPopup && (
          <div className="absolute z-50 bg-popover border rounded-lg shadow-lg p-3 -translate-x-1/2 -translate-y-full w-64" style={{ left: annotationPopup.x, top: annotationPopup.y }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Anotação</span>
              <div className="flex gap-1">
                <button onClick={() => removeHighlight(annotationPopup.highlightId)} className="text-xs text-destructive hover:underline">Remover grifo</button>
                <button onClick={() => setAnnotationPopup(null)} className="ml-1"><X className="h-3 w-3 text-muted-foreground" /></button>
              </div>
            </div>
            <Textarea value={annotationInput} onChange={(e) => setAnnotationInput(e.target.value)} placeholder="Adicionar anotação..." className="text-sm min-h-[60px] mb-2" />
            <Button size="sm" onClick={saveAnnotation} className="w-full">Salvar</Button>
          </div>
        )}

        {formattedContent ? (
          <div className="prose prose-sm sm:prose max-w-none dark:prose-invert
            prose-headings:font-display prose-headings:tracking-tight
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/50
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-h4:text-base prose-h4:mt-6 prose-h4:mb-2
            prose-p:font-body prose-p:leading-relaxed prose-p:my-4
            prose-li:font-body prose-li:leading-relaxed prose-li:my-1
            prose-ul:my-4 prose-ol:my-4
            prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2
            prose-strong:text-foreground
            prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-blockquote:my-6
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-hr:my-8
          ">
            <ReactMarkdown>{formattedContent}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-muted-foreground italic">Conteúdo não disponível.</p>
        )}
      </article>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center pb-8">
        {!hasFlashcards && note.content && (
          <div className="w-full sm:w-auto space-y-3">
          <Button onClick={handleGenerateFlashcards} disabled={generatingCards} size="lg" className="w-full sm:w-auto">
            {generatingCards ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando questões...</> : 'Gerar Questões para Revisão'}
          </Button>
          {generatingCards && (
            <div className="space-y-1">
              <Progress value={cardProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">Gerando questões de revisão... {Math.round(cardProgress)}%</p>
            </div>
          )}
          </div>
        )}
        {hasFlashcards && (
          <Button size="lg" onClick={() => navigate(`/review?note=${id}`)} className="w-full sm:w-auto">
            <Brain className="h-4 w-4 mr-2" /> Revisar Flashcards {dueCount > 0 ? `(${dueCount})` : ''}
          </Button>
        )}
      </div>
    </div>
  );
}
