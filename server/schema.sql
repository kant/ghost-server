CREATE TABLE "ghostSignup" (
  "signupTime" timestamp,
  "userId" varchar(255),
  "signupUsername" varchar(255),
  "signupEmail" varchar(255)
);

CREATE TABLE "user" (
  "userId" varchar(255) PRIMARY KEY,

)

CREATE TABLE "playResults" (
  "playResultId" varchar(255) PRIMARY KEY,
  "gameId" varchar(255),
  "userId" varchar(255),
  "score" NUMERIC,
  "createdTime" timestamp,
  "updatedTime" timestamp
);

CREATE TABLE "engine" (
  "engineId" varchar(255) PRIMARY KEY,
  "name" varchar(255),
  "url" varchar(255),
  "createdTime" timestamp, 
  "updatedTime" timestamp
);

CREATE TABLE "playlist" (
  "playlistId" varchar(255) PRIMARY KEY,
  "userId" varchar(255),
  "name" varchar(255),
  "description" varchar(255),
  "createdTime" timestamp,
  "updatedTime" timestamp
)

CREATE TABLE "playlistItem" (
  "playlistItemId" varchar(255) PRIMARY KEY,
  "playlistId" varchar(255),
  "addedByUserId" varchar(255),
  "mediaId" varchar(255),
  "itemNumber" int,
  "createdTime" timestamp,
  "updatedTime" timestamp
);

CREATE TABLE "media" (
  "mediaId" varchar(255) PRIMARY KEY,
  "name" text,
  "description" json,
  "dimensions" json,
  "instructions" json,
  "createdTime" timestamp,
  "updatedTime" timestamp,
  "userId" varchar(255),
  "engineId" varchar(255)
);

