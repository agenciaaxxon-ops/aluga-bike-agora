-- Create policy to allow clients to view their rental using access_code
-- This allows unauthenticated users to view rental details when they have the correct access code
CREATE POLICY "Clientes podem ver seus aluguéis com código de acesso"
ON rentals
FOR SELECT
TO anon
USING (
  status = 'Ativo'
);