import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame, Trophy, Star, Target, Zap, BookOpen, Brain, Clock, Award, TrendingUp, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const BADGES: Record<string, { icon: React.ReactNode; label: string; description: string }> = {
  first_note: { icon: <BookOpen className="h-5 w-5" />, label: 'Primeiro Passo', description: 'Leu o primeiro apunte' },
  first_review: { icon: <Brain className="h-5 w-5" />, label: 'Revisor', description: 'Completou a primeira revisão' },
  streak_3: { icon: <Flame className="h-5 w-5" />, label: 'Em Chamas', description: '3 dias consecutivos' },
  streak_7: { icon: <Flame className="h-5 w-5" />, label: 'Imparável', description: '7 dias consecutivos' },
  streak_30: { icon: <Trophy className="h-5 w-5" />, label: 'Lendário', description: '30 dias consecutivos' },
  xp_100: { icon: <Star className="h-5 w-5" />, label: 'Centurião', description: '100 XP acumulados' },
  xp_500: { icon: <Star className="h-5 w-5" />, label: 'Veterano', description: '500 XP acumulados' },
  xp_1000: { icon: <Zap className="h-5 w-5" />, label: 'Elite', description: '1000 XP acumulados' },
  notes_10: { icon: <BookOpen className="h-5 w-5" />, label: 'Estudioso', description: '10 apuntes lidos' },
  flashcards_100: { icon: <Brain className="h-5 w-5" />, label: 'Máquina', description: '100 flashcards revisados' },
};

const LEVEL_XP = [0, 50, 150, 300, 500, 750, 1100, 1500, 2000, 2600, 3300, 4100, 5000, 6000, 7200, 8500, 10000];

function getLevel(xp: number) {
  let level = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) level = i + 1;
    else break;
  }
  const currentLevelXp = LEVEL_XP[level - 1] || 0;
  const nextLevelXp = LEVEL_XP[level] || LEVEL_XP[LEVEL_XP.length - 1] + 1000;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  return { level, progress: Math.min(progress, 100), currentXp: xp - currentLevelXp, neededXp: nextLevelXp - currentLevelXp };
}

interface GoalsData {
  daily_notes_goal: number;
  daily_flashcards_goal: number;
  daily_minutes_goal: number;
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  level: number;
  last_study_date: string | null;
}

