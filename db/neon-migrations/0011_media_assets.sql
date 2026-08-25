CREATE TABLE IF NOT EXISTS public.media_blobs (
  key text PRIMARY KEY,
  data bytea NOT NULL,
  content_type text NOT NULL DEFAULT 'application/octet-stream',
  etag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_blobs_size_limit CHECK (octet_length(data) <= 5242880)
);

CREATE INDEX IF NOT EXISTS media_blobs_updated_at_idx
  ON public.media_blobs (updated_at DESC);
