import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Users, Crown, Star, DollarSign, CheckCircle, UserPlus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface UserProfile {
  id: string; email: string | null; display_name: string | null;
  subscription_status: string | null; trial_start_date: string | null;
  subscription_end_date: string | null; referral_code: string | null;
  successful_referrals: number | null; is_influencer: boolean | null;
  influencer_code: string | null;
}

interface InfluencerSale {
  id: string; influencer_id: string; buyer_user_id: string;
  sale_amount: number; commission_amount: number; sale_date: string; paid_out: boolean;
}

export default function AdminPage() {
  const { isAdmin, loading, adminLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [influencers, setInfluencers] = useState<UserProfile[]>([]);
  const [sales, setSales] = useState<InfluencerSale[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();
  const [addInfluencerOpen, setAddInfluencerOpen] = useState(false);
  const [influencerEmail, setInfluencerEmail] = useState('');
  const [influencerCodeInput, setInfluencerCodeInput] = useState('');
  const [addingInfluencer, setAddingInfluencer] = useState(false);

  useEffect(() => { if (isAdmin) fetchData(); }, [isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    const [usersRes, salesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('influencer_sales').select('*').order('sale_date', { ascending: false }),
    ]);
    const allUsers = (usersRes.data || []) as unknown as UserProfile[];
    setUsers(allUsers);
    setInfluencers(allUsers.filter(u => u.is_influencer));
    setSales((salesRes.data || []) as unknown as InfluencerSale[]);
    setLoadingData(false);
  };

  const markAllPaid = async (influencerId: string) => {
    const { error } = await supabase.from('influencer_sales').update({ paid_out: true } as any).eq('influencer_id', influencerId).eq('paid_out', false);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Comissões marcadas como pagas!' }); fetchData(); }
  };

  const toggleInfluencer = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('profiles').update({
      is_influencer: !currentStatus,
      influencer_code: !currentStatus ? userId.substring(0, 8).toUpperCase() : null,
    } as any).eq('id', userId);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: !currentStatus ? 'Influenciador(a) ativado(a)!' : 'Influenciador(a) desativado(a).' }); fetchData(); }
  };

  const addInfluencer = async () => {
    if (!influencerEmail.trim()) return;
    setAddingInfluencer(true);
    const { data: profile } = await supabase.from('profiles').select('id, is_influencer').eq('email', influencerEmail.trim().toLowerCase()).single();
    if (!profile) {
      toast({ title: 'Usuário não encontrado', description: 'Nenhum usuário com esse e-mail.', variant: 'destructive' });
      setAddingInfluencer(false);
      return;
    }
    const code = influencerCodeInput.trim().toUpperCase() || profile.id.substring(0, 8).toUpperCase();
    const { error } = await supabase.from('profiles').update({ is_influencer: true, influencer_code: code } as any).eq('id', profile.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Influenciador(a) cadastrado(a)!' }); setAddInfluencerOpen(false); setInfluencerEmail(''); setInfluencerCodeInput(''); fetchData(); }
    setAddingInfluencer(false);
  };

  if (loading || adminLoading) return (<div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>);
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const statusBadge = (status: string | null) => {
    const map: Record<string, string> = { active: 'bg-accent/20 text-accent', trialing: 'bg-chart-3/20 text-chart-3', expired: 'bg-destructive/20 text-destructive', cancelled: 'bg-muted text-muted-foreground' };
    return <Badge className={map[status || ''] || 'bg-muted text-muted-foreground'}>{status || 'N/A'}</Badge>;
  };

  const totalPendingCommission = sales.filter(s => !s.paid_out).reduce((sum, s) => sum + s.commission_amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Painel Admin</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Total Usuários</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold">{users.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Crown className="h-4 w-4" /> Assinantes Ativos</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold">{users.filter(u => u.subscription_status === 'active').length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Star className="h-4 w-4" /> Influenciadoras</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold">{influencers.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" /> Comissão Pendente</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold">R${(totalPendingCommission / 100).toFixed(2)}</span></CardContent></Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="influencers">Influenciadoras</TabsTrigger>
          <TabsTrigger value="referrals">Indicações</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead><TableHead>Status</TableHead><TableHead>Trial</TableHead>
                  <TableHead>Indicações</TableHead><TableHead>Influencer</TableHead><TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => {
                  const trialEnd = u.trial_start_date ? new Date(new Date(u.trial_start_date).getTime() + 3 * 86400000) : null;
                  const inTrial = trialEnd && trialEnd > new Date();
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs">{u.email}</TableCell>
                      <TableCell>{statusBadge(u.subscription_status)}</TableCell>
                      <TableCell>{inTrial ? <Badge className="bg-chart-3/20 text-chart-3">Ativo</Badge> : <Badge variant="secondary">Expirado</Badge>}</TableCell>
                      <TableCell>{u.successful_referrals || 0}</TableCell>
                      <TableCell>{u.is_influencer ? <Badge className="bg-accent/20 text-accent">Sim</Badge> : 'Não'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => toggleInfluencer(u.id, !!u.is_influencer)}>
                          {u.is_influencer ? 'Remover Influ' : 'Tornar Influ'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="influencers">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setAddInfluencerOpen(true)}><UserPlus className="h-4 w-4 mr-1" /> Cadastrar Influenciador(a)</Button>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead><TableHead>Código</TableHead><TableHead>Vendas</TableHead>
                  <TableHead>Comissão Pendente</TableHead><TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {influencers.map(inf => {
                  const infSales = sales.filter(s => s.influencer_id === inf.id);
                  const pendingCommission = infSales.filter(s => !s.paid_out).reduce((sum, s) => sum + s.commission_amount, 0);
                  return (
                    <TableRow key={inf.id}>
                      <TableCell className="font-mono text-xs">{inf.email}</TableCell>
                      <TableCell className="font-mono">{inf.influencer_code || 'Sem código'}</TableCell>
                      <TableCell>{infSales.length}</TableCell>
                      <TableCell className="font-semibold">R${(pendingCommission / 100).toFixed(2)}</TableCell>
                      <TableCell className="flex gap-2">
                        {pendingCommission > 0 && (
                          <Button size="sm" variant="outline" onClick={() => markAllPaid(inf.id)}><CheckCircle className="h-3 w-3 mr-1" /> Marcar pago</Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => toggleInfluencer(inf.id, true)}>Remover</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="referrals">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Usuário</TableHead><TableHead>Indicações</TableHead><TableHead>Recompensa</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {users.filter(u => (u.successful_referrals || 0) > 0).map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.email}</TableCell>
                    <TableCell>{u.successful_referrals}</TableCell>
                    <TableCell>{(u.successful_referrals || 0) >= 10 ? <Badge className="bg-accent/20 text-accent">1 ano grátis</Badge> : `${u.successful_referrals} mês(es) grátis`}</TableCell>
                    <TableCell>{statusBadge(u.subscription_status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addInfluencerOpen} onOpenChange={setAddInfluencerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cadastrar Influenciador(a)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>E-mail do usuário</Label><Input value={influencerEmail} onChange={e => setInfluencerEmail(e.target.value)} placeholder="influencer@email.com" className="mt-1.5" /></div>
            <div><Label>Código personalizado (opcional)</Label><Input value={influencerCodeInput} onChange={e => setInfluencerCodeInput(e.target.value.toUpperCase())} placeholder="CODIGO" className="mt-1.5 font-mono" maxLength={10} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddInfluencerOpen(false)}>Cancelar</Button>
            <Button onClick={addInfluencer} disabled={addingInfluencer || !influencerEmail.trim()}>
              {addingInfluencer ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />} Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
