declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database
  }

  export interface Database {
    run(sql: string, params?: any[]): RunResult
    exec(sql: string): ExecResult[]
    prepare(sql: string): Statement
    export(): Uint8Array
    close(): void
    getRowsModified(): number
  }

  export interface RunResult {
    lastInsertRowid?: number
  }

  export interface ExecResult {
    columns: string[]
    values: any[][]
  }

  export interface Statement {
    step(): boolean
    get(): any[]
    getAsObject(): { [key: string]: any }
    run(params?: any[]): void
    reset(): void
    free(): void
  }

  export interface SqlJsConfig {
    locateFile?: (file: string) => string
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>
  
  export { Database }
}