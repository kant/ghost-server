CREATE TABLE "ghostSignup" (
  "signupTime" timestamp,
  "userId" varchar(255),
  "signupUsername" varchar(255),
  "signupEmail" varchar(255)
);

CREATE TABLE "playRecord" (
  "playRecordId" varchar(255) PRIMARY KEY,
  "mediaId" varchar(255),
  "userId" varchar(255),
  "score" NUMERIC,
  "startTime" timestamp,
  "endTime" timestamp,
  "createdTime" timestamp,
  "updatedTime" timestamp
  "deleted" int,
);

CREATE TABLE "engine" (
  "engineId" varchar(255) PRIMARY KEY,
  "name" varchar(255),
  "url" varchar(255),
  "createdTime" timestamp, 
  "updatedTime" timestamp,
  "deleted" int,
);

CREATE TABLE "playlist" (
  "playlistId" varchar(255) PRIMARY KEY,
  "userId" varchar(255),
  "name" varchar(255),
  "description" varchar(255),
  "mediaItems" jsonb,
  "createdTime" timestamp,
  "updatedTime" timestamp
  "deleted" int,
);

CREATE TABLE "media" (
  "mediaId" varchar(255) PRIMARY KEY,
  "name" text,
  "description" jsonb,
  "dimensions" jsonb,
  "instructions" jsonb,
  "createdTime" timestamp,
  "updatedTime" timestamp,
  "userId" varchar(255),
  "engineId" varchar(255)
  "deleted" int,
);

CREATE TABLE "user" (
  "userId" varchar(255) PRIMARY KEY,
  "name" text,
  "username" varchar(255),
  "about" jsonb,
  "location" text,
  "photoUrl" text,
  "createdTime" timestamp,
  "updatedTime" timestamp
);

CREATE TABLE "contact" (
  "contactId" varchar(255) PRIMARY KEY,
  "userId" varchar(255),
  "contactType" varchar(24),
  "normalizedContact" varchar(255),
  "confirmed" boolean,
  "deleted" boolean,
  "commandeered" boolean,
  "createdTime" timestamp,
  "updatedTime" timestamp
);

CREATE TABLE "profileView" (
  "viewedProfileUserId" varchar(255),
  "viewerUserId" varchar(255),
  "viewTime" timestamp
);



