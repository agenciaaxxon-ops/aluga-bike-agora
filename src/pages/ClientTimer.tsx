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

// Simulação de dados do aluguel baseado no ID da URL
const getRentalData = (rentalId: string) => {
  return {
    id: rentalId,
    vehicleName: "Bike Azul #001",
    vehicleType: "bicicleta",
    startTime: new Date(Date.now() - 45 * 60 * 1000), // 45 min atrás
    endTime: new Date(Date.now() + 15 * 60 * 1000), // termina em 15 min
    storeName: "Bike Adventures",
    storeContact: "(13) 99999-9999",
    storeAddress: "Praia do Gonzaga, Santos - SP"
  };
};

const ClientTimer = () => {
  const { rentalId } = useParams();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  const rental = getRentalData(rentalId || "");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = rental.endTime.getTime();
      const diff = endTime - now;
      
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        return;
      }
      
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(minutes * 60 + seconds);
      
      // Mostrar aviso quando restam 10 minutos ou menos
      if (minutes <= 10 && !showWarning) {
        setShowWarning(true);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [rental.endTime, showWarning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const addTime = (additionalMinutes: number) => {
    // Em uma implementação real, isso faria uma chamada para a API
    console.log(`Adicionando ${additionalMinutes} minutos ao aluguel`);
    // Simular adição de tempo
    const newEndTime = new Date(rental.endTime.getTime() + additionalMinutes * 60 * 1000);
    rental.endTime = newEndTime;
    setIsExpired(false);
    setShowWarning(false);
  };

  return (
    <div className="min-h-screen bg-app p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-app-gradient rounded-2xl mb-4 shadow-emerald">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Aluga Bike Baixada</h1>
          <p className="text-muted-foreground">Acompanhe seu aluguel</p>
        </div>

        {/* Vehicle Info */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{rental.vehicleName}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {rental.vehicleType}
                </p>
              </div>
              <Badge className="bg-vehicle-rented text-white">
                Em uso
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Timer */}
        <Card className={`mb-6 border-0 shadow-lg ${isExpired ? 'border-destructive' : showWarning ? 'border-warning' : ''}`}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mb-4">
                <Clock className={`w-12 h-12 mx-auto mb-2 ${
                  isExpired ? 'text-destructive' : showWarning ? 'text-warning' : 'text-primary'
                }`} />
                <h2 className="text-lg font-medium text-muted-foreground">
                  {isExpired ? 'Tempo Esgotado' : 'Tempo Restante'}
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

        {/* Add Time Button */}
        <Dialog>
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
                Selecione quanto tempo deseja adicionar ao seu aluguel
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => addTime(15)}
                className="h-20 flex-col"
              >
                <Clock className="w-6 h-6 mb-2" />
                <span>+15 min</span>
                <span className="text-xs text-muted-foreground">R$ 5,00</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => addTime(30)}
                className="h-20 flex-col"
              >
                <Clock className="w-6 h-6 mb-2" />
                <span>+30 min</span>
                <span className="text-xs text-muted-foreground">R$ 8,00</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => addTime(60)}
                className="h-20 flex-col"
              >
                <Clock className="w-6 h-6 mb-2" />
                <span>+1 hora</span>
                <span className="text-xs text-muted-foreground">R$ 15,00</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => addTime(120)}
                className="h-20 flex-col"
              >
                <Clock className="w-6 h-6 mb-2" />
                <span>+2 horas</span>
                <span className="text-xs text-muted-foreground">R$ 25,00</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Store Info */}
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
                <p className="font-medium">{rental.storeName}</p>
                <p className="text-sm text-muted-foreground">Loja parceira</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Localização</p>
                <p className="text-sm text-muted-foreground">{rental.storeAddress}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Contato</p>
                <p className="text-sm text-muted-foreground">{rental.storeContact}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientTimer;