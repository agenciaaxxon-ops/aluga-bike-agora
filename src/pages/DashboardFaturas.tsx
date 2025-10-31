import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileText, Copy, Download, ExternalLink, CreditCard } from "lucide-react";

interface Billing {
  id: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'EXPIRED';
  createdAt: string;
  url: string;
  devMode: boolean;
  customer: {
    metadata: {
      name?: string;
      email?: string;
    };
  };
}

const DashboardFaturas = () => {
  const navigate = useNavigate();
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Busca status da assinatura
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single();

      if (profile) {
        setSubscriptionStatus(profile.subscription_status);
      }

      // Busca faturas via edge function
      const { data, error } = await supabase.functions.invoke('list-user-billings');
      
      if (error) {
        console.error('Erro ao buscar faturas:', error);
        toast({
          title: "Erro ao carregar faturas",
          description: "Não foi possível carregar suas faturas.",
          variant: "destructive"
        });
      } else {
        setBillings(data?.billings || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'PAID': return 'default';
      case 'PENDING': return 'secondary';
      case 'EXPIRED': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PAID': return 'Pago';
      case 'PENDING': return 'Pendente';
      case 'EXPIRED': return 'Expirado';
      default: return status;
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link de pagamento foi copiado para a área de transferência."
    });
  };

  const handleUpdatePayment = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado.",
          variant: "destructive"
        });
        return;
      }

      // Chamar edge function com todos os parâmetros necessários
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: { 
          mode: 'prod',
          userId: user.id,
          userEmail: user.email
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erro ao criar link de pagamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o link de pagamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const paidBillings = billings.filter(b => b.status === 'PAID');
  const totalPaid = paidBillings.reduce((sum, b) => sum + b.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/assinatura')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Minhas Faturas</h1>
            <p className="text-muted-foreground mt-2">
              Histórico de pagamentos e cobranças
            </p>
          </div>

          {/* Card de Resumo */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status da Assinatura</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                  {subscriptionStatus === 'active' ? 'Ativo' : 
                   subscriptionStatus === 'trial' ? 'Trial' : 
                   subscriptionStatus === 'canceled' ? 'Cancelado' : 'Inativo'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Faturas Pagas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paidBillings.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Botão Atualizar Método de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Método de Pagamento</CardTitle>
              <CardDescription>
                Atualize sua forma de pagamento gerando um novo link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleUpdatePayment} disabled={loading}>
                <CreditCard className="mr-2 h-4 w-4" />
                Atualizar Método de Pagamento
              </Button>
            </CardContent>
          </Card>

          {/* Tabela de Faturas */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Faturas</CardTitle>
              <CardDescription>
                Todas as suas cobranças e pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma fatura encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Modo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billings.map((billing) => (
                      <TableRow key={billing.id}>
                        <TableCell>{formatDate(billing.createdAt)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {billing.id.substring(0, 12)}...
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(billing.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(billing.status)}>
                            {getStatusLabel(billing.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={billing.devMode ? 'outline' : 'default'}>
                            {billing.devMode ? 'Teste' : 'Prod'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBilling(billing);
                              setIsDetailDialogOpen(true);
                            }}
                          >
                            Ver Detalhes
                          </Button>
                          {billing.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(billing.url)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog de Detalhes */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Fatura</DialogTitle>
              <DialogDescription>
                Informações completas da cobrança
              </DialogDescription>
            </DialogHeader>
            {selectedBilling && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID da Fatura</p>
                    <p className="font-mono text-sm mt-1">{selectedBilling.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de Criação</p>
                    <p className="mt-1">{formatDate(selectedBilling.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(selectedBilling.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={getStatusVariant(selectedBilling.status)} className="mt-1">
                      {getStatusLabel(selectedBilling.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome do Cliente</p>
                    <p className="mt-1">{selectedBilling.customer?.metadata?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="mt-1">{selectedBilling.customer?.metadata?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Modo</p>
                    <Badge variant={selectedBilling.devMode ? 'outline' : 'default'} className="mt-1">
                      {selectedBilling.devMode ? 'Teste' : 'Produção'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Método de Pagamento</p>
                    <p className="mt-1">PIX</p>
                  </div>
                </div>
                
                {selectedBilling.status === 'PENDING' && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Link de Pagamento</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleCopyLink(selectedBilling.url)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Link
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => window.open(selectedBilling.url, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DashboardFaturas;
