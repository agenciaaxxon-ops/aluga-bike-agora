import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Bike, Store, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginEmailError, setLoginEmailError] = useState("");
  const [loginPasswordError, setLoginPasswordError] = useState("");

  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerEmailError, setRegisterEmailError] = useState("");
  const [registerPasswordError, setRegisterPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | "">("");

  const emailSchema = z.string().trim().email("Email inválido").max(255);
  const passwordSchema = z.string().min(6, "A senha deve ter pelo menos 6 caracteres").max(128);

  // Validação em tempo real do email de login
  const validateLoginEmail = (email: string) => {
    try {
      emailSchema.parse(email);
      setLoginEmailError("");
      return true;
    } catch (err: any) {
      setLoginEmailError(err.errors?.[0]?.message || "Email inválido");
      return false;
    }
  };

  // Validação em tempo real da senha de login
  const validateLoginPassword = (password: string) => {
    try {
      passwordSchema.parse(password);
      setLoginPasswordError("");
      return true;
    } catch (err: any) {
      setLoginPasswordError(err.errors?.[0]?.message || "Senha inválida");
      return false;
    }
  };

  // Validação em tempo real do email de cadastro
  const validateRegisterEmail = (email: string) => {
    try {
      emailSchema.parse(email);
      setRegisterEmailError("");
      return true;
    } catch (err: any) {
      setRegisterEmailError(err.errors?.[0]?.message || "Email inválido");
      return false;
    }
  };

  // Validação de força da senha
  const checkPasswordStrength = (password: string) => {
    if (password.length === 0) {
      setPasswordStrength("");
      return;
    }
    
    if (password.length < 6) {
      setPasswordStrength("weak");
    } else if (password.length < 10) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
    
    try {
      passwordSchema.parse(password);
      setRegisterPasswordError("");
    } catch (err: any) {
      setRegisterPasswordError(err.errors?.[0]?.message || "Senha inválida");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        toast({ title: "Erro ao entrar", description: "Verifique seu e-mail e senha.", variant: "destructive" });
      } else {
        toast({ title: "Login realizado com sucesso" });
        // O App.tsx cuidará do redirecionamento
      }
    } catch (err: any) {
      toast({ title: "Dados inválidos", description: err?.message ?? "Verifique os campos", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!storeName.trim()) throw new Error("Informe o nome da loja");
      if (!ownerName.trim()) throw new Error("Informe o nome do responsável");
      emailSchema.parse(registerEmail);
      passwordSchema.parse(registerPassword);

      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: { store_name: storeName, owner_name: ownerName },
        },
      });

      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else if (data.user) {
        // *** INÍCIO DA MUDANÇA ***
        // 1. Desloga o usuário para não entrar direto no dashboard
        await supabase.auth.signOut(); 

        // 2. Mostra a mensagem de sucesso
        toast({
          title: "Cadastro concluído!",
          description: "Pode prosseguir com o login.",
        });

        // 3. Muda para a aba de login e limpa os campos para uma melhor experiência
        setActiveTab("login");
        setStoreName("");
        setOwnerName("");
        setRegisterEmail("");
        setRegisterPassword("");
        // *** FIM DA MUDANÇA ***
      }

    } catch (err: any) {
      toast({ title: "Dados inválidos", description: err?.message ?? "Verifique os campos", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Login | Aluga Bike Baixada";
  }, []);

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-app-gradient rounded-2xl mb-4 shadow-emerald">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Aluga Bike Baixada</h1>
          <p className="text-muted-foreground">
            Sistema de gerenciamento para locação de bicicletas
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Acesso para Lojistas</CardTitle>
            <CardDescription className="text-center">
              Entre na sua conta ou cadastre sua loja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        className={`pl-10 ${loginEmailError ? 'border-destructive' : loginEmail && !loginEmailError ? 'border-success' : ''}`}
                        required
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          if (e.target.value) validateLoginEmail(e.target.value);
                        }}
                        onBlur={(e) => validateLoginEmail(e.target.value)}
                      />
                      {loginEmail && !loginEmailError && (
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-success text-xl">✓</span>
                      )}
                    </div>
                    {loginEmailError && <p className="text-xs text-destructive">{loginEmailError}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className={`pl-10 ${loginPasswordError ? 'border-destructive' : loginPassword && !loginPasswordError ? 'border-success' : ''}`}
                        required
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (e.target.value) validateLoginPassword(e.target.value);
                        }}
                        onBlur={(e) => validateLoginPassword(e.target.value)}
                      />
                      {loginPassword && !loginPasswordError && (
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-success text-xl">✓</span>
                      )}
                    </div>
                    {loginPasswordError && <p className="text-xs text-destructive">{loginPasswordError}</p>}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    variant="default"
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Nome da Loja</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="storeName"
                        type="text"
                        placeholder="Bike Adventures"
                        className="pl-10"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Nome do Responsável</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="ownerName"
                        type="text"
                        placeholder="João Silva"
                        className="pl-10"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="registerEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="registerEmail"
                        type="email"
                        placeholder="contato@minhaloja.com"
                        className={`pl-10 ${registerEmailError ? 'border-destructive' : registerEmail && !registerEmailError ? 'border-success' : ''}`}
                        required
                        value={registerEmail}
                        onChange={(e) => {
                          setRegisterEmail(e.target.value);
                          if (e.target.value) validateRegisterEmail(e.target.value);
                        }}
                        onBlur={(e) => validateRegisterEmail(e.target.value)}
                      />
                      {registerEmail && !registerEmailError && (
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-success text-xl">✓</span>
                      )}
                    </div>
                    {registerEmailError && <p className="text-xs text-destructive">{registerEmailError}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">Senha (mínimo 6 caracteres)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="registerPassword"
                        type="password"
                        placeholder="••••••••"
                        className={`pl-10 ${registerPasswordError ? 'border-destructive' : ''}`}
                        required
                        value={registerPassword}
                        onChange={(e) => {
                          setRegisterPassword(e.target.value);
                          checkPasswordStrength(e.target.value);
                        }}
                      />
                    </div>
                    {registerPasswordError && <p className="text-xs text-destructive">{registerPasswordError}</p>}
                    
                    {/* Indicador de força da senha */}
                    {passwordStrength && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <div className={`h-1 flex-1 rounded ${passwordStrength === "weak" ? "bg-destructive" : passwordStrength === "medium" ? "bg-warning" : "bg-success"}`}></div>
                          <div className={`h-1 flex-1 rounded ${passwordStrength === "medium" ? "bg-warning" : passwordStrength === "strong" ? "bg-success" : "bg-muted"}`}></div>
                          <div className={`h-1 flex-1 rounded ${passwordStrength === "strong" ? "bg-success" : "bg-muted"}`}></div>
                        </div>
                        <p className={`text-xs ${passwordStrength === "weak" ? "text-destructive" : passwordStrength === "medium" ? "text-warning" : "text-success"}`}>
                          {passwordStrength === "weak" ? "Senha fraca" : passwordStrength === "medium" ? "Senha média" : "Senha forte"}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    variant="default"
                  >
                    {isLoading ? "Cadastrando..." : "Cadastrar Loja"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Sistema seguro para gestão de aluguéis</p>
        </div>
      </div>
    </div>
  );
};

export default Login;