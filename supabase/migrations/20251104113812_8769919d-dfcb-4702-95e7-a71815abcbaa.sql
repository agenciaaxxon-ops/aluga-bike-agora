-- Corrigir search_path nas funções para evitar avisos de segurança

CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.crypt(password, extensions.gen_salt('bf'));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN hash = extensions.crypt(password, hash);
END;
$$;

CREATE OR REPLACE FUNCTION public.hash_shop_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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