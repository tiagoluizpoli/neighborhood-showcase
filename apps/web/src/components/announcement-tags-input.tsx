import { Badge } from '@neighborhood-showcase/ui/components/badge';
import { Plus, X } from 'lucide-react';
import { type KeyboardEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AnnouncementTagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Known tags (e.g. popular provider tags) used to power autocomplete. */
  suggestions?: string[];
}

const MAX_VISIBLE_SUGGESTIONS = 8;

/** Strip diacritics so "Café" and "cafe" collapse to one chip (mirror server). */
function foldAccents(raw: string): string {
  return raw.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/**
 * Structured token/chip tag input with inline chips and autocomplete. Chips
 * live inside the field; typing filters a suggestion dropdown sourced from
 * known tags, and the author can always commit a brand-new free tag. Client
 * cleanup stays conservative — trim, lowercase, accent-fold dedupe — matching
 * the canonical server normalization (no singular/plural or synonym
 * rewriting). The server remains authoritative.
 */
export function AnnouncementTagsInput({
  value,
  onChange,
  suggestions = [],
}: AnnouncementTagsInputProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedKeys = useMemo(() => new Set(value.map(foldAccents)), [value]);

  const trimmedDraft = draft.trim().toLowerCase();
  const draftKey = foldAccents(trimmedDraft);

  const filteredSuggestions = useMemo(() => {
    if (suggestions.length === 0) {
      return [];
    }
    return suggestions
      .filter((suggestion) => {
        const key = foldAccents(suggestion.toLowerCase());
        if (selectedKeys.has(key)) {
          return false;
        }
        return draftKey.length === 0 || key.includes(draftKey);
      })
      .slice(0, MAX_VISIBLE_SUGGESTIONS);
  }, [suggestions, selectedKeys, draftKey]);

  // Offer a "create" row whenever the draft is novel (not already a chip and
  // not an exact suggestion match), so free tagging stays first-class.
  const canCreateDraft =
    trimmedDraft.length > 0 &&
    !selectedKeys.has(draftKey) &&
    !filteredSuggestions.some((s) => foldAccents(s.toLowerCase()) === draftKey);

  const options = canCreateDraft
    ? [...filteredSuggestions, { create: true as const }]
    : filteredSuggestions;
  const isOpen = open && options.length > 0;

  const addTag = (raw: string) => {
    const normalized = raw.trim().toLowerCase();
    if (normalized.length === 0 || selectedKeys.has(foldAccents(normalized))) {
      setDraft('');
      setActiveIndex(0);
      return;
    }
    onChange([...value, normalized]);
    setDraft('');
    setActiveIndex(0);
  };

  const removeTag = (target: string) => {
    onChange(value.filter((tag) => tag !== target));
  };

  const commitActive = () => {
    if (!isOpen) {
      addTag(draft);
      return;
    }
    const choice = options[activeIndex];
    if (choice && typeof choice === 'string') {
      addTag(choice);
      return;
    }
    addTag(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitActive();
      return;
    }
    if (event.key === 'ArrowDown' && isOpen) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % options.length);
      return;
    }
    if (event.key === 'ArrowUp' && isOpen) {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + options.length) % options.length);
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'Backspace' && draft.length === 0 && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <div
          className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50"
          data-testid="tags-field"
        >
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 pr-1"
              data-testid={`tag-chip-${tag}`}
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-sm text-muted-foreground hover:text-foreground"
                aria-label={t('announcement_authoring.tags.remove', { tag })}
                data-testid={`tag-remove-${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <input
            type="text"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => setOpen(true)}
            // Close the dropdown on blur but do NOT auto-commit the draft —
            // a tag is only added on an explicit Enter/comma/suggestion pick,
            // so a half-typed value never silently becomes a chip.
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={handleKeyDown}
            placeholder={
              value.length === 0
                ? t('announcement_authoring.tags.placeholder')
                : ''
            }
            className="min-w-[8rem] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            data-testid="tags-input"
          />
        </div>

        {isOpen && (
          <div
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            data-testid="tag-suggestions"
          >
            {options.map((option, index) => {
              const isCreate = typeof option !== 'string';
              const label = isCreate ? trimmedDraft : option;
              return (
                <button
                  key={isCreate ? '__create__' : option}
                  type="button"
                  // onMouseDown (not onClick) so the field's onBlur does not
                  // close the list before the selection registers.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    addTag(label);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm ${
                    index === activeIndex
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground'
                  }`}
                  data-testid={
                    isCreate
                      ? 'tag-suggestion-create'
                      : `tag-suggestion-${option}`
                  }
                >
                  {isCreate ? (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      {t('announcement_authoring.tags.create', {
                        tag: trimmedDraft,
                      })}
                    </>
                  ) : (
                    <span>#{option}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {t('announcement_authoring.tags.hint')}
      </p>
    </div>
  );
}
