-- Adicionar coluna admin_password na tabela shops
ALTER TABLE shops 
ADD COLUMN admin_password TEXT;

-- Atualizar trigger handle_new_user para incluir senha admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Cria a entrada na tabela de perfis
  INSERT INTO public.profiles (id, store_name, owner_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'store_name',
    new.raw_user_meta_data ->> 'owner_name'
  );

  -- Cria a loja padrão com senha de admin
  INSERT INTO public.shops (user_id, name, contact_phone, admin_password)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'store_name',
    new.raw_user_meta_data ->> 'contact_phone',
    new.raw_user_meta_data ->> 'admin_password'
  );

  RETURN new;
END;
$function$;