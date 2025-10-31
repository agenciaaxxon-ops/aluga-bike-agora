import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, DollarSign, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Rental {
  id: string;
  client_name: string;
  item_id: string;
  start_time: string;
  actual_end_time: string;
  total_cost: number;
}

const DashboardRelatorios = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!shop) {
        navigate('/dashboard');
        return;
      }

      // Busca todos os aluguéis finalizados com dados do item
      const { data: rentalsData } = await supabase
        .from('rentals')
        .select('*, item:items(name, item_type:item_types(name))')
        .eq('shop_id', shop.id)
        .eq('status', 'Finalizado')
        .order('actual_end_time', { ascending: false });

      if (rentalsData) {
        setRentals(rentalsData);

        // Calcula métricas do mês atual
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const monthlyRentals = rentalsData.filter(r => 
          new Date(r.actual_end_time) >= firstDayOfMonth
        );

        const revenue = monthlyRentals.reduce((sum, r) => sum + (Number(r.total_cost) || 0), 0);
        setMonthlyRevenue(revenue);
        setMonthlyCount(monthlyRentals.length);

        // Calcula duração média
        if (monthlyRentals.length > 0) {
          const totalMinutes = monthlyRentals.reduce((sum, r) => {
            const start = new Date(r.start_time).getTime();
            const end = new Date(r.actual_end_time).getTime();
            return sum + ((end - start) / 1000 / 60);
          }, 0);
          setAvgDuration(Math.round(totalMinutes / monthlyRentals.length));
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      navigate('/dashboard');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
      <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe o desempenho da sua loja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Faturamento do Mês
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Aluguéis do Mês
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tempo Médio
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Aluguéis</CardTitle>
              <CardDescription>
                Todos os aluguéis finalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rentals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentals.map((rental: any) => {
                      const duration = Math.round(
                        (new Date(rental.actual_end_time).getTime() - 
                         new Date(rental.start_time).getTime()) / 1000 / 60
                      );
                      
                      return (
                        <TableRow key={rental.id}>
                          <TableCell>{rental.client_name || 'N/A'}</TableCell>
                          <TableCell>
                            {rental.item?.item_type?.name || rental.item?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(rental.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{formatDuration(duration)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(Number(rental.total_cost) || 0)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum aluguel finalizado ainda
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardRelatorios;