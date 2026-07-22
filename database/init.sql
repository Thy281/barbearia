CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TYPE appointment_status AS ENUM ('PENDING', 'COMPLETED', 'NO_SHOW');

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  service VARCHAR(80) NOT NULL,
  appointment_at TIMESTAMPTZ NOT NULL,
  cancel_token_hash CHAR(64) NOT NULL UNIQUE,
  status appointment_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX appointments_active_appointment_at_key ON appointments (appointment_at) WHERE status <> 'NO_SHOW';

CREATE TABLE available_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slot_date, slot_time)
);

CREATE INDEX available_slots_date_idx ON available_slots (slot_date);
