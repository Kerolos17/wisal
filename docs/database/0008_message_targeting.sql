-- Wisal 0008: optional message targeting by guest group and event segment.
-- Additive and backwards-compatible: existing messages remain event-wide.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS group_id uuid;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS segment_id uuid;

ALTER TABLE messages ADD CONSTRAINT messages_group_id_guest_groups_id_fk
  FOREIGN KEY (group_id) REFERENCES guest_groups(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE messages ADD CONSTRAINT messages_segment_id_event_segments_id_fk
  FOREIGN KEY (segment_id) REFERENCES event_segments(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE messages VALIDATE CONSTRAINT messages_group_id_guest_groups_id_fk;
ALTER TABLE messages VALIDATE CONSTRAINT messages_segment_id_event_segments_id_fk;

CREATE INDEX IF NOT EXISTS messages_event_group_idx ON messages (event_id, group_id);
CREATE INDEX IF NOT EXISTS messages_event_segment_idx ON messages (event_id, segment_id);
