import { AdminConfig } from '@/lib/types/admin'
import { DEFAULT_ADMIN_CONFIG } from '@/lib/constants/admin'
import { getDatabase, DatabaseWrapper } from '@/lib/db/connection'
import { migrator } from '@/lib/db/migrations'

export interface ConfigRecord {
  id: number
  config_data: string
  created_at: string
  updated_at: string
  version: number
}

export interface ConfigAuditEntry {
  id: number
  action: 'UPDATE' | 'RESET' | 'CREATE'
  config_data: string
  timestamp: string
  user_agent: string
}

export class ConfigError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'ConfigError'
  }
}

export const CONFIG_ERRORS = {
  DATABASE_CONNECTION: 'DATABASE_CONNECTION',
  INVALID_CONFIG: 'INVALID_CONFIG',
  SAVE_FAILED: 'SAVE_FAILED',
  NOT_FOUND: 'NOT_FOUND'
} as const

export class ServerConfigService {
  private db: DatabaseWrapper | null = null
  private initialized: boolean = false

  async getDb(): Promise<DatabaseWrapper> {
    if (!this.db) {
      this.db = await getDatabase()
    }
    return this.db
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await migrator.initializeDatabase()
      this.initialized = true
    }
  }

  async getConfig(): Promise<AdminConfig> {
    try {
      await this.ensureInitialized()
      const db = await this.getDb()
      
      const result = await db.get(`
        SELECT config_data, updated_at, version
        FROM admin_config
        ORDER BY updated_at DESC
        LIMIT 1
      `) as ConfigRecord | undefined
      
      if (!result) {
        // No configuration exists, create default
        console.log('No configuration found, creating default')
        const defaultConfig = await this.createDefaultConfig()
        return defaultConfig
      }
      
      const config = JSON.parse(result.config_data) as AdminConfig
      
      // Validate the loaded configuration
      if (!this.isValidConfig(config)) {
        console.warn('Invalid configuration found, using defaults')
        return await this.createDefaultConfig()
      }
      
      return config
    } catch (error) {
      console.error('Failed to get configuration:', error)
      throw new ConfigError(
        'Failed to load configuration',
        CONFIG_ERRORS.DATABASE_CONNECTION
      )
    }
  }

  async saveConfig(config: AdminConfig, userAgent: string = 'Unknown'): Promise<boolean> {
    try {
      await this.ensureInitialized()
      const db = await this.getDb()
      
      if (!this.isValidConfig(config)) {
        throw new ConfigError(
          'Invalid configuration structure',
          CONFIG_ERRORS.INVALID_CONFIG,
          400
        )
      }
      
      const configWithTimestamp = {
        ...config,
        lastUpdated: new Date().toISOString()
      }
      
      // Insert new configuration
      await db.run(`
        INSERT INTO admin_config (config_data, updated_at, version)
        VALUES (?, CURRENT_TIMESTAMP, 1)
      `, [JSON.stringify(configWithTimestamp)])
      
      // Log the change for audit
      await this.logConfigChange('UPDATE', configWithTimestamp, userAgent)
      
      console.log('Configuration saved successfully')
      return true
    } catch (error) {
      console.error('Failed to save configuration:', error)
      if (error instanceof ConfigError) {
        throw error
      }
      throw new ConfigError(
        'Failed to save configuration',
        CONFIG_ERRORS.SAVE_FAILED
      )
    }
  }

  async resetToDefaults(userAgent: string = 'Unknown'): Promise<AdminConfig> {
    try {
      await this.ensureInitialized()
      const db = await this.getDb()
      
      const defaultConfig = {
        ...DEFAULT_ADMIN_CONFIG,
        lastUpdated: new Date().toISOString()
      }
      
      // Insert default configuration
      await db.run(`
        INSERT INTO admin_config (config_data, updated_at, version)
        VALUES (?, CURRENT_TIMESTAMP, 1)
      `, [JSON.stringify(defaultConfig)])
      
      // Log the reset for audit
      await this.logConfigChange('RESET', defaultConfig, userAgent)
      
      console.log('Configuration reset to defaults')
      return defaultConfig
    } catch (error) {
      console.error('Failed to reset configuration:', error)
      throw new ConfigError(
        'Failed to reset configuration',
        CONFIG_ERRORS.SAVE_FAILED
      )
    }
  }

  private async createDefaultConfig(): Promise<AdminConfig> {
    const defaultConfig = {
      ...DEFAULT_ADMIN_CONFIG,
      lastUpdated: new Date().toISOString()
    }
    
    try {
      const db = await this.getDb()
      
      // Insert default configuration
      await db.run(`
        INSERT INTO admin_config (config_data, updated_at, version)
        VALUES (?, CURRENT_TIMESTAMP, 1)
      `, [JSON.stringify(defaultConfig)])
      
      // Log the creation for audit
      await this.logConfigChange('CREATE', defaultConfig, 'System')
      
      console.log('Default configuration created')
      return defaultConfig
    } catch (error) {
      console.error('Failed to create default configuration:', error)
      // Return in-memory default if database fails
      return defaultConfig
    }
  }

  private async logConfigChange(action: 'UPDATE' | 'RESET' | 'CREATE', config: AdminConfig, userAgent: string): Promise<void> {
    try {
      const db = await this.getDb()
      
      await db.run(`
        INSERT INTO config_audit (action, config_data, user_agent)
        VALUES (?, ?, ?)
      `, [action, JSON.stringify(config), userAgent])
    } catch (error) {
      console.error('Failed to log configuration change:', error)
      // Don't throw error for audit logging failures
    }
  }

  async getAuditLog(limit: number = 50): Promise<ConfigAuditEntry[]> {
    try {
      await this.ensureInitialized()
      const db = await this.getDb()
      
      return await db.all(`
        SELECT id, action, config_data, timestamp, user_agent
        FROM config_audit
        ORDER BY timestamp DESC
        LIMIT ?
      `, [limit]) as ConfigAuditEntry[]
    } catch (error) {
      console.error('Failed to get audit log:', error)
      return []
    }
  }

  async checkDatabaseHealth(): Promise<boolean> {
    try {
      const db = await this.getDb()
      
      // Test database connection
      await db.get('SELECT 1')
      
      // Test configuration table
      await db.get('SELECT COUNT(*) as count FROM admin_config')
      
      // Test audit table
      await db.get('SELECT COUNT(*) as count FROM config_audit')
      
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  private isValidConfig(config: any): config is AdminConfig {
    if (!config || typeof config !== 'object') return false
    
    if (!config.upselling || typeof config.upselling !== 'object') return false

    const requiredFeatures: (keyof AdminConfig['upselling'])[] = [
      'frequentlyBoughtTogether',
      'youMightAlsoLike',
      'freeShippingProgressBar',
      'postCartUpsellOffers',
      'crossSellRecommendations',
    ]

    return requiredFeatures.every(
      feature => typeof config.upselling[feature] === 'boolean'
    )
  }

  async validateAndRepair(): Promise<AdminConfig> {
    try {
      const config = await this.getConfig()
      const defaults = DEFAULT_ADMIN_CONFIG
      let needsRepair = false

      // Ensure all required features exist
      Object.keys(defaults.upselling).forEach(key => {
        const featureKey = key as keyof AdminConfig['upselling']
        if (!(featureKey in config.upselling)) {
          config.upselling[featureKey] = defaults.upselling[featureKey]
          needsRepair = true
        }
      })

      if (needsRepair) {
        await this.saveConfig(config, 'System-Repair')
        console.log('Configuration repaired and saved')
      }

      return config
    } catch (error) {
      console.error('Failed to validate and repair configuration:', error)
      return DEFAULT_ADMIN_CONFIG
    }
  }

  async exportConfiguration(): Promise<{ config: AdminConfig; audit: ConfigAuditEntry[]; metadata: any }> {
    try {
      const config = await this.getConfig()
      const audit = await this.getAuditLog(100)
      const metadata = {
        exportedAt: new Date().toISOString(),
        version: await migrator.getCurrentVersion(),
        totalAuditEntries: audit.length
      }

      return { config, audit, metadata }
    } catch (error) {
      console.error('Failed to export configuration:', error)
      throw new ConfigError(
        'Failed to export configuration',
        CONFIG_ERRORS.DATABASE_CONNECTION
      )
    }
  }

  async importConfiguration(data: { config: AdminConfig }, userAgent: string = 'Import'): Promise<boolean> {
    try {
      if (!this.isValidConfig(data.config)) {
        throw new ConfigError(
          'Invalid configuration in import data',
          CONFIG_ERRORS.INVALID_CONFIG,
          400
        )
      }

      await this.saveConfig(data.config, userAgent)
      console.log('Configuration imported successfully')
      return true
    } catch (error) {
      console.error('Failed to import configuration:', error)
      if (error instanceof ConfigError) {
        throw error
      }
      throw new ConfigError(
        'Failed to import configuration',
        CONFIG_ERRORS.SAVE_FAILED
      )
    }
  }

  async createBackup(): Promise<{ filename: string; data: any; size: number }> {
    try {
      await this.ensureInitialized()
      
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        config: await this.getConfig(),
        audit: await this.getAuditLog(1000), // Get more audit entries for backup
        metadata: {
          databaseVersion: migrator.getCurrentVersion(),
          appliedMigrations: migrator.getAppliedMigrations()
        }
      }

      const filename = `admin-config-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      const data = JSON.stringify(backup, null, 2)
      const size = Buffer.byteLength(data, 'utf8')

      return { filename, data: backup, size }
    } catch (error) {
      console.error('Failed to create backup:', error)
      throw new ConfigError(
        'Failed to create backup',
        CONFIG_ERRORS.DATABASE_CONNECTION
      )
    }
  }

  async restoreFromBackup(backupData: any, userAgent: string = 'Restore'): Promise<boolean> {
    try {
      await this.ensureInitialized()

      // Validate backup structure
      if (!backupData || !backupData.config || !backupData.version) {
        throw new ConfigError(
          'Invalid backup file structure',
          CONFIG_ERRORS.INVALID_CONFIG,
          400
        )
      }

      // Validate configuration in backup
      if (!this.isValidConfig(backupData.config)) {
        throw new ConfigError(
          'Invalid configuration in backup file',
          CONFIG_ERRORS.INVALID_CONFIG,
          400
        )
      }

      // Create a backup of current state before restore
      const currentBackup = await this.createBackup()
      console.log('Created safety backup before restore:', currentBackup.filename)

      // Restore configuration
      await this.saveConfig(backupData.config, `${userAgent}-Restore`)

      console.log('Configuration restored from backup successfully')
      return true
    } catch (error) {
      console.error('Failed to restore from backup:', error)
      if (error instanceof ConfigError) {
        throw error
      }
      throw new ConfigError(
        'Failed to restore from backup',
        CONFIG_ERRORS.SAVE_FAILED
      )
    }
  }

  async getDatabaseStats(): Promise<{
    configCount: number
    auditCount: number
    oldestConfig: string | null
    newestConfig: string | null
    databaseSize: number
  }> {
    try {
      await this.ensureInitialized()
      const db = await this.getDb()

      const configCountResult = await db.get('SELECT COUNT(*) as count FROM admin_config') as { count: number }
      const auditCountResult = await db.get('SELECT COUNT(*) as count FROM config_audit') as { count: number }
      
      const oldestConfigResult = await db.get(`
        SELECT created_at FROM admin_config 
        ORDER BY created_at ASC 
        LIMIT 1
      `) as { created_at: string } | undefined

      const newestConfigResult = await db.get(`
        SELECT updated_at FROM admin_config 
        ORDER BY updated_at DESC 
        LIMIT 1
      `) as { updated_at: string } | undefined

      // Get database file size
      const fs = require('fs')
      const path = require('path')
      const dbPath = path.join(process.cwd(), 'data', 'admin.db')
      let databaseSize = 0
      
      try {
        const stats = fs.statSync(dbPath)
        databaseSize = stats.size
      } catch {
        // Database file might not exist yet
      }

      return {
        configCount: configCountResult.count,
        auditCount: auditCountResult.count,
        oldestConfig: oldestConfigResult?.created_at || null,
        newestConfig: newestConfigResult?.updated_at || null,
        databaseSize
      }
    } catch (error) {
      console.error('Failed to get database stats:', error)
      throw new ConfigError(
        'Failed to get database statistics',
        CONFIG_ERRORS.DATABASE_CONNECTION
      )
    }
  }

  async cleanupOldAuditEntries(keepDays: number = 30): Promise<number> {
    try {
      await this.ensureInitialized()
      const db = await this.getDb()

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - keepDays)

      const result = await db.run(`
        DELETE FROM config_audit 
        WHERE timestamp < ?
      `, [cutoffDate.toISOString()])

      console.log(`Cleaned up ${result.changes} old audit entries`)
      return result.changes || 0
    } catch (error) {
      console.error('Failed to cleanup old audit entries:', error)
      throw new ConfigError(
        'Failed to cleanup audit entries',
        CONFIG_ERRORS.DATABASE_CONNECTION
      )
    }
  }

  async repairDatabase(): Promise<{ repaired: boolean; issues: string[] }> {
    try {
      await this.ensureInitialized()
      const db = await this.getDb()
      const issues: string[] = []
      let repaired = false

      // Check for missing default configuration
      const configCount = await db.get('SELECT COUNT(*) as count FROM admin_config') as { count: number }
      if (configCount.count === 0) {
        await this.createDefaultConfig()
        issues.push('Created missing default configuration')
        repaired = true
      }

      // Validate existing configurations
      const configs = await db.all('SELECT id, config_data FROM admin_config') as Array<{ id: number; config_data: string }>
      
      for (const configRecord of configs) {
        try {
          const config = JSON.parse(configRecord.config_data)
          if (!this.isValidConfig(config)) {
            // Remove invalid configuration
            await db.run('DELETE FROM admin_config WHERE id = ?', [configRecord.id])
            issues.push(`Removed invalid configuration with ID ${configRecord.id}`)
            repaired = true
          }
        } catch {
          // Remove unparseable configuration
          await db.run('DELETE FROM admin_config WHERE id = ?', [configRecord.id])
          issues.push(`Removed unparseable configuration with ID ${configRecord.id}`)
          repaired = true
        }
      }

      // Ensure we have at least one valid configuration
      const remainingCount = await db.get('SELECT COUNT(*) as count FROM admin_config') as { count: number }
      if (remainingCount.count === 0) {
        await this.createDefaultConfig()
        issues.push('Recreated default configuration after cleanup')
        repaired = true
      }

      return { repaired, issues }
    } catch (error) {
      console.error('Failed to repair database:', error)
      throw new ConfigError(
        'Failed to repair database',
        CONFIG_ERRORS.DATABASE_CONNECTION
      )
    }
  }
}