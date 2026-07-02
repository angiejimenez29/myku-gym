-- =========================================================
-- MERCADO PAGO INTEGRATION
-- =========================================================

-- Add Mercado Pago tracking fields to reservations table
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS estado_pago text DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS mp_payment_id text,
ADD COLUMN IF NOT EXISTS mp_preference_id text,
ADD COLUMN IF NOT EXISTS expira_en timestamptz;
