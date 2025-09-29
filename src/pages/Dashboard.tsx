import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bike, 
  Plus, 
  LogOut, 
  Clock, 
  Play, 
  Square, 
  QrCode,
  Share2,
  Timer,
  Settings
} from "lucide-react";

// Tipo para veículos
type VehicleType = "bicicleta" | "triciclo" | "quadriciclo";
type VehicleStatus = "disponivel" | "alugado" | "manutencao";

interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  status: VehicleStatus;
  currentRental?: {
    startTime: Date;
    duration: number; // em minutos
    clientLink: string;
  };
}

const Dashboard = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: "1",
      name: "Bike Azul #001",
      type: "bicicleta",
      status: "disponivel"
    },
    {
      id: "2", 
      name: "Triciclo Rosa #002",
      type: "triciclo",
      status: "alugado",
      currentRental: {
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
        duration: 60,
        clientLink: "cliente/abc123"
      }
    },
    {
      id: "3",
      name: "Quadri Verde #003", 
      type: "quadriciclo",
      status: "disponivel"
    }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const handleAddVehicle = (formData: FormData) => {
    const name = formData.get("vehicleName") as string;
    const type = formData.get("vehicleType") as VehicleType;
    
    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      name,
      type,
      status: "disponivel"
    };
    
    setVehicles([...vehicles, newVehicle]);
    setIsAddModalOpen(false);
  };

  const handleStartRental = (vehicle: Vehicle, duration: number) => {
    const clientLink = `cliente/${Math.random().toString(36).substring(7)}`;
    const updatedVehicle = {
      ...vehicle,
      status: "alugado" as VehicleStatus,
      currentRental: {
        startTime: new Date(),
        duration,
        clientLink
      }
    };
    
    setVehicles(vehicles.map(v => v.id === vehicle.id ? updatedVehicle : v));
    setSelectedVehicle(updatedVehicle);
    setIsRentalModalOpen(false);
  };

  const handleEndRental = (vehicle: Vehicle) => {
    const updatedVehicle = {
      ...vehicle,
      status: "disponivel" as VehicleStatus,
      currentRental: undefined
    };
    
    setVehicles(vehicles.map(v => v.id === vehicle.id ? updatedVehicle : v));
  };

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case "disponivel": return "bg-success text-success-foreground";
      case "alugado": return "bg-warning text-warning-foreground";
      case "manutencao": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: VehicleStatus) => {
    switch (status) {
      case "disponivel": return "Disponível";
      case "alugado": return "Alugado";
      case "manutencao": return "Manutenção";
      default: return status;
    }
  };

  const getVehicleIcon = (type: VehicleType) => {
    return <Bike className="w-8 h-8" />;
  };

  return (
    <div className="min-h-screen bg-app">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-app-gradient rounded-xl flex items-center justify-center">
                <Bike className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Bike Adventures</h1>
                <p className="text-sm text-muted-foreground">Painel de Gerenciamento</p>
              </div>
            </div>
            
            <Button variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vehicles.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Uso</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {vehicles.filter(v => v.status === "alugado").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {vehicles.filter(v => v.status === "disponivel").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Grid */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Meus Veículos</h2>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Veículo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Veículo</DialogTitle>
                <DialogDescription>
                  Cadastre um novo veículo na sua frota
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddVehicle(formData);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleName">Nome/Identificador</Label>
                  <Input
                    id="vehicleName"
                    name="vehicleName"
                    placeholder="Ex: Bike Azul #004"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Tipo de Veículo</Label>
                  <Select name="vehicleType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bicicleta">Bicicleta</SelectItem>
                      <SelectItem value="triciclo">Triciclo</SelectItem>
                      <SelectItem value="quadriciclo">Quadriciclo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Adicionar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getVehicleIcon(vehicle.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {vehicle.type}
                      </p>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(vehicle.status)}>
                    {getStatusText(vehicle.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {vehicle.status === "disponivel" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="default">
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar Aluguel
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Iniciar Aluguel - {vehicle.name}</DialogTitle>
                        <DialogDescription>
                          Configure o tempo inicial do aluguel
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            onClick={() => handleStartRental(vehicle, 30)}
                            className="h-20 flex-col"
                          >
                            <Clock className="w-6 h-6 mb-2" />
                            30 min
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleStartRental(vehicle, 60)}
                            className="h-20 flex-col"
                          >
                            <Clock className="w-6 h-6 mb-2" />
                            1 hora
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleStartRental(vehicle, 120)}
                            className="h-20 flex-col"
                          >
                            <Clock className="w-6 h-6 mb-2" />
                            2 horas
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleStartRental(vehicle, 180)}
                            className="h-20 flex-col"
                          >
                            <Clock className="w-6 h-6 mb-2" />
                            3 horas
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                {vehicle.status === "alugado" && vehicle.currentRental && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tempo restante:</span>
                      <span className="font-mono font-medium">
                        {Math.max(0, vehicle.currentRental.duration - 
                          Math.floor((Date.now() - vehicle.currentRental.startTime.getTime()) / (1000 * 60))
                        )} min
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // Copiar link para compartilhar
                          navigator.clipboard.writeText(`${window.location.origin}/${vehicle.currentRental?.clientLink}`);
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        QR Code
                      </Button>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleEndRental(vehicle)}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Finalizar Aluguel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;