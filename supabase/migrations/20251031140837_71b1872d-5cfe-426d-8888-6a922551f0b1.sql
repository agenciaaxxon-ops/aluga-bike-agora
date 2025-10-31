-- Adicionar campo para rastrear tutorial completado
ALTER TABLE public.profiles
ADD COLUMN has_completed_tutorial BOOLEAN DEFAULT false;

-- Índice para performance
CREATE INDEX idx_profiles_tutorial ON public.profiles(has_completed_tutorial);