import path from 'path'
import fs from 'fs'

// Database configuration
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const CONFIG_FILE = path.join(DATA_DIR, 'admin-config.json')
const AUDIT_FILE = path.join(DATA_DIR, 'config-audit.json')
const DB_LOGGING = process.env.DB_LOGGING === 'true'

// Ensure data directory exists
function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Simple file-based database wrapper
export class DatabaseWrapper {
  constructor() {
    ensureDataDirectory()
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> {
    // This is a simplified implementation for basic operations
    if (sql.includes('INSERT INTO admin_config')) {
      return this.insertConfig(params[0])
    } else if (sql.includes('INSERT INTO config_audit')) {
      return this.insertAudit(params[0], params[1], params[2])
    } else if (sql.includes('DELETE FROM config_audit')) {
      return this.deleteOldAudit(params[0])
    }
    
    return { changes: 0, lastID: 0 }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    if (sql.includes('admin_config')) {
      return this.getLatestConfig()
    } else if (sql.includes('config_audit') && sql.includes('COUNT')) {
      return this.getAuditCount()
    } else if (sql.includes('SELECT 1')) {
      return { result: 1 } // Health check
    }
    
    return undefined
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    if (sql.includes('config_audit')) {
      return this.getAuditEntries(params[0] || 50)
    } else if (sql.includes('admin_config')) {
      const config = this.getLatestConfig()
      return config ? [config] : []
    }
    
    return []
  }

  async exec(sql: string): Promise<void> {
    // No-op for PRAGMA statements and table creation
    if (DB_LOGGING && !sql.includes('PRAGMA')) {
      console.log('Executing SQL:', sql)
    }
  }

  async close(): Promise<void> {
    // No-op for file-based storage
  }

  // File-based operations
  private async insertConfig(configData: string): Promise<{ changes: number; lastID: number }> {
    try {
      const configs = this.loadConfigs()
      const newConfig = {
        id: configs.length + 1,
        config_data: configData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1
      }
      
      configs.push(newConfig)
      this.saveConfigs(configs)
      
      return { changes: 1, lastID: newConfig.id }
    } catch (error) {
      console.error('Failed to insert config:', error)
      throw error
    }
  }

  private async insertAudit(action: string, configData: string, userAgent: string): Promise<{ changes: number; lastID: number }> {
    try {
      const audits = this.loadAudits()
      const newAudit = {
        id: audits.length + 1,
        action,
        config_data: configData,
        timestamp: new Date().toISOString(),
        user_agent: userAgent
      }
      
      audits.push(newAudit)
      this.saveAudits(audits)
      
      return { changes: 1, lastID: newAudit.id }
    } catch (error) {
      console.error('Failed to insert audit:', error)
      throw error
    }
  }

  private async deleteOldAudit(cutoffDate: string): Promise<{ changes: number; lastID: number }> {
    try {
      const audits = this.loadAudits()
      const originalCount = audits.length
      const filteredAudits = audits.filter(audit => audit.timestamp >= cutoffDate)
      
      this.saveAudits(filteredAudits)
      
      return { changes: originalCount - filteredAudits.length, lastID: 0 }
    } catch (error) {
      console.error('Failed to delete old audits:', error)
      throw error
    }
  }

  private getLatestConfig(): any {
    try {
      const configs = this.loadConfigs()
      if (configs.length === 0) return undefined
      
      // Return the most recent config
      return configs[configs.length - 1]
    } catch (error) {
      console.error('Failed to get latest config:', error)
      return undefined
    }
  }

  private getAuditCount(): any {
    try {
      const audits = this.loadAudits()
      return { count: audits.length }
    } catch (error) {
      console.error('Failed to get audit count:', error)
      return { count: 0 }
    }
  }

  private getAuditEntries(limit: number): any[] {
    try {
      const audits = this.loadAudits()
      // Return most recent entries first
      return audits.slice(-limit).reverse()
    } catch (error) {
      console.error('Failed to get audit entries:', error)
      return []
    }
  }

  private loadConfigs(): any[] {
    try {
      if (!fs.existsSync(CONFIG_FILE)) {
        return []
      }
      
      const data = fs.readFileSync(CONFIG_FILE, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to load configs:', error)
      return []
    }
  }

  private saveConfigs(configs: any[]): void {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2))
      if (DB_LOGGING) {
        console.log(`Saved ${configs.length} configs to ${CONFIG_FILE}`)
      }
    } catch (error) {
      console.error('Failed to save configs:', error)
      throw error
    }
  }

  private loadAudits(): any[] {
    try {
      if (!fs.existsSync(AUDIT_FILE)) {
        return []
      }
      
      const data = fs.readFileSync(AUDIT_FILE, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to load audits:', error)
      return []
    }
  }

  private saveAudits(audits: any[]): void {
    try {
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(audits, null, 2))
      if (DB_LOGGING) {
        console.log(`Saved ${audits.length} audit entries to ${AUDIT_FILE}`)
      }
    } catch (error) {
      console.error('Failed to save audits:', error)
      throw error
    }
  }
}

// Database connection singleton
let dbWrapper: DatabaseWrapper | null = null

export async function getDatabase(): Promise<DatabaseWrapper> {
  if (!dbWrapper) {
    try {
      dbWrapper = new DatabaseWrapper()
      
      if (DB_LOGGING) {
        console.log(`File-based database initialized: ${DATA_DIR}`)
      }

    } catch (error) {
      console.error('Failed to initialize file-based database:', error)
      throw new Error(`Database connection failed: ${error}`)
    }
  }

  return dbWrapper
}

export async function closeDatabase(): Promise<void> {
  if (dbWrapper) {
    try {
      await dbWrapper.close()
      dbWrapper = null
      console.log('SQLite database connection closed')
    } catch (error) {
      console.error('Error closing database:', error)
    }
  }
}

export async function isDatabaseConnected(): Promise<boolean> {
  try {
    if (!dbWrapper) return false
    // Test connection with a simple query
    await dbWrapper.get('SELECT 1')
    return true
  } catch {
    return false
  }
}

export async function getDatabaseInfo(): Promise<{ path: string; size: number; connected: boolean }> {
  const connected = await isDatabaseConnected()
  let size = 0

  try {
    // Calculate total size of config and audit files
    if (fs.existsSync(CONFIG_FILE)) {
      const configStats = fs.statSync(CONFIG_FILE)
      size += configStats.size
    }
    if (fs.existsSync(AUDIT_FILE)) {
      const auditStats = fs.statSync(AUDIT_FILE)
      size += auditStats.size
    }
  } catch (error) {
    console.warn('Could not get database file size:', error)
  }

  return {
    path: DATA_DIR,
    size,
    connected
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', () => {
  closeDatabase()
  process.exit(0)
})