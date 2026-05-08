-- Migration: add calendar_event_id to bookings table
-- Run this in Supabase SQL Editor if you already ran schema.sql previously.
-- (schema.sql already includes this column for fresh installs)

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;
