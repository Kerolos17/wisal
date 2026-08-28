CREATE TABLE "rate_limit_windows" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limit_windows_count_positive" CHECK ("rate_limit_windows"."count" >= 0)
);
--> statement-breakpoint
CREATE INDEX "rate_limit_windows_reset_at_idx" ON "rate_limit_windows" USING btree ("reset_at");
