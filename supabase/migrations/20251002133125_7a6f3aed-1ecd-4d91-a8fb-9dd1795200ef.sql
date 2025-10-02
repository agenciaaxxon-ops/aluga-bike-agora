-- ============================================
-- SECURITY FIX: Remove Public PII Exposure
-- ============================================

-- Drop the overly permissive policies that expose customer PII
DROP POLICY IF EXISTS "Clients can view their own rental" ON rentals;
DROP POLICY IF EXISTS "Página do cliente é pública para leitura" ON rentals;

-- ============================================
-- SECURITY FIX: Upgrade access_code generation
-- ============================================

-- Change access_code to use UUID instead of weak MD5 substring
ALTER TABLE rentals 
ALTER COLUMN access_code SET DEFAULT gen_random_uuid()::text;

-- ============================================
-- SECURITY FIX: Add rate limiting columns
-- ============================================

-- Add columns to track rental extensions
ALTER TABLE rentals 
ADD COLUMN IF NOT EXISTS extension_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_extended_minutes integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_extension_at timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN rentals.extension_count IS 'Number of times rental has been extended';
COMMENT ON COLUMN rentals.total_extended_minutes IS 'Total minutes added through extensions';
COMMENT ON COLUMN rentals.last_extension_at IS 'Timestamp of last extension';

-- ============================================
-- SECURITY FIX: Add input validation constraints
-- ============================================

-- Add constraints to prevent excessively long strings (XSS prevention)
ALTER TABLE rentals
ADD CONSTRAINT client_name_length CHECK (char_length(client_name) <= 100),
ADD CONSTRAINT client_phone_length CHECK (char_length(client_phone) <= 20),
ADD CONSTRAINT vehicle_type_length CHECK (char_length(vehicle_type) <= 50),
ADD CONSTRAINT access_code_length CHECK (char_length(access_code) >= 10);

-- Add constraint to prevent invalid status values
ALTER TABLE rentals
ADD CONSTRAINT valid_status CHECK (status IN ('Ativo', 'Finalizado'));

-- ============================================
-- Recreate existing active rentals if needed
-- ============================================

-- Note: Existing rentals with old access_codes will continue to work
-- New rentals will use the stronger UUID-based access codes