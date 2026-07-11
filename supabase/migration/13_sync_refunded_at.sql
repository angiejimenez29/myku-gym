-- =========================================================
-- MIGRATION 13: SYNC REFUNDED_AT ON RESERVATIONS
-- =========================================================

-- Create function to handle refund completion
create or replace function public.handle_refund_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_should_sync boolean := false;
begin
    -- Determine if sync needs to happen based on operation and status transition
    if tg_op = 'INSERT' then
        if new.status = 'completed' then
            v_should_sync := true;
        end if;
    elsif tg_op = 'UPDATE' then
        if new.status = 'completed' and old.status is distinct from 'completed' then
            v_should_sync := true;
        end if;
    end if;

    if v_should_sync then
        -- 1. Update the reservation status and refunded_at timestamp
        update public.reservations
        set
            status = 'refunded',
            refunded_at = now()
        where id = new.reservation_id;

        -- 2. Update corresponding payment status to refunded
        update public.payments
        set status = 'refunded'
        where reservation_id = new.reservation_id;

        -- 3. Free up the reserved spots associated with the reservation
        update public.session_spots
        set status = 'available'
        where id in (
            select spot_id
            from public.reservation_spots
            where reservation_id = new.reservation_id
        );
    end if;

    return new;
end;
$$;

-- Create the trigger after insert or update on public.refunds
create trigger trigger_sync_refund_completion
after insert or update on public.refunds
for each row
execute function public.handle_refund_completion();
