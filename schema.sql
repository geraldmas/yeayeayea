-- Création des tables principales
CREATE TABLE IF NOT EXISTS public.cards (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('personnage', 'objet', 'evenement', 'lieu', 'action')),
  rarity text NOT NULL,
  properties jsonb DEFAULT '{}',
  summon_cost integer, -- Nouveau: coût en charisme pour les cartes invoquables
  image text,
  passive_effect jsonb, -- Modifié: text -> jsonb
  is_wip boolean DEFAULT true,
  is_crap boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.alterations (
  id bigserial PRIMARY KEY,
  name varchar NOT NULL,
  description text,
  effect jsonb NOT NULL, -- Modifié: text -> jsonb
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
  passive_effect jsonb, -- Modifié: text -> jsonb
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.card_spells (
  card_id bigint REFERENCES public.cards(id) ON DELETE CASCADE,
  spell_id bigint REFERENCES public.spells(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, spell_id)
);

CREATE TABLE IF NOT EXISTS public.card_tags (
  card_id bigint REFERENCES public.cards(id) ON DELETE CASCADE,
  tag_id bigint REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, tag_id)
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

-- Modification of the validation functions to work with junction tables instead of direct columns
CREATE OR REPLACE FUNCTION check_spell_references() RETURNS trigger AS $$
BEGIN
  -- This checks if the spell_id in card_spells exists in the spells table
  IF NOT EXISTS (SELECT 1 FROM public.spells WHERE id = NEW.spell_id) THEN
    RAISE EXCEPTION 'Invalid spell ID: %', NEW.spell_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_tag_references() RETURNS trigger AS $$
BEGIN
  -- This checks if the tag_id in card_tags exists in the tags table
  IF NOT EXISTS (SELECT 1 FROM public.tags WHERE id = NEW.tag_id) THEN
    RAISE EXCEPTION 'Invalid tag ID: %', NEW.tag_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old triggers that reference non-existent columns
DROP TRIGGER IF EXISTS check_spell_ids_trigger ON cards;
DROP TRIGGER IF EXISTS check_tag_ids_trigger ON cards;

-- Create new triggers on the junction tables
CREATE TRIGGER check_spell_references_trigger
  BEFORE INSERT OR UPDATE ON card_spells
  FOR EACH ROW
  EXECUTE FUNCTION check_spell_references();

CREATE TRIGGER check_tag_references_trigger
  BEFORE INSERT OR UPDATE ON card_tags
  FOR EACH ROW
  EXECUTE FUNCTION check_tag_references();