interface SessionData {
  notes_read: number;
  flashcards_reviewed: number;
  essays_written: number;
  minutes_studied: number;
  xp_earned: number;
}

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<GoalsData | null>(null);
  const [today, setToday] = useState<SessionData | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editGoals, setEditGoals] = useState({ notes: 3, flashcards: 20, minutes: 30 });
  const [weekSessions, setWeekSessions] = useState<{ date: string; xp: number }[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const [goalsRes, sessionRes, badgesRes, weekRes] = await Promise.all([
      supabase.from('user_goals').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('study_sessions').select('*').eq('user_id', user.id).eq('session_date', todayStr).maybeSingle(),
      supabase.from('achievements').select('badge_key').eq('user_id', user.id),
      supabase.from('study_sessions').select('session_date, xp_earned').eq('user_id', user.id).gte('session_date', new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]).order('session_date'),
    ]);

    if (!goalsRes.data) {
      // Create default goals
      const { data: newGoals } = await supabase.from('user_goals').insert({ user_id: user.id }).select().single();
      setGoals(newGoals as any);
    } else {
      setGoals(goalsRes.data as any);
    }

    setToday(sessionRes.data as any || { notes_read: 0, flashcards_reviewed: 0, essays_written: 0, minutes_studied: 0, xp_earned: 0 });
    setBadges((badgesRes.data || []).map(b => b.badge_key));

    // Fill week data
    const week: { date: string; xp: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const session = (weekRes.data || []).find((s: any) => s.session_date === d);
      week.push({ date: d, xp: session ? (session as any).xp_earned : 0 });
    }
    setWeekSessions(week);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveGoals = async () => {
    if (!user) return;
    await supabase.from('user_goals').update({
      daily_notes_goal: editGoals.notes,
      daily_flashcards_goal: editGoals.flashcards,
      daily_minutes_goal: editGoals.minutes,
    }).eq('user_id', user.id);
    setGoals(prev => prev ? { ...prev, daily_notes_goal: editGoals.notes, daily_flashcards_goal: editGoals.flashcards, daily_minutes_goal: editGoals.minutes } : prev);
    setSettingsOpen(false);
    toast({ title: 'Metas atualizadas' });
  };

  if (loading || !goals) {
    return (
      <div className="space-y-4">
        <div className="skeleton-pulse h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map(i => <div key={i} className="skeleton-pulse h-32 rounded-lg" />)}</div>
      </div>
    );
  }

  const levelInfo = getLevel(goals.total_xp);
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const maxWeekXp = Math.max(...weekSessions.map(s => s.xp), 1);

  const notesProgress = Math.min((today?.notes_read || 0) / goals.daily_notes_goal * 100, 100);
  const flashcardsProgress = Math.min((today?.flashcards_reviewed || 0) / goals.daily_flashcards_goal * 100, 100);
  const minutesProgress = Math.min((today?.minutes_studied || 0) / goals.daily_minutes_goal * 100, 100);
  const overallProgress = (notesProgress + flashcardsProgress + minutesProgress) / 3;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metas & Conquistas</h1>
          <p className="text-muted-foreground mt-1">Mantenha a consistência e suba de nível.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => { setEditGoals({ notes: goals.daily_notes_goal, flashcards: goals.daily_flashcards_goal, minutes: goals.daily_minutes_goal }); setSettingsOpen(true); }}>
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Streak + Level + XP cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Streak */}
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-xl border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Streak</span>
          </div>
          <div className="text-4xl font-bold font-mono text-orange-500">{goals.current_streak}</div>
          <p className="text-xs text-muted-foreground mt-1">dia{goals.current_streak !== 1 ? 's' : ''} consecutivo{goals.current_streak !== 1 ? 's' : ''}</p>
          <p className="text-xs font-mono text-muted-foreground/60 mt-2">Recorde: {goals.longest_streak} dias</p>
        </motion.div>

        {/* Level */}
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Nível</span>
          </div>
          <div className="text-4xl font-bold font-mono">{levelInfo.level}</div>
          <div className="mt-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${levelInfo.progress}%` }} transition={{ duration: 1, delay: 0.3 }} className="h-full bg-gradient-to-r from-primary to-accent rounded-full" />
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-1">{levelInfo.currentXp}/{levelInfo.neededXp} XP</p>
          </div>
        </motion.div>

        {/* Total XP */}
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-xl border-2 border-chart-3/20 bg-gradient-to-br from-chart-3/5 to-chart-4/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-chart-3" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">XP Total</span>
          </div>
          <div className="text-4xl font-bold font-mono">{goals.total_xp}</div>
          <p className="text-xs text-muted-foreground mt-1">pontos de experiência</p>
          <p className="text-xs font-mono text-muted-foreground/60 mt-2">Hoje: +{today?.xp_earned || 0} XP</p>
        </motion.div>
      </div>

      {/* Daily Progress */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Progresso de Hoje</h2>
          <span className="text-sm font-mono font-bold text-primary">{Math.round(overallProgress)}%</span>
        </div>

        <div className="space-y-5">
          {/* Notes goal */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Apuntes lidos</span>
              </div>
              <span className="text-sm font-mono">{today?.notes_read || 0}/{goals.daily_notes_goal}</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${notesProgress}%` }} transition={{ duration: 0.8 }} className="h-full bg-accent rounded-full" />
            </div>
          </div>

          {/* Flashcards goal */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Flashcards revisados</span>
              </div>
              <span className="text-sm font-mono">{today?.flashcards_reviewed || 0}/{goals.daily_flashcards_goal}</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${flashcardsProgress}%` }} transition={{ duration: 0.8, delay: 0.1 }} className="h-full bg-primary rounded-full" />
            </div>
          </div>

          {/* Minutes goal */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-chart-3" />
                <span className="text-sm font-medium">Minutos estudados</span>
              </div>
              <span className="text-sm font-mono">{today?.minutes_studied || 0}/{goals.daily_minutes_goal}</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${minutesProgress}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full bg-chart-3 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Week Chart */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><TrendingUp className="h-5 w-5 text-primary" /> Última Semana</h2>
        <div className="flex items-end gap-2 h-32">
          {weekSessions.map((s, i) => {
            const height = maxWeekXp > 0 ? (s.xp / maxWeekXp) * 100 : 0;
            const dayIndex = new Date(s.date + 'T12:00:00').getDay();
            const isToday = s.date === new Date().toISOString().split('T')[0];
            return (
              <div key={s.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-mono text-muted-foreground">{s.xp > 0 ? s.xp : ''}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 4)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={`w-full rounded-t-md ${isToday ? 'bg-primary' : s.xp > 0 ? 'bg-primary/40' : 'bg-muted'}`}
                />
                <span className={`text-xs font-mono ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{dayNames[dayIndex]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Trophy className="h-5 w-5 text-chart-4" /> Conquistas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(BADGES).map(([key, badge]) => {
            const unlocked = badges.includes(key);
            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.05 }}
                className={`rounded-lg border p-3 text-center transition-all ${unlocked ? 'bg-chart-4/5 border-chart-4/30' : 'opacity-40 grayscale'}`}
              >
                <div className={`h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center ${unlocked ? 'bg-chart-4/20 text-chart-4' : 'bg-muted text-muted-foreground'}`}>
                  {badge.icon}
                </div>
                <p className="text-xs font-semibold truncate">{badge.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configurar Metas Diárias</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Apuntes por dia</Label>
              <Input type="number" min={1} max={50} value={editGoals.notes} onChange={e => setEditGoals(p => ({ ...p, notes: parseInt(e.target.value) || 1 }))} className="mt-1" />
            </div>
            <div>
              <Label>Flashcards por dia</Label>
              <Input type="number" min={1} max={200} value={editGoals.flashcards} onChange={e => setEditGoals(p => ({ ...p, flashcards: parseInt(e.target.value) || 1 }))} className="mt-1" />
            </div>
            <div>
              <Label>Minutos de estudo por dia</Label>
              <Input type="number" min={5} max={480} value={editGoals.minutes} onChange={e => setEditGoals(p => ({ ...p, minutes: parseInt(e.target.value) || 5 }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Cancelar</Button>
            <Button onClick={saveGoals}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
