CREATE TABLE "media_blobs" (
	"key" text PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL,
	"content_type" text DEFAULT 'application/octet-stream' NOT NULL,
	"etag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_blobs_size_limit" CHECK (octet_length("media_blobs"."data") <= 5242880)
);
--> statement-breakpoint
CREATE INDEX "media_blobs_updated_at_idx" ON "media_blobs" USING btree ("updated_at");