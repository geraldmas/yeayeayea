-- Création des tables principales
CREATE TABLE IF NOT EXISTS public.cards (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('personnage', 'objet', 'evenement', 'lieu', 'action')),
  rarity text NOT NULL,
  health integer NOT NULL,
  image text,
  passive_effect text,
  spells integer[] DEFAULT '{}',
  tags integer[] DEFAULT '{}',
  is_wip boolean DEFAULT true,
  is_crap boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.alterations (
  id bigserial PRIMARY KEY,
  name varchar NOT NULL,
  description text,
  effect text NOT NULL,
  icon varchar NOT NULL,
  duration integer,
  stackable boolean DEFAULT false,
  unique_effect boolean DEFAULT false,
  type varchar NOT NULL CHECK (type IN ('buff', 'debuff', 'status', 'other')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.spells (
  id bigserial PRIMARY KEY,
  name varchar NOT NULL,
  description text,
  power integer NOT NULL,
  cost integer,
  range_min integer,
  range_max integer,
  effects jsonb NOT NULL DEFAULT '[]',
  is_value_percentage boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.tags (
  id bigserial PRIMARY KEY,
  name varchar NOT NULL,
  passive_effect text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Création des triggers pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Suppression des triggers existants s'ils existent
DROP TRIGGER IF EXISTS set_updated_at ON cards;
DROP TRIGGER IF EXISTS set_updated_at ON alterations;
DROP TRIGGER IF EXISTS set_updated_at ON spells;
DROP TRIGGER IF EXISTS set_updated_at ON tags;

-- Création des nouveaux triggers
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON alterations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON spells
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Création des fonctions de validation des références
CREATE OR REPLACE FUNCTION check_spell_ids() RETURNS trigger AS $$
BEGIN
  IF NEW.spells IS NOT NULL AND NOT (
    SELECT bool_and(spell_id::text IS NOT NULL)
    FROM unnest(NEW.spells) spell_id
    LEFT JOIN public.spells ON spell_id::text = spells.id::text
  ) THEN
    RAISE EXCEPTION 'Invalid spell ID found';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_tag_ids() RETURNS trigger AS $$
BEGIN
  IF NEW.tags IS NOT NULL AND NOT (
    SELECT bool_and(tag_id::text IS NOT NULL)
    FROM unnest(NEW.tags) tag_id
    LEFT JOIN public.tags ON tag_id::text = tags.id::text
  ) THEN
    RAISE EXCEPTION 'Invalid tag ID found';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création des triggers de validation
CREATE TRIGGER check_spell_ids_trigger
  BEFORE INSERT OR UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION check_spell_ids();

CREATE TRIGGER check_tag_ids_trigger
  BEFORE INSERT OR UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION check_tag_ids();