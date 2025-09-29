import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bike, Store, Clock, Users, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-app">
      {/* Hero Section */}
      <div className="bg-app-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl mb-8">
              <Bike className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Aluga Bike Baixada
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Sistema completo para gerenciamento de aluguel de bicicletas, triciclos e quadriciclos na Baixada Santista
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" variant="secondary" className="text-primary">
                  <Store className="w-5 h-5 mr-2" />
                  Acesso para Lojistas
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/30 text-primary hover:bg-white/10">
                <Users className="w-5 h-5 mr-2" />
                Como Funciona
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Facilite o gerenciamento dos seus aluguéis
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Uma solução completa e intuitiva para lojas de aluguel de veículos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Painel Administrativo</CardTitle>
              <CardDescription>
                Gerencie toda sua frota com interface simples e intuitiva
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Cadastro de veículos</li>
                <li>• Controle de status em tempo real</li>
                <li>• Histórico de aluguéis</li>
                <li>• Relatórios de uso</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Cronômetro para Clientes</CardTitle>
              <CardDescription>
                Clientes acompanham o tempo restante sem precisar de cadastro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Acesso via QR Code ou link</li>
                <li>• Tempo em tempo real</li>
                <li>• Opção de estender aluguel</li>
                <li>• Alertas automáticos</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Foco na Baixada</CardTitle>
              <CardDescription>
                Desenvolvido especialmente para o turismo da região
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Interface mobile-first</li>
                <li>• Suporte a múltiplos idiomas</li>
                <li>• Integração com pagamentos</li>
                <li>• Suporte local</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Demo */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Controle visual do status dos veículos
            </h2>
            <p className="text-xl text-muted-foreground">
              Saiba o status de cada veículo de forma instantânea
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <Badge className="bg-vehicle-available text-white text-lg px-4 py-2 mb-4">
                Disponível
              </Badge>
              <h3 className="font-semibold mb-2">Pronto para alugar</h3>
              <p className="text-sm text-muted-foreground">
                Veículo disponível e em perfeitas condições
              </p>
            </div>
            
            <div className="text-center">
              <Badge className="bg-vehicle-rented text-white text-lg px-4 py-2 mb-4">
                Alugado
              </Badge>
              <h3 className="font-semibold mb-2">Em uso pelo cliente</h3>
              <p className="text-sm text-muted-foreground">
                Cronômetro ativo, cliente pode acompanhar o tempo
              </p>
            </div>
            
            <div className="text-center">
              <Badge className="bg-vehicle-maintenance text-white text-lg px-4 py-2 mb-4">
                Manutenção
              </Badge>
              <h3 className="font-semibold mb-2">Fora de operação</h3>
              <p className="text-sm text-muted-foreground">
                Veículo em manutenção ou reparo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-app-gradient text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Cadastre sua loja e comece a gerenciar seus aluguéis hoje mesmo
          </p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="text-primary">
              <Store className="w-5 h-5 mr-2" />
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Bike className="w-8 h-8 mr-3" />
              <span className="text-xl font-bold">Aluga Bike Baixada</span>
            </div>
            <p className="text-background/70">
              Sistema de gerenciamento para aluguel de bicicletas na Baixada Santista
            </p>
            <p className="text-background/50 text-sm mt-4">
              © 2024 Aluga Bike Baixada. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
