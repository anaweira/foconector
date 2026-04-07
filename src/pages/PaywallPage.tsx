import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Check, Crown, Zap, LogOut } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

export default function PaywallPage() {
  const { user, session, subscription, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const { toast } = useToast();

  const trialDaysLeft = subscription?.trial_end
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / 86400000))
    : 0;

  if (!user) return <Navigate to="/auth" replace />;
  if (subscription && (subscription.status === 'active' || subscription.lifetime)) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCheckout = async (plan: 'monthly' | 'annual') => {
    if (!session) return;
    setLoading(true);
    try {
      // Check URL params for influencer code
      const urlParams = new URLSearchParams(window.location.search);
      const influencerCode = urlParams.get('ref') || '';

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { plan, referralCode: referralCode.trim() || undefined, influencerCode: influencerCode || undefined },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Notas de estudo completas',
    'Flashcards com repetição espaçada',
    'Mapas mentais interativos',
    'Correção de redações detalhada',
    'Metas e gamificação',
    'Suporte prioritário',
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <img src={logo} alt="FoConector" className="h-8 w-8 rounded-full" />
          <span className="font-semibold tracking-tight">FoConector</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10 max-w-lg">
          <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            {subscription?.in_trial ? 'Assine agora e continue sem interrupções' : 'Seu período gratuito acabou'}
          </h1>
          <p className="text-muted-foreground text-lg">
            Assine o FoConector para continuar transformando editais em aprovação.
          </p>
          {subscription?.in_trial && trialDaysLeft > 0 && (
            <p className="text-sm text-primary mt-3">
              Seu acesso gratuito termina em {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}.
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-3xl w-full mb-8">
          <Card className="relative border-2 border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Mensal
              </CardTitle>
              <CardDescription>Cancele quando quiser</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$47</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-2 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => handleCheckout('monthly')} disabled={loading}>
                {loading ? 'Processando...' : 'Assinar Mensal'}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-2 border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                MELHOR CUSTO-BENEFÍCIO
              </span>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Anual
              </CardTitle>
              <CardDescription>Economize R$187 por ano</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$377</span>
                <span className="text-muted-foreground">/ano</span>
                <p className="text-sm text-muted-foreground mt-1">≈ R$31,42/mês</p>
              </div>
              <ul className="space-y-2 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="default" onClick={() => handleCheckout('annual')} disabled={loading}>
                {loading ? 'Processando...' : 'Assinar Anual'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-sm w-full">
          <Label htmlFor="referral" className="text-sm text-muted-foreground">
            Tem um código de indicação? Ganhe 10% de desconto!
          </Label>
          <Input
            id="referral"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder="CÓDIGO"
            className="mt-1 font-mono text-center tracking-wider"
            maxLength={10}
          />
        </div>
      </main>
    </div>
  );
}
