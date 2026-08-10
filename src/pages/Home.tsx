import Autoplay from 'embla-carousel-autoplay'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ImageIcon, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

interface Slide {
  title: string
  description: string
  /** Swap this in for a real screenshot/illustration once available. */
  imageSrc?: string
}

const SLIDES: Slide[] = [
  {
    title: 'Upload your spec',
    description: 'Drop in an OpenAPI or Swagger file — YAML or JSON, any version.',
  },
  {
    title: 'Validate instantly',
    description: 'Catch schema errors and readiness issues before you generate anything.',
  },
  {
    title: 'Generate a test project',
    description: 'Get a ready-to-run Playwright project, one test per operation in your spec.',
  },
  {
    title: 'Download & run',
    description: 'Unzip, npm install, and your API already has a working test suite.',
  },
]

function SlidePlaceholder({ imageSrc, title }: { imageSrc?: string; title: string }) {
  if (imageSrc) {
    return <img src={imageSrc} alt={title} className="aspect-video w-full rounded-lg object-cover" />
  }
  // Deliberately compact (not full aspect-video width) — an empty
  // placeholder that size reads as a big blank void rather than a slide.
  // Swap to the branch above by passing `imageSrc` once a real image exists.
  return (
    <div className="text-muted-foreground bg-muted mx-auto flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
      <ImageIcon className="size-6" />
      <span className="text-center text-xs">Image coming soon</span>
    </div>
  )
}

export function Home() {
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: true }))

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-16">
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Playwright meets OpenAPI spec
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          PlaySpec turns any OpenAPI/Swagger document into a ready-to-run Playwright test project.
          Upload your spec, validate it, and download a full test suite — no test code to write by
          hand.
        </p>
        <Button size="lg" asChild>
          <Link to="/generate">
            <Rocket className="size-4" />
            Get started
          </Link>
        </Button>
      </section>

      <section>
        <Carousel
          className="mx-auto w-full max-w-3xl"
          opts={{ loop: true }}
          plugins={[autoplay.current]}
        >
          <CarouselContent>
            {SLIDES.map((slide) => (
              <CarouselItem key={slide.title}>
                <Card>
                  <CardContent className="flex flex-col gap-4">
                    <SlidePlaceholder imageSrc={slide.imageSrc} title={slide.title} />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">{slide.title}</h3>
                      <p className="text-muted-foreground text-sm">{slide.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      </section>
    </main>
  )
}
