import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, GraduationCap, BookOpen, ArrowLeft, FileText, Loader2, Lightbulb } from 'lucide-react';

export default function NewExamPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [examType, setExamType] = useState<'concurso' | 'enem' | 'freeform' | null>(null);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [editalFile, setEditalFile] = useState<File | null>(null);
  const [provaFile, setProvaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const progressTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (progressTimer.current) window.clearInterval(progressTimer.current);
  }, []);

  const startProgress = (label: string) => {
    setLoading(true);
    setProgressLabel(label);
    setProgressValue(6);
    if (progressTimer.current) window.clearInterval(progressTimer.current);
    progressTimer.current = window.setInterval(() => {
      setProgressValue((prev) => (prev >= 92 ? prev : prev + Math.random() * 8));
    }, 700);
  };

  const finishProgress = async () => {
    if (progressTimer.current) window.clearInterval(progressTimer.current);
    progressTimer.current = null;
    setProgressValue(100);
    await new Promise((resolve) => setTimeout(resolve, 250));
  };

  const resetProgress = () => {
    if (progressTimer.current) window.clearInterval(progressTimer.current);
    progressTimer.current = null;
    setLoading(false);
    setProgressValue(0);
    setProgressLabel('');
  };

  const progressBlock = loading ? (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{progressLabel}</span>
        <span className="font-mono text-primary">{Math.round(progressValue)}%</span>
      </div>
      <Progress value={progressValue} className="h-2" />
      <p className="text-xs text-muted-foreground">Isso pode levar um pouco mais de tempo em conteúdos extensos.</p>
    </div>
  ) : null;

  const handleCreateENEM = async () => {
    if (!user) return;
    startProgress('Gerando conteúdo do ENEM');
    try {
      const { data: exam, error } = await supabase.from('exams').insert({ user_id: user.id, name: 'ENEM', exam_type: 'enem' }).select().single();
      if (error) throw error;
      await supabase.functions.invoke('generate-enem-content', { body: { exam_id: exam.id } });
      await finishProgress();
      toast({ title: 'ENEM configurado', description: 'Cadernos sendo gerados automaticamente.' });
      navigate(`/exams/${exam.id}`);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { resetProgress(); }
  };

  const handleCreateFreeform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topic.trim()) return;
    startProgress('Gerando trilha de aprendizado');
    try {
      const { data: exam, error } = await supabase.from('exams').insert({ user_id: user.id, name: topic.trim(), exam_type: 'freeform' }).select().single();
      if (error) throw error;
      await supabase.functions.invoke('generate-enem-content', { body: { exam_id: exam.id, freeform_topic: topic.trim() } });
      await finishProgress();
      toast({ title: 'Trilha criada', description: 'Cadernos e apuntes sendo gerados para o tema escolhido.' });
      navigate(`/exams/${exam.id}`);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { resetProgress(); }
  };

  const handleCreateConcurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editalFile || !name.trim()) return;
    startProgress('Processando edital');
    try {
      const filePath = `${user.id}/${Date.now()}_${editalFile.name}`;
      const { error: uploadError } = await supabase.storage.from('editals').upload(filePath, editalFile);
      if (uploadError) throw uploadError;
      const { data: exam, error: examError } = await supabase.from('exams').insert({ user_id: user.id, name: name.trim(), exam_type: 'concurso', edital_url: filePath }).select().single();
      if (examError) throw examError;
      let provaPath: string | undefined;
      if (provaFile) {
        const provaFilePath = `${user.id}/${Date.now()}_prova_${provaFile.name}`;
        await supabase.storage.from('editals').upload(provaFilePath, provaFile);
        provaPath = provaFilePath;
      }
      const { error: parseError } = await supabase.functions.invoke('parse-edital', { body: { exam_id: exam.id, edital_path: filePath, prova_path: provaPath } });
      await finishProgress();
      if (parseError) {
        toast({ title: 'Edital enviado', description: 'O processamento do conteúdo programático está em andamento. Pode levar alguns minutos.' });
      } else {
        toast({ title: 'Processamento concluído', description: 'Cadernos gerados automaticamente.' });
      }
      navigate(`/exams/${exam.id}`);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { resetProgress(); }
  };

  if (!examType) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-6"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Para que você vai estudar?</h1>
        <p className="text-muted-foreground mb-8">Escolha o modo de preparação ideal para o seu objetivo.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <button onClick={() => setExamType('concurso')} className="rounded-lg border-2 p-6 text-left hover:border-primary transition-colors bg-card">
            <GraduationCap className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-1">Ranked</h3>
            <p className="text-xs text-primary/70 font-medium mb-2">Concursos Públicos</p>
            <p className="text-sm text-muted-foreground">Suba o edital e receba cadernos organizados por matéria automaticamente.</p>
          </button>
          <button onClick={() => setExamType('enem')} className="rounded-lg border-2 p-6 text-left hover:border-chart-4 transition-colors bg-card">
            <BookOpen className="h-8 w-8 text-chart-4 mb-4" />
            <h3 className="font-semibold text-lg mb-1">Sigma</h3>
            <p className="text-xs text-chart-4/70 font-medium mb-2">ENEM</p>
            <p className="text-sm text-muted-foreground">Conteúdo completo para todas as áreas do ENEM, incluindo redação com correção.</p>
          </button>
          <button onClick={() => setExamType('freeform')} className="rounded-lg border-2 p-6 text-left hover:border-accent transition-colors bg-card">
            <Lightbulb className="h-8 w-8 text-accent mb-4" />
            <h3 className="font-semibold text-lg mb-1">Genius</h3>
            <p className="text-xs text-accent/70 font-medium mb-2">Aprenda Qualquer Coisa</p>
            <p className="text-sm text-muted-foreground">Digite um tema e receba uma trilha completa: do zero ao domínio absoluto.</p>
          </button>
        </div>
      </div>
    );
  }

  if (examType === 'enem') {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setExamType(null)} className="mb-6"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Sigma: Preparação ENEM</h1>
        <p className="text-muted-foreground mb-8">Todo o conteúdo programático do ENEM será gerado automaticamente, incluindo Linguagens, Ciências Humanas, Ciências da Natureza, Matemática e Redação.</p>
        {progressBlock}
        <Button onClick={handleCreateENEM} disabled={loading} className="w-full" size="lg">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando conteúdo...</> : 'Começar Preparação ENEM'}
        </Button>
      </div>
    );
  }

  if (examType === 'freeform') {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setExamType(null)} className="mb-6"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Genius: Aprenda Qualquer Coisa</h1>
        <p className="text-muted-foreground mb-8">Digite o tema que deseja dominar e o sistema criará uma trilha de aprendizado completa com cadernos, apuntes e questões para revisão.</p>
        <form onSubmit={handleCreateFreeform} className="space-y-6">
          <div>
            <Label htmlFor="topic">Qual tema você quer dominar?</Label>
            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Machine Learning, Direito Constitucional, Piano, Filosofia..." className="mt-1.5" required autoFocus />
          </div>
          {progressBlock}
          <Button type="submit" className="w-full" size="lg" disabled={loading || !topic.trim()}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando trilha de aprendizado...</> : 'Criar Trilha de Aprendizado'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => setExamType(null)} className="mb-6"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Ranked: Novo Concurso</h1>
      <p className="text-muted-foreground mb-8">Suba o edital e o sistema organiza tudo para você.</p>
      <form onSubmit={handleCreateConcurso} className="space-y-6">
        <div>
          <Label htmlFor="name">Nome do concurso</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Polícia Civil SC 2025" className="mt-1.5" required />
        </div>
        <div>
          <Label>Edital (PDF) *</Label>
          <label className="mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-8 hover:border-primary/50 transition-colors">
            <div className="text-center">
              {editalFile ? (
                <><FileText className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-sm font-medium">{editalFile.name}</p><p className="text-xs text-muted-foreground mt-1">{(editalFile.size / 1024 / 1024).toFixed(1)} MB</p></>
              ) : (
                <><Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Clique para selecionar o PDF do edital</p></>
              )}
            </div>
            <input type="file" accept=".pdf" className="hidden" onChange={(e) => setEditalFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <div>
          <Label>Prova antiga da banca (opcional)</Label>
          <label className="mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 hover:border-primary/50 transition-colors">
            <div className="text-center">
              {provaFile ? (
                <><FileText className="h-6 w-6 text-accent mx-auto mb-1" /><p className="text-sm font-medium">{provaFile.name}</p></>
              ) : (
                <><Upload className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1" /><p className="text-xs text-muted-foreground">PDF da prova anterior (ajuda a calibrar as questões)</p></>
              )}
            </div>
            <input type="file" accept=".pdf" className="hidden" onChange={(e) => setProvaFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        {progressBlock}
        <Button type="submit" className="w-full" size="lg" disabled={loading || !editalFile || !name.trim()}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando edital...</> : 'Criar Concurso e Processar Edital'}
        </Button>
      </form>
    </div>
  );
}