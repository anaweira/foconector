import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, subscription, subscriptionLoading, isAdmin, adminLoading } = useAuth();

  if (loading || subscriptionLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-mono">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const hasLifetimeAccess = Boolean(subscription?.lifetime) || isAdmin;

  if (subscription && subscription.status === 'expired' && !hasLifetimeAccess) {
    return <Navigate to="/paywall" replace />;
  }

  return <>{children}</>;
};
