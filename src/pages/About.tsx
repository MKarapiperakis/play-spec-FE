import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FeedbackForm } from '@/components/FeedbackForm'

export function About() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>About PlaySpec</CardTitle>
          <CardDescription className="text-foreground text-justify text-base leading-relaxed">
            Writing API test scaffolding by hand is repetitive: the same request-building,
            auth-wiring, and response-shape boilerplate for every single endpoint. PlaySpec skips
            that step. Upload an OpenAPI/Swagger spec, and it comes back as a ready-to-run
            Playwright project, with one test per operation, requests built straight from the
            spec's own schemas and examples, and auth already wired up for the security schemes it
            declares.
            <br />
            <br />
            Before generating anything, PlaySpec can also validate the spec itself, catching
            undeclared path parameters, dangling security references, missing response examples,
            and a handful of other issues that would otherwise turn into confusing failures in the
            generated tests. The goal throughout is the same: turn an existing spec into a working
            test suite in minutes, not an afternoon.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
          <CardDescription>
            Found a bug, have a feature idea, or just want to say hi? Send a message below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackForm />
        </CardContent>
      </Card>
    </main>
  )
}
