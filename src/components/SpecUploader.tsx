import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { UploadCloud, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const ACCEPTED_EXTENSIONS = ['.yaml', '.yml', '.json']

const optionsSchema = z.object({
  projectName: z.string().optional(),
  baseUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

type OptionsValues = z.infer<typeof optionsSchema>

interface SpecUploaderProps {
  onValidate: (file: File) => void
  onGenerate: (file: File, options: { projectName?: string; baseUrl?: string }) => void
  isValidating: boolean
  isGenerating: boolean
  generateDisabled: boolean
}

export function SpecUploader({
  onValidate,
  onGenerate,
  isValidating,
  isGenerating,
  generateDisabled,
}: SpecUploaderProps) {
  const [file, setFile] = useState<File | null>(null)

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

  const requireFile = (): File | null => {
    if (!file) {
      toast.error('Choose a spec file first.')
      return null
    }
    return file
  }

  const handleValidate = () => {
    const chosen = requireFile()
    if (chosen) onValidate(chosen)
  }

  const handleGenerate = async () => {
    const chosen = requireFile()
    if (!chosen) return
    const valid = await trigger()
    if (!valid) return
    const { projectName, baseUrl } = getValues()
    onGenerate(chosen, { projectName: projectName || undefined, baseUrl: baseUrl || undefined })
  }

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
          <div className="flex items-center gap-2 text-sm">
            <FileText className="size-4" />
            <span>{file.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
              }}
              className="text-muted-foreground hover:text-foreground"
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

      <details className="text-sm">
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
        <Button type="button" variant="outline" onClick={handleValidate} disabled={isValidating}>
          {isValidating ? 'Validating…' : 'Validate'}
        </Button>
        <Button type="button" onClick={handleGenerate} disabled={isGenerating || generateDisabled}>
          {isGenerating ? 'Starting…' : 'Generate Tests'}
        </Button>
      </div>
    </div>
  )
}
