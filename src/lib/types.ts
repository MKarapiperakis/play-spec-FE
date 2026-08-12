// Mirrors PlaySpec's actual API response shapes (src/parser/validateSpec.js,
// src/routes/generateRoutes.js, src/middlewares/generateQueue.js).

export type Severity = 'good' | 'medium' | 'bad'

export interface ValidationIssue {
  message: string
  path: string | null
}

export type CategoryStatus = 'pass' | 'warning' | 'error'

export interface CategoryIssue {
  severity: 'warning' | 'error'
  message: string
  path: string | null
}

export interface ValidationCategory {
  id: string
  label: string
  status: CategoryStatus
  issues: CategoryIssue[]
}

export interface SecuritySchemeInfo {
  name: string
  type: string
}

export interface EndpointInfo {
  path: string
  summary: string | null
}

export interface SchemaInfo {
  name: string
  /** The dereferenced JSON Schema, with any circular self-reference replaced by the string "[Circular reference]". */
  definition: unknown
}

export interface ValidationSummary {
  title: string | null
  specVersion: string | null
  pathCount: number
  operationCount: number
  hasBaseUrl: boolean
  securitySchemes: SecuritySchemeInfo[]
  endpoints: Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete', EndpointInfo[]>>
  tags?: { name: string; description: string | null }[]
  schemas?: SchemaInfo[]
}

export interface ValidateResult {
  valid: boolean
  canGenerate: boolean
  severity: Severity
  score: number
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  categories: ValidationCategory[] | null
  summary: ValidationSummary | null
}

export interface GenerateStartResult {
  jobId: string
}

export type GenerateJobStatus =
  | { status: 'pending' }
  | { status: 'done'; blob: Blob; filename: string }
  | { status: 'failed'; error: string }
  | { status: 'not-found' }

export interface QueueStats {
  running: number
  waiting: number
  activeUsers: number
  limits: { concurrency: number; maxWaiting: number }
}
