CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TYPE appointment_status AS ENUM ('PENDING', 'COMPLETED', 'NO_SHOW');

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  service VARCHAR(80) NOT NULL,
  appointment_at TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX appointments_appointment_at_idx ON appointments (appointment_at);
