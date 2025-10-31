import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Bike, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Planos = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      // Chama a edge function para criar o link de pagamento
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: { userId: user.id, userEmail: user.email }
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        console.log('Redirecionando para:', data.paymentUrl);
        // Redireciona para o checkout do AbacatePay
        window.location.href = data.paymentUrl;
      } else {
        console.error('Resposta da API:', data);
        throw new Error("Link de pagamento não gerado");
      }

    } catch (err: any) {
      const errorMessage = err?.message ?? "Tente novamente mais tarde";
      
      // Trata especificamente erro de documento inválido
      if (errorMessage.includes("Invalid taxId") || errorMessage.includes("taxId")) {
        toast({
          title: "Documento inválido",
          description: "Atualize seu CPF/CNPJ na página de cadastro e tente novamente",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao processar",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Dashboard completo para gestão",
    "Cadastro ilimitado de veículos",
    "Sistema de QR Code para clientes",
    "Controle de tempo em tempo real",
    "Extensão de tempo pelo cliente",
    "Histórico completo de aluguéis",
    "Suporte prioritário",
    "Atualizações gratuitas"
  ];

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl mb-6 shadow-xl">
            <Bike className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Escolha seu Plano</h1>
          <p className="text-muted-foreground text-lg">
            Desbloqueie todo o potencial do Aluga Bike Baixada
          </p>
        </div>

        <div className="grid md:grid-cols-1 gap-8 max-w-xl mx-auto">
          <Card className="border-2 border-primary shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0">
              <Badge variant="default" className="rounded-none rounded-bl-lg px-4 py-1">
                <Zap className="w-3 h-3 mr-1" />
                Recomendado
              </Badge>
            </div>
            
            <CardHeader className="space-y-4 pb-6 pt-12">
              <CardTitle className="text-3xl text-center font-bold">Plano Pro</CardTitle>
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-primary">R$ 99</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Cobrado mensalmente
                </p>
              </div>
              <CardDescription className="text-center text-base">
                Tudo que você precisa para gerenciar sua locadora
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-8 space-y-6">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleSubscribe}
                className="w-full h-14 text-lg font-semibold"
                disabled={isLoading}
                variant="premium"
              >
                {isLoading ? "Processando..." : "Assinar Agora"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Pagamento seguro via AbacatePay • Cancele quando quiser
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Tem dúvidas? Entre em contato com nosso suporte
          </p>
        </div>
      </div>
    </div>
  );
};

export default Planos;
