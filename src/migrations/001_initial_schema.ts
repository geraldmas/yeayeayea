import { supabase } from '../utils/supabaseClient';
import { MigrationFile } from '../utils/migrationService';

export const initialSchema: MigrationFile = {
  version: '001',
  name: 'initial_schema',
  dependencies: [],
  up: async () => {
    // Création de la table game_config
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.game_config (
          id bigserial PRIMARY KEY,
          name varchar NOT NULL,
          description text,
          config jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
          updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
        );
      `
    });

    // Création de la table simulation_results
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.simulation_results (
          id bigserial PRIMARY KEY,
          game_config_id bigint REFERENCES public.game_config(id),
          result jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
        );
      `
    });

    // Création de la table debug_logs
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.debug_logs (
          id bigserial PRIMARY KEY,
          log_type varchar NOT NULL,
          severity varchar NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
          message text NOT NULL,
          context jsonb NOT NULL DEFAULT '{}'::jsonb,
          stack_trace text,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
        );
      `
    });

    // Création des index
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_game_config_name ON public.game_config(name);
        CREATE INDEX IF NOT EXISTS idx_simulation_results_game_config_id ON public.simulation_results(game_config_id);
        CREATE INDEX IF NOT EXISTS idx_debug_logs_log_type ON public.debug_logs(log_type);
        CREATE INDEX IF NOT EXISTS idx_debug_logs_severity ON public.debug_logs(severity);
        CREATE INDEX IF NOT EXISTS idx_debug_logs_created_at ON public.debug_logs(created_at);
      `
    });
  },
  down: async () => {
    // Suppression des tables dans l'ordre inverse de leur création
    await supabase.rpc('exec_sql', {
      sql: `
        DROP TABLE IF EXISTS public.debug_logs;
        DROP TABLE IF EXISTS public.simulation_results;
        DROP TABLE IF EXISTS public.game_config;
      `
    });
  }
}; 