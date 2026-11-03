import { Container } from '@/components/layout/container'
import { SITE_NAME } from '@/lib/site'

export function Footer() {
  return (
    <footer className="border-t">
      <Container className="py-6">
        <p className="text-muted-foreground text-center text-sm">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </Container>
    </footer>
  )
}
