-- Adicionar campos de trial e assinatura na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN trial_ends_at timestamp with time zone,
ADD COLUMN subscription_status text DEFAULT 'trial' NOT NULL;

-- Adicionar campos obrigatórios de cadastro completo na tabela shops
ALTER TABLE public.shops 
ADD COLUMN address text,
ADD COLUMN document text;

-- Atualizar usuários existentes para ter trial de 1 hora a partir de agora
UPDATE public.profiles 
SET trial_ends_at = now() + interval '1 hour'
WHERE trial_ends_at IS NULL;

-- Criar índice para melhorar performance das consultas
CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX idx_profiles_trial_ends_at ON public.profiles(trial_ends_at);