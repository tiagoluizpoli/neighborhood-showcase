import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/panel/dashboard/announcements')({
  component: AnnouncementsPlaceholder,
});

function AnnouncementsPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="text-foreground">
      <h1 className="font-bold text-2xl">{t('sidebar.item.meus_anuncios')}</h1>
    </div>
  );
}
