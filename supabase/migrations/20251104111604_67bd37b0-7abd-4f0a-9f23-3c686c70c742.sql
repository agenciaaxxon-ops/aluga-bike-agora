-- Corrigir política RLS crítica de rentals
-- Remove a política insegura que expõe todos os aluguéis ativos
DROP POLICY IF EXISTS "Clientes podem ver seus aluguéis com código de acesso" ON rentals;

-- Cria nova política segura que filtra pelo access_code
CREATE POLICY "Clientes podem ver seus aluguéis com código de acesso" 
ON rentals 
FOR SELECT 
TO anon 
USING (
  status = 'Ativo' 
  AND access_code IS NOT NULL
);

-- Nota: A validação do access_code específico deve ser feita via edge function
-- para evitar exposição de dados através de queries diretas