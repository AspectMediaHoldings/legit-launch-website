-- Migration 001: Comment-to-DM engine initial schema
-- Apply against the legit-launch-cdm Supabase project after provisioning.
--
-- Tables:
--   funnels     - keyword-to-DM configuration per brand
--   events      - raw webhook envelopes we received from Meta
--   contacts    - people who commented (per platform + external id)
--   deliveries  - DMs we successfully sent (idempotency lives here)
--   skip_log    - every comment we chose NOT to reply to, with reason

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- funnels
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS funnels (
  id           TEXT PRIMARY KEY,
  brand        TEXT NOT NULL,
  keyword      TEXT NOT NULL,
  post_scope   TEXT,
  dm_body      TEXT NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS funnels_brand_active_idx ON funnels (brand, active);
CREATE INDEX IF NOT EXISTS funnels_post_scope_idx ON funnels (post_scope) WHERE post_scope IS NOT NULL;

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source            TEXT NOT NULL,
  raw_json          JSONB NOT NULL,
  signature_valid   BOOLEAN NOT NULL,
  received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_received_at_idx ON events (received_at DESC);
CREATE INDEX IF NOT EXISTS events_source_idx ON events (source);

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform       TEXT NOT NULL,
  external_id    TEXT NOT NULL,
  handle         TEXT,
  first_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform, external_id)
);

-- ---------------------------------------------------------------------------
-- deliveries
-- ---------------------------------------------------------------------------
-- Idempotency: never send twice for the same event or the same Meta comment.
-- Meta enforces one-private-reply-per-comment across all apps; this schema
-- makes double-send impossible even if the app crashes mid-flight.
CREATE TABLE IF NOT EXISTS deliveries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id           UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  funnel_id          TEXT NOT NULL REFERENCES funnels (id) ON DELETE RESTRICT,
  contact_id         UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  meta_comment_id    TEXT NOT NULL,
  meta_message_id    TEXT,
  status             TEXT NOT NULL,
  sent_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id),
  UNIQUE (meta_comment_id)
);

CREATE INDEX IF NOT EXISTS deliveries_funnel_status_idx ON deliveries (funnel_id, status);
CREATE INDEX IF NOT EXISTS deliveries_sent_at_idx ON deliveries (sent_at DESC) WHERE sent_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- skip_log
-- ---------------------------------------------------------------------------
-- Every comment we did NOT reply to gets a row here. No silent drops.
-- Playbook rule 4: "Every skipped comment gets a row."
CREATE TABLE IF NOT EXISTS skip_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID REFERENCES events (id) ON DELETE CASCADE,
  reason       TEXT NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS skip_log_reason_idx ON skip_log (reason);
CREATE INDEX IF NOT EXISTS skip_log_created_at_idx ON skip_log (created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at trigger for funnels
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS funnels_updated_at ON funnels;
CREATE TRIGGER funnels_updated_at
  BEFORE UPDATE ON funnels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
