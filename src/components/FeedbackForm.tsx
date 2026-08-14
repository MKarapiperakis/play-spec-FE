import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSubmitFeedback } from '@/hooks/useSubmitFeedback'
import { ApiError } from '@/lib/api'

// Mirrors the backend's own limits (src/routes/feedbackRoutes.js) so the
// user gets the same feedback before submitting instead of after — the
// server re-validates everything regardless, this is purely for UX.
const feedbackSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Keep it under 100 characters'),
  email: z.string().trim().max(254).email('Enter a valid email address').optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Say a little more (at least 5 characters)').max(5000, 'Keep it under 5,000 characters'),
  // Honeypot — always empty for a real visitor, see the field itself below.
  website: z.string().optional(),
})

type FeedbackValues = z.infer<typeof feedbackSchema>

export function FeedbackForm() {
  const submitFeedback = useSubmitFeedback()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { fullName: '', email: '', message: '', website: '' },
  })

  const onSubmit = (values: FeedbackValues) => {
    submitFeedback.mutate(
      { fullName: values.fullName, email: values.email || undefined, message: values.message, website: values.website },
      {
        onSuccess: () => {
          toast.success("Thanks! Your message is on its way.")
          reset()
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : 'Could not send your message. Try again shortly.')
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Honeypot: visually hidden (not display:none — some bots skip that), never focusable or announced to real users. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Full name*</Label>
        <Input id="fullName" placeholder="" {...register('fullName')} />
        {errors.fullName && <p className="text-destructive text-xs">{errors.fullName.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="" {...register('email')} />
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">Message*</Label>
        <Textarea id="message" placeholder="Bug reports, feature ideas, or just a hello!" rows={5} {...register('message')} />
        {errors.message && <p className="text-destructive text-xs">{errors.message.message}</p>}
      </div>

      <Button type="submit" disabled={submitFeedback.isPending} className="self-start">
        {submitFeedback.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send message
      </Button>
    </form>
  )
}
