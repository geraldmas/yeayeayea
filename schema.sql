-- Création de la table cards
create table cards (
  id text primary key,
  name text not null,
  description text,
  type text not null,
  rarity text not null,
  health integer not null,
  image text,
  passive_effect text,
  spells jsonb default '[]'::jsonb,
  talent jsonb,
  tags jsonb default '[]'::jsonb,
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

create trigger set_updated_at
  before update on cards
  for each row
  execute procedure update_updated_at_column();