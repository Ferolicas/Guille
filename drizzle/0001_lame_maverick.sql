CREATE TABLE "admin_credentials" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"recovery_email" varchar(320) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_slots" (
	"slot" integer PRIMARY KEY NOT NULL,
	"title" varchar(120) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"media_one_name" varchar(255),
	"media_one_type" varchar(20),
	"media_one_label" varchar(20),
	"media_two_name" varchar(255),
	"media_two_type" varchar(20),
	"media_two_label" varchar(20),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_files" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"lead_id" varchar(36) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"storage_name" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "lead_files" ADD CONSTRAINT "lead_files_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;