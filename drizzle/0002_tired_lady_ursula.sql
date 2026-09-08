CREATE TABLE "gallery_videos" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"storage_name" varchar(255) NOT NULL,
	"poster_name" varchar(255) NOT NULL,
	"source_external_id" varchar(100) NOT NULL,
	"source_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_videos_storage_name_unique" UNIQUE("storage_name"),
	CONSTRAINT "gallery_videos_source_external_id_unique" UNIQUE("source_external_id")
);
