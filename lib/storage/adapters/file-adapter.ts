import fs from 'fs'
import path from 'path'
import { AdminConfig } from '@/lib/types/admin'
import { StorageAdapter, ConfigAuditEntry } from '../storage-adapter'
import { PlatformInfo, PlatformType, PlatformDetector } from '../platform-detector'
import { ConfigError, ErrorHandler, CONFIG_ERRORS } from '../errors'

export class FileAdapter extends StorageAdapter {
  private readonly configPath: string
  private readonly auditPath: string
  private readonly dataDir: string

  constructor() {
    super()
    this.dataDir = path.join(process.cwd(), 'data')
    this.configPath = path.join(this.dataDir, 'admin-config.json')
    this.auditPath = path.join(this.dataDir, 'config-audit.json')
  }

  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true })
      }

      // Create config file if it doesn't exist
      if (!fs.existsSync(this.configPath)) {
        const defaultConfig = this.getDefaultConfig()
        await this.saveConfig(defaultConfig)
      }

      // Create audit file if it doesn't exist
      if (!fs.existsSync(this.auditPath)) {
        fs.writeFileSync(this.auditPath, JSON.stringify([]), 'utf8')
      }
    } catch (error) {
      throw ErrorHandler.handleStorageError(error, PlatformType.SQLITE)
    }
  }

  async migrate(): Promise<void> {
    // File adapter doesn't need migrations
    return Promise.resolve()
  }

  async getConfig(): Promise<AdminConfig | null> {
    try {
      if (!fs.existsSync(this.configPath)) {
        return null
      }

      const configData = fs.readFileSync(this.configPath, 'utf8')
      const config = JSON.parse(configData)
      
      return this.isValidConfig(config) ? config : null
    } catch (error) {
      console.error('Failed to read config file:', error)
      return null
    }
  }

  async saveConfig(config: AdminConfig): Promise<boolean> {
    if (!this.isValidConfig(config)) {
      throw new ConfigError('Invalid configuration', CONFIG_ERRORS.INVALID_CONFIG, PlatformType.SQLITE)
    }

    try {
      // Update lastUpdated timestamp
      const updatedConfig = { ...config, lastUpdated: new Date().toISOString() }
      
      // Write config to file
      fs.writeFileSync(this.configPath, JSON.stringify(updatedConfig, null, 2), 'utf8')
      
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
    try {
      let auditLog: ConfigAuditEntry[] = []
      
      // Read existing audit log
      if (fs.existsSync(this.auditPath)) {
        const auditData = fs.readFileSync(this.auditPath, 'utf8')
        auditLog = JSON.parse(auditData)
      }

      // Add new audit entry
      const auditEntry: ConfigAuditEntry = {
        id: Date.now(),
        action: action as any,
        config_data: JSON.stringify(config),
        timestamp: new Date().toISOString(),
        user_agent: userAgent,
        platform: PlatformType.SQLITE
      }

      auditLog.unshift(auditEntry)
      
      // Keep only last 100 audit entries
      if (auditLog.length > 100) {
        auditLog = auditLog.slice(0, 100)
      }

      // Write updated audit log
      fs.writeFileSync(this.auditPath, JSON.stringify(auditLog, null, 2), 'utf8')
    } catch (error) {
      console.error('Failed to log config change:', error)
      // Don't throw error for audit logging failures
    }
  }

  async getAuditLog(): Promise<ConfigAuditEntry[]> {
    try {
      if (!fs.existsSync(this.auditPath)) {
        return []
      }

      const auditData = fs.readFileSync(this.auditPath, 'utf8')
      return JSON.parse(auditData)
    } catch (error) {
      console.error('Failed to get audit log:', error)
      return []
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Check if we can read and write to the data directory
      const testFile = path.join(this.dataDir, 'health-check.tmp')
      fs.writeFileSync(testFile, 'test', 'utf8')
      fs.readFileSync(testFile, 'utf8')
      fs.unlinkSync(testFile)
      return true
    } catch (error) {
      console.error('File adapter health check failed:', error)
      return false
    }
  }

  getPlatformInfo(): PlatformInfo {
    return {
      type: PlatformType.SQLITE,
      name: 'File Storage',
      supportsFileSystem: true,
      storageType: 'file'
    }
  }
}