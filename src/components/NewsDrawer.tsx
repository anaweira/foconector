import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Newspaper, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';

interface NewsDrawerProps {
  mode: 'concurso' | 'enem' | 'freeform';
  topic?: string;
}

export default function NewsDrawer({ mode, topic }: NewsDrawerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchNews = async () => {
    if (content) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { mode, topic },
      });
      if (error) throw error;
      setContent(data.content);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setContent(null);
    setLoading(true);
    supabase.functions.invoke('fetch-news', { body: { mode, topic } })
      .then(({ data, error }) => {
        if (error) throw error;
        setContent(data.content);
      })
      .catch((err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  };

  const titleMap = {
    concurso: 'Novidades de Concursos',
    enem: 'Novidades do ENEM',
    freeform: `Novidades: ${topic}`,
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchNews(); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Newspaper className="h-4 w-4 mr-1" /> Novidades
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{titleMap[mode]}</SheetTitle>
            {content && !loading && (
              <Button variant="ghost" size="icon" onClick={refresh} className="h-8 w-8">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="mt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Buscando novidades...</p>
            </div>
          ) : content ? (
            <div className="prose prose-sm max-w-none dark:prose-invert font-body prose-headings:font-display prose-h3:text-base prose-h3:mt-4 prose-h3:mb-1 prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-hr:my-4">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Clique em Novidades para carregar.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}