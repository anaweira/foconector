import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const XP_VALUES = {
  note_read: 10,
  flashcard_reviewed: 2,
  essay_written: 25,
  minute_studied: 1,
};

export function useStudyTracker() {
  const { user } = useAuth();

  const trackActivity = useCallback(async (type: 'note_read' | 'flashcard_reviewed' | 'essay_written', count = 1) => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const xp = XP_VALUES[type] * count;

    // Upsert today's session
    const { data: existing } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_date', todayStr)
      .maybeSingle();

    const fieldMap: Record<string, string> = {
      note_read: 'notes_read',
      flashcard_reviewed: 'flashcards_reviewed',
      essay_written: 'essays_written',
    };

    if (existing) {
      const field = fieldMap[type];
      const update: any = {
        [field]: (existing as any)[field] + count,
        xp_earned: (existing as any).xp_earned + xp,
      };
      await supabase.from('study_sessions').update(update).eq('id', (existing as any).id);
    } else {
      const insert: any = {
        user_id: user.id,
        session_date: todayStr,
        [fieldMap[type]]: count,
        xp_earned: xp,
      };
      await supabase.from('study_sessions').insert(insert);
    }

    // Update user goals (streak + xp)
    const { data: goals } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (goals) {
      const g = goals as any;
      const lastDate = g.last_study_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = g.current_streak;

      if (lastDate !== todayStr) {
        if (lastDate === yesterday) {
          newStreak = g.current_streak + 1;
        } else if (!lastDate) {
          newStreak = 1;
        } else {
          newStreak = 1; // streak broken
        }
      }

      const newTotalXp = g.total_xp + xp;
      const longestStreak = Math.max(g.longest_streak, newStreak);

      await supabase.from('user_goals').update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        total_xp: newTotalXp,
        last_study_date: todayStr,
      }).eq('user_id', user.id);

      // Check achievements
      const achievementsToCheck: [string, boolean][] = [
        ['first_note', type === 'note_read'],
        ['first_review', type === 'flashcard_reviewed'],
        ['streak_3', newStreak >= 3],
        ['streak_7', newStreak >= 7],
        ['streak_30', newStreak >= 30],
        ['xp_100', newTotalXp >= 100],
        ['xp_500', newTotalXp >= 500],
        ['xp_1000', newTotalXp >= 1000],
      ];

      for (const [badge, condition] of achievementsToCheck) {
        if (condition) {
          await supabase.from('achievements').upsert(
            { user_id: user.id, badge_key: badge },
            { onConflict: 'user_id,badge_key' }
          );
        }
      }
    } else {
      // Create goals entry
      await supabase.from('user_goals').insert({
        user_id: user.id,
        current_streak: 1,
        total_xp: xp,
        last_study_date: todayStr,
      });
    }
  }, [user]);

  return { trackActivity };
}
