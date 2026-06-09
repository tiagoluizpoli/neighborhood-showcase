import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/spectrum')({
  component: SpectrumPageComponent,
});

function SpectrumPageComponent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          Spectrum
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Operator analytics, KPIs, and reporting
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Spectrum analytics dashboard — coming soon
      </div>
    </div>
  );
}
