CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedTime" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

create or replace function array_subtract(array1 anyarray, array2 anyarray)
returns anyarray language sql as $$
    select array_agg(elem)
    from unnest(array1) elem
    where elem <> all(array2)
$$;

CREATE TABLE "env" (
  "var" text PRIMARY KEY,
  "value" text
);

CREATE TABLE "playRecord" (
  "playRecordId" text PRIMARY KEY,
  "mediaId" text,
  "userId" text,
  "score" numeric,
  "startTime" timestamptz,
  "endTime" timestamptz,
  "deleted" int,
  "createdTime" timestamptz default now(), 
  "updatedTime" timestamptz default now()
);

CREATE TRIGGER "playRecord_setUpdatedTime" BEFORE UPDATE ON "playRecord" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE "engine" (
  "engineId" text PRIMARY KEY,
  "name" text,
  "url" text,
  "about" jsonb,
  "image" jsonb,
  "createdTime" timestamptz default now(),   
  "updatedTime" timestamptz default now()
);

CREATE TRIGGER "engine_setUpdatedTime" BEFORE UPDATE ON "engine" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE "tool" (
  "toolId" text PRIMARY KEY,
  "name" text,
  "url" text,
  "about" jsonb,
  "image" jsonb,
  "creatorId" text,
  "tagSet" jsonb,
  "createdTime" timestamptz default now(),   
  "updatedTime" timestamptz default now()
);

CREATE TRIGGER "tool_setUpdatedTime" BEFORE UPDATE ON "tool" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE "playlist" (
  "playlistId" varchar(255) PRIMARY KEY,
  "userId" text,
  "name" text,
  "website" text,
  "description" jsonb,
  "mediaItems" jsonb,
  "image" jsonb,
  "createdTime" timestamptz default now(),
  "updatedTime" timestamptz defualt now(),
);

CREATE TRIGGER "playlist_setUpdatedTime" BEFORE UPDATE ON "playlist" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE "media" (
  "mediaId" varchar(255) PRIMARY KEY,
  "name" text,
  "mediaUrl" text,
  "slug" text,
  "homepageUrl" text,
  "coverImage" jsonb,
  "description" jsonb,
  "links" jsonb,
  "dimensions" jsonb,
  "instructions" jsonb,
  "userId" varchar(255),
  "creators" jsonb,
  "extraData" jsonb,
  "published" timestamptz,
  "deleted" int,
  "tagsSet" jsonb,
  "toolSet" jsonb,
  "createdTime" timestamp default now(),
  "updatedTime" timestamp default now()
);

ALTER TABLE "media" ADD CONSTRAINT "media_slug_key" UNIQUE ("slug");
CREATE TRIGGER "media_setUpdatedTime" BEFORE UPDATE ON "media" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE "user" (
  "userId" varchar(255) PRIMARY KEY,
  "name" text,
  "username" varchar(255),
  "links" jsonb,
  "otherUsernames" jsonb,
  "about" jsonb,
  "location" text,
  "photo" jsonb,
  "unclaimed" boolean,
  "isTeam" boolean,
  "members" jsonb,
  "admins" jsonb,
  "createdTime" timestamp default now(),
  "updatedTime" timestamp default now()
);

ALTER TABLE "user" ADD CONSTRAINT "user_username_key" UNIQUE ("username");
CREATE TRIGGER "user_setUpdatedTime" BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE "contact" (
  "contactId" varchar(255) PRIMARY KEY,
  "userId" varchar(255),
  "contactType" varchar(24),
  "normalizedContact" varchar(255),
  "confirmed" boolean,
  "deleted" boolean,
  "commandeered" boolean,
  "createdTime" timestamptz default now(),
  "updatedTime" timestamptz default now()
);

CREATE TRIGGER "contact_setUpdatedTime" BEFORE UPDATE ON "contact" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE "profileView" (
  "viewedProfileUserId" varchar(255),
  "viewerUserId" varchar(255),
  "viewTime" timestamptz
);

CREATE TABLE "session" (
  "clientId" text PRIMARY KEY,
  "userId" text,
  "createdIp" text,
  "createdTime" timestamptz default now(),
  "updatedTime" timestamptz default now()
);
CREATE TRIGGER "session_setUpdatedTime" BEFORE UPDATE ON "session" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
