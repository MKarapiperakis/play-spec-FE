import { ExternalLink, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function About() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>
            {/* TODO: replace with your own bio */}
            PlaySpec was built to turn writing API test scaffolding from a chore into a single
            upload.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          {/* TODO: point these at your real profiles */}
          <Button variant="outline" asChild>
            <a href="https://github.com/MKarapiperakis" target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              GitHub
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="mailto:mkarapiperakis21@gmail.com">
              <Mail className="size-4" />
              Email
            </a>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
