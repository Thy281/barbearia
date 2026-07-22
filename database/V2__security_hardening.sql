ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancel_token_hash CHAR(64);

-- Existing appointments cannot be safely cancelled after this migration; this revokes the previous insecure cancellation capability.
UPDATE appointments SET cancel_token_hash = encode(gen_random_bytes(32), 'hex') WHERE cancel_token_hash IS NULL;
ALTER TABLE appointments ALTER COLUMN cancel_token_hash SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_appointment_at_key ON appointments (appointment_at) WHERE status <> 'NO_SHOW';
