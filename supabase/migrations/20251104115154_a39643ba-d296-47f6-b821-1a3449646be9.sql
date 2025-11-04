-- Remover a constraint antiga
ALTER TABLE rentals DROP CONSTRAINT IF EXISTS valid_status;

-- Adicionar a nova constraint com os status corretos
ALTER TABLE rentals ADD CONSTRAINT valid_status 
CHECK (status IN ('Ativo', 'Finalizado', 'Cancelado'));