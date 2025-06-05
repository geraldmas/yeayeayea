import { SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Assuming supabase client is initialized and passed to the service
// import supabase from '../utils/supabaseClient'; // Adjust path as needed

interface Migration {
  name: string;
  up: (supabase: SupabaseClient) => Promise<void>;
  down: (supabase: SupabaseClient) => Promise<void>;
}

const MIGRATIONS_TABLE_NAME = 'schema_migrations';
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations'); // Adjust if your script/service runs from a different location relative to migrations

export class MigrationService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  private async ensureMigrationsTableExists(): Promise<void> {
    console.log('Ensuring schema_migrations table exists...');
    const { error } = await this.supabase.rpc('run_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE_NAME} (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    });
    if (error) {
      console.error('Error ensuring migrations table exists:', error);
      throw error;
    }
    console.log('Schema_migrations table ensured.');
  }

  private async getAppliedMigrationNames(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from(MIGRATIONS_TABLE_NAME)
      .select('migration_name');

    if (error) {
      console.error('Error fetching applied migrations:', error);
      throw error;
    }
    return data?.map((row: any) => row.migration_name) || [];
  }

  private async recordMigration(migrationName: string): Promise<void> {
    const { error } = await this.supabase
      .from(MIGRATIONS_TABLE_NAME)
      .insert([{ migration_name: migrationName }]);

    if (error) {
      console.error(`Error recording migration ${migrationName}:`, error);
      throw error;
    }
    console.log(`Migration ${migrationName} recorded.`);
  }

  private async deleteMigrationRecord(migrationName: string): Promise<void> {
    const { error } = await this.supabase
      .from(MIGRATIONS_TABLE_NAME)
      .delete()
      .match({ migration_name: migrationName });

    if (error) {
      console.error(`Error deleting migration record ${migrationName}:`, error);
      throw error;
    }
    console.log(`Migration record ${migrationName} deleted.`);
  }

  public async applyMigrations(): Promise<void> {
    console.log('Starting to apply migrations...');
    await this.ensureMigrationsTableExists();

    const appliedMigrationNames = await this.getAppliedMigrationNames();
    const migrationFiles = await fs.readdir(MIGRATIONS_DIR);

    const pendingMigrations = migrationFiles
      .filter((file) => file.endsWith('.ts') || file.endsWith('.js')) // Assuming .js if compiled
      .sort(); // Lexicographical order

    for (const fileName of pendingMigrations) {
      if (!appliedMigrationNames.includes(fileName)) {
        console.log(`Applying migration ${fileName}...`);
        try {
          const migrationPath = path.join(MIGRATIONS_DIR, fileName);
          const migrationModule = await import(migrationPath);

          if (typeof migrationModule.up !== 'function') {
            throw new Error(`Migration ${fileName} does not have an 'up' function.`);
          }

          await migrationModule.up(this.supabase);
          await this.recordMigration(fileName);
          console.log(`Migration ${fileName} applied successfully.`);
        } catch (error) {
          console.error(`Error applying migration ${fileName}:`, error);
          // Decide if we should stop or continue on error
          throw error; // Stop on error
        }
      } else {
        console.log(`Migration ${fileName} already applied.`);
      }
    }
    console.log('All pending migrations processed.');
  }

  public async rollbackMigration(migrationName?: string): Promise<void> {
    // If migrationName is not provided, rollback the last applied one.
    // This requires knowing the order they were applied or fetching the last one from the DB.
    // For simplicity, this example will require a migrationName or could be extended.
    console.log('Starting to rollback migration...');
    await this.ensureMigrationsTableExists(); // Should exist, but good practice

    let targetMigrationName = migrationName;

    if (!targetMigrationName) {
        const { data, error } = await this.supabase
            .from(MIGRATIONS_TABLE_NAME)
            .select('migration_name')
            .order('applied_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error fetching last applied migration for rollback:', error);
            throw error;
        }
        if (!data || data.length === 0) {
            console.log('No migrations to rollback.');
            return;
        }
        targetMigrationName = data[0].migration_name;
    }


    if (!targetMigrationName) {
        console.log('No specific migration name provided and could not determine the last one.');
        return;
    }
    
    console.log(`Attempting to rollback migration: ${targetMigrationName}`);

    try {
      const migrationPath = path.join(MIGRATIONS_DIR, targetMigrationName);
      // Ensure the file exists before trying to import, especially if it was deleted or renamed
      try {
        await fs.access(migrationPath);
      } catch (e) {
        console.error(`Migration file ${targetMigrationName} not found at ${migrationPath}. Cannot execute 'down' function.`);
        // We might still want to remove it from the DB if the record exists
        const appliedMigrations = await this.getAppliedMigrationNames();
        if (appliedMigrations.includes(targetMigrationName)) {
            console.warn(`Migration file ${targetMigrationName} not found, but a record exists in the database. Removing record.`);
            await this.deleteMigrationRecord(targetMigrationName);
            console.log(`Record for missing migration file ${targetMigrationName} removed.`);
        } else {
            console.log(`No record for ${targetMigrationName} in database. Nothing to do.`);
        }
        return; // Stop if file not found
      }

      const migrationModule = await import(migrationPath);

      if (typeof migrationModule.down !== 'function') {
        throw new Error(`Migration ${targetMigrationName} does not have a 'down' function.`);
      }

      await migrationModule.down(this.supabase);
      await this.deleteMigrationRecord(targetMigrationName);
      console.log(`Migration ${targetMigrationName} rolled back and record deleted successfully.`);
    } catch (error) {
      console.error(`Error rolling back migration ${targetMigrationName}:`, error);
      throw error;
    }
  }
}
