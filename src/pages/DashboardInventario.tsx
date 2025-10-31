import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Package, ArrowRight, ArrowLeft, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface ItemType {
  id: string;
  name: string;
  pricing_model: 'per_minute' | 'per_day' | 'fixed_rate';
  price_per_minute: number | null;
  price_per_day: number | null;
  price_fixed: number | null;
  icon: string;
}

const DashboardInventario = () => {
  const navigate = useNavigate();
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userShop, setUserShop] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [pricingModel, setPricingModel] = useState<'per_minute' | 'per_day' | 'fixed_rate'>('per_minute');
  const [pricePerMinute, setPricePerMinute] = useState("0.50");
  const [pricePerDay, setPricePerDay] = useState("30.00");
  const [priceFixed, setPriceFixed] = useState("50.00");
  const [icon, setIcon] = useState("package");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shop } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (shop) {
        setUserShop(shop);
        await loadItemTypes(shop.id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItemTypes = async (shopId: string) => {
    const { data, error } = await supabase
      .from('item_types')
      .select('*')
      .eq('shop_id', shopId)
      .order('name');

    if (!error && data) {
      setItemTypes(data as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userShop) return;

    try {
      const { error } = await supabase.from('item_types').insert({
        shop_id: userShop.id,
        name,
        pricing_model: pricingModel,
        price_per_minute: pricingModel === 'per_minute' ? parseFloat(pricePerMinute) : null,
        price_per_day: pricingModel === 'per_day' ? parseFloat(pricePerDay) : null,
        price_fixed: pricingModel === 'fixed_rate' ? parseFloat(priceFixed) : null,
        icon
      });

      if (error) throw error;

      toast({ title: "Tipo de item criado com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
      await loadItemTypes(userShop.id);
    } catch (error: any) {
      toast({
        title: "Erro ao criar tipo de item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setName("");
    setPricingModel('per_minute');
    setPricePerMinute("0.50");
    setPricePerDay("30.00");
    setPriceFixed("50.00");
    setIcon("package");
  };

  const formatPrice = (itemType: ItemType) => {
    if (itemType.pricing_model === 'per_minute' && itemType.price_per_minute) {
      return `R$ ${itemType.price_per_minute.toFixed(2)} / min`;
    } else if (itemType.pricing_model === 'per_day' && itemType.price_per_day) {
      return `R$ ${itemType.price_per_day.toFixed(2)} / dia`;
    } else if (itemType.pricing_model === 'fixed_rate' && itemType.price_fixed) {
      return `R$ ${itemType.price_fixed.toFixed(2)} (taxa fixa)`;
    }
    return 'Sem preço';
  };

  if (loading) {
    return <div className="min-h-screen bg-app flex items-center justify-center"><p>Carregando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Inventário</h1>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Tipo de Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Tipo de Item</DialogTitle>
                <DialogDescription>
                  Crie uma categoria para seus itens (ex: Bicicletas, Pranchas, Ferramentas)
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Tipo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Bicicletas Elétricas"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricing_model">Modelo de Precificação</Label>
                  <Select value={pricingModel} onValueChange={(v: any) => setPricingModel(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_minute">Por Minuto</SelectItem>
                      <SelectItem value="per_day">Por Dia</SelectItem>
                      <SelectItem value="fixed_rate">Taxa Fixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {pricingModel === 'per_minute' && (
                  <div className="space-y-2">
                    <Label htmlFor="price_per_minute">Preço por Minuto (R$)</Label>
                    <Input
                      id="price_per_minute"
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricePerMinute}
                      onChange={(e) => setPricePerMinute(e.target.value)}
                      required
                    />
                  </div>
                )}

                {pricingModel === 'per_day' && (
                  <div className="space-y-2">
                    <Label htmlFor="price_per_day">Preço por Dia (R$)</Label>
                    <Input
                      id="price_per_day"
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(e.target.value)}
                      required
                    />
                  </div>
                )}

                {pricingModel === 'fixed_rate' && (
                  <div className="space-y-2">
                    <Label htmlFor="price_fixed">Taxa Fixa (R$)</Label>
                    <Input
                      id="price_fixed"
                      type="number"
                      step="0.01"
                      min="0"
                      value={priceFixed}
                      onChange={(e) => setPriceFixed(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="icon">Ícone</Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bike">Bicicleta</SelectItem>
                      <SelectItem value="package">Pacote</SelectItem>
                      <SelectItem value="box">Caixa</SelectItem>
                      <SelectItem value="wrench">Ferramenta</SelectItem>
                      <SelectItem value="camera">Câmera</SelectItem>
                      <SelectItem value="tent">Barraca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Criar Tipo
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {itemTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itemTypes.map((itemType) => (
              <Card
                key={itemType.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                onClick={() => navigate(`/dashboard/inventario/${itemType.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{itemType.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <DollarSign className="w-3 h-3" />
                          {formatPrice(itemType)}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhum tipo de item cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie tipos de itens para organizar seu inventário
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Tipo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardInventario;
