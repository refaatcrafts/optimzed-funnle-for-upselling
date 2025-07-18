import { getDatabase, DatabaseWrapper } from './connection'

export interface Migration {
  version: number
  description: string
  sql: string
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Create admin_config table',
    sql: `
      CREATE TABLE IF NOT EXISTS admin_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        version INTEGER DEFAULT 1
      );
      
      CREATE INDEX IF NOT EXISTS idx_config_updated_at ON admin_config(updated_at);
    `
  },
  {
    version: 2,
    description: 'Create config_audit table',
    sql: `
      CREATE TABLE IF NOT EXISTS config_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        config_data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON config_audit(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON config_audit(action);
    `
  },
  {
    version: 3,
    description: 'Create schema_version table',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      );
    `
  }
]

export class DatabaseMigrator {
  private db: DatabaseWrapper | null = null

  async getDb(): Promise<DatabaseWrapper> {
    if (!this.db) {
      this.db = await getDatabase()
    }
    return this.db
  }

  async initializeDatabase(): Promise<void> {
    try {
      console.log('Initializing database...')
      
      const db = await this.getDb()
      
      // Create schema_version table first
      await db.exec(`
        CREATE TABLE IF NOT EXISTS schema_version (
          version INTEGER PRIMARY KEY,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          description TEXT
        );
      `)
      
      await this.runMigrations()
      console.log('Database initialization completed')
    } catch (error) {
      console.error('Database initialization failed:', error)
      throw error
    }
  }

  async runMigrations(): Promise<void> {
    const currentVersion = await this.getCurrentVersion()
    console.log(`Current database version: ${currentVersion}`)
    
    const pendingMigrations = MIGRATIONS.filter(m => m.version > currentVersion)
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations')
      return
    }
    
    console.log(`Running ${pendingMigrations.length} pending migrations...`)
    
    for (const migration of pendingMigrations) {
      await this.runMigration(migration)
    }
    
    console.log('All migrations completed successfully')
  }

  private async runMigration(migration: Migration): Promise<void> {
    const db = await this.getDb()
    
    try {
      console.log(`Running migration ${migration.version}: ${migration.description}`)
      
      // Execute the migration SQL
      await db.exec(migration.sql)
      
      // Record the migration
      await db.run(`
        INSERT INTO schema_version (version, description)
        VALUES (?, ?)
      `, [migration.version, migration.description])
      
      console.log(`Migration ${migration.version} completed`)
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error)
      throw error
    }
  }

  async getCurrentVersion(): Promise<number> {
    try {
      const db = await this.getDb()
      const result = await db.get(`
        SELECT MAX(version) as version FROM schema_version
      `) as { version: number | null }
      
      return result?.version || 0
    } catch (error) {
      // If schema_version table doesn't exist, we're at version 0
      return 0
    }
  }

  async getAppliedMigrations(): Promise<Array<{ version: number; description: string; applied_at: string }>> {
    try {
      const db = await this.getDb()
      return await db.all(`
        SELECT version, description, applied_at
        FROM schema_version
        ORDER BY version
      `) as Array<{ version: number; description: string; applied_at: string }>
    } catch (error) {
      console.warn('Could not fetch applied migrations:', error)
      return []
    }
  }

  async resetDatabase(): Promise<void> {
    console.log('Resetting database...')
    
    const db = await this.getDb()
    
    // Drop all tables
    await db.exec(`
      DROP TABLE IF EXISTS config_audit;
      DROP TABLE IF EXISTS admin_config;
      DROP TABLE IF EXISTS schema_version;
    `)
    
    // Reinitialize
    await this.initializeDatabase()
    console.log('Database reset completed')
  }

  async checkDatabaseHealth(): Promise<{ healthy: boolean; version: number; error?: string }> {
    try {
      const db = await this.getDb()
      const version = await this.getCurrentVersion()
      
      // Test basic operations
      await db.get('SELECT 1')
      
      // Check if required tables exist
      const tables = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('admin_config', 'config_audit', 'schema_version')
      `) as Array<{ name: string }>
      
      const requiredTables = ['admin_config', 'config_audit', 'schema_version']
      const existingTables = tables.map(t => t.name)
      const missingTables = requiredTables.filter(t => !existingTables.includes(t))
      
      if (missingTables.length > 0) {
        return {
          healthy: false,
          version,
          error: `Missing tables: ${missingTables.join(', ')}`
        }
      }
      
      return { healthy: true, version }
    } catch (error) {
      return {
        healthy: false,
        version: 0,
        error: String(error)
      }
    }
  }
}

// Export singleton instance
export const migrator = new DatabaseMigrator()