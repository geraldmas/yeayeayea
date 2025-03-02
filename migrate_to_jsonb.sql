-- Script de migration pour convertir les colonnes de text à jsonb
-- Exécutez ce script si votre base de données contient déjà des données

-- Migration pour cards.passive_effect
ALTER TABLE public.cards ALTER COLUMN passive_effect TYPE jsonb USING
  CASE 
    WHEN passive_effect IS NULL THEN NULL
    WHEN passive_effect = '' THEN '{}'::jsonb
    WHEN passive_effect ~ E'^\\{.*\\}$' THEN passive_effect::jsonb -- Si c'est déjà un format JSON
    ELSE jsonb_build_object('description', passive_effect) -- Valeur texte simple
  END;

-- Migration pour tags.passive_effect
ALTER TABLE public.tags ALTER COLUMN passive_effect TYPE jsonb USING
  CASE 
    WHEN passive_effect IS NULL THEN NULL
    WHEN passive_effect = '' THEN '{}'::jsonb
    WHEN passive_effect ~ E'^\\{.*\\}$' THEN passive_effect::jsonb -- Si c'est déjà un format JSON
    ELSE jsonb_build_object('description', passive_effect) -- Valeur texte simple
  END;

-- Migration pour alterations.effect
ALTER TABLE public.alterations ALTER COLUMN effect TYPE jsonb USING
  CASE 
    WHEN effect = '' THEN '{}'::jsonb
    WHEN effect ~ E'^\\{.*\\}$' THEN effect::jsonb -- Si c'est déjà un format JSON
    ELSE jsonb_build_object('description', effect) -- Valeur texte simple
  END;