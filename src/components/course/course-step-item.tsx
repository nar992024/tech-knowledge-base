import { ExternalLinkButton } from '@/components/link/external-link-button'
import { LinkBadges } from '@/components/link/link-badges'
import type { CourseStep } from '@/types/content'

interface CourseStepItemProps {
  step: CourseStep
  position: number
}

export function CourseStepItem({ step, position }: CourseStepItemProps) {
  return (
    <li className="bg-card flex gap-4 rounded-lg border p-5">
      <span
        aria-hidden="true"
        className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full font-bold"
      >
        {position}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold break-words">
          <span className="sr-only">{position}단계: </span>
          {step.title}
        </h3>
        <p className="mt-1">{step.purpose}</p>
        <LinkBadges link={step} level={step.level} className="mt-3" />
        <ExternalLinkButton
          url={step.url}
          title={step.title}
          className="mt-4"
        />
      </div>
    </li>
  )
}
