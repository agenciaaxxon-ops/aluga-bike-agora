-- Habilitar realtime para a tabela rentals
ALTER TABLE public.rentals REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rentals;