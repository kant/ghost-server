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

CREATE TABLE "playRecord" (
  "playRecordId" text PRIMARY KEY,
  "mediaId" text,
  "userId" text,
  "score" numeric,
  "startTime" timestamp,
  "endTime" timestamp,
  "deleted" int,
  "createdTime" timestamp default now(), 
  "updatedTime" timestamp default now()
);

CREATE TRIGGER "playRecord_setUpdatedTime" BEFORE UPDATE ON "playRecord" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE "engine" (
  "engineId" varchar(255) PRIMARY KEY,
  "name" varchar(255),
  "url" varchar(255),
  "deleted" int,
  "createdTime" timestamp default now(),   
  "updatedTime" timestamp default now()
);

CREATE TRIGGER "engine_setUpdatedTime" BEFORE UPDATE ON "engine" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE "playlist" (
  "playlistId" varchar(255) PRIMARY KEY,
  "userId" varchar(255),
  "name" varchar(255),
  "description" jsonb,
  "mediaItems" jsonb,
  "createdTime" timestamp default now(),
  "updatedTime" timestamp defualt now(),
  "deleted" int
);

CREATE TRIGGER "playlist_setUpdatedTime" BEFORE UPDATE ON "playlist" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE "media" (
  "mediaId" varchar(255) PRIMARY KEY,
  "name" text,
  "mediaUrl" text,
  "homepageUrl" text,
  "coverImage" jsonb,
  "description" jsonb,
  "dimensions" jsonb,
  "instructions" jsonb,
  "userId" varchar(255),
  "creators" jsonb,
  "engineId" varchar(255),
  "extraData" jsonb,
  "deleted" int,
  "createdTime" timestamp default now(),
  "updatedTime" timestamp default now()
);

CREATE TRIGGER "media_setUpdatedTime" BEFORE UPDATE ON "media" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE "user" (
  "userId" varchar(255) PRIMARY KEY,
  "name" text,
  "username" varchar(255),
  "links" jsonb,
  "about" jsonb,
  "location" text,
  "photoUrl" text,
  "unclaimed" boolean,
  "isTeam" boolean,
  "roles" jsonb,
  "createdTime" timestamp default now(),
  "updatedTime" timestamp default now()
);

CREATE TRIGGER "user_setUpdatedTime" BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE "contact" (
  "contactId" varchar(255) PRIMARY KEY,
  "userId" varchar(255),
  "contactType" varchar(24),
  "normalizedContact" varchar(255),
  "confirmed" boolean,
  "deleted" boolean,
  "commandeered" boolean,
  "createdTime" timestamp DEFAULT NOW(),
  "updatedTime" timestamp default now()
);

CREATE TRIGGER "contact_setUpdatedTime" BEFORE UPDATE ON "contact" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE "profileView" (
  "viewedProfileUserId" varchar(255),
  "viewerUserId" varchar(255),
  "viewTime" timestamp
);


CREATE TABLE "session" (
  "sessionId" text PRIMARY KEY,
  "userId" text,
  "createdIp" text,
  "createdTime" timestamp default now(),
  "updatedTime" timestamp default now()
);

CREATE TRIGGER "session_setUpdatedTime" BEFORE UPDATE ON "session" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

