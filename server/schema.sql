CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedTime" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE "playRecord" (
  "playRecordId" varchar(255) PRIMARY KEY,
  "mediaId" varchar(255),
  "userId" varchar(255),
  "score" numeric,
  "startTime" timestamp,
  "endTime" timestamp,
  "createdTime" timestamp default now(), 
  "updatedTime" timestamp
  "deleted" int,
);

CREATE TRIGGER "playRecord_setUpdatedTime" BEFORE UPDATE ON "playRecord" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE "engine" (
  "engineId" varchar(255) PRIMARY KEY,
  "name" varchar(255),
  "url" varchar(255),
  "createdTime" timestamp default now(),   
  "updatedTime" timestamp,
  "deleted" int,
);

CREATE TRIGGER "engine_setUpdatedTime" BEFORE UPDATE ON "engine" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE "playlist" (
  "playlistId" varchar(255) PRIMARY KEY,
  "userId" varchar(255),
  "name" varchar(255),
  "description" jsonb,
  "mediaItems" jsonb,
  "createdTime" timestamp default now(),
  "updatedTime" timestamp,
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
  "createdTime" timestamp default now(),
  "updatedTime" timestamp,
  "userId" varchar(255),
  "creators" jsonb,
  "engineId" varchar(255),
  "extraData" jsonb,
  "deleted" int
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
  "createdTime" timestamp default now(),
  "updatedTime" timestamp
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
  "updatedTime" timestamp
);

CREATE TRIGGER "contact_setUpdatedTime" BEFORE UPDATE ON "contact" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE "profileView" (
  "viewedProfileUserId" varchar(255),
  "viewerUserId" varchar(255),
  "viewTime" timestamp
);


CREATE TABLE "session" (
  "sessionId" varchar(255) PRIMARY KEY,
  "userId" varchar(255),
  "createdTime" timestamp default now(),
  "updatedTime" timestamp,
  "createdIp" varchar(48)
);

CREATE TRIGGER "session_setUpdatedTime" BEFORE UPDATE ON "session" FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
