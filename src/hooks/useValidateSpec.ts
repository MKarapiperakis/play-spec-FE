import { useMutation } from '@tanstack/react-query'
import { validateSpec, type ValidateOptions } from '@/lib/api'

export function useValidateSpec() {
  return useMutation({
    mutationFn: ({ file, options }: { file: File; options?: ValidateOptions }) =>
      validateSpec(file, options),
  })
}
