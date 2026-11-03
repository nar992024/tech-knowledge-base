import { Home } from 'lucide-react'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <Container size="sm" className="py-20 text-center">
      <p className="text-muted-foreground text-sm font-bold">404</p>
      <h1 className="mt-2 text-3xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="text-muted-foreground mt-4">
        주소가 바뀌었거나 아직 공개되지 않은 코스일 수 있습니다.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">
          <Home aria-hidden="true" />
          코스 목록으로 돌아가기
        </Link>
      </Button>
    </Container>
  )
}
