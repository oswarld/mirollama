import Database from 'better-sqlite3'
import path from 'path'

// In Next.js, process.cwd() points to the root of the next.js project (e.g., persona-dashboard)
// Since personas.db is one level up, we do '../personas.db'
const dbPath = path.join(process.cwd(), '../personas.db')

// Create a singleton instance
const db = new Database(dbPath, { readonly: true })

export default db
