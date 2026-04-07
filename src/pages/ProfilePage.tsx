import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Crown, Calendar, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, subscription, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name').eq('id', user.id).single()
      .then(({ data }) => {
        setDisplayName(data?.display_name || '');
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', user.id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado' });
    }
    setSaving(false);
  };

  const handleManageSubscription = async () => {
    if (!session) return;
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err) {
      console.error(err);
    } finally {
      setPortalLoading(false);
    }
  };

  const statusLabel = (status: string | undefined | null) => {
    const map: Record<string, { label: string; className: string }> = {
      active: { label: 'Ativa', className: 'bg-accent/20 text-accent' },
      trialing: { label: 'Período de teste', className: 'bg-chart-3/20 text-chart-3' },
      expired: { label: 'Expirada', className: 'bg-destructive/20 text-destructive' },
      cancelled: { label: 'Cancelada', className: 'bg-muted text-muted-foreground' },
    };
    return map[status || ''] || { label: status || 'N/A', className: 'bg-muted text-muted-foreground' };
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="skeleton-pulse h-8 w-48" />
        <div className="skeleton-pulse h-48 rounded-lg" />
      </div>
    );
  }

  const subStatus = statusLabel(subscription?.status);
  const trialDaysLeft = subscription?.trial_end
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / 86400000))
    : 0;
  const subscriptionBadge = subscription?.lifetime
    ? { label: 'Vitalício', className: 'bg-primary text-primary-foreground' }
    : subStatus;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" className="mt-1.5" />
          </div>
          <div>
            <Label>E-mail</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" /> Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={subscriptionBadge.className}>{subscriptionBadge.label}</Badge>
          </div>
          {subscription?.lifetime && (
            <div className="flex items-center gap-3">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Seu acesso é vitalício.</span>
            </div>
          )}
          {subscription?.subscription_end && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Válida até {new Date(subscription.subscription_end).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
          {subscription?.in_trial && subscription?.trial_end && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-chart-3" />
              <span className="text-sm text-chart-3">
                Período gratuito até {new Date(subscription.trial_end).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
          {subscription?.in_trial && trialDaysLeft > 0 && (
            <p className="text-sm text-muted-foreground">
              Restam {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'} no seu acesso gratuito.
            </p>
          )}
          {subscription?.subscribed && !subscription?.lifetime && (
            <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Crown className="h-4 w-4 mr-1" />}
              Gerenciar Assinatura
            </Button>
          )}
          {!subscription?.subscribed && (
            <Button onClick={() => navigate('/paywall')}>
              <Crown className="h-4 w-4 mr-1" /> Assinar Agora
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
