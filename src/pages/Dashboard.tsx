import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Plus, 
  LogOut, 
  Square, 
  QrCode,
  Timer,
  Settings,
  User as UserIcon,
  Phone,
  AlertTriangle,
  Printer,
  Share2,
  DollarSign,
  CreditCard,
  FileText,
  Shield,
  MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { TrialBanner } from "@/components/TrialBanner";
import OnboardingTour from "@/components/OnboardingTour";
import { RentalLocationMap } from "@/components/RentalLocationMap";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Rental = Database["public"]["Tables"]["rentals"]["Row"];

interface RentalReport {
  clientName: string | null;
  itemTypeName: string;
  initialDuration: number;
  overtimeDuration: number;
  totalMinutes: number;
  pricePerUnit: number;
  initialCost: number;
  overtimeCost: number;
  totalAmount: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<any[]>([]);
  const [userShop, setUserShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isNewRentalModalOpen, setIsNewRentalModalOpen] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<string>("");
  const [endConfirmForId, setEndConfirmForId] = useState<string | null>(null);
  const [rentalReport, setRentalReport] = useState<RentalReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  // Novos estados para inventário
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [selectedItemType, setSelectedItemType] = useState<string>("");
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");

  // Estados para modo admin
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return localStorage.getItem('adminMode') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true);
  
  // Estados para o mapa de localização
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedRentalForMap, setSelectedRentalForMap] = useState<any>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Você saiu da sua conta." });
  };

  const handleVerifyAdminPassword = async () => {
    if (!userShop) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-password', {
        body: { shopId: userShop.id, password: adminPasswordInput }
      });
      
      if (error) {
        toast({ 
          title: "Erro ao verificar senha", 
          description: error.message,
          variant: "destructive" 
        });
        return;
      }
      
      if (data?.valid) {
        setIsAdminMode(true);
        localStorage.setItem('adminMode', 'true');
        setIsAdminDialogOpen(false);
        setAdminPasswordInput("");
        toast({ 
          title: "Modo Admin ativado!", 
          description: "Acesso completo concedido."
        });
      } else {
        toast({ 
          title: "Senha incorreta", 
          description: "A senha de admin não está correta.",
          variant: "destructive" 
        });
      }
    } catch (err) {
      toast({ 
        title: "Erro", 
        description: "Não foi possível verificar a senha.",
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!userShop) return;
    const channel = supabase
      .channel('rentals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rentals', filter: `shop_id=eq.${userShop.id}` },
        () => loadRentals(userShop.id)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userShop]);

  // Carregar itens disponíveis quando selecionar um tipo
  useEffect(() => {
    if (!selectedItemType) {
      setAvailableItems([]);
      setSelectedItem("");
      return;
    }

    const loadAvailableItems = async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('item_type_id', selectedItemType)
        .eq('status', 'disponível')
        .order('name');
      
      if (!error && data) {
        setAvailableItems(data);
      }
    };

    loadAvailableItems();
  }, [selectedItemType]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; };

      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_ends_at, subscription_status, store_name, has_completed_tutorial')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setTrialEndsAt(profile.trial_ends_at);
        setSubscriptionStatus(profile.subscription_status);
        setHasCompletedTutorial(profile.has_completed_tutorial || false);
        
        // Se é o primeiro acesso, ativa admin automaticamente e mostra tour
        if (!profile.has_completed_tutorial) {
          setIsAdminMode(true);
          localStorage.setItem('adminMode', 'true');
          setShowOnboardingTour(true);
        }
      }

      let { data: shop, error: shopError } = await supabase.from('shops').select('*').eq('user_id', user.id).single();

      if (shopError && shopError.code === 'PGRST116') {
        const { data: newShop, error: insertError } = await supabase.from('shops').insert({ user_id: user.id, name: profile?.store_name || 'Minha Loja' }).select().single();
        if (insertError) throw insertError;
        shop = newShop;
      } else if (shopError) {
        throw shopError;
      }
      setUserShop(shop);
      
      if (shop) {
        await loadRentals(shop.id);
        
        // Buscar item_types da loja
        const { data: types } = await supabase
          .from('item_types')
          .select('*')
          .eq('shop_id', shop.id)
          .order('name');
        if (types) setItemTypes(types);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTutorial = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ has_completed_tutorial: true })
        .eq('id', user.id);

      setShowOnboardingTour(false);
      setHasCompletedTutorial(true);
      
      toast({
        title: "Tutorial completo!",
        description: "Bem-vindo ao Alugaí. Você está pronto para começar!"
      });
    } catch (error) {
      console.error('Erro ao completar tutorial:', error);
    }
  };
  
  const loadRentals = async (shopId: string) => {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, item:items(name, item_type:item_types(*))')
      .eq('shop_id', shopId)
      .eq('status', 'Ativo')
      .order('created_at', { ascending: false });
    if (!error && data) setRentals(data);
  };

  const handleStartRental = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userShop || !selectedItem) {
      toast({ 
        title: "Erro", 
        description: "Selecione um item antes de iniciar",
        variant: "destructive" 
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const clientName = formData.get("clientName") as string;
    const clientPhone = formData.get("clientPhone") as string;
    
    // Buscar o item_type para saber o pricing_model
    const selectedType = itemTypes.find(t => t.id === selectedItemType);
    if (!selectedType) {
      toast({ 
        title: "Erro", 
        description: "Tipo de item não encontrado",
        variant: "destructive" 
      });
      return;
    }

    const startTime = new Date();
    let endTime: Date;

    // Calcular end_time baseado no pricing_model
    if (selectedType.pricing_model === 'per_day') {
      const days = parseInt(formData.get("days") as string, 10);
      endTime = new Date(startTime.getTime() + days * 24 * 60 * 60 * 1000);
    } else {
      // per_minute e fixed_rate usam duration em minutos
      const duration = parseInt(formData.get("duration") as string, 10);
      endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    }

    try {
      const { data, error } = await supabase.from('rentals').insert({
        shop_id: userShop.id, 
        item_id: selectedItem,
        client_name: clientName, 
        client_phone: clientPhone,
        start_time: startTime.toISOString(), 
        end_time: endTime.toISOString(), 
        status: 'Ativo'
      }).select().single();

      if (error) throw error;

      // Atualizar status do item para "alugado"
      const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'alugado' })
        .eq('id', selectedItem);

      if (itemError) throw itemError;

      toast({ title: "Locação iniciada com sucesso!" });
      setIsNewRentalModalOpen(false);
      setSelectedItemType("");
      setSelectedItem("");
      showQrCode(data);
      await loadRentals(userShop.id);
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro ao iniciar locação", variant: "destructive" });
    }
  };
  
  const handleEndRental = async (rentalId: string) => {
    try {
      // Chamar edge function para cálculo seguro no backend
      const { data, error } = await supabase.functions.invoke('finalize-rental', {
        body: { rentalId }
      });

      if (error) throw error;

      const { totalAmount, overageMinutes, actualEndTime } = data;

      // Buscar dados do rental para o relatório
      const rentalToEnd = rentals.find(r => r.id === rentalId);
      if (!rentalToEnd) return;

      const { data: itemData } = await supabase
        .from('items')
        .select('*, item_type:item_types(*)')
        .eq('id', rentalToEnd.item_id)
        .single();

      if (itemData) {
        const startTime = new Date(rentalToEnd.start_time);
        const scheduledEndTime = new Date(rentalToEnd.end_time);
        const actualEnd = new Date(actualEndTime);
        const totalMinutes = Math.floor((actualEnd.getTime() - startTime.getTime()) / 60000);
        const scheduledMinutes = Math.floor((scheduledEndTime.getTime() - startTime.getTime()) / 60000);

        setRentalReport({
          clientName: rentalToEnd.client_name,
          itemTypeName: itemData.item_type.name,
          initialDuration: scheduledMinutes,
          overtimeDuration: overageMinutes,
          totalMinutes,
          pricePerUnit: itemData.item_type.price_per_minute || 0,
          initialCost: totalAmount - (overageMinutes * (itemData.item_type.price_per_minute || 0)),
          overtimeCost: overageMinutes * (itemData.item_type.price_per_minute || 0),
          totalAmount
        });
        setIsReportModalOpen(true);
      }

      setEndConfirmForId(null);
      await loadRentals(userShop.id);

      toast({
        title: "Locação finalizada",
        description: `Valor total: R$ ${totalAmount.toFixed(2)}${overageMinutes > 0 ? ` (${overageMinutes} min de acréscimo)` : ''}`,
      });
    } catch (error) {
      console.error('Erro ao finalizar aluguel:', error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o aluguel",
        variant: "destructive",
      });
    }
  };

  const showQrCode = async (rental: any) => {
    const link = `${window.location.origin}/cliente/${rental.access_code}`;
    try {
      const dataUrl = await QRCode.toDataURL(link, { width: 224 });
      setQrDataUrl(dataUrl);
      setQrLink(link);
      setQrOpen(true);
    } catch (e) {
      toast({ title: "Erro ao gerar QR Code", variant: "destructive" });
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

  const overdueRentalsCount = rentals.filter(r => new Date(r.end_time).getTime() < nowTick).length;

  if (loading) {
    return <div className="min-h-screen bg-app flex items-center justify-center"><p>Carregando...</p></div>;
  }
  
  return (
    <div className="min-h-screen bg-app">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-white/95 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 animate-fade-in">
              <div className="w-10 h-10 bg-app-gradient rounded-xl flex items-center justify-center shadow-emerald transition-all duration-300 hover:scale-110 hover:shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground transition-colors duration-300">{userShop?.name || 'Minha Loja'}</h1>
                <p className="text-sm text-muted-foreground transition-colors duration-300">Painel de Gerenciamento</p>
              </div>
            </div>
            <div className="flex items-center gap-2 animate-fade-in">
              {!isAdminMode ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAdminDialogOpen(true)}
                  className="transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <Shield className="w-4 h-4 mr-2" /> Admin
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsAdminMode(false);
                      localStorage.removeItem('adminMode');
                      toast({ title: "Modo Admin desativado" });
                    }}
                    className="transition-all duration-300 hover:scale-105 hover:shadow-md border-primary text-primary"
                  >
                    <Shield className="w-4 h-4 mr-2" /> Sair do Modo Admin
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/inventario')} className="transition-all duration-300 hover:scale-105 hover:shadow-md">
                    <Package className="w-4 h-4 mr-2" /> Inventário
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/relatorios')} className="transition-all duration-300 hover:scale-105 hover:shadow-md">
                    <FileText className="w-4 h-4 mr-2" /> Relatórios
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/configuracoes')} className="transition-all duration-300 hover:scale-105 hover:shadow-md">
                    <Settings className="w-4 h-4 mr-2" /> Configurações
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/assinatura')} className="transition-all duration-300 hover:scale-105 hover:shadow-md">
                    <CreditCard className="w-4 h-4 mr-2" /> Assinatura
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout} className="transition-all duration-300 hover:scale-105 hover:shadow-md">
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TrialBanner 
          trialEndsAt={trialEndsAt} 
          subscriptionStatus={subscriptionStatus} 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="animate-fade-in hover:shadow-emerald transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locações Ativas</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary transition-all duration-300">{rentals.length}</div>
            </CardContent>
          </Card>
          <Card className={`animate-fade-in hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${overdueRentalsCount > 0 ? 'animate-pulse-glow' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locações em Atraso</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${overdueRentalsCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold transition-all duration-300 ${overdueRentalsCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {overdueRentalsCount}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-foreground transition-colors duration-300">Locações Ativas</h2>
          <Dialog open={isNewRentalModalOpen} onOpenChange={setIsNewRentalModalOpen}>
            <DialogTrigger asChild>
              <Button className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Plus className="w-4 h-4 mr-2" /> Nova Locação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Iniciar Nova Locação</DialogTitle>
                <DialogDescription>Preencha os dados para iniciar uma nova locação.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleStartRental} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input id="clientName" name="clientName" placeholder="Ex: João Silva" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Telefone (Opcional)</Label>
                  <Input id="clientPhone" name="clientPhone" placeholder="Ex: (13) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-type">Tipo de Item</Label>
                  <Select value={selectedItemType} onValueChange={setSelectedItemType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedItemType && (
                  <div className="space-y-2">
                    <Label htmlFor="item">Item Específico</Label>
                    <Select value={selectedItem} onValueChange={setSelectedItem} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o item" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableItems.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Nenhum item disponível
                          </SelectItem>
                        ) : (
                          availableItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedItemType && (() => {
                  const selectedType = itemTypes.find(t => t.id === selectedItemType);
                  const pricingModel = selectedType?.pricing_model;

                  if (pricingModel === 'per_minute') {
                    return (
                      <div className="space-y-2">
                        <Label>Tempo Inicial</Label>
                        <Select name="duration" required defaultValue="30">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="60">1 hora</SelectItem>
                            <SelectItem value="120">2 horas</SelectItem>
                            <SelectItem value="180">3 horas</SelectItem>
                            <SelectItem value="360">6 horas</SelectItem>
                            <SelectItem value="720">12 horas</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Cobrança: R$ {selectedType.price_per_minute?.toFixed(2)}/minuto
                        </p>
                      </div>
                    );
                  }

                  if (pricingModel === 'per_day') {
                    return (
                      <div className="space-y-2">
                        <Label>Número de Dias</Label>
                        <Select name="days" required defaultValue="1">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 dia</SelectItem>
                            <SelectItem value="2">2 dias</SelectItem>
                            <SelectItem value="3">3 dias</SelectItem>
                            <SelectItem value="7">7 dias</SelectItem>
                            <SelectItem value="15">15 dias</SelectItem>
                            <SelectItem value="30">30 dias</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Cobrança: R$ {selectedType.price_per_day?.toFixed(2)}/dia
                        </p>
                      </div>
                    );
                  }

                  if (pricingModel === 'fixed_rate') {
                    return (
                      <div className="space-y-2">
                        <Label>Duração Estimada</Label>
                        <Select name="duration" required defaultValue="60">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="60">1 hora</SelectItem>
                            <SelectItem value="120">2 horas</SelectItem>
                            <SelectItem value="180">3 horas</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Taxa fixa: R$ {selectedType.price_fixed?.toFixed(2)} (cobrança proporcional se devolver antes)
                        </p>
                      </div>
                    );
                  }

                  return null;
                })()}
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsNewRentalModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="flex-1">Iniciar Locação</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {rentals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentals.map((rental: any, index: number) => {
              const timeLeftSeconds = Math.floor((new Date(rental.end_time).getTime() - nowTick) / 1000);
              const isOvertime = timeLeftSeconds < 0;
              
              const startTime = new Date(rental.start_time).getTime();
              const currentTime = nowTick;
              const minutesElapsed = Math.ceil((currentTime - startTime) / (1000 * 60));
              const pricePerMinute = rental.item?.item_type?.price_per_minute || 0;
              const currentCost = minutesElapsed * pricePerMinute;
              
              return (
                <Card 
                  key={rental.id} 
                  className={`border-0 shadow-lg flex flex-col hover:shadow-emerald transition-all duration-300 hover:scale-[1.02] animate-fade-in-up ${isOvertime ? 'ring-2 ring-destructive/50 animate-pulse-glow' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg transition-all duration-300 hover:bg-primary/20 hover:scale-110">
                          <UserIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg transition-colors duration-300">{rental.client_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{rental.item?.name || 'Item'}</p>
                        </div>
                      </div>
                      <Badge className={`transition-all duration-300 ${isOvertime ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"}`}>
                        {isOvertime ? "Excedido" : "Ativo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-grow flex flex-col justify-end">
                    {rental.client_phone && (
                      <div className="flex items-center text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{rental.client_phone}</span>
                      </div>
                    )}
                    
                    {rental.latitude && rental.longitude && (
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
                          <button 
                            onClick={() => {
                              setSelectedRentalForMap(rental);
                              setMapModalOpen(true);
                            }}
                            className="text-emerald-600 hover:underline font-medium"
                          >
                            Ver localização no mapa
                          </button>
                        </div>
                        {rental.last_location_update && (
                          <div className="text-xs text-muted-foreground pl-6">
                            Atualizado {formatDistanceToNow(new Date(rental.last_location_update), { 
                              locale: ptBR, 
                              addSuffix: true 
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`flex items-center justify-between text-sm transition-all duration-300 ${isOvertime ? 'text-destructive font-bold scale-105' : ''}`}>
                      <span className="text-muted-foreground">Tempo:</span>
                      <span className="font-mono font-medium">{formatTime(timeLeftSeconds)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10 transition-all duration-300 hover:bg-primary/10 hover:border-primary/20">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary transition-transform duration-300 hover:scale-110" />
                        <span className="text-sm font-medium text-muted-foreground">Custo atual:</span>
                      </div>
                      <span className="text-lg font-bold text-primary transition-all duration-300">
                        R$ {currentCost.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 transition-all duration-300 hover:scale-105 hover:shadow-md" 
                        onClick={() => showQrCode(rental)}
                      >
                        <QrCode className="w-4 h-4 mr-1" /> QR Code
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1 transition-all duration-300 hover:scale-105 hover:shadow-lg" 
                        onClick={() => setEndConfirmForId(rental.id)}
                      >
                        <Square className="w-4 h-4 mr-2" /> Finalizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">Nenhuma locação ativa no momento.</h3>
            <p className="text-sm text-muted-foreground">Clique em "Nova Locação" para começar.</p>
          </div>
        )}
      </main>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code do Cliente</DialogTitle>
            <DialogDescription>Peça para o cliente escanear para abrir o cronômetro no celular.</DialogDescription>
          </DialogHeader>
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-3">
              <img src={qrDataUrl} alt="QR Code" className="w-56 h-56" />
              <div className="text-xs break-all text-muted-foreground text-center">{qrLink}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={mapModalOpen} onOpenChange={setMapModalOpen}>
        <DialogContent className="max-w-3xl min-h-[500px]">
          <DialogHeader>
            <DialogTitle>Localização de {selectedRentalForMap?.client_name}</DialogTitle>
            <DialogDescription>
              Rastreamento em tempo real da localização do cliente
            </DialogDescription>
          </DialogHeader>
          {selectedRentalForMap?.latitude && selectedRentalForMap?.longitude && (
            <RentalLocationMap
              latitude={selectedRentalForMap.latitude}
              longitude={selectedRentalForMap.longitude}
              clientName={selectedRentalForMap.client_name}
              lastUpdate={selectedRentalForMap.last_location_update}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!endConfirmForId} onOpenChange={(open) => !open && setEndConfirmForId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar locação?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita e irá gerar o relatório de cobrança.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if(endConfirmForId) handleEndRental(endConfirmForId); setEndConfirmForId(null); }}>Finalizar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Relatório de Finalização</DialogTitle>
            <DialogDescription>Resumo da locação para cobrança.</DialogDescription>
          </DialogHeader>
          {rentalReport && 
            <div className="space-y-4">
              <div id="rental-report-content" className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Cliente:</span><span className="font-medium">{rentalReport.clientName}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Item:</span><span className="font-medium">{rentalReport.itemTypeName}</span></div>
                <div className="border-t my-2"></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Tempo Contratado:</span><span className="font-medium">{rentalReport.initialDuration} min</span></div>
                {rentalReport.overtimeDuration > 0 && <div className="flex justify-between text-destructive"><span className="text-sm">Tempo Excedente:</span><span className="font-medium">{rentalReport.overtimeDuration} min</span></div>}
                <div className="border-t my-2"></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total de Minutos:</span><span className="font-medium">{rentalReport.totalMinutes} min</span></div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total a Pagar:</span>
                    <span className="text-2xl font-bold text-primary">R$ {rentalReport.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const text = `*Relatório de Locação*\n\nCliente: ${rentalReport.clientName}\nItem: ${rentalReport.itemTypeName}\nTempo total: ${rentalReport.totalMinutes} min\n*Total: R$ ${rentalReport.totalAmount.toFixed(2)}*`;
                    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>
              
              <Button onClick={() => setIsReportModalOpen(false)} className="w-full">Fechar</Button>
            </div>
          }
        </DialogContent>
      </Dialog>

      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Acesso Administrativo</DialogTitle>
            <DialogDescription>
              Digite a senha de administrador para acessar funções restritas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminPasswordInput">Senha de Admin</Label>
              <Input
                id="adminPasswordInput"
                type="password"
                placeholder="Digite a senha de admin"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleVerifyAdminPassword();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => {
                  setIsAdminDialogOpen(false);
                  setAdminPasswordInput("");
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                className="flex-1" 
                onClick={handleVerifyAdminPassword}
              >
                Entrar como Admin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OnboardingTour 
        open={showOnboardingTour} 
        onComplete={handleCompleteTutorial}
      />
    </div>
  );
};

export default Dashboard;
