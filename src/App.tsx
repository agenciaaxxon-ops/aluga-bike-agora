import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientTimer from "./pages/ClientTimer";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Planos from "./pages/Planos";
import DashboardAssinatura from "./pages/DashboardAssinatura";
import DashboardEquipe from "./pages/DashboardEquipe";
import DashboardConfiguracoes from "./pages/DashboardConfiguracoes";
import DashboardRelatorios from "./pages/DashboardRelatorios";
import DashboardFaturas from "./pages/DashboardFaturas";
import DashboardInventario from "./pages/DashboardInventario";
import DashboardItemTypeDetail from "./pages/DashboardItemTypeDetail";
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';

const queryClient = new QueryClient();

const AppRoutes = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('subscription_status, trial_ends_at')
          .eq('id', userId)
          .single();
        
        if (data) {
          setSubscriptionStatus(data.subscription_status);
          setTrialEndsAt(data.trial_ends_at);
        }
      } finally {
        setLoadingSubscription(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkSubscription(session.user.id);
      } else {
        setLoadingSubscription(false);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setLoadingSubscription(true);
        checkSubscription(session.user.id);
      } else {
        setSubscriptionStatus(null);
        setTrialEndsAt(null);
        setLoadingSubscription(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime subscription para mudanças no subscription_status
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('Profile atualizado em tempo real:', payload.new);
          setSubscriptionStatus(payload.new.subscription_status);
          setTrialEndsAt(payload.new.trial_ends_at);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // Polling como fallback para pending_payment
  useEffect(() => {
    if (!session?.user?.id) return;
    if (subscriptionStatus !== 'pending_payment' && !window.location.search.includes('from_payment=true')) return;

    let attempts = 0;
    const maxAttempts = 60;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status, trial_ends_at')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setSubscriptionStatus(data.subscription_status);
        setTrialEndsAt(data.trial_ends_at);
        
        if (data.subscription_status === 'active' || attempts >= maxAttempts) {
          clearInterval(pollInterval);
        }
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [session?.user?.id, subscriptionStatus]);

  const canAccessDashboard = () => {
    if (!session) return false;
    if (subscriptionStatus === 'active') return true;
    if (subscriptionStatus === 'trial' && trialEndsAt) {
      return new Date(trialEndsAt) > new Date();
    }
    return false;
  };

  const getRedirectPath = () => {
    if (subscriptionStatus === 'trial' && trialEndsAt && new Date(trialEndsAt) <= new Date()) {
      return '/onboarding';
    }
    if (subscriptionStatus === 'pending_payment') {
      return '/planos';
    }
    if (subscriptionStatus === 'inactive' || !subscriptionStatus) {
      return '/onboarding';
    }
    return '/onboarding';
  };

  // Auto-redirect para dashboard quando assinatura ficar ativa
  useEffect(() => {
    if (subscriptionStatus === 'active' && (location.pathname === '/planos' || location.pathname === '/onboarding')) {
      console.log('Assinatura ativa detectada, redirecionando para dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [subscriptionStatus, location.pathname, navigate]);

  if (loading || loadingSubscription) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={session ? <Navigate to="/dashboard" replace /> : <Index />}
      />
      <Route
        path="/login"
        element={session ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={canAccessDashboard() ? <Dashboard /> : <Navigate to={getRedirectPath()} replace />}
      />
      <Route
        path="/onboarding"
        element={session ? <Onboarding /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/planos"
        element={session ? <Planos /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/dashboard/assinatura"
        element={canAccessDashboard() ? <DashboardAssinatura /> : <Navigate to={getRedirectPath()} replace />}
      />
      <Route
        path="/dashboard/equipe"
        element={canAccessDashboard() ? <DashboardEquipe /> : <Navigate to={getRedirectPath()} replace />}
      />
      <Route
        path="/dashboard/configuracoes"
        element={canAccessDashboard() ? <DashboardConfiguracoes /> : <Navigate to={getRedirectPath()} replace />}
      />
      <Route
        path="/dashboard/relatorios"
        element={canAccessDashboard() ? <DashboardRelatorios /> : <Navigate to={getRedirectPath()} replace />}
      />
      <Route
        path="/dashboard/faturas"
        element={canAccessDashboard() ? <DashboardFaturas /> : <Navigate to={getRedirectPath()} replace />}
      />
      <Route
        path="/dashboard/inventario"
        element={canAccessDashboard() ? <DashboardInventario /> : <Navigate to={getRedirectPath()} replace />}
      />
      <Route
        path="/dashboard/inventario/:typeId"
        element={canAccessDashboard() ? <DashboardItemTypeDetail /> : <Navigate to={getRedirectPath()} replace />}
      />
      <Route path="/cliente/:rentalId" element={<ClientTimer />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;