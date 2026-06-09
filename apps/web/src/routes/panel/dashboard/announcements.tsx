import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/dashboard/announcements')({
  component: AnnouncementsPlaceholder,
});

function AnnouncementsPlaceholder() {
  return (
    <div className="text-foreground">
      <h1 className="font-bold text-2xl">Meus Anúncios</h1>
    </div>
  );
}
