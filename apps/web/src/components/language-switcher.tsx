import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@neighborhood-showcase/ui/components/popover';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/utils/trpc';

const FLAGS: Record<string, string> = {
  pt: '🇧🇷',
  en: '🇺🇸',
};

const LANGUAGES = [{ code: 'pt' }, { code: 'en' }] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const updateMutation = useMutation(trpc.user.update.mutationOptions());

  const handleLanguageChange = (code: string) => {
    void i18n.changeLanguage(code);
    void updateMutation
      .mutateAsync({ language: code === 'pt' ? 'pt-BR' : 'en' })
      .catch(() => {});
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex h-9 items-center justify-center rounded-md px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={t('sidebar.language_switcher.language')}
          >
            <span className="text-lg">{FLAGS[i18n.language] ?? '🌐'}</span>
          </button>
        }
      />
      <PopoverContent align="end" className="w-40 border bg-card p-1">
        <div className="flex flex-col">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span>{FLAGS[lang.code]}</span>
              <span>
                {t(
                  `sidebar.language_switcher.${lang.code === 'pt' ? 'portuguese' : 'english'}`,
                )}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
