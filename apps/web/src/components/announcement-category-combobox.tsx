import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@neighborhood-showcase/ui/components/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@neighborhood-showcase/ui/components/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface AnnouncementCategoryOption {
  id: string;
  name: string;
}

interface AnnouncementCategoryComboboxProps {
  categories: AnnouncementCategoryOption[] | undefined;
  value: string;
  onChange: (categoryId: string) => void;
  isLoading?: boolean;
}

/**
 * Async-style searchable single-category combobox. Each announcement keeps
 * exactly one structural category (PRD-v10), so this is single-select by
 * design — the search scales the picker past the old fixed button grid without
 * opening a multi-select taxonomy. Filtering is delegated to cmdk against each
 * option's name keyword.
 */
export function AnnouncementCategoryCombobox({
  categories,
  value,
  onChange,
  isLoading = false,
}: AnnouncementCategoryComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const selected = categories?.find((category) => category.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            aria-expanded={open}
            className="w-full justify-between font-normal"
            data-testid="category-combobox-trigger"
          >
            <span className={selected ? '' : 'text-muted-foreground'}>
              {selected
                ? selected.name
                : t('announcement_authoring.category.placeholder')}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) p-0">
        <Command>
          <CommandInput
            placeholder={t(
              'announcement_authoring.category.search_placeholder',
            )}
            data-testid="category-combobox-input"
          />
          <CommandList>
            <CommandEmpty>
              {t('announcement_authoring.category.empty')}
            </CommandEmpty>
            <CommandGroup>
              {categories?.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.id}
                  keywords={[category.name]}
                  onSelect={() => {
                    onChange(category.id);
                    setOpen(false);
                  }}
                  data-testid={`category-option-${category.id}`}
                >
                  <span className="flex-1">{category.name}</span>
                  {category.id === value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
