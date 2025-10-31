-- Adicionar coluna invited_email na tabela team_members para guardar email de convites pendentes
ALTER TABLE public.team_members
ADD COLUMN invited_email TEXT;

-- Criar função para processar aceite de convite quando usuário confirmar email
CREATE OR REPLACE FUNCTION public.handle_team_invite_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar team_members onde há convite pendente com o email do novo usuário
  UPDATE public.team_members
  SET 
    user_id = NEW.id,
    invited_email = NULL
  WHERE invited_email = NEW.email
    AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que executa após usuário confirmar email
CREATE TRIGGER on_team_invite_user_confirmed
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_team_invite_accepted();