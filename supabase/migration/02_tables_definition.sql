-- =========================================================
-- INSTRUCTORS
-- =========================================================

create table public.instructors (
    id uuid primary key
        references auth.users(id)
        on delete cascade,

    full_name text,

    email text not null unique,

    whatsapp_phone text,

    bio text,

    years_experience integer default 0,

    profile_image_url text,

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);

-- =========================================================
-- SESSIONS
-- =========================================================

create table public.sessions (
    id uuid primary key
        default gen_random_uuid(),

    instructor_id uuid not null
        references public.instructors(id)
        on delete cascade,

    session_date date not null,

    start_time time not null,

    special_guest text,

    theme text,

    price numeric(10,2) not null
        check (price >= 0),

    whatsapp_contact text not null,

    capacity integer not null
        check (
            capacity >= 1
            and capacity <= 40
        ),

    is_featured boolean not null
        default false,

    status session_status not null
        default 'draft',

    created_at timestamptz
        default now(),

    updated_at timestamptz
        default now()
);

-- =========================================================
-- SESSION SPOTS
-- =========================================================

create table public.session_spots (
    id uuid primary key
        default gen_random_uuid(),

    session_id uuid not null
        references public.sessions(id)
        on delete cascade,

    spot_number integer not null,

    status spot_status not null
        default 'available',

    created_at timestamptz
        default now(),

    unique(session_id, spot_number)
);

-- =========================================================
-- RESERVATIONS
-- =========================================================

create table public.reservations (
    id uuid primary key
        default gen_random_uuid(),

    session_id uuid not null
        references public.sessions(id)
        on delete cascade,

    client_name text not null,

    client_phone text not null,

    total_amount numeric(10,2) not null
        check (total_amount >= 0),

    status reservation_status not null
        default 'pending',

    reserved_at timestamptz
        default now(),

    refunded_at timestamptz
);

-- =========================================================
-- RESERVATION SPOTS
-- =========================================================

create table public.reservation_spots (
    id uuid primary key
        default gen_random_uuid(),

    reservation_id uuid not null
        references public.reservations(id)
        on delete cascade,

    spot_id uuid not null
        references public.session_spots(id)
        on delete cascade,

    created_at timestamptz
        default now(),

    unique(spot_id)
);

-- =========================================================
-- PAYMENTS
-- =========================================================

create table public.payments (
    id uuid primary key
        default gen_random_uuid(),

    reservation_id uuid not null
        references public.reservations(id)
        on delete cascade,

    method payment_method not null
        default 'yape',

    culqi_reference text,

    approval_code text,

    amount numeric(10,2) not null
        check (amount >= 0),

    status payment_status not null
        default 'pending',

    paid_at timestamptz,

    created_at timestamptz
        default now()
);