-- =========================================================
-- MIGRATION 12: ADMIN POLICIES
-- =========================================================

-- 1. Políticas RLS para la tabla refunds (Reembolsos)
CREATE POLICY "Admins can view all refunds"
ON public.refunds
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    )
);

CREATE POLICY "Admins can update all refunds"
ON public.refunds
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    )
);

-- 2. Políticas RLS para la tabla sessions (Clases)
CREATE POLICY "Admins can view all sessions"
ON public.sessions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    )
);

-- 3. Políticas RLS para la tabla reservations (Reservas)
CREATE POLICY "Admins can view all reservations"
ON public.reservations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    )
);
