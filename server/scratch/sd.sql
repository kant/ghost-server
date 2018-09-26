--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.6
-- Dumped by pg_dump version 10.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
--



--
--



--
-- Name: trigger_set_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION IF NOT EXISTS public.trigger_set_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW."updatedTime" = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_set_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: contact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact (
    "contactId" character varying(255) NOT NULL,
    "userId" character varying(255),
    "contactType" character varying(24),
    "normalizedContact" character varying(255),
    confirmed boolean,
    deleted boolean,
    commandeered boolean,
    "createdTime" timestamp without time zone DEFAULT now(),
    "updatedTime" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contact OWNER TO postgres;

--
-- Name: engine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.engine (
    "engineId" text NOT NULL,
    name text,
    url text,
    about jsonb,
    image jsonb,
    "createdTime" timestamp without time zone DEFAULT now(),
    "updatedTime" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.engine OWNER TO postgres;

--
-- Name: json_test; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.json_test (
    val jsonb
);


ALTER TABLE public.json_test OWNER TO postgres;

--
-- Name: media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media (
    "mediaId" character varying(255) NOT NULL,
    name text,
    "mediaUrl" text,
    "homepageUrl" text,
    "coverImage" jsonb,
    description jsonb,
    dimensions jsonb,
    instructions jsonb,
    "createdTime" timestamp without time zone DEFAULT now(),
    "updatedTime" timestamp without time zone DEFAULT now(),
    "userId" character varying(255),
    "extraData" jsonb,
    published timestamp without time zone,
    tags jsonb,
    slug text,
    "toolSet" jsonb
);


ALTER TABLE public.media OWNER TO postgres;

--
-- Name: password; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password (
    "userId" text NOT NULL,
    hash text,
    "createdTime" timestamp without time zone DEFAULT now(),
    "updatedTime" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.password OWNER TO postgres;

--
-- Name: people; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.people (
    name character varying(255) NOT NULL
);


ALTER TABLE public.people OWNER TO postgres;

--
-- Name: playRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."playRecord" (
    "playRecordId" character varying(255) NOT NULL,
    "mediaId" character varying(255),
    "userId" character varying(255),
    score numeric,
    "startTime" timestamp without time zone,
    "endTime" timestamp without time zone,
    "createdTime" timestamp without time zone DEFAULT now(),
    "updatedTime" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."playRecord" OWNER TO postgres;

--
-- Name: playlist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.playlist (
    "playlistId" character varying(255) NOT NULL,
    "userId" character varying(255),
    name character varying(255),
    description jsonb,
    "mediaItems" jsonb,
    "createdTime" timestamp without time zone DEFAULT now(),
    "updatedTime" timestamp without time zone DEFAULT now(),
    image jsonb,
    website text
);


ALTER TABLE public.playlist OWNER TO postgres;

--
-- Name: profileView; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."profileView" (
    "viewedProfileUserId" character varying(255),
    "viewerUserId" character varying(255),
    "viewTime" timestamp without time zone
);


ALTER TABLE public."profileView" OWNER TO postgres;

--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    "clientId" text NOT NULL,
    "userId" text,
    "createdIp" text,
    "createdTime" timestamp without time zone DEFAULT now(),
    "updatedTime" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: tool; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tool (
    "toolId" text NOT NULL,
    name text,
    url text,
    about jsonb,
    image jsonb,
    "creatorId" text,
    "createdTime" timestamp without time zone DEFAULT now(),
    "updatedTime" timestamp without time zone DEFAULT now(),
    "tagSet" jsonb
);


ALTER TABLE public.tool OWNER TO postgres;

--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    "userId" character varying(255) NOT NULL,
    name text,
    username character varying(255),
    links jsonb,
    about jsonb,
    location text,
    "createdTime" timestamp without time zone DEFAULT now(),
    "updatedTime" timestamp without time zone DEFAULT now(),
    unclaimed boolean,
    "isTeam" boolean,
    photo jsonb,
    members jsonb,
    admins jsonb,
    "otherUsernames" jsonb
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: contact contact_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_pkey PRIMARY KEY ("contactId");


--
-- Name: engine engine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.engine
    ADD CONSTRAINT engine_pkey PRIMARY KEY ("engineId");


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY ("mediaId");


--
-- Name: media media_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_slug_key UNIQUE (slug);


--
-- Name: password password_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password
    ADD CONSTRAINT password_pkey PRIMARY KEY ("userId");


--
-- Name: people people_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_pkey PRIMARY KEY (name);


--
-- Name: playRecord playRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."playRecord"
    ADD CONSTRAINT "playRecord_pkey" PRIMARY KEY ("playRecordId");


--
-- Name: playlist playlist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlist
    ADD CONSTRAINT playlist_pkey PRIMARY KEY ("playlistId");


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY ("clientId");


--
-- Name: tool tool_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tool
    ADD CONSTRAINT tool_pkey PRIMARY KEY ("toolId");


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY ("userId");


--
-- Name: user user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_username_key UNIQUE (username);


--
-- Name: contact contact_setUpdatedTime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "contact_setUpdatedTime" BEFORE UPDATE ON public.contact FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: engine engine_setUpdatedTime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "engine_setUpdatedTime" BEFORE UPDATE ON public.engine FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: media media_setUpdatedTime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "media_setUpdatedTime" BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: password password_setUpdatedTime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "password_setUpdatedTime" BEFORE UPDATE ON public.password FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: playRecord playRecord_setUpdatedTime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "playRecord_setUpdatedTime" BEFORE UPDATE ON public."playRecord" FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: playlist playlist_setUpdatedTime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "playlist_setUpdatedTime" BEFORE UPDATE ON public.playlist FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: session session_setUpdatedTime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "session_setUpdatedTime" BEFORE UPDATE ON public.session FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: tool tool_setUpdatedTime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "tool_setUpdatedTime" BEFORE UPDATE ON public.tool FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: user user_setUpdatedTime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "user_setUpdatedTime" BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: cloudsqlsuperuser
--

REVOKE ALL ON SCHEMA public FROM cloudsqladmin;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO cloudsqlsuperuser;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

