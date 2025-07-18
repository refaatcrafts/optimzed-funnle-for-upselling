import { StorageAdapter } from './storage-adapter'
import { PlatformType } from './platform-detector'
import { SQLiteAdapter } from './adapters/sqlite-adapter'
import { NetlifyBlobsAdapter } from './adapters/netlify-adapter'

interface MigrationStrategy {
  version: number
  platform: PlatformType
  migrate(adapter: StorageAdapter): Promise<void>
}

const MIGRATIONS: MigrationStrategy[] = [
  {
    version: 1,
    platform: PlatformType.SQLITE,
    async migrate(adapter: StorageAdapter) {
      const sqliteAdapter = adapter as SQLiteAdapter
      await sqliteAdapter.migrate()
    }
  },
  {
    version: 1,
    platform: PlatformType.NETLIFY,
    async migrate(adapter: StorageAdapter) {
      const netlifyAdapter = adapter as NetlifyBlobsAdapter
      await netlifyAdapter.migrate()
    }
  }
]

export class MigrationManager {
  static async runMigrations(adapter: StorageAdapter): Promise<void> {
    const platform = adapter.getPlatformInfo().type
    const migrations = MIGRATIONS.filter(m => m.platform === platform)
    
    for (const migration of migrations) {
      try {
        await migration.migrate(adapter)
        console.log(`Migration ${migration.version} completed for ${platform}`)
      } catch (error) {
        console.error(`Migration ${migration.version} failed for ${platform}:`, error)
        throw error
      }
    }
  }
}