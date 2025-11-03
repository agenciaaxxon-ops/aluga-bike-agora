import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, ArrowLeft, Package, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Item {
  id: string;
  name: string;
  description: string | null;
  status: string;
  image_url: string | null;
}

interface ItemType {
  id: string;
  name: string;
  pricing_model: string;
  price_per_minute: number | null;
  price_per_day: number | null;
  price_fixed: number | null;
}

const DashboardItemTypeDetail = () => {
  const { typeId } = useParams();
  const navigate = useNavigate();
  const [itemType, setItemType] = useState<ItemType | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("disponível");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    loadData();
  }, [typeId]);

  const loadData = async () => {
    if (!typeId) return;

    try {
      setLoading(true);

      // Buscar dados do tipo
      const { data: typeData, error: typeError } = await supabase
        .from('item_types')
        .select('*')
        .eq('id', typeId)
        .single();

      if (typeError) throw typeError;
      setItemType(typeData);

      // Buscar itens deste tipo
      await loadItems();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('item_type_id', typeId)
      .order('name');

    if (!error && data) {
      setItems(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeId) return;

    try {
      if (editingItem) {
        // Atualizar item existente
        const { error } = await supabase.from('items').update({
          name,
          description: description || null,
          status,
          image_url: imageUrl || null
        }).eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: "Item atualizado com sucesso!" });
      } else {
        // Criar novo item
        // Buscar shop_id do item_type
        const { data: typeData } = await supabase
          .from('item_types')
          .select('shop_id')
          .eq('id', typeId)
          .single();

        if (!typeData) throw new Error('Tipo de item não encontrado');

        const { error } = await supabase.from('items').insert({
          shop_id: typeData.shop_id,
          item_type_id: typeId,
          name,
          description: description || null,
          status,
          image_url: imageUrl || null
        });

        if (error) throw error;
        toast({ title: "Item criado com sucesso!" });
      }

      setIsDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (error: any) {
      toast({
        title: editingItem ? "Erro ao atualizar item" : "Erro ao criar item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("disponível");
    setImageUrl("");
    setEditingItem(null);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || "");
    setStatus(item.status);
    setImageUrl(item.image_url || "");
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      'disponível': { color: 'bg-vehicle-available', label: 'Disponível' },
      'alugado': { color: 'bg-vehicle-rented', label: 'Alugado' },
      'em manutenção': { color: 'bg-vehicle-maintenance', label: 'Manutenção' },
      'desativado': { color: 'bg-muted', label: 'Desativado' }
    };

    const variant = variants[status] || variants['disponível'];
    return <Badge className={`${variant.color} text-white`}>{variant.label}</Badge>;
  };

  if (loading) {
    return <div className="min-h-screen bg-app flex items-center justify-center"><p>Carregando...</p></div>;
  }

  if (!itemType) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Tipo de item não encontrado</h2>
          <Button onClick={() => navigate('/dashboard/inventario')}>Voltar ao Inventário</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/inventario')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{itemType.name}</h1>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'itens'} cadastrados
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar Item' : `Novo Item em ${itemType.name}`}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Item</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Bike E-01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Bicicleta elétrica vermelha, com cesta"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponível">Disponível</SelectItem>
                      <SelectItem value="em manutenção">Em Manutenção</SelectItem>
                      <SelectItem value="desativado">Desativado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">URL da Imagem (Opcional)</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingItem ? 'Atualizar' : 'Criar Item'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {items.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Itens Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditItem(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhum item cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione itens individuais a este tipo
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardItemTypeDetail;
