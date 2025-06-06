CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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


-- Utility RPC used by migrations
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suppression des triggers existants s'ils existent
DROP TRIGGER IF EXISTS set_updated_at ON cards;
DROP TRIGGER IF EXISTS set_updated_at ON alterations;
DROP TRIGGER IF EXISTS set_updated_at ON spells;
DROP TRIGGER IF EXISTS set_updated_at ON tags;
DROP TRIGGER IF EXISTS check_spell_references_trigger ON card_spells;
DROP TRIGGER IF EXISTS check_tag_references_trigger ON card_tags;

-- Création des triggers pour updated_at
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


-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    experience_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    currency INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Table d'inventaire des cartes
CREATE TABLE IF NOT EXISTS card_inventory (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    favorite BOOLEAN DEFAULT false,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, card_id)
);

-- Table des decks
CREATE TABLE IF NOT EXISTS decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_decks_updated_at ON decks;



-- Trigger pour mettre à jour le timestamp des decks
CREATE TRIGGER update_decks_updated_at
    BEFORE UPDATE ON decks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();



-- Table de composition des decks
CREATE TABLE IF NOT EXISTS deck_cards (
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (deck_id, card_id)
);

-- Table des réalisations
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    icon_url TEXT
);

-- Table de liaison utilisateurs-réalisations
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);

