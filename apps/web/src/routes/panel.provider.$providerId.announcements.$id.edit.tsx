import { createFileRoute } from '@tanstack/react-router';
import { AnnouncementForm } from './panel/provider/-announcement-form';

export const Route = createFileRoute(
  '/panel/provider/$providerId/announcements/$id/edit',
)({
  component: EditAnnouncementComponent,
});

function EditAnnouncementComponent() {
  const { id } = Route.useParams();
  return <AnnouncementForm mode="edit" announcementId={id} />;
}
