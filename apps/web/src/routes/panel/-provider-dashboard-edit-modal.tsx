import { Button } from '@neighborhood-showcase/ui/components/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ProviderDashboardEditFormFields } from './-provider-dashboard-edit-form-fields';
import type { ProviderDashboardAnnouncementItem } from './-provider-dashboard-types';
import { trpc } from '@/utils/trpc';

interface ProviderDashboardEditModalProps {
  ad: ProviderDashboardAnnouncementItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProviderDashboardEditModal({
  ad,
  onClose,
  onSuccess,
}: ProviderDashboardEditModalProps) {
  const { data: backendCategories } = useQuery(
    trpc.announcement.listCategories.queryOptions(),
  );

  const assignmentsQuery = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(),
  );
  const assignments = assignmentsQuery.data;

  const selectedAssignment = assignments?.find(
    (assignment) => assignment.id === ad.providerAssignmentId,
  );
  const canVerify =
    selectedAssignment?.type === 'RESIDENT' &&
    selectedAssignment?.status === 'APPROVED';

  const [title, setTitle] = useState(ad.title);
  const [subtitle, setSubtitle] = useState(ad.subtitle || '');
  const [description, setDescription] = useState(ad.description);
  const [price, setPrice] = useState<number | ''>(
    ad.priceCents ? ad.priceCents / 100 : '',
  );
  const [categoryId, setCategoryId] = useState(ad.categoryId);
  const [whatsapp, setWhatsapp] = useState(ad.contactLinks.whatsapp || '');
  const [instagram, setInstagram] = useState(ad.contactLinks.instagram || '');
  const [website, setWebsite] = useState(ad.contactLinks.website || '');
  const [showVerifiedBadge, setShowVerifiedBadge] = useState(
    ad.showVerifiedBadge,
  );
  const [imageUrl, setImageUrl] = useState(ad.imageUrl);
  const [isUploading, setIsUploading] = useState(false);

  const updateMutation = useMutation(
    trpc.announcement.update.mutationOptions({
      onSuccess: () => {
        toast.success('Anúncio atualizado com sucesso!');
        onSuccess();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao atualizar anúncio.');
      },
    }),
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      toast.error('O título do anúncio deve ter pelo menos 3 caracteres.');
      return;
    }

    if (description.trim().length < 10) {
      toast.error('A descrição do anúncio deve ter pelo menos 10 caracteres.');
      return;
    }

    if (!whatsapp.trim() && !instagram.trim() && !website.trim()) {
      toast.error(
        'Forneça pelo menos um meio de contato (WhatsApp, Instagram ou Site).',
      );
      return;
    }

    updateMutation.mutate({
      id: ad.id,
      title,
      subtitle: subtitle || null,
      description,
      priceCents: price ? Math.round(Number(price) * 100) : null,
      imageUrl,
      categoryId,
      tags: ad.tags,
      contactLinks: {
        whatsapp: whatsapp || undefined,
        instagram: instagram || undefined,
        website: website || undefined,
      },
      showVerifiedBadge: showVerifiedBadge && canVerify,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-border border-b p-5">
          <div>
            <h3 className="font-bold text-foreground text-xl">
              Editar Anúncio
            </h3>
            <p className="mt-0.5 text-muted-foreground text-xs">
              As alterações serão salvas e enviadas para revisão.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="flex-1 space-y-5 overflow-y-auto p-6"
        >
          <ProviderDashboardEditFormFields
            backendCategories={backendCategories}
            canVerify={canVerify}
            categoryId={categoryId}
            description={description}
            imageUrl={imageUrl}
            instagram={instagram}
            isUploading={isUploading}
            price={price}
            showVerifiedBadge={showVerifiedBadge}
            subtitle={subtitle}
            title={title}
            website={website}
            whatsapp={whatsapp}
            onCategoryIdChange={setCategoryId}
            onDescriptionChange={setDescription}
            onImageUrlChange={setImageUrl}
            onInstagramChange={setInstagram}
            onPriceChange={setPrice}
            onShowVerifiedBadgeChange={setShowVerifiedBadge}
            onSubtitleChange={setSubtitle}
            onTitleChange={setTitle}
            onUploadingChange={setIsUploading}
            onWebsiteChange={setWebsite}
            onWhatsappChange={setWhatsapp}
          />
        </form>

        <div className="flex justify-end gap-3 border-border border-t p-5">
          <Button type="button" onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending || isUploading}
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