-- Fonction pour vérifier le mot de passe
CREATE OR REPLACE FUNCTION public.check_password(p_username text, p_password text)
RETURNS TABLE (
    id uuid,
    username text,
    properties jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id::uuid,
        u.username::text,
        u.properties::jsonb
    FROM public.users u
    WHERE u.username = p_username
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Création du compte admin par défaut
INSERT INTO public.users (
    username,
    password_hash,
    experience_points,
    level,
    currency,
    settings,
    properties,
    created_at,
    last_login
) VALUES (
    'admin',
    crypt('vanderestgay', gen_salt('bf')),
    0,
    1,
    0,
    '{}',
    '{"isAdmin": true}',
    now(),
    now()
) ON CONFLICT (username) DO NOTHING;

-- Table de configuration du jeu
CREATE TABLE IF NOT EXISTS public.game_config (
    id bigserial PRIMARY KEY,
    key varchar NOT NULL UNIQUE,
    value jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Trigger pour mettre à jour le timestamp de game_config
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON game_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion des configurations par défaut
INSERT INTO public.game_config (key, value, description) VALUES
    ('max_personnages', '{"value": 5}', 'Nombre maximum de personnages sur le terrain'),
    ('emplacements_objet', '{"value": 3}', 'Nombre d''emplacements d''objets par personnage'),
    ('budget_motivation_initial', '{"value": 10}', 'Budget de motivation initial par tour'),
    ('pv_base_initial', '{"value": 100}', 'Points de vie initiaux de la base'),
    ('conflict_strategy', '{"value": "fifo"}', 'Stratégie de résolution des conflits'),
    ('conflict_random_chance', '{"value": 0}', 'Probabilité de résolution aléatoire des conflits')
ON CONFLICT (key) DO NOTHING;

-- Table des résultats de simulation
CREATE TABLE IF NOT EXISTS public.simulation_results (
    id bigserial PRIMARY KEY,
    simulation_type varchar NOT NULL CHECK (simulation_type IN ('training', 'performance', 'metrics')),
    deck_id uuid REFERENCES public.decks(id) ON DELETE CASCADE,
    opponent_deck_id uuid REFERENCES public.decks(id) ON DELETE CASCADE,
    result jsonb NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Trigger pour mettre à jour le timestamp de simulation_results
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON simulation_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index pour optimiser les requêtes par type de simulation
CREATE INDEX idx_simulation_results_type ON public.simulation_results(simulation_type);

-- Index pour optimiser les requêtes par deck
CREATE INDEX idx_simulation_results_deck ON public.simulation_results(deck_id);

-- Index pour optimiser les requêtes par deck opposant
CREATE INDEX idx_simulation_results_opponent ON public.simulation_results(opponent_deck_id);

-- Table des logs de debug
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id bigserial PRIMARY KEY,
    log_type varchar NOT NULL CHECK (log_type IN ('tag_interaction', 'performance', 'error')),
    severity varchar NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    message text NOT NULL,
    context jsonb NOT NULL DEFAULT '{}',
    stack_trace text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Index pour optimiser les requêtes par type de log
CREATE INDEX idx_debug_logs_type ON public.debug_logs(log_type);

-- Index pour optimiser les requêtes par sévérité
CREATE INDEX idx_debug_logs_severity ON public.debug_logs(severity);

-- Index pour optimiser les requêtes par date
CREATE INDEX idx_debug_logs_created_at ON public.debug_logs(created_at);

-- Fonction pour nettoyer automatiquement les vieux logs
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void AS $$
BEGIN
    -- Supprimer les logs de plus de 30 jours
    DELETE FROM public.debug_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Créer un job pour nettoyer les logs tous les jours
SELECT cron.schedule('0 0 * * *', $$SELECT clean_old_logs()$$);

-- Table des migrations
CREATE TABLE IF NOT EXISTS public.migrations (
    id bigserial PRIMARY KEY,
    version varchar NOT NULL UNIQUE,
    name varchar NOT NULL,
    applied_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    batch integer NOT NULL,
    dependencies text[] NOT NULL DEFAULT '{}',
    status varchar NOT NULL CHECK (status IN ('pending', 'applied', 'failed', 'rolled_back')),
    error text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Index pour optimiser les requêtes par version
CREATE INDEX idx_migrations_version ON public.migrations(version);

-- Index pour optimiser les requêtes par batch
CREATE INDEX idx_migrations_batch ON public.migrations(batch);

-- Index pour optimiser les requêtes par status
CREATE INDEX idx_migrations_status ON public.migrations(status);

-- Fonction pour obtenir le prochain numéro de batch
CREATE OR REPLACE FUNCTION get_next_batch()
RETURNS integer AS $$
DECLARE
    last_batch integer;
BEGIN
    SELECT COALESCE(MAX(batch), 0)
    INTO last_batch
    FROM public.migrations;
    
    RETURN last_batch + 1;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si une migration peut être appliquée
CREATE OR REPLACE FUNCTION can_apply_migration(p_version varchar, p_dependencies text[])
RETURNS boolean AS $$
DECLARE
    dep_version varchar;
    dep_status varchar;
BEGIN
    -- Vérifier chaque dépendance
    FOREACH dep_version IN ARRAY p_dependencies
    LOOP
        SELECT status INTO dep_status
        FROM public.migrations
        WHERE version = dep_version;
        
        -- Si la dépendance n'existe pas ou n'est pas appliquée
        IF dep_status IS NULL OR dep_status != 'applied' THEN
            RETURN false;
        END IF;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour sauvegarder l'état de la base avant une migration
CREATE OR REPLACE FUNCTION backup_before_migration(p_version varchar)
RETURNS void AS $$
DECLARE
    backup_name text;
BEGIN
    backup_name := 'backup_' || p_version || '_' || to_char(now(), 'YYYYMMDD_HH24MISS');
    
    -- Créer une sauvegarde de la base de données
    PERFORM pg_dump(
        current_database(),
        '-Fc',  -- Format personnalisé
        '-f', backup_name || '.dump'
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour restaurer une sauvegarde
CREATE OR REPLACE FUNCTION restore_backup(p_version varchar)
RETURNS void AS $$
DECLARE
    backup_name text;
BEGIN
    backup_name := 'backup_' || p_version || '_' || to_char(now(), 'YYYYMMDD_HH24MISS');
    
    -- Restaurer la sauvegarde
    PERFORM pg_restore(
        '-d', current_database(),
        backup_name || '.dump'
    );
END;
$$ LANGUAGE plpgsql;
