CREATE TABLE "leads" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(320),
	"city" varchar(120),
	"service" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"consent" boolean NOT NULL,
	"source" varchar(60) DEFAULT 'web-form' NOT NULL,
	"ip_hash" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
