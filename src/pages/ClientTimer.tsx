import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Bike, 
  Clock, 
  Plus, 
  AlertTriangle,
  MapPin,
  Phone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RentalData {
  id: string;
  vehicle_name: string;
  vehicle_type: string;
  start_time: string;
  end_time: string;
  store_name: string;
  store_contact?: string;
  store_address?: string;
  status: string;
  access_code: string;
}

const ClientTimer = () => {
  const { rentalId } = useParams();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [rental, setRental] = useState<RentalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  // Estado para controlar a abertura do modal
  const [isAddTimeModalOpen, setIsAddTimeModalOpen] = useState(false);

  useEffect(() => {
    if (rentalId) {
      loadRentalData();
    }
  }, [rentalId]);

  useEffect(() => {
    if (!rental) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const endTime = new Date(rental.end_time).getTime();
      const diff = endTime - now;
      
      setTimeLeft(diff / 1000);
      
      if (diff <= 0) {
        setIsExpired(true);
      } else {
        setIsExpired(false);
        if (diff / (1000 * 60) <= 10) {
          setShowWarning(true);
        } else {
          setShowWarning(false);
        }
      }
    };
    
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [rental]);

  const loadRentalData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('rentals')
        .select('*, shop:shops(name)')
        .eq('access_code', rentalId)
        .eq('status', 'Ativo')
        .maybeSingle();

      if (error || !data) {
        console.error('Rental not found:', error);
        setNotFound(true);
        return;
      }

      // @ts-ignore
      const storeName = Array.isArray(data.shop) ? data.shop[0]?.name : data.shop?.name || 'Loja Parceira';

      const rentalData: RentalData = {
        id: data.id,
        // @ts-ignore
        vehicle_name: data.vehicle_type ? data.vehicle_type.charAt(0).toUpperCase() + data.vehicle_type.slice(1) : 'Veículo',
        // @ts-ignore
        vehicle_type: data.vehicle_type || 'veículo',
        start_time: data.start_time,
        end_time: data.end_time,
        store_name: storeName,
        status: data.status,
        access_code: data.access_code
      };

      setRental(rentalData);
      
    } catch (error) {
      console.error('Erro ao carregar aluguel:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const isOvertime = totalSeconds < 0;
    if (isOvertime) totalSeconds = Math.abs(totalSeconds);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    const timeString = hours > 0
      ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
    return isOvertime ? `-${timeString}` : timeString;
  };

  const addTime = async (additionalMinutes: number) => {
    if (!rental) return;
    
    try {
      const { error } = await supabase.functions.invoke("extend_rental_time", {
        body: { 
          access_code: rental.access_code, 
          minutes: additionalMinutes 
        }
      });

      if (error) throw error;
      
      const newEndTime = new Date(new Date(rental.end_time).getTime() + additionalMinutes * 60 * 1000);
      setRental(prev => prev ? { ...prev, end_time: newEndTime.toISOString() } : null);
      
      toast({ 
        title: `+${additionalMinutes} minutos adicionados!`,
      });
      
    } catch (error: any) {
      toast({ 
        title: "Erro ao adicionar tempo", 
        description: error.message || "Tente novamente ou entre em contato com a loja",
        variant: "destructive" 
      });
    } finally {
      setIsAddTimeModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando seu aluguel...</p>
        </div>
      </div>
    );
  }

  if (notFound || !rental) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-2xl mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Aluguel não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O código do aluguel pode estar incorreto ou o aluguel já foi finalizado.
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com a loja se você acredita que isso é um erro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-app-gradient rounded-2xl mb-4 shadow-emerald">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{rental.store_name}</h1>
          <p className="text-muted-foreground">Acompanhe seu aluguel</p>
        </div>

        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{rental.vehicle_name}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {rental.vehicle_type}
                </p>
              </div>
              <Badge className={`${isExpired ? 'bg-destructive' : 'bg-primary'} text-primary-foreground`}>
                {isExpired ? 'Expirado' : 'Em uso'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className={`mb-6 border-0 shadow-lg`}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mb-4">
                <Clock className={`w-12 h-12 mx-auto mb-2 ${
                  isExpired ? 'text-destructive' : showWarning ? 'text-warning' : 'text-primary'
                }`} />
                <h2 className="text-lg font-medium text-muted-foreground">
                  {isExpired ? 'Tempo Excedido' : 'Tempo Restante'}
                </h2>
              </div>
              
              <div className={`text-6xl font-mono font-bold mb-4 ${
                isExpired ? 'text-destructive' : showWarning ? 'text-warning' : 'text-foreground'
              }`}>
                {formatTime(timeLeft)}
              </div>
              
              {isExpired && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center text-destructive mb-2">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Tempo esgotado!</span>
                  </div>
                  <p className="text-sm text-destructive/80">
                    Retorne o veículo para a loja ou adicione mais tempo
                  </p>
                </div>
              )}
              
              {showWarning && !isExpired && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center text-warning mb-2">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Atenção!</span>
                  </div>
                  <p className="text-sm text-warning/80">
                    Seu tempo está acabando. Considere adicionar mais tempo.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isAddTimeModalOpen} onOpenChange={setIsAddTimeModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Mais Tempo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Tempo</DialogTitle>
              <DialogDescription>
                Selecione quanto tempo deseja adicionar ao seu aluguel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button variant="outline" onClick={() => addTime(15)} className="h-20 flex-col"><Clock className="w-6 h-6 mb-2" /><span>+15 min</span></Button>
              <Button variant="outline" onClick={() => addTime(30)} className="h-20 flex-col"><Clock className="w-6 h-6 mb-2" /><span>+30 min</span></Button>
              <Button variant="outline" onClick={() => addTime(60)} className="h-20 flex-col"><Clock className="w-6 h-6 mb-2" /><span>+1 hora</span></Button>
              <Button variant="outline" onClick={() => addTime(120)} className="h-20 flex-col"><Clock className="w-6 h-6 mb-2" /><span>+2 horas</span></Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Informações da Loja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Bike className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{rental.store_name}</p>
                <p className="text-sm text-muted-foreground">Loja parceira</p>
              </div>
            </div>
            
            {rental.store_address && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Localização</p>
                  <p className="text-sm text-muted-foreground">{rental.store_address}</p>
                </div>
              </div>
            )}
            
            {rental.store_contact && (
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Contato</p>
                  <p className="text-sm text-muted-foreground">{rental.store_contact}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Detalhes do Aluguel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Código:</span>
              <span className="font-mono font-medium">{rental.access_code}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Início:</span>
              <span className="font-medium">
                {new Date(rental.start_time).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Término previsto:</span>
              <span className="font-medium">
                {new Date(rental.end_time).toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientTimer;