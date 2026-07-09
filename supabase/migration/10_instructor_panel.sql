-- =========================================================
-- MIGRATION 10: INSTRUCTOR PANEL & REFUNDS
-- =========================================================

-- 1. Create refunds table
create table public.refunds (
    id uuid default gen_random_uuid() primary key,
    reservation_id uuid not null references public.reservations(id) on delete cascade,
    amount decimal(10,2) not null,
    status text not null check (status in ('pending', 'completed')) default 'pending',
    created_at timestamptz default now(),
    completed_at timestamptz
);

alter table public.refunds enable row level security;

-- 2. RLS for refunds
create policy "Instructor can view refunds for own classes"
on public.refunds
for select
using (
    exists (
        select 1
        from public.reservations r
        join public.sessions s on r.session_id = s.id
        where r.id = refunds.reservation_id
        and s.instructor_id = auth.uid()
    )
);

create policy "Instructor can update refunds for own classes"
on public.refunds
for update
using (
    exists (
        select 1
        from public.reservations r
        join public.sessions s on r.session_id = s.id
        where r.id = refunds.reservation_id
        and s.instructor_id = auth.uid()
    )
);

-- 3. We also need to ensure instructors can view their own sessions even if they are not 'published' (e.g. draft/cancelled)
create policy "Instructor can view own sessions"
on public.sessions
for select
using (
    auth.uid() = instructor_id
);
