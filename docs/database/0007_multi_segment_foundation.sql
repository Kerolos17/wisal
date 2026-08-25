ALTER TABLE events
  ADD COLUMN IF NOT EXISTS default_locale text NOT NULL DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS enabled_locales jsonb NOT NULL DEFAULT '["ar","en"]'::jsonb;

CREATE TABLE IF NOT EXISTS event_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'other',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  venue_name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  map_url text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_segments_kind_check CHECK (kind IN ('ceremony','reception','dinner','party','session','other'))
);

CREATE INDEX IF NOT EXISTS event_segments_event_position_idx ON event_segments(event_id, position);

CREATE TABLE IF NOT EXISTS guest_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guest_groups_event_name_unique UNIQUE (event_id, name)
);

CREATE TABLE IF NOT EXISTS guest_group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES guest_groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guest_group_memberships_guest_unique UNIQUE (guest_id)
);

CREATE INDEX IF NOT EXISTS guest_group_memberships_group_idx ON guest_group_memberships(group_id);

CREATE TABLE IF NOT EXISTS guest_segment_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid NOT NULL REFERENCES event_segments(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES guests(id) ON DELETE CASCADE,
  group_id uuid REFERENCES guest_groups(id) ON DELETE CASCADE,
  invited boolean NOT NULL DEFAULT true,
  party_limit integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guest_segment_access_single_audience CHECK (num_nonnulls(guest_id, group_id) = 1),
  CONSTRAINT guest_segment_access_party_limit_positive CHECK (party_limit > 0),
  CONSTRAINT guest_segment_access_guest_unique UNIQUE (segment_id, guest_id),
  CONSTRAINT guest_segment_access_group_unique UNIQUE (segment_id, group_id)
);

CREATE INDEX IF NOT EXISTS guest_segment_access_segment_idx ON guest_segment_access(segment_id);

CREATE TABLE IF NOT EXISTS segment_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid NOT NULL REFERENCES event_segments(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  party_size integer NOT NULL DEFAULT 1,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT segment_rsvps_status_check CHECK (status IN ('yes','maybe','pending','no')),
  CONSTRAINT segment_rsvps_party_size_positive CHECK (party_size > 0),
  CONSTRAINT segment_rsvps_guest_segment_unique UNIQUE (guest_id, segment_id)
);

CREATE INDEX IF NOT EXISTS segment_rsvps_segment_status_idx ON segment_rsvps(segment_id, status);
