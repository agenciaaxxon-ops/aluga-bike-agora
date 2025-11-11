import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { z } from "zod";

// Utilidades de telefone (Brasil)
const sanitizePhone = (value: string) => value.replace(/\D/g, "");
const formatBRPhone = (raw: string) => {
  const digits = sanitizePhone(raw).slice(0, 11); // máx 11 dígitos
  if (digits.length <= 2) return digits; // DDD incompleto
  if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`; // 11 dígitos (celular)
};

const phoneSchema = z
  .string()
  .transform((val) => sanitizePhone(val))
  .refine((val) => val.length === 10 || val.length === 11, {
    message: "Informe DDD + número com 10 ou 11 dígitos",
  });

const DashboardConfiguracoes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    contact_phone: "",
    address: ""
  });

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: shop, error } = await supabase
        .from('shops')
        .select('id, name, contact_phone, address')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (shop) {
        setShopId(shop.id);
        setFormData({
          name: shop.name || "",
          contact_phone: formatBRPhone(shop.contact_phone || ""),
          address: shop.address || ""
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da loja.",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Validação e sanitização do telefone
      const parsed = phoneSchema.safeParse(formData.contact_phone);
      if (!parsed.success) {
        toast({
          title: "Telefone inválido",
          description: parsed.error.issues[0]?.message || "Use DDD + número (10 ou 11 dígitos)",
          variant: "destructive",
        });
        return;
      }
      const sanitizedPhone = parsed.data; // apenas números

      const { error } = await supabase
        .from('shops')
        .update({
          name: formData.name.trim(),
          contact_phone: sanitizedPhone,
          address: formData.address.trim()
        })
        .eq('id', shopId);

      if (error) throw error;

      // Mantém a máscara no input após salvar
      setFormData((prev) => ({ ...prev, contact_phone: formatBRPhone(sanitizedPhone) }));

      toast({
        title: "Configurações salvas!",
        description: "As informações da loja foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
      <div className="max-w-2xl mx-auto">
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
            <h1 className="text-3xl font-bold">Configurações da Loja</h1>
            <p className="text-muted-foreground mt-2">
              Atualize as informações da sua loja
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Loja</CardTitle>
              <CardDescription>
                Essas informações serão exibidas para os clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Loja</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Bike Rental Center"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone de Contato</Label>
                  <Input
                    id="phone"
                    value={formData.contact_phone}
                    onChange={(e) => {
                      const masked = formatBRPhone(e.target.value);
                      setFormData({ ...formData, contact_phone: masked });
                    }}
                    placeholder="(00) 00000-0000"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Salvamos apenas números (DDD+telefone). Não inclua +55.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade - UF"
                    required
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardConfiguracoes;