ALTER TABLE "event_segments" ADD CONSTRAINT "event_segments_kind_check" CHECK ("event_segments"."kind" in ('ceremony', 'reception', 'dinner', 'party', 'session', 'other'));--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_status_check" CHECK ("events"."status" in ('draft', 'published', 'archived'));--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_default_locale_check" CHECK ("events"."default_locale" in ('ar', 'en'));--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_status_check" CHECK ("guests"."status" in ('yes', 'maybe', 'pending', 'no'));--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_party_size_positive" CHECK ("guests"."party_size" > 0);--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_opening_style_check" CHECK ("invitations"."opening_style" in ('envelope', 'card', 'curtain'));--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_layout_style_check" CHECK ("invitations"."layout_style" in ('classic', 'story', 'cinematic'));--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_audience_check" CHECK ("messages"."audience" in ('all', 'pending', 'confirmed', 'unopened', 'opened_pending', 'maybe', 'declined'));--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_status_check" CHECK ("messages"."status" in ('draft', 'scheduled'));--> statement-breakpoint
ALTER TABLE "payment_destinations" ADD CONSTRAINT "payment_destinations_method_check" CHECK ("payment_destinations"."method" in ('instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer'));--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_status_check" CHECK ("payment_requests"."status" in ('draft', 'pending_review', 'needs_info', 'rejected', 'approved', 'cancelled'));--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_method_check" CHECK ("payment_requests"."payment_method" is null or "payment_requests"."payment_method" in ('instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer'));--> statement-breakpoint
ALTER TABLE "segment_rsvps" ADD CONSTRAINT "segment_rsvps_status_check" CHECK ("segment_rsvps"."status" in ('yes', 'maybe', 'pending', 'no'));--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_category_check" CHECK ("support_tickets"."category" in ('account', 'invitation', 'guests', 'technical', 'billing', 'other'));--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_priority_check" CHECK ("support_tickets"."priority" in ('normal', 'high', 'urgent'));--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_status_check" CHECK ("support_tickets"."status" in ('open', 'in_progress', 'resolved', 'closed'));--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_kind_check" CHECK ("user_notifications"."kind" in ('info', 'success', 'warning', 'support'));--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_status_check" CHECK ("user_subscriptions"."status" in ('active', 'expired', 'cancelled', 'suspended'));