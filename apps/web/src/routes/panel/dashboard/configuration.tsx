import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/panel/dashboard/configuration')({
  component: ConfigurationPlaceholder,
});

function ConfigurationPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="text-foreground">
      <h1 className="font-bold text-2xl">{t('sidebar.item.configuracoes')}</h1>
    </div>
  );
}
