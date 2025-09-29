import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, Plus, Settings, QrCode, Share2, Clock, ArrowRight } from "lucide-react";

interface DashboardTourProps {
  onAddVehicle: () => void;
}

const DashboardTour = ({ onAddVehicle }: DashboardTourProps) => {
  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-app-gradient rounded-2xl mb-4 mx-auto">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao Aluga Bike!</CardTitle>
          <CardDescription className="text-base">
            Vamos te ensinar como gerenciar seus aluguéis de forma simples e eficiente
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tutorial Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1 */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <CardTitle className="text-lg">Cadastre seus Veículos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Primeiro, adicione as bicicletas, triciclos ou quadriciclos que você possui para aluguel.
            </CardDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Plus className="w-4 h-4" />
              <span>Clique em "Adicionar Veículo" para começar</span>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="border-l-4 border-l-secondary">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <CardTitle className="text-lg">Configure os Preços</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Defina quanto cobra por minuto para cada tipo de veículo.
            </CardDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings className="w-4 h-4" />
              <span>Use o botão "Preços" no cabeçalho</span>
            </div>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="border-l-4 border-l-accent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <CardTitle className="text-lg">Inicie um Aluguel</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Selecione um veículo disponível e escolha o tempo inicial (30min, 1h, 2h, 3h).
            </CardDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>O sistema gera automaticamente link e QR Code</span>
            </div>
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                4
              </div>
              <CardTitle className="text-lg">Compartilhe com o Cliente</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              O cliente acessa o cronômetro pelo QR Code ou link, sem precisar baixar app.
            </CardDescription>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <QrCode className="w-4 h-4" />
                <span>QR Code</span>
              </div>
              <div className="flex items-center gap-1">
                <Share2 className="w-4 h-4" />
                <span>Link direto</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Pronto para começar?</h3>
            <p className="text-muted-foreground">
              Adicione seu primeiro veículo para começar a gerenciar seus aluguéis
            </p>
            <Button onClick={onAddVehicle} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Primeiro Veículo
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl mb-2">📱</div>
          <h4 className="font-medium mb-1">Sem Apps</h4>
          <p className="text-sm text-muted-foreground">
            Clientes não precisam baixar nada
          </p>
        </div>
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl mb-2">⚡</div>
          <h4 className="font-medium mb-1">Rápido</h4>
          <p className="text-sm text-muted-foreground">
            Aluguel criado em segundos
          </p>
        </div>
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl mb-2">💰</div>
          <h4 className="font-medium mb-1">Eficiente</h4>
          <p className="text-sm text-muted-foreground">
            Controle total dos seus aluguéis
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardTour;