import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, DollarSign, TrendingUp, Star } from 'lucide-react';

export default function InfluencerDashboardPage() {
  const { user, subscription } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isInfluencer = subscription?.is_influencer;

  useEffect(() => {
    if (user && isInfluencer) fetchData();
  }, [user, isInfluencer]);

  const fetchData = async () => {
    setLoading(true);
    const [salesRes, profileRes] = await Promise.all([
      supabase.from('influencer_sales').select('*').order('sale_date', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user!.id).single(),
    ]);
    setSales(salesRes.data || []);
    setProfile(profileRes.data);
    setLoading(false);
  };

  if (!user) return <Navigate to="/auth" replace />;
  if (!isInfluencer) return <Navigate to="/dashboard" replace />;

  const totalCommission = sales.reduce((s, sale) => s + sale.commission_amount, 0);
  const paidCommission = sales.filter(s => s.paid_out).reduce((s, sale) => s + sale.commission_amount, 0);
  const pendingCommission = totalCommission - paidCommission;

  const referralLink = `${window.location.origin}/auth?ref=${profile?.influencer_code || ''}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Star className="h-6 w-6 text-primary" /> Painel da Influenciadora
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Total de Vendas</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{sales.length}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" /> Comissão Pendente</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold text-primary">R${(pendingCommission / 100).toFixed(2)}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" /> Total Já Pago</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold text-accent">R${(paidCommission / 100).toFixed(2)}</span></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seu Link e Código</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Código promocional</p>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-3 py-1.5 rounded font-mono text-sm flex-1">{profile?.influencer_code || 'Sem código'}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(profile?.influencer_code || '')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Link de indicação</p>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-3 py-1.5 rounded font-mono text-xs flex-1 truncate">{referralLink}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(referralLink)}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Valor da Venda</TableHead>
                <TableHead>Comissão (15%)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma venda registrada ainda.</TableCell>
                </TableRow>
              ) : (
                sales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.sale_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>R${(sale.sale_amount / 100).toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">R${(sale.commission_amount / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      {sale.paid_out
                        ? <Badge className="bg-accent/20 text-accent">Pago</Badge>
                        : <Badge className="bg-chart-3/20 text-chart-3">Pendente</Badge>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
