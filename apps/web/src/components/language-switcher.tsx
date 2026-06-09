import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@neighborhood-showcase/ui/components/popover';
import { useTranslation } from 'react-i18next';

const FLAGS: Record<string, string> = {
  pt: '🇧🇷',
  en: '🇺🇸',
};

const LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('sidebar');

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex h-9 items-center justify-center rounded-md px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={t('language_switcher.language')}
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
              onClick={() => i18n.changeLanguage(lang.code)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span>{FLAGS[lang.code]}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
