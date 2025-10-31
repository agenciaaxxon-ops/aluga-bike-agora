import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Plus, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingTour = ({ open, onComplete }: OnboardingTourProps) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "🎉 Bem-vindo ao Alugaí!",
      description: "Você está em Modo Admin e pode acessar todas as funcionalidades da plataforma.",
      content: (
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
            <Sparkles className="w-8 h-8 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Modo Admin Ativado</p>
              <p className="text-sm text-muted-foreground">
                Você tem acesso completo para configurar sua loja e gerenciar inventário.
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Vamos fazer um tour rápido para você começar a usar o sistema!
          </p>
        </div>
      )
    },
    {
      title: "📦 Passo 1: Criar Tipos de Item",
      description: "Organize seu inventário criando categorias (tipos) de itens.",
      content: (
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <Package className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <p className="font-semibold text-foreground">O que são Tipos de Item?</p>
              <p className="text-sm text-muted-foreground">
                São categorias que agrupam itens similares. Exemplos:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Bicicletas Elétricas</li>
                <li>Pranchas de Surf</li>
                <li>Ferramentas</li>
                <li>Câmeras Profissionais</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-accent/50 p-4 rounded-lg border-l-4 border-primary">
            <p className="text-sm font-medium mb-2">💡 Dica Importante:</p>
            <p className="text-sm text-muted-foreground">
              Para cada tipo, você define o modelo de precificação: por minuto, por dia ou taxa fixa.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Como criar:</p>
            <ol className="text-sm text-muted-foreground space-y-2 ml-4 list-decimal">
              <li>Clique no botão "Inventário" no topo da página</li>
              <li>Clique em "Adicionar Tipo de Item"</li>
              <li>Preencha o nome, escolha o modelo de preço e defina o valor</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      title: "🏷️ Passo 2: Adicionar Itens",
      description: "Adicione itens individuais em cada tipo criado.",
      content: (
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <Plus className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Itens Específicos</p>
              <p className="text-sm text-muted-foreground">
                Dentro de cada tipo, você cadastra os itens individuais do seu estoque. Exemplos:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Bike E-01, Bike E-02, Bike E-03</li>
                <li>Prancha Pro, Prancha Iniciante</li>
                <li>Furadeira A, Furadeira B</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Como adicionar:</p>
            <ol className="text-sm text-muted-foreground space-y-2 ml-4 list-decimal">
              <li>No Inventário, clique em um tipo de item</li>
              <li>Clique em "Adicionar Item"</li>
              <li>Preencha nome, descrição e status do item</li>
            </ol>
          </div>

          <div className="bg-accent/50 p-4 rounded-lg border-l-4 border-primary">
            <p className="text-sm font-medium mb-2">✅ Status dos Itens:</p>
            <p className="text-sm text-muted-foreground">
              Disponível, Em Manutenção, Desativado. Apenas itens "Disponíveis" aparecem ao criar uma locação.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "🚀 Passo 3: Iniciar Locações",
      description: "Pronto! Agora você pode começar a alugar seus itens.",
      content: (
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 border rounded-lg bg-primary/5">
            <CheckCircle2 className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Tudo Pronto!</p>
              <p className="text-sm text-muted-foreground">
                Com tipos e itens cadastrados, você já pode começar a trabalhar:
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="text-sm font-medium">Clique em "Nova Locação"</p>
                <p className="text-xs text-muted-foreground">Preencha dados do cliente</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="text-sm font-medium">Selecione tipo e item</p>
                <p className="text-xs text-muted-foreground">Escolha o tempo inicial</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="text-sm font-medium">Mostre o QR Code ao cliente</p>
                <p className="text-xs text-muted-foreground">Ele pode acompanhar o tempo em tempo real</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                4
              </div>
              <div>
                <p className="text-sm font-medium">Finalize quando o cliente devolver</p>
                <p className="text-xs text-muted-foreground">O sistema calcula automaticamente o valor total</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Pronto para começar!
            </p>
            <p className="text-xs text-muted-foreground">
              Explore o sistema e qualquer dúvida, você pode acessar este tour novamente nas configurações.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={handleSkip}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-base">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[300px]">
          {currentStep.content}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index === step ? 'bg-primary' : index < step ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 sm:flex-initial"
            >
              Pular Tutorial
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 sm:flex-initial"
            >
              {isLastStep ? 'Começar!' : 'Próximo'}
              {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
