import { supabase } from './supabaseClient';
import { Database } from '../types/database.types';

type Migration = Database['public']['Tables']['migrations']['Row'];
type MigrationInsert = Database['public']['Tables']['migrations']['Insert'];

export interface MigrationFile {
  version: string;
  name: string;
  dependencies: string[];
  up: () => Promise<void>;
  down: () => Promise<void>;
}

class MigrationService {
  private migrations: Map<string, MigrationFile> = new Map();

  async registerMigration(migration: MigrationFile): Promise<void> {
    this.migrations.set(migration.version, migration);
  }

  async getPendingMigrations(): Promise<MigrationFile[]> {
    const { data: appliedMigrations } = await supabase
      .from('migrations')
      .select('version')
      .eq('status', 'applied');

    const appliedVersions = new Set(appliedMigrations?.map(m => m.version) || []);
    
    return Array.from(this.migrations.values())
      .filter(m => !appliedVersions.has(m.version))
      .sort((a, b) => a.version.localeCompare(b.version));
  }

  async getAppliedMigrations(): Promise<Migration[]> {
    const { data, error } = await supabase
      .from('migrations')
      .select('*')
      .eq('status', 'applied')
      .order('applied_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getFailedMigrations(): Promise<Migration[]> {
    const { data, error } = await supabase
      .from('migrations')
      .select('*')
      .eq('status', 'failed')
      .order('applied_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async runMigrations(): Promise<void> {
    const pendingMigrations = await this.getPendingMigrations();
    
    for (const migration of pendingMigrations) {
      try {
        // Vérifier les dépendances
        const { data: canApply } = await supabase
          .rpc('can_apply_migration', {
            p_version: migration.version,
            p_dependencies: migration.dependencies
          });

        if (!canApply) {
          console.log(`Migration ${migration.version} skipped: dependencies not met`);
          continue;
        }

        // Sauvegarder l'état actuel
        await supabase.rpc('backup_before_migration', {
          p_version: migration.version
        });

        // Exécuter la migration
        await migration.up();

        // Enregistrer la migration
        const { data: batch } = await supabase.rpc('get_next_batch');
        
        const migrationRecord: MigrationInsert = {
          version: migration.version,
          name: migration.name,
          batch,
          dependencies: migration.dependencies,
          status: 'applied',
          applied_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('migrations')
          .insert(migrationRecord);

        if (error) throw error;

        console.log(`Migration ${migration.version} applied successfully`);
      } catch (error) {
        console.error(`Error applying migration ${migration.version}:`, error);

        // Enregistrer l'échec
        const { error: updateError } = await supabase
          .from('migrations')
          .insert({
            version: migration.version,
            name: migration.name,
            batch: 0,
            dependencies: migration.dependencies,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
          });

        if (updateError) throw updateError;

        // Restaurer la sauvegarde
        await supabase.rpc('restore_backup', {
          p_version: migration.version
        });

        throw error;
      }
    }
  }

  async rollbackMigration(version: string): Promise<void> {
    const migration = this.migrations.get(version);
    if (!migration) throw new Error(`Migration ${version} not found`);

    try {
      // Exécuter le rollback
      await migration.down();

      // Mettre à jour le statut
      const { error } = await supabase
        .from('migrations')
        .update({ status: 'rolled_back' })
        .eq('version', version);

      if (error) throw error;

      console.log(`Migration ${version} rolled back successfully`);
    } catch (error) {
      console.error(`Error rolling back migration ${version}:`, error);
      throw error;
    }
  }

  async rollbackBatch(batch: number): Promise<void> {
    const { data: migrations, error } = await supabase
      .from('migrations')
      .select('*')
      .eq('batch', batch)
      .eq('status', 'applied')
      .order('applied_at', { ascending: false });

    if (error) throw error;

    for (const migration of migrations) {
      await this.rollbackMigration(migration.version);
    }
  }
}

export const migrationService = new MigrationService(); 