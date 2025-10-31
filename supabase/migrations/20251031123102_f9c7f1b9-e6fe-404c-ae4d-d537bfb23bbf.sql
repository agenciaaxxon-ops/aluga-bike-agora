-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'funcionario');

-- Criar tabela de membros da equipe
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'funcionario',
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, shop_id)
);

-- Habilitar RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Função de segurança para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se usuário é dono da loja
CREATE OR REPLACE FUNCTION public.is_shop_owner(_user_id UUID, _shop_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shops
    WHERE id = _shop_id
      AND user_id = _user_id
  )
$$;

-- Função para verificar se usuário pertence à equipe da loja
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _shop_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND shop_id = _shop_id
  )
$$;

-- Policies para team_members
CREATE POLICY "Donos podem ver membros da sua equipe"
ON public.team_members
FOR SELECT
USING (public.is_shop_owner(auth.uid(), shop_id));

CREATE POLICY "Donos podem adicionar membros"
ON public.team_members
FOR INSERT
WITH CHECK (public.is_shop_owner(auth.uid(), shop_id));

CREATE POLICY "Donos podem remover membros"
ON public.team_members
FOR DELETE
USING (public.is_shop_owner(auth.uid(), shop_id));

-- Atualizar policies de rentals para incluir team_members
DROP POLICY IF EXISTS "Shop owners can manage their own rentals" ON public.rentals;

CREATE POLICY "Donos e equipe podem gerenciar aluguéis"
ON public.rentals
FOR ALL
USING (
  public.is_shop_owner(auth.uid(), shop_id) OR
  public.is_team_member(auth.uid(), shop_id)
)
WITH CHECK (
  public.is_shop_owner(auth.uid(), shop_id) OR
  public.is_team_member(auth.uid(), shop_id)
);

-- Atualizar policies de vehicles para incluir team_members
DROP POLICY IF EXISTS "Users can view vehicles from their shops" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles to their shops" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update vehicles from their shops" ON public.vehicles;

CREATE POLICY "Donos e equipe podem ver veículos"
ON public.vehicles
FOR SELECT
USING (
  public.is_shop_owner(auth.uid(), shop_id) OR
  public.is_team_member(auth.uid(), shop_id)
);

CREATE POLICY "Donos e equipe podem adicionar veículos"
ON public.vehicles
FOR INSERT
WITH CHECK (
  public.is_shop_owner(auth.uid(), shop_id) OR
  public.is_team_member(auth.uid(), shop_id)
);

CREATE POLICY "Donos e equipe podem atualizar veículos"
ON public.vehicles
FOR UPDATE
USING (
  public.is_shop_owner(auth.uid(), shop_id) OR
  public.is_team_member(auth.uid(), shop_id)
);