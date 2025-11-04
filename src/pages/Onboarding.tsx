import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Store, MapPin, FileText, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Onboarding = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [document, setDocument] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const addressSchema = z.string().trim().min(5, "Endereço muito curto").max(255);
  const documentSchema = z.string().trim().min(11, "CPF/CNPJ inválido").max(18);
  const phoneSchema = z.string().trim().min(10, "Telefone inválido").max(15);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      addressSchema.parse(address);
      documentSchema.parse(document);
      phoneSchema.parse(contactPhone);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      // Busca a loja do usuário
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!shop) throw new Error("Loja não encontrada");

      // Atualiza os dados da loja
      const { error: shopError } = await supabase
        .from('shops')
        .update({
          address,
          document,
          contact_phone: contactPhone
        })
        .eq('id', shop.id);

      if (shopError) throw shopError;

      // Atualiza o status para pending_payment
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscription_status: 'pending_payment' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Cadastro concluído!",
        description: "Agora escolha seu plano para continuar.",
      });

      navigate('/planos');

    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err?.message ?? "Verifique os campos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl mb-6 shadow-xl">
            <Store className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Complete seu Cadastro</h1>
          <p className="text-muted-foreground text-base">
            Seu trial de 20 minutos expirou. Complete as informações da sua loja para continuar.
          </p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-2xl text-center font-bold">Dados da Loja</CardTitle>
            <CardDescription className="text-center text-base">
              Preencha as informações completas para ativar sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="address"
                    type="text"
                    placeholder="Rua, número, bairro, cidade, estado"
                    className="pl-10"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CPF ou CNPJ</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="document"
                    type="text"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    className="pl-10"
                    required
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefone de Contato</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    className="pl-10"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isLoading}
                variant="premium"
              >
                {isLoading ? "Salvando..." : "Continuar para Planos"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
