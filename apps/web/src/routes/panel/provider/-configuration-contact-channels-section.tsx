import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { RouterOutputs } from '@/utils/trpc';
import { trpc } from '@/utils/trpc';

type ProviderProfileData = RouterOutputs['providerProfile']['get'];

interface ContactChannelsSectionProps {
  profile: ProviderProfileData;
}

export function ContactChannelsSection({
  profile,
}: ContactChannelsSectionProps) {
  const { t } = useTranslation('configuracoes');

  const [whatsapp, setWhatsapp] = useState(profile.socialLinks?.whatsapp ?? '');
  const [phone, setPhone] = useState(profile.socialLinks?.phone ?? '');
  const [email, setEmail] = useState(profile.socialLinks?.email ?? '');
  const [instagram, setInstagram] = useState(
    profile.socialLinks?.instagram ?? '',
  );
  const [tiktok, setTiktok] = useState(profile.socialLinks?.tiktok ?? '');
  const [facebook, setFacebook] = useState(profile.socialLinks?.facebook ?? '');
  const [website, setWebsite] = useState(profile.socialLinks?.website ?? '');

  const updateMutation = useMutation(
    trpc.providerProfile.update.mutationOptions({
      onSuccess: () => {
        toast.success(t('toast_success_contact_channels'));
      },
      onError: (err) => {
        toast.error(err.message || t('toast_error_generic'));
      },
    }),
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      socialLinks: {
        whatsapp: whatsapp.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        instagram: instagram.trim() || undefined,
        tiktok: tiktok.trim() || undefined,
        facebook: facebook.trim() || undefined,
        website: website.trim() || undefined,
      },
    });
  };

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle>{t('section_contact_channels')}</CardTitle>
        <CardDescription>{t('section_contact_channels_help')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">{t('field_whatsapp')}</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={t('field_whatsapp_placeholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('field_phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('field_phone_placeholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('field_email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('field_email_placeholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">{t('field_instagram')}</Label>
              <Input
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder={t('field_instagram_placeholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">{t('field_tiktok')}</Label>
              <Input
                id="tiktok"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder={t('field_tiktok_placeholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">{t('field_facebook')}</Label>
              <Input
                id="facebook"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder={t('field_facebook_placeholder')}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">{t('field_website')}</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t('field_website_placeholder')}
              className="h-10"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t('button_save')}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
