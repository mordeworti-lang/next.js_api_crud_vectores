CREATE EXTENSION IF NOT EXISTS vector;
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Chat (
  id integer NOT NULL DEFAULT nextval('"Chat_id_seq"'::regclass),
  title text NOT NULL DEFAULT 'Nueva conversación'::text,
  user_id integer NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL,
  CONSTRAINT Chat_pkey PRIMARY KEY (id),
  CONSTRAINT Chat_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.User(id)
);
CREATE TABLE public.ChatMessage (
  id integer NOT NULL DEFAULT nextval('"ChatMessage_id_seq"'::regclass),
  role text NOT NULL,
  content text NOT NULL,
  chat_id integer NOT NULL,
  metadata jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ChatMessage_pkey PRIMARY KEY (id),
  CONSTRAINT ChatMessage_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.Chat(id)
);
CREATE TABLE public.ClientKey (
  id integer NOT NULL DEFAULT nextval('"ClientKey_id_seq"'::regclass),
  key text NOT NULL,
  lawyer_id integer NOT NULL,
  client_email text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_by_id integer,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamp without time zone,
  CONSTRAINT ClientKey_pkey PRIMARY KEY (id),
  CONSTRAINT ClientKey_lawyer_id_fkey FOREIGN KEY (lawyer_id) REFERENCES public.User(id),
  CONSTRAINT ClientKey_used_by_id_fkey FOREIGN KEY (used_by_id) REFERENCES public.User(id)
);
CREATE TABLE public.Embedding (
  id integer NOT NULL DEFAULT nextval('"Embedding_id_seq"'::regclass),
  word_id integer NOT NULL,
  vector USER-DEFINED NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Embedding_pkey PRIMARY KEY (id),
  CONSTRAINT Embedding_word_id_fkey FOREIGN KEY (word_id) REFERENCES public.Word(id)
);
CREATE TABLE public.User (
  id integer NOT NULL DEFAULT nextval('"User_id_seq"'::regclass),
  email text NOT NULL,
  name text NOT NULL,
  nickname text,
  password text NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'CLIENTE'::"UserRole",
  status USER-DEFINED NOT NULL DEFAULT 'PENDIENTE'::"UserStatus",
  lawyer_id integer,
  email_verified boolean NOT NULL DEFAULT false,
  email_code text,
  email_code_expires timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL,
  CONSTRAINT User_pkey PRIMARY KEY (id),
  CONSTRAINT User_lawyer_id_fkey FOREIGN KEY (lawyer_id) REFERENCES public.User(id)
);
CREATE TABLE public.Word (
  id integer NOT NULL DEFAULT nextval('"Word_id_seq"'::regclass),
  text text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Word_pkey PRIMARY KEY (id)
);