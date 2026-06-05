import { Checkbox } from '@neighborhood-showcase/ui/components/checkbox';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Textarea } from '@neighborhood-showcase/ui/components/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@neighborhood-showcase/ui/components/tooltip';
import { ProviderDashboardEditImageField } from './-provider-dashboard-edit-image-field';

interface ProviderDashboardEditFormFieldsProps {
  backendCategories:
    | Array<{
        id: string;
        name: string;
      }>
    | undefined;
  canVerify: boolean;
  categoryId: string;
  description: string;
  imageUrl: string;
  instagram: string;
  isUploading: boolean;
  price: number | '';
  showVerifiedBadge: boolean;
  subtitle: string;
  title: string;
  website: string;
  whatsapp: string;
  onCategoryIdChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onImageUrlChange: (imageUrl: string) => void;
  onInstagramChange: (value: string) => void;
  onPriceChange: (value: number | '') => void;
  onShowVerifiedBadgeChange: (value: boolean) => void;
  onSubtitleChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onUploadingChange: (isUploading: boolean) => void;
  onWebsiteChange: (value: string) => void;
  onWhatsappChange: (value: string) => void;
}

export function ProviderDashboardEditFormFields({
  backendCategories,
  canVerify,
  categoryId,
  description,
  imageUrl,
  instagram,
  onCategoryIdChange,
  onDescriptionChange,
  onImageUrlChange,
  onInstagramChange,
  onPriceChange,
  onShowVerifiedBadgeChange,
  onSubtitleChange,
  onTitleChange,
  onUploadingChange,
  onWebsiteChange,
  onWhatsappChange,
  price,
  showVerifiedBadge,
  subtitle,
  title,
  website,
  whatsapp,
}: ProviderDashboardEditFormFieldsProps) {
  return (
    <>
      <ProviderDashboardEditImageField
        imageUrl={imageUrl}
        onImageUrlChange={onImageUrlChange}
        onUploadingChange={onUploadingChange}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="block font-medium text-foreground text-sm">
            Título *
          </span>
          <Input
            type="text"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Ex: Marmitas Saudáveis"
          />
        </div>
        <div className="space-y-1.5">
          <span className="block font-medium text-foreground text-sm">
            Subtítulo (Opcional)
          </span>
          <Input
            type="text"
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="Ex: Feitas com amor e ingredientes locais"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="block font-medium text-foreground text-sm">
            Categoria *
          </span>
          <select
            required
            value={categoryId}
            onChange={(e) => onCategoryIdChange(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {backendCategories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <span className="block font-medium text-foreground text-sm">
            Preço (R$, opcional)
          </span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) =>
              onPriceChange(e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder="Ex: 25.00 (deixe em branco para combinar)"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block font-medium text-foreground text-sm">
          Descrição Detalhada *
        </span>
        <Textarea
          required
          rows={4}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Descreva o que você oferece, horários, prazos..."
          className="resize-none"
        />
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-foreground text-sm">
          Meios de Contato (Forneça ao menos um)
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <span className="block text-muted-foreground text-xs">
              WhatsApp (DDD + Número)
            </span>
            <Input
              type="text"
              value={whatsapp}
              onChange={(e) => onWhatsappChange(e.target.value)}
              placeholder="Ex: 47999999999"
            />
          </div>
          <div className="space-y-1.5">
            <span className="block text-muted-foreground text-xs">
              Instagram (Username)
            </span>
            <Input
              type="text"
              value={instagram}
              onChange={(e) => onInstagramChange(e.target.value)}
              placeholder="Ex: @seuusername"
            />
          </div>
          <div className="space-y-1.5">
            <span className="block text-muted-foreground text-xs">
              Site / Portfólio (URL)
            </span>
            <Input
              type="url"
              value={website}
              onChange={(e) => onWebsiteChange(e.target.value)}
              placeholder="Ex: https://meusite.com"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
          <div className="space-y-0.5">
            <span className="block font-semibold text-foreground text-sm">
              Exibir Selo de Morador Verificado
            </span>
            <span className="text-muted-foreground text-xs">
              Exiba que você é um morador aprovado neste condomínio.
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-block">
                    <Checkbox
                      disabled={!canVerify}
                      checked={showVerifiedBadge && canVerify}
                      onCheckedChange={(checked) =>
                        onShowVerifiedBadgeChange(checked === true)
                      }
                    />
                  </span>
                }
              />
              {!canVerify && (
                <TooltipContent
                  side="top"
                  align="center"
                  className="max-w-xs p-2 text-center"
                >
                  O selo de morador verificado está disponível apenas para
                  moradores de condomínio aprovados. Acesse a página "Minha
                  Conta" para verificar sua residência.
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        {!canVerify && (
          <p className="px-1 text-[10px] text-warning">
            Indisponível: O selo de morador verificado está disponível apenas
            para moradores de condomínio aprovados. Acesse a página "Minha
            Conta" para verificar sua residência.
          </p>
        )}
      </div>
    </>
  );
}
