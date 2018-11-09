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
  "info" jsonb,
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

CREATE TABLE "sub" (
  "fromId" text,
  "toId" text,
  "createdTime" timestamptz default now(),
  "updatedTime" timestamptz default now(),
  PRIMARY KEY ("fromId", "toId")
);

CREATE TRIGGER "sub_setUpdatedTime" BEFORE UPDATE ON "sub" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE "email" (
  "userId" text,
  "email" text,
  "isPrimary" boolean,
  "confirmationCode" text,
  "codeSentTime" timestamptz,
  "incorrectConfirmations" int default 0,
  "confirmed" boolean,
  "bouncing" boolean,
  "commandeered" boolean,
  "commandeeredBy" text,
  "commandeeredTime" timestamptz,
  "notes" text,
  "createdTime" timestamptz default now(),
  "updatedTime" timestamptz default now(),
  PRIMARY KEY ("userId", "email")
);

CREATE TRIGGER "email_setUpdatedTime" BEFORE UPDATE ON "email" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE "phone" (
  "userId" text,
  "number" text,
  "isPrimary" boolean,
  "confirmationCode" text,
  "codeSentTime" timestamptz,
  "incorrectConfirmations" int default 0,
  "confirmed" boolean,
  "bouncing" boolean,
  "commandeered" boolean,
  "commandeeredBy" text,
  "commandeeredTime" timestamptz,
  "notes" text,
  "createdTime" timestamptz default now(),
  "updatedTime" timestamptz default now(),
  PRIMARY KEY ("userId", "number")
);

CREATE TRIGGER "phone_setUpdatedTime" BEFORE UPDATE ON "phone" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

create TABLE "userplay" (
  "userplayId" text PRIMARY KEY,
  "clientId" text,
  "userId" text,
  "mediaId" text,
  "playId" text,
  "startTime" timestamptz default now(),
  "endTime" timestamptz,
  "notes" jsonb,
  "createdTime" timestamptz noT null default now(),
  "updatedTime" timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER "userplay_setUpdatedTime" BEFORE UPDATE ON "userplay" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();


create TABLE "play" (
  "playId" text PRIMARY KEY,
  "mediaId" text,
  "startTime" timestamptz default now(),
  "endTime" timestamptz,
  "notes" jsonb,
  "createdTime" timestamptz noT null default now(),
  "updatedTime" timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER "play_setUpdatedTime" BEFORE UPDATE ON "play" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE "client" (
  "clientId" text PRIMARY KEY,
  "publicId" text,
  "createdTime" timestamptz noT null default now(),
  "updatedTime" timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER "client_setUpdatedTime" BEFORE UPDATE ON "client" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
