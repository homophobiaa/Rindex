import { Container } from '@/components/ui/Container';
import { LinkButton } from '@/components/ui/Button';
import { Aurora } from '@/components/decor/Aurora';
import { GridBackdrop } from '@/components/decor/GridBackdrop';

export default function NotFound() {
  return (
    <section className="relative isolate overflow-hidden py-32 md:py-40">
      <Aurora />
      <GridBackdrop />
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <div className="font-mono text-caption text-ink-tertiary">ERR_RINDEX_404</div>
          <h1 className="mt-3 text-display-md text-gradient md:text-display-lg">
            That page slipped through the firewall.
          </h1>
          <p className="mt-4 text-body-lg text-ink-subtle">
            The URL you requested doesn't exist — but your data is still safe, because it never
            left your browser in the first place.
          </p>
          <div className="mt-8">
            <LinkButton to="/">Back to home</LinkButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
