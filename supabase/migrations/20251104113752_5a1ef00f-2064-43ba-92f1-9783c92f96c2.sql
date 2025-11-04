-- Habilitar extensão pgcrypto no schema correto
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Função para hash de senha usando bcrypt
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN extensions.crypt(password, extensions.gen_salt('bf'));
END;
$$;

-- Função para verificar senha
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN hash = extensions.crypt(password, hash);
END;
$$;

-- Trigger para hash automático de senha ao inserir/atualizar
CREATE OR REPLACE FUNCTION public.hash_shop_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.admin_password IS NOT NULL 
     AND NEW.admin_password NOT LIKE '$2a$%' 
     AND NEW.admin_password NOT LIKE '$2b$%' THEN
    NEW.admin_password := public.hash_password(NEW.admin_password);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_hash_shop_password ON public.shops;

CREATE TRIGGER trigger_hash_shop_password
BEFORE INSERT OR UPDATE OF admin_password ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.hash_shop_password();