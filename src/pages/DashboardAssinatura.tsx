import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CreditCard, FileText, XCircle, ArrowLeft } from "lucide-react";

const DashboardAssinatura = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [planName, setPlanName] = useState("Plano Pro");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    checkOwnerAndLoadData();
  }, []);

  const checkOwnerAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Verifica se é dono da loja
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!shop) {
        toast({
          title: "Acesso negado",
          description: "Apenas o dono da loja pode acessar esta página.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setIsOwner(true);

      // Busca status da assinatura
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single();

      if (profile) {
        setSubscriptionStatus(profile.subscription_status);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      navigate('/dashboard');
    }
  };

  const handleOpenPortal = () => {
    navigate('/dashboard/faturas');
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('cancel-subscription');
      
      if (error) throw error;
      
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso."
      });
      
      // Recarrega os dados para atualizar o status
      await checkOwnerAndLoadData();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a assinatura.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setLoading(true);
      
      // Redireciona para o fluxo de pagamento em vez de reativar diretamente
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca email do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new Error('Perfil não encontrado');
      }

      // Cria um novo link de pagamento
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: { 
          userId: user.id,
          userEmail: user.email,
          mode: 'production'
        }
      });

      if (error) throw error;

      // Redireciona para o pagamento
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error('Erro ao reativar assinatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o link de pagamento. Verifique se seu CPF/CNPJ está válido nas configurações.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Minha Assinatura</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie sua assinatura e forma de pagamento
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{planName}</span>
                <Badge variant={subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                  {subscriptionStatus === 'active' ? 'Ativo' : 
                   subscriptionStatus === 'trial' ? 'Trial' : 
                   subscriptionStatus === 'canceled' ? 'Cancelado' : 'Inativo'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Status atual da sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Button
                  onClick={handleOpenPortal}
                  disabled={loading}
                  className="w-full"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Portal do Cliente
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Gerencie seu método de pagamento e veja suas faturas
                </p>
              </div>

              {subscriptionStatus === 'active' && (
                <div className="pt-4 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar Assinatura
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelSubscription}>
                          Sim, cancelar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {subscriptionStatus === 'canceled' && (
                <div className="pt-4 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Reativar Assinatura
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reativar assinatura?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Deseja reativar sua assinatura e voltar a ter acesso aos recursos premium?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReactivateSubscription}>
                          Sim, reativar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardAssinatura;