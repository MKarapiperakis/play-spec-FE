import { useMutation } from '@tanstack/react-query'
import { submitFeedback, type FeedbackPayload } from '@/lib/api'

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (payload: FeedbackPayload) => submitFeedback(payload),
  })
}
