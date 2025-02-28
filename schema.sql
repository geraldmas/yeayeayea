-- Création de la table cards
create table if not exists cards (
  id text primary key,
  name text not null,
  description text,
  type text not null check (type in ('personnage', 'objet', 'evenement', 'lieu', 'action')),
  rarity text not null,
  health integer not null,
  image text,
  passive_effect text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Création d'un trigger pour mettre à jour updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON cards;

create trigger set_updated_at
  before update on cards
  for each row
  execute procedure update_updated_at_column();

-- Création des nouvelles tables
CREATE TABLE IF NOT EXISTS public.alterations (
    id varchar PRIMARY KEY,
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
    id varchar PRIMARY KEY,
    name varchar NOT NULL,
    description text,
    power integer NOT NULL,
    cost integer,
    range_min integer,
    range_max integer,
    effects jsonb NOT NULL DEFAULT '[]',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.tags (
    id varchar PRIMARY KEY,
    name varchar NOT NULL,
    passive_effect text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Modification de la table cards existante
ALTER TABLE public.cards 
    ADD COLUMN IF NOT EXISTS is_wip boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS spells varchar[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS talent varchar REFERENCES public.spells(id),
    ADD COLUMN IF NOT EXISTS tags varchar[] DEFAULT '{}';

-- Création des fonctions et triggers pour la validation des références
CREATE OR REPLACE FUNCTION check_spell_ids() RETURNS trigger AS $$
BEGIN
  IF NOT (SELECT bool_and(spell_id IS NOT NULL) 
          FROM unnest(NEW.spells) spell_id 
          LEFT JOIN public.spells ON spell_id = spells.id) THEN
    RAISE EXCEPTION 'Invalid spell ID found';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_tag_ids() RETURNS trigger AS $$
BEGIN
  IF NOT (SELECT bool_and(tag_id IS NOT NULL) 
          FROM unnest(NEW.tags) tag_id 
          LEFT JOIN public.tags ON tag_id = tags.id) THEN
    RAISE EXCEPTION 'Invalid tag ID found';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_spell_ids_trigger ON public.cards;
DROP TRIGGER IF EXISTS check_tag_ids_trigger ON public.cards;

CREATE TRIGGER check_spell_ids_trigger
  BEFORE INSERT OR UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION check_spell_ids();

CREATE TRIGGER check_tag_ids_trigger
  BEFORE INSERT OR UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION check_tag_ids();