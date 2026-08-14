import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, Sparkles, UploadCloud, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { IconChip } from '@/components/IconChip'
import { cn, scrollIntoViewOnOpen } from '@/lib/utils'

const ACCEPTED_EXTENSIONS = ['.yaml', '.yml', '.json']

// Same set /generate/http actually turns into tests (backend's ENDPOINT_METHODS) — the only
// methods it's meaningful to scope validation to.
const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

const optionsSchema = z.object({
  projectName: z.string().optional(),
  baseUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

type OptionsValues = z.infer<typeof optionsSchema>

export interface ValidateFilters {
  methods?: string[]
  tags?: string[]
}

interface SpecUploaderProps {
  onValidate: (file: File, filters: ValidateFilters) => void
  onGenerate: (file: File, options: { projectName?: string; baseUrl?: string }) => void
  isValidating: boolean
  isGenerating: boolean
  generateDisabled: boolean
  /** Populated from the previous validate response's summary.tags, once one exists. */
  availableTags: string[]
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

// "Select all" flips to "Clear" once everything in the group is already
// checked — a no-op group (nothing to select) doesn't render at all.
function SelectAllToggle({ allSelected, onToggle }: { allSelected: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="text-primary cursor-pointer text-xs font-medium hover:underline">
      {allSelected ? 'Clear' : 'Select all'}
    </button>
  )
}

export function SpecUploader({
  onValidate,
  onGenerate,
  isValidating,
  isGenerating,
  generateDisabled,
  availableTags,
}: SpecUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  const {
    register,
    getValues,
    formState: { errors },
    trigger,
  } = useForm<OptionsValues>({ resolver: zodResolver(optionsSchema) })

  const onDrop = useCallback((accepted: File[], rejected: { file: File }[]) => {
    if (rejected.length > 0) {
      toast.error('Only .yaml, .yml, or .json files are accepted.')
      return
    }
    setFile(accepted[0] ?? null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/x-yaml': ['.yaml', '.yml'],
      'text/yaml': ['.yaml', '.yml'],
      'application/json': ['.json'],
    },
  })

  // file is guaranteed non-null here — both buttons below are disabled
  // whenever it's null, so these only ever run with one chosen.
  const handleValidate = () => {
    if (!file) return
    onValidate(file, {
      methods: selectedMethods.size ? [...selectedMethods] : undefined,
      tags: selectedTags.size ? [...selectedTags] : undefined,
    })
  }

  const handleGenerate = async () => {
    if (!file) return
    const valid = await trigger()
    if (!valid) return
    const { projectName, baseUrl } = getValues()
    onGenerate(file, { projectName: projectName || undefined, baseUrl: baseUrl || undefined })
  }

  const hasScope = selectedMethods.size > 0 || selectedTags.size > 0

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragActive ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50',
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex w-full items-center gap-3 text-left">
            <IconChip
              icon={<FileText />}
              className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs">Uploaded file</p>
              <p className="truncate font-medium text-teal-700 dark:text-teal-400">{file.name}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
              }}
              className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="text-muted-foreground size-8" />
            <p className="text-sm">Drag & drop an OpenAPI/Swagger spec here, or click to browse</p>
            <p className="text-muted-foreground text-xs">{ACCEPTED_EXTENSIONS.join(', ')}</p>
          </>
        )}
      </div>

      <details className="text-sm" open={hasScope} onToggle={scrollIntoViewOnOpen}>
        <summary className="cursor-pointer select-none">
          Validate scope {hasScope ? `(${selectedMethods.size + selectedTags.size} selected)` : '(all by default)'}
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Methods</Label>
              <SelectAllToggle
                allSelected={selectedMethods.size === METHODS.length}
                onToggle={() =>
                  setSelectedMethods(selectedMethods.size === METHODS.length ? new Set() : new Set(METHODS))
                }
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {METHODS.map((method) => (
                <label key={method} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedMethods.has(method)}
                    onCheckedChange={() => setSelectedMethods((prev) => toggleInSet(prev, method))}
                  />
                  {method.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {availableTags.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Tags</Label>
                <SelectAllToggle
                  allSelected={selectedTags.size === availableTags.length}
                  onToggle={() =>
                    setSelectedTags(selectedTags.size === availableTags.length ? new Set() : new Set(availableTags))
                  }
                />
              </div>
              <div className="flex flex-wrap gap-3">
                {availableTags.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedTags.has(tag)}
                      onCheckedChange={() => setSelectedTags((prev) => toggleInSet(prev, tag))}
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>
          )}

          <p className="text-muted-foreground text-xs">
            Leave everything unchecked to validate the whole spec. Only affects Validate — Generate
            always uses the whole spec.
            {availableTags.length === 0 && ' Tag filters appear here after your first Validate.'}
          </p>
        </div>
      </details>

      <details className="text-sm" onToggle={scrollIntoViewOnOpen}>
        <summary className="cursor-pointer select-none">Options (used by Generate)</summary>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectName">Project name</Label>
            <Input
              id="projectName"
              placeholder="Defaults to the spec's info.title"
              {...register('projectName')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input id="baseUrl" placeholder="Overrides the spec's servers[0].url" {...register('baseUrl')} />
            {errors.baseUrl && <p className="text-destructive text-sm">{errors.baseUrl.message}</p>}
          </div>
        </div>
      </details>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleValidate} disabled={!file || isValidating}>
          {isValidating ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          {isValidating ? 'Validating…' : 'Validate'}
        </Button>
        <Button type="button" onClick={handleGenerate} disabled={!file || isGenerating || generateDisabled}>
          {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isGenerating ? 'Starting…' : 'Generate Tests'}
        </Button>
      </div>
    </div>
  )
}
