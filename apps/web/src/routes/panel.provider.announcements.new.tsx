import { createFileRoute } from '@tanstack/react-router';
import { AnnouncementForm } from './panel/provider/-announcement-form';

export const Route = createFileRoute('/panel/provider/announcements/new')({
  component: NewAnnouncementComponent,
});

function NewAnnouncementComponent() {
  return <AnnouncementForm mode="create" />;
}
