import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Target, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function StatsPage() {
  const { user } = useAuth();
  const [reviewData, setReviewData] = useState<any[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: reviews } = await supabase.from('flashcard_reviews').select('quality, reviewed_at').eq('user_id', user.id).order('reviewed_at', { ascending: true });
      if (reviews && reviews.length > 0) {
        setTotalReviews(reviews.length);
        const correct = reviews.filter(r => r.quality >= 3).length;
        setAvgAccuracy(Math.round((correct / reviews.length) * 100));
        const byDay: Record<string, { date: string; total: number; correct: number }> = {};
        reviews.forEach(r => {
          const day = new Date(r.reviewed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          if (!byDay[day]) byDay[day] = { date: day, total: 0, correct: 0 };
          byDay[day].total++;
          if (r.quality >= 3) byDay[day].correct++;
        });
        const chartData = Object.values(byDay).map(d => ({ ...d, accuracy: Math.round((d.correct / d.total) * 100) }));
        setReviewData(chartData.slice(-14));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (<div className="space-y-4"><div className="skeleton-pulse h-8 w-48" /><div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map(i => <div key={i} className="skeleton-pulse h-28 rounded-lg" />)}</div></div>);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estatísticas</h1>
        <p className="text-muted-foreground mt-1">Acompanhe seu desempenho e evolução.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3 mb-3"><div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><BarChart3 className="h-4 w-4 text-primary" /></div><span className="text-sm text-muted-foreground">Total de Revisões</span></div>
          <div className="text-3xl font-bold font-mono">{totalReviews}</div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3 mb-3"><div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center"><Target className="h-4 w-4 text-accent" /></div><span className="text-sm text-muted-foreground">Taxa de Acerto</span></div>
          <div className="text-3xl font-bold font-mono">{avgAccuracy}%</div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3 mb-3"><div className="h-9 w-9 rounded-lg bg-chart-3/10 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-chart-3" /></div><span className="text-sm text-muted-foreground">Dias Estudados</span></div>
          <div className="text-3xl font-bold font-mono">{reviewData.length}</div>
        </div>
      </div>

      {reviewData.length > 0 && (
        <>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Revisões por Dia</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reviewData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="correct" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Acertos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Evolução da Taxa de Acerto</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reviewData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} name="Acerto %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {reviewData.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Faça suas primeiras revisões para ver as estatísticas.</p>
        </div>
      )}
    </div>
  );
}