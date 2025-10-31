import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientTimer from "./pages/ClientTimer";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Planos from "./pages/Planos";
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';

const queryClient = new QueryClient();

const AppRoutes = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  useEffect(() => {
    const checkSubscription = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status, trial_ends_at')
        .eq('id', userId)
        .single();
      
      if (data) {
        setSubscriptionStatus(data.subscription_status);
        setTrialEndsAt(data.trial_ends_at);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkSubscription(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkSubscription(session.user.id);
      } else {
        setSubscriptionStatus(null);
        setTrialEndsAt(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const canAccessDashboard = () => {
    if (!session) return false;
    if (subscriptionStatus === 'active') return true;
    if (subscriptionStatus === 'trial' && trialEndsAt) {
      return new Date(trialEndsAt) > new Date();
    }
    return false;
  };

  const getRedirectPath = () => {
    if (!subscriptionStatus) return '/login';
    if (subscriptionStatus === 'trial' && trialEndsAt && new Date(trialEndsAt) <= new Date()) {
      return '/onboarding';
    }
    if (subscriptionStatus === 'pending_payment') {
      return '/planos';
    }
    return '/login';
  };

  if (loading) {
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