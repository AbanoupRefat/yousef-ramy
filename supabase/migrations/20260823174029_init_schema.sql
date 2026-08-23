-- Postgres / Supabase Schema

CREATE TABLE bonus_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    kind TEXT NOT NULL, -- 'percentage_commission', 'flat_per_customer', 'tiered_threshold', 'manual'
    params JSONB NOT NULL
);

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'hero', 'helper'
    bonus_type_id UUID REFERENCES bonus_types(id)
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    phone_number TEXT,
    loyalty_hero_id UUID REFERENCES staff(id)
);

CREATE TABLE queue_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) NOT NULL,
    hero_id UUID REFERENCES staff(id),
    service_id UUID REFERENCES services(id) NOT NULL,
    status TEXT NOT NULL, -- 'waiting', 'with_hero', 'done'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) NOT NULL,
    service_id UUID REFERENCES services(id) NOT NULL,
    amount NUMERIC NOT NULL,
    tip NUMERIC NOT NULL DEFAULT 0,
    ticket_id UUID REFERENCES queue_tickets(id) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stock_qty INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 0,
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    sale_price NUMERIC
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    product_id UUID REFERENCES products(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE staff_service_durations (
    staff_id UUID REFERENCES staff(id) NOT NULL,
    service_id UUID REFERENCES services(id) NOT NULL,
    average_duration_seconds INT NOT NULL DEFAULT 0,
    PRIMARY KEY (staff_id, service_id)
);
