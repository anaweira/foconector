import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, Gift, Users, Trophy, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ReferralPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('referral_code, successful_referrals').eq('id', user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user]);

  const referralLink = `${window.location.origin}/auth?ref=${profile?.referral_code || ''}`;
  const referrals = profile?.successful_referrals || 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!' });
  };

  const milestones = [
    { count: 1, reward: '1 mês grátis', reached: referrals >= 1 },
    { count: 3, reward: '3 meses grátis', reached: referrals >= 3 },
    { count: 5, reward: '5 meses grátis', reached: referrals >= 5 },
    { count: 10, reward: '1 ano grátis! 🎉', reached: referrals >= 10 },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton-pulse h-8 w-64" />
        <div className="skeleton-pulse h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao Painel
      </Button>

      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
        >
          <Gift className="h-8 w-8 text-primary" />
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Ganhe até 1 ano de acesso gratuito</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Indique amigos para o FoConector. Cada indicação que assinar, você ganha 1 mês grátis.
          Ao atingir 10 indicações, ganhe 1 ano inteiro!
        </p>
      </div>

      {/* Referral Code & Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" /> Seu Código e Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1.5">Código de indicação</p>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-4 py-2.5 rounded-lg font-mono text-lg font-bold flex-1 text-center tracking-widest">
                {profile?.referral_code || 'Sem código'}
              </code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(profile?.referral_code || '')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1.5">Link de indicação</p>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-3 py-2 rounded-lg font-mono text-xs flex-1 truncate">
                {referralLink}
              </code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(referralLink)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Quem usar seu código ou link na hora de assinar ganha 10% de desconto!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Seu Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold font-mono text-primary">{referrals}</div>
            <p className="text-sm text-muted-foreground mt-1">indicação{referrals !== 1 ? 'ões' : ''} bem-sucedida{referrals !== 1 ? 's' : ''}</p>
          </div>

          <div className="space-y-3">
            {milestones.map((m) => (
              <motion.div
                key={m.count}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  m.reached ? 'bg-accent/5 border-accent/30' : 'bg-muted/30 border-border'
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  m.reached ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                }`}>
                  {m.reached ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-mono font-bold">{m.count}</span>}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${m.reached ? 'text-accent' : ''}`}>
                    {m.count} indicaç{m.count > 1 ? 'ões' : 'ão'}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.reward}</p>
                </div>
                {m.reached && <Trophy className="h-4 w-4 text-accent" />}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Compartilhe seu código ou link com amigos.</p>
          <p>2. Eles se cadastram e ganham 10% de desconto na assinatura.</p>
          <p>3. A cada amigo que assinar, você ganha 1 mês grátis adicionado à sua assinatura.</p>
          <p>4. Ao atingir 10 indicações bem-sucedidas, ganhe 1 ano inteiro de acesso!</p>
        </CardContent>
      </Card>
    </div>
  );
}
