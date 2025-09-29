-- Criação da tabela de perfis para lojistas
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  owner_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, store_name, owner_name)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'store_name', 
    new.raw_user_meta_data ->> 'owner_name'
  );
  RETURN new;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Habilitar RLS nas tabelas existentes
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para shops
CREATE POLICY "Users can view their own shops" 
ON public.shops 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shops" 
ON public.shops 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shops" 
ON public.shops 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas RLS para vehicles
CREATE POLICY "Users can view vehicles from their shops" 
ON public.vehicles 
FOR SELECT 
USING (shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert vehicles to their shops" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid()));

CREATE POLICY "Users can update vehicles from their shops" 
ON public.vehicles 
FOR UPDATE 
USING (shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid()));

-- Políticas RLS para rentals (públicas para clientes poderem acessar)
CREATE POLICY "Anyone can view active rentals" 
ON public.rentals 
FOR SELECT 
USING (true);

CREATE POLICY "Shop owners can manage rentals for their vehicles" 
ON public.rentals 
FOR ALL 
USING (vehicle_id IN (SELECT id FROM vehicles WHERE shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())));

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();