import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { AdminConfig } from '@/lib/types/admin'
import { StorageAdapter, ConfigAuditEntry, ConfigRecord } from '../storage-adapter'
import { PlatformInfo, PlatformType, PlatformDetector } from '../platform-detector'
import { ConfigError, ErrorHandler, CONFIG_ERRORS } from '../errors'

export class SQLiteAdapter extends StorageAdapter {
  private db: Database.Database | null = null
  private readonly dbPath: string

  constructor() {
    super()
    this.dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'admin.db')
  }

  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      // Create database connection
      this.db = new Database(this.dbPath)
      this.db.pragma('journal_mode = WAL') // Better performance
      this.db.pragma('synchronous = NORMAL')
      this.db.pragma('cache_size = 1000')

      // Run migrations
      await this.migrate()
    } catch (error) {
      throw ErrorHandler.handleStorageError(error, PlatformType.SQLITE)
    }
  }

  async migrate(): Promise<void> {
    if (!this.db) throw new ConfigError('Database not initialized', CONFIG_ERRORS.DATABASE_CONNECTION, PlatformType.SQLITE)

    try {
      // Create admin_config table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS admin_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          config_data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          version INTEGER DEFAULT 1
        );
      `)

      // Create config_audit table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS config_audit (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action TEXT NOT NULL,
          config_data TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_agent TEXT,
          platform TEXT DEFAULT 'sqlite'
        );
      `)

      // Create indexes for better performance
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_config_updated_at ON admin_config(updated_at);
        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON config_audit(timestamp);
      `)
    } catch (error) {
      throw ErrorHandler.handleStorageError(error, PlatformType.SQLITE)
    }
  }

  async getConfig(): Promise<AdminConfig | null> {
    if (!this.db) throw new ConfigError('Database not initialized', CONFIG_ERRORS.DATABASE_CONNECTION, PlatformType.SQLITE)

    try {
      const stmt = this.db.prepare('SELECT config_data FROM admin_config ORDER BY updated_at DESC LIMIT 1')
      const row = stmt.get() as { config_data: string } | undefined

      if (!row) return null

      const config = JSON.parse(row.config_data)
      return this.isValidConfig(config) ? config : null
    } catch (error) {
      throw ErrorHandler.handleStorageError(error, PlatformType.SQLITE)
    }
  }

  async saveConfig(config: AdminConfig): Promise<boolean> {
    if (!this.db) throw new ConfigError('Database not initialized', CONFIG_ERRORS.DATABASE_CONNECTION, PlatformType.SQLITE)
    if (!this.isValidConfig(config)) throw new ConfigError('Invalid configuration', CONFIG_ERRORS.INVALID_CONFIG, PlatformType.SQLITE)

    try {
      const configData = JSON.stringify(config)
      const now = new Date().toISOString()

      // Update lastUpdated timestamp
      const updatedConfig = { ...config, lastUpdated: now }
      const updatedConfigData = JSON.stringify(updatedConfig)

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO admin_config (id, config_data, updated_at) 
        VALUES (1, ?, ?)
      `)

      stmt.run(updatedConfigData, now)

      // Log the change
      await this.logConfigChange('UPDATE', updatedConfig)

      return true
    } catch (error) {
      throw ErrorHandler.handleStorageError(error, PlatformType.SQLITE)
    }
  }

  async resetToDefaults(): Promise<AdminConfig> {
    const defaultConfig = this.getDefaultConfig()
    const success = await this.saveConfig(defaultConfig)

    if (!success) {
      throw new ConfigError('Failed to reset configuration', CONFIG_ERRORS.SAVE_FAILED, PlatformType.SQLITE)
    }

    await this.logConfigChange('RESET', defaultConfig)
    return defaultConfig
  }

  async logConfigChange(action: string, config: AdminConfig, userAgent?: string): Promise<void> {
    if (!this.db) return // Don't throw error for audit logging

    try {
      const stmt = this.db.prepare(`
        INSERT INTO config_audit (action, config_data, user_agent, platform) 
        VALUES (?, ?, ?, ?)
      `)

      stmt.run(action, JSON.stringify(config), userAgent || null, 'sqlite')
    } catch (error) {
      console.error('Failed to log config change:', error)
      // Don't throw error for audit logging failures
    }
  }

  async getAuditLog(): Promise<ConfigAuditEntry[]> {
    if (!this.db) return []

    try {
      const stmt = this.db.prepare(`
        SELECT id, action, config_data, timestamp, user_agent, platform 
        FROM config_audit 
        ORDER BY timestamp DESC 
        LIMIT 100
      `)

      const rows = stmt.all() as any[]

      return rows.map(row => ({
        id: row.id,
        action: row.action,
        config_data: row.config_data,
        timestamp: row.timestamp,
        user_agent: row.user_agent,
        platform: row.platform || PlatformType.SQLITE
      }))
    } catch (error) {
      console.error('Failed to get audit log:', error)
      return []
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      if (!this.db) return false

      // Simple query to check database connectivity
      const stmt = this.db.prepare('SELECT 1 as test')
      const result = stmt.get()

      return result !== undefined
    } catch (error) {
      console.error('SQLite health check failed:', error)
      return false
    }
  }

  getPlatformInfo(): PlatformInfo {
    return PlatformDetector.getPlatformInfo(PlatformType.SQLITE)
  }

  getDatabase(): Database.Database | null {
    return this.db
  }
}