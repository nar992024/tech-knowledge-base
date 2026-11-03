'use client'

import { RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Container size="sm" className="py-20 text-center">
      <h1 className="text-3xl font-bold">자료를 불러오지 못했습니다</h1>
      <p className="text-muted-foreground mt-4">
        일시적인 문제일 수 있습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <Button onClick={reset} className="mt-8">
        <RefreshCw aria-hidden="true" />
        다시 시도
      </Button>
    </Container>
  )
}
