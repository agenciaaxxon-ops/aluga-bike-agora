-- Adicionar coluna price_fixed à tabela rentals
ALTER TABLE public.rentals 
ADD COLUMN price_fixed numeric;