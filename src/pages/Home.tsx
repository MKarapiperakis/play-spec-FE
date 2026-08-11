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
    title: 'From upload to a ready test suite',
    description: 'Upload a spec, validate it, generate — the whole flow in a few clicks.',
    imageSrc: '/workflow.PNG',
  },
  {
    title: 'Know exactly what needs fixing',
    description: 'A category-by-category breakdown — schema, security, responses, params — before you generate anything.',
    imageSrc: '/overview.PNG',
  },
  {
    title: 'A real Playwright project, ready to run',
    description: 'Tests, config, env template, README — download the zip and go.',
    imageSrc: '/playwright.PNG',
  },
]

function SlidePlaceholder({ imageSrc, title }: { imageSrc?: string; title: string }) {
  if (imageSrc) {
    // object-contain, not cover — these are screenshots/diagrams with real
    // text in them, so cropping to fill would cut content off; letterboxing
    // is the safer trade-off across their differing aspect ratios. The frame
    // itself is ~4:3 (not 16:9) since that's what all three images actually
    // are — 16:9 was leaving most of the frame as empty letterbox space.
    return (
      <div className="bg-muted flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg">
        <img src={imageSrc} alt={title} className="max-h-full max-w-full object-contain" />
      </div>
    )
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
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Playwright meets OpenAPI spec
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          PlaySpec turns any OpenAPI/Swagger document into a ready-to-run Playwright test project.
          Upload your spec, validate it, and download a full test suite — no test code to write by
          hand.
        </p>
        <Button size="sm" asChild>
          <Link to="/generate">
            <Rocket className="size-4" />
            Get started
          </Link>
        </Button>
      </section>

      <section>
        <Carousel
          className="mx-auto w-full max-w-4xl"
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
