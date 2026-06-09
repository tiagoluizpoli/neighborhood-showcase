import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/moderation/announcements')({
  component: ModerationAnnouncementsPlaceholder,
});

function ModerationAnnouncementsPlaceholder() {
  return (
    <div className="text-foreground">
      <h1 className="font-bold text-2xl">Anúncios</h1>
    </div>
  );
}
