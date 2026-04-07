import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  BookOpen, Brain, BarChart3, CalendarCheck, GraduationCap,
  LogOut, Menu, X, ChevronDown, Plus, Flame, Shield, Star, Crown, UserCircle, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Painel', icon: CalendarCheck },
  { path: '/exams', label: 'Meus Estudos', icon: GraduationCap },
  { path: '/review', label: 'Revisões do Dia', icon: Brain },
  { path: '/goals', label: 'Metas & Streak', icon: Flame },
  { path: '/stats', label: 'Estatísticas', icon: BarChart3 },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut, subscription, isAdmin, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border
        transform transition-transform duration-200 lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="FoConector" className="h-7 w-7 rounded-full" />
              <span className="font-semibold tracking-tight text-sidebar-primary">FoConector</span>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                    ${active
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}
                  `}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
            {subscription?.is_influencer && (
              <Link
                to="/influencer"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/influencer'
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Star className="h-4 w-4 flex-shrink-0" />
                Painel Influenciadora
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Shield className="h-4 w-4 flex-shrink-0" />
                Admin
              </Link>
            )}
          </nav>

          <div className="border-t border-sidebar-border p-3 space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 truncate">
              <div className="h-6 w-6 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-foreground">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{user?.email}</span>
            </div>
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-md hover:bg-sidebar-accent/50 transition-colors"
            >
              <UserCircle className="h-4 w-4" /> Meu Perfil
            </Link>
            <Link
              to="/referral"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-md hover:bg-sidebar-accent/50 transition-colors"
            >
              <Gift className="h-4 w-4" /> Indicar Amigos
            </Link>
            {subscription?.subscribed && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                <Crown className="h-4 w-4 mr-2" /> Gerenciar Assinatura
              </Button>
            )}
            {!subscription?.subscribed && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground"
                onClick={() => navigate('/paywall')}
              >
                <Crown className="h-4 w-4 mr-2" /> {subscription?.in_trial ? 'Assinar Agora' : 'Ver Planos'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}