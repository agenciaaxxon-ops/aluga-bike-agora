-- Adicionar campo total_extended_minutes à tabela rentals
ALTER TABLE public.rentals 
ADD COLUMN IF NOT EXISTS total_extended_minutes integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.rentals.total_extended_minutes IS 'Total de minutos adicionados através de extensões durante o aluguel';