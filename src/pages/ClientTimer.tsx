import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Store,
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
  item_name: string;
  item_type_name: string;
  start_time: string;
  end_time: string;
  store_name: string;
  store_contact?: string;
  store_address?: string;
  status: string;
  access_code: string;
  pricing_model?: string;
}

const ClientTimer = () => {
  const { rentalId } = useParams();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [rental, setRental] = useState<RentalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  
  // Estado para controlar a abertura do modal
  const [isAddTimeModalOpen, setIsAddTimeModalOpen] = useState(false);

  // Estados para rastreamento de localização
  const [locationStatus, setLocationStatus] = useState<'inactive' | 'active' | 'denied' | 'error'>('inactive');
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  useEffect(() => {
    if (rentalId) {
      loadRentalData();
    }
  }, [rentalId]);

  useEffect(() => {
    if (!rental) return;
    
    // Para taxa fixa, não calcular tempo
    if (rental.pricing_model === 'fixed_rate') return;

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

  // Effect para rastreamento de localização
  useEffect(() => {
    if (!rental || rental.status !== 'Ativo') return;

    // Verificar se o navegador suporta geolocalização
    if (!navigator.geolocation) {
      console.log('Geolocalização não é suportada neste navegador');
      setLocationStatus('error');
      return;
    }

    const startTracking = () => {
      console.log('[ClientTimer] Starting location tracking for rental:', rental.id);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('[ClientTimer] Location obtained:', { latitude, longitude, accuracy });
          updateLocationOnServer(latitude, longitude);
          setLocationStatus('active');
        },
        (error) => {
          console.error('[ClientTimer] Geolocation error:', {
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: error.PERMISSION_DENIED,
            POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
            TIMEOUT: error.TIMEOUT
          });
          if (error.code === error.PERMISSION_DENIED) {
            console.log('[ClientTimer] Location permission denied');
            setLocationStatus('denied');
          } else {
            console.log('[ClientTimer] Location error (not permission)');
            setLocationStatus('error');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    };

    startTracking();

    // Cleanup: parar de rastrear quando o componente desmontar
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [rental]);

  const updateLocationOnServer = async (latitude: number, longitude: number) => {
    if (!rental) return;

    const now = Date.now();
    const lastLocation = lastLocationRef.current;

    // Throttle: só enviar se mudou significativamente ou passou tempo suficiente
    if (lastLocation) {
      const timeDiff = now - lastLocation.time;
      const distance = Math.sqrt(
        Math.pow(latitude - lastLocation.lat, 2) + 
        Math.pow(longitude - lastLocation.lng, 2)
      ) * 111000; // Conversão aproximada para metros

      // Só enviar se passou mais de 30 segundos OU se mudou mais de 10 metros
      if (timeDiff < 30000 && distance < 10) {
        console.log('[ClientTimer] Location update throttled - too soon or too close');
        return;
      }
    }

    console.log('[ClientTimer] Updating location on server:', { 
      latitude, 
      longitude, 
      access_code: rental.access_code,
      rental_id: rental.id 
    });

    try {
      const { data, error } = await supabase.functions.invoke('update-rental-location', {
        body: {
          access_code: rental.access_code,
          latitude,
          longitude
        }
      });

      if (error) {
        console.error('[ClientTimer] Error updating location:', error);
      } else {
        console.log('[ClientTimer] Location updated successfully:', data);
        // Atualizar última localização enviada
        lastLocationRef.current = { lat: latitude, lng: longitude, time: now };
      }
    } catch (error) {
      console.error('[ClientTimer] Exception when sending location:', error);
    }
  };

  const loadRentalData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('rentals')
        .select('*, pricing_model, shop:shops(name, contact_phone, address), item:items(name, item_type:item_types(name))')
        .eq('access_code', rentalId)
        .eq('status', 'Ativo')
        .maybeSingle();

      if (error || !data) {
        console.error('Rental not found:', error);
        setNotFound(true);
        return;
      }

      const rentalData: RentalData = {
        id: data.id,
        item_name: data.item?.name || 'Item',
        item_type_name: data.item?.item_type?.name || 'Tipo',
        start_time: data.start_time,
        end_time: data.end_time,
        store_name: data.shop?.name || 'Loja Parceira',
        store_contact: data.shop?.contact_phone,
        store_address: data.shop?.address,
        status: data.status,
        access_code: data.access_code,
        pricing_model: data.pricing_model
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

  const handleTimeSelection = async (minutes: number) => {
    // Busca o preço por minuto da loja
    if (!rental?.id) return;

    try {
      const { data: rentalData } = await supabase
        .from('rentals')
        .select('shop_id')
        .eq('id', rental.id)
        .single();

      if (!rentalData) return;

      const { data: shop } = await supabase
        .from('shops')
        .select('price_per_minute')
        .eq('id', rentalData.shop_id)
        .single();

      const pricePerMinute = Number(shop?.price_per_minute || 0.69);
      const totalPrice = pricePerMinute * minutes;

      setSelectedMinutes(minutes);
      setCalculatedPrice(totalPrice);
      setIsAddTimeModalOpen(false);
      setShowPriceDialog(true);
    } catch (error) {
      console.error('Erro ao calcular preço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível calcular o preço.",
        variant: "destructive"
      });
    }
  };

  const addTime = async () => {
    if (!rental || selectedMinutes === 0) return;
    
    setShowPriceDialog(false);
    
    try {
      const { data, error } = await supabase.functions.invoke("extend_rental_time", {
        body: { 
          access_code: rental.access_code, 
          minutes: selectedMinutes 
        }
      });

      if (error) {
        const errorMessage = error.message || "Tente novamente ou entre em contato com a loja";
        throw new Error(errorMessage);
      }

      if (data && data.error) {
        throw new Error(data.error);
      }
      
      const newEndTime = new Date(new Date(rental.end_time).getTime() + selectedMinutes * 60 * 1000);
      setRental(prev => prev ? { ...prev, end_time: newEndTime.toISOString() } : null);
      
      toast({ 
        title: "✓ Tempo adicionado!",
        description: `+${selectedMinutes} minutos`,
      });
      
    } catch (error: any) {
      toast({ 
        title: "Erro ao adicionar tempo", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setSelectedMinutes(0);
      setCalculatedPrice(0);
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
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{rental.store_name}</h1>
          <p className="text-muted-foreground">Acompanhe seu aluguel</p>
        </div>

        {/* Indicador de Localização */}
        {locationStatus !== 'inactive' && (
          <Card className="mb-4 border-0 shadow-sm">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${
                    locationStatus === 'active' ? 'text-green-500' : 
                    locationStatus === 'denied' ? 'text-destructive' : 
                    'text-warning'
                  }`} />
                  <span className="text-sm font-medium">
                    {locationStatus === 'active' && 'Localização ativa'}
                    {locationStatus === 'denied' && 'Permissão negada'}
                    {locationStatus === 'error' && 'Erro na localização'}
                  </span>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  locationStatus === 'active' ? 'bg-green-500 animate-pulse' : 
                  locationStatus === 'denied' ? 'bg-destructive' : 
                  'bg-warning'
                }`} />
              </div>
              {locationStatus === 'active' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sua localização está sendo compartilhada com a loja
                </p>
              )}
              {locationStatus === 'denied' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ative a permissão de localização nas configurações do navegador
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{rental.item_name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {rental.item_type_name}
                </p>
              </div>
              <Badge className={isExpired ? 'bg-destructive text-primary-foreground' : 'bg-primary text-primary-foreground'}>
                {isExpired ? 'Expirado' : 'Em uso'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {rental.pricing_model !== 'fixed_rate' && (
          <Card className={`mb-6 border-0 shadow-lg ${isExpired ? 'ring-2 ring-destructive/50' : showWarning ? 'ring-2 ring-warning/50' : ''}`}>
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
                
                {isExpired && rental.pricing_model !== 'fixed_rate' && (
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
                
                {showWarning && !isExpired && rental.pricing_model !== 'fixed_rate' && (
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
        )}

        {rental.pricing_model === 'fixed_rate' && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <Badge className="text-lg px-4 py-2 mb-3">
                  💰 Taxa Fixa - Sem limite de tempo
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Este aluguel não possui tempo limite
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {rental.pricing_model !== 'fixed_rate' && (
          <Sheet open={isAddTimeModalOpen} onOpenChange={setIsAddTimeModalOpen}>
            <SheetTrigger asChild>
              <Button className="w-full mb-6" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Mais Tempo
              </Button>
            </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="text-2xl">Adicionar Tempo</SheetTitle>
              <SheetDescription>
                Selecione quanto tempo deseja adicionar ao seu aluguel.
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4 pb-6">
              <Button 
                variant="outline" 
                onClick={() => handleTimeSelection(15)} 
                className="h-24 flex-col gap-2 text-lg hover:bg-primary/10 hover:border-primary"
              >
                <Clock className="w-8 h-8" />
                <span className="font-semibold">+15 min</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleTimeSelection(30)} 
                className="h-24 flex-col gap-2 text-lg hover:bg-primary/10 hover:border-primary"
              >
                <Clock className="w-8 h-8" />
                <span className="font-semibold">+30 min</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleTimeSelection(60)} 
                className="h-24 flex-col gap-2 text-lg hover:bg-primary/10 hover:border-primary"
              >
                <Clock className="w-8 h-8" />
                <span className="font-semibold">+1 hora</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleTimeSelection(120)} 
                className="h-24 flex-col gap-2 text-lg hover:bg-primary/10 hover:border-primary"
              >
                <Clock className="w-8 h-8" />
                <span className="font-semibold">+2 horas</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        )}

        <AlertDialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar adição de tempo</AlertDialogTitle>
              <AlertDialogDescription>
                Adicionar <strong>+{selectedMinutes} minutos</strong> por{" "}
                <strong>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(calculatedPrice)}
                </strong>?
                <br />
                <br />
                O valor será adicionado à sua conta final.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={addTime}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Informações da Loja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
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
            {rental.pricing_model !== 'fixed_rate' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Término previsto:</span>
                <span className="font-medium">
                  {new Date(rental.end_time).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientTimer;