import type { GenerateJobStatus, GenerateStartResult, QueueStats, ValidateResult } from './types'

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/play-spec/api'

// /validate, /feedback, /queue, and /queue/events all require this — see
// src/middlewares/basicAuth.js on the backend. Baked in at build time like
// any other VITE_* var, which means it ships inside this bundle and is
// readable by anyone who opens devtools: this stops drive-by
// bots/scanners hitting the raw API, not a determined visitor of the site.
const BASIC_AUTH_USER = import.meta.env.VITE_BASIC_AUTH_USER as string | undefined
const BASIC_AUTH_PASS = import.meta.env.VITE_BASIC_AUTH_PASS as string | undefined

export function basicAuthHeaders(): Record<string, string> {
  if (!BASIC_AUTH_USER || !BASIC_AUTH_PASS) return {}
  return { Authorization: `Basic ${btoa(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASS}`)}` }
}

/** Thrown for any non-2xx response; carries the HTTP status so callers can branch on it (409, 503, ...). */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function errorFromResponse(res: Response): Promise<ApiError> {
  try {
    const body = await res.json()
    if (typeof body?.error === 'string') return new ApiError(res.status, body.error)
  } catch {
    // body wasn't JSON — fall through to the generic message below
  }
  return new ApiError(res.status, `Request failed with status ${res.status}`)
}

function specFormData(file: File, fields: Record<string, string | undefined>): FormData {
  const form = new FormData()
  form.append('spec', file)
  for (const [key, value] of Object.entries(fields)) {
    if (value) form.append(key, value)
  }
  return form
}

/** Filename from a `Content-Disposition: attachment; filename="..."` header, falling back to a default. */
function filenameFromContentDisposition(res: Response, fallback: string): string {
  const header = res.headers.get('Content-Disposition') ?? ''
  const match = header.match(/filename="([^"]+)"/)
  return match?.[1] ?? fallback
}

export interface ValidateOptions {
  includeTags?: boolean
  includeSchemas?: boolean
  /** Only validate these HTTP methods (comma-joined server-side; case-insensitive). */
  methods?: string[]
  /** Only validate operations tagged with at least one of these (case-sensitive — matches the spec's own tags). */
  tags?: string[]
}

export async function validateSpec(file: File, options: ValidateOptions = {}): Promise<ValidateResult> {
  const params = new URLSearchParams()
  if (options.includeTags) params.set('includeTags', 'true')
  if (options.includeSchemas) params.set('includeSchemas', 'true')
  if (options.methods?.length) params.set('methods', options.methods.join(','))
  if (options.tags?.length) params.set('tags', options.tags.join(','))

  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_BASE_URL}/validate${query}`, {
    method: 'POST',
    headers: basicAuthHeaders(),
    body: specFormData(file, {}),
  })
  if (!res.ok) throw await errorFromResponse(res)
  return res.json()
}

export interface GenerateOptions {
  projectName?: string
  baseUrl?: string
}

/**
 * `generateToken` is the JWT validateSpec() returns (ValidateResult.generateToken)
 * — /generate/http requires either that or a pre-shared API key (which this
 * app's UI never holds; that layer is for external callers integrating
 * directly). Omitting it here just means the backend will reject the
 * request with 401, which is why Generate.tsx keeps the button disabled
 * until a token exists rather than letting this call happen at all.
 */
export async function startGenerate(file: File, options: GenerateOptions = {}, generateToken?: string): Promise<GenerateStartResult> {
  const res = await fetch(`${API_BASE_URL}/generate/http`, {
    method: 'POST',
    headers: generateToken ? { Authorization: `Bearer ${generateToken}` } : {},
    body: specFormData(file, { projectName: options.projectName, baseUrl: options.baseUrl }),
  })
  if (!res.ok) throw await errorFromResponse(res)
  return res.json()
}

/** Never throws for a "normal" non-done state (404/pending/failed) — those are all part of the job lifecycle. */
export async function getGenerateJob(jobId: string): Promise<GenerateJobStatus> {
  const res = await fetch(`${API_BASE_URL}/generate/http/${encodeURIComponent(jobId)}`)

  if (res.status === 404) return { status: 'not-found' }
  if (res.status === 202) return { status: 'pending' }
  if (res.status === 500) {
    const body = await res.json()
    return { status: 'failed', error: body.error ?? 'Generation failed.' }
  }
  if (!res.ok) throw await errorFromResponse(res)

  const blob = await res.blob()
  const filename = filenameFromContentDisposition(res, `${jobId}.zip`)
  return { status: 'done', blob, filename }
}

export async function getQueueStats(): Promise<QueueStats> {
  const res = await fetch(`${API_BASE_URL}/queue`, { headers: basicAuthHeaders() })
  if (!res.ok) throw await errorFromResponse(res)
  return res.json()
}

export interface FeedbackPayload {
  fullName: string
  /** Optional — if given, the site owner's reply goes straight to it. */
  email?: string
  message: string
  /**
   * Honeypot: always left empty by a real visitor since the field is
   * visually hidden. A bot that blindly fills every input won't know that,
   * so a non-empty value here signals spam server-side.
   */
  website?: string
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...basicAuthHeaders() },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw await errorFromResponse(res)
}
