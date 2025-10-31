import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, UserPlus, Trash2 } from "lucide-react";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

const DashboardEquipe = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [shopId, setShopId] = useState<string>("");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    checkOwnerAndLoadTeam();
  }, []);

  const checkOwnerAndLoadTeam = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Verifica se é dono da loja
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!shop) {
        toast({
          title: "Acesso negado",
          description: "Apenas o dono da loja pode gerenciar a equipe.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setIsOwner(true);
      setShopId(shop.id);

      // Carrega membros da equipe
      const { data: members } = await supabase
        .from('team_members')
        .select('*')
        .eq('shop_id', shop.id);

      if (members) {
        setTeamMembers(members);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
      navigate('/dashboard');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail) {
      toast({
        title: "Erro",
        description: "Digite um e-mail válido.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Convida usuário por e-mail
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
        data: {
          shop_id: shopId,
          role: 'funcionario'
        },
        redirectTo: `${window.location.origin}/dashboard`
      });

      if (error) throw error;

      toast({
        title: "Convite enviado!",
        description: `Um e-mail de convite foi enviado para ${inviteEmail}`
      });

      setInviteEmail("");
      await checkOwnerAndLoadTeam();
    } catch (error: any) {
      console.error('Erro ao convidar:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o convite.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Membro removido",
        description: "O membro foi removido da equipe."
      });

      await checkOwnerAndLoadTeam();
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o membro.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isOwner) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app p-6">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold">Gestão de Equipe</h1>
            <p className="text-muted-foreground mt-2">
              Convide e gerencie os membros da sua equipe
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Convidar Novo Membro</CardTitle>
              <CardDescription>
                Envie um convite por e-mail para adicionar um funcionário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail do funcionário</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="funcionario@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enviar Convite
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membros da Equipe</CardTitle>
              <CardDescription>
                {teamMembers.length} membro(s) na equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID do Usuário</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Adicionado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-xs">
                          {member.user_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                            {member.role === 'admin' ? 'Admin' : 'Funcionário'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover membro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O membro perderá acesso ao sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveMember(member.id)}>
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum membro na equipe ainda. Convide o primeiro!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardEquipe;