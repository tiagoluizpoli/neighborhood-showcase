import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { Textarea } from '@neighborhood-showcase/ui/components/textarea';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ImageUploadField } from '@/components/image-upload-field';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/dashboard/configuration')({
  component: ConfigurationPageComponent,
});

const MAX_DESCRIPTION_CHARS = 500;

function ConfigurationPageComponent() {
  const { t } = useTranslation('configuracoes');
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  // Fetch provider profile
  const { data: profile, isLoading } = useQuery(
    trpc.providerProfile.get.queryOptions(),
  );

  // Fetch user's assignments to check provider capability
  const { data: assignments, isLoading: assignmentsLoading } = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(),
  );

  const hasEnabledProviderAssignment = assignments?.some(
    (a) => a.type === 'RESIDENT' && a.status === 'APPROVED',
  );

  // Redirect if no enabled provider assignment
  useEffect(() => {
    if (!assignmentsLoading && assignments && !hasEnabledProviderAssignment) {
      toast.error(t('toast_error_no_provider_account'));
      navigate({ to: '/panel/account' });
    }
  }, [
    assignmentsLoading,
    assignments,
    hasEnabledProviderAssignment,
    navigate,
    t,
  ]);

  // Section 1: Public Profile
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [publicDescription, setPublicDescription] = useState('');

  // Section 2: Contact Channels
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');
  const [website, setWebsite] = useState('');

  // Section 3: Public Visibility
  const [isProviderVisible, setIsProviderVisible] = useState(false);
  const [visibilityPending, setVisibilityPending] = useState(false);

  // Sync state with profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
      setCompanyName(profile.companyName ?? '');
      setTradeName(profile.tradeName ?? '');
      setAvatarUrl(profile.avatarUrl ?? '');
      setLogoUrl(profile.logoUrl ?? '');
      setBannerUrl(profile.bannerUrl ?? '');
      setPublicDescription(profile.publicDescription ?? '');
      setWhatsapp(profile.socialLinks?.whatsapp ?? '');
      setPhone(profile.socialLinks?.phone ?? '');
      setEmail(profile.socialLinks?.email ?? '');
      setInstagram(profile.socialLinks?.instagram ?? '');
      setTiktok(profile.socialLinks?.tiktok ?? '');
      setFacebook(profile.socialLinks?.facebook ?? '');
      setWebsite(profile.socialLinks?.website ?? '');
      setIsProviderVisible(profile.isProviderVisible ?? false);
    }
  }, [profile]);

  // Mutations
  const updatePublicProfileMutation = useMutation(
    trpc.providerProfile.update.mutationOptions({
      onSuccess: () => {
        toast.success(t('toast_success_public_profile'));
      },
      onError: (err) => {
        toast.error(err.message || t('toast_error_generic'));
      },
    }),
  );

  const updateContactChannelsMutation = useMutation(
    trpc.providerProfile.update.mutationOptions({
      onSuccess: () => {
        toast.success(t('toast_success_contact_channels'));
      },
      onError: (err) => {
        toast.error(err.message || t('toast_error_generic'));
      },
    }),
  );

  const updateVisibilityMutation = useMutation(
    trpc.providerProfile.update.mutationOptions({
      onSuccess: () => {
        toast.success(t('toast_success_visibility'));
        setVisibilityPending(false);
      },
      onError: (err) => {
        toast.error(err.message || t('toast_error_generic'));
        setVisibilityPending(false);
      },
    }),
  );

  // Auto-save visibility with 300ms debounce
  const visibilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleVisibilityToggle = () => {
    const newValue = !isProviderVisible;
    setIsProviderVisible(newValue);
    setVisibilityPending(true);

    if (visibilityDebounceRef.current) {
      clearTimeout(visibilityDebounceRef.current);
    }

    visibilityDebounceRef.current = setTimeout(() => {
      updateVisibilityMutation.mutate({ isProviderVisible: newValue });
    }, 300);
  };

  const handlePublicProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePublicProfileMutation.mutate({
      displayName: displayName.trim() || undefined,
      companyName: companyName.trim() || undefined,
      tradeName: tradeName.trim() || undefined,
      avatarUrl: avatarUrl || null,
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      publicDescription: publicDescription.trim() || null,
    });
  };

  const handleContactChannelsSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateContactChannelsMutation.mutate({
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

  if (isLoading || assignmentsLoading || !session) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const remaining = MAX_DESCRIPTION_CHARS - publicDescription.length;

  return (
    <div className="w-full space-y-8 px-6 py-8">
      {/* Page Header */}
      <div>
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          {t('page_title')}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {t('page_subtitle')}
        </p>
      </div>

      {/* Section 1: Public Profile */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle>{t('section_public_profile')}</CardTitle>
          <CardDescription>{t('field_publicProfile_help')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <form onSubmit={handlePublicProfileSave} className="space-y-6">
            {/* Row: Display Name + Company Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('field_displayName')}</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('field_displayName_placeholder')}
                  className="h-10"
                  maxLength={100}
                />
                <p className="text-muted-foreground text-xs">
                  {t('field_displayName_help')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">{t('field_companyName')}</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t('field_companyName_placeholder')}
                  className="h-10"
                  maxLength={100}
                />
                <p className="text-muted-foreground text-xs">
                  {t('field_companyName_help')}
                </p>
              </div>
            </div>

            {/* Row: Trade Name */}
            <div className="space-y-2">
              <Label htmlFor="tradeName">{t('field_tradeName')}</Label>
              <Input
                id="tradeName"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder={t('field_tradeName_placeholder')}
                className="h-10"
                maxLength={100}
              />
              <p className="text-muted-foreground text-xs">
                {t('field_tradeName_help')}
              </p>
            </div>

            {/* Row: Avatar + Logo + Banner */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <ImageUploadField
                label={t('field_avatarUrl')}
                helpText={t('field_avatarUrl_help')}
                value={avatarUrl}
                onChange={setAvatarUrl}
                aspectRatio={1}
                urlInput={false}
                circular={true}
              />
              <ImageUploadField
                label={t('field_logoUrl')}
                helpText={t('field_logoUrl_help')}
                value={logoUrl}
                onChange={setLogoUrl}
                aspectRatio={1}
                urlInput={true}
              />
              <ImageUploadField
                label={t('field_bannerUrl')}
                helpText={t('field_bannerUrl_help')}
                value={bannerUrl}
                onChange={setBannerUrl}
                aspectRatio={16 / 9}
                urlInput={true}
              />
            </div>

            {/* Public Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="publicDescription">
                  {t('field_publicDescription')}
                </Label>
                <span
                  className={`text-xs ${
                    remaining < 50
                      ? remaining < 20
                        ? 'text-destructive'
                        : 'text-warning'
                      : 'text-muted-foreground'
                  }`}
                >
                  {remaining} {t('field_publicDescription_counter_suffix')}
                </span>
              </div>
              <Textarea
                id="publicDescription"
                value={publicDescription}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_DESCRIPTION_CHARS) {
                    setPublicDescription(e.target.value);
                  }
                }}
                placeholder={t('field_publicDescription_placeholder')}
                className="min-h-[100px] resize-y"
                maxLength={MAX_DESCRIPTION_CHARS}
              />
              <p className="text-muted-foreground text-xs">
                {t('field_publicDescription_help')}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updatePublicProfileMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {updatePublicProfileMutation.isPending ? (
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

      {/* Section 2: Contact Channels */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle>{t('section_contact_channels')}</CardTitle>
          <CardDescription>{t('field_contactChannels_help')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <form onSubmit={handleContactChannelsSave} className="space-y-6">
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
                disabled={updateContactChannelsMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {updateContactChannelsMutation.isPending ? (
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

      {/* Section 3: Public Visibility */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle>{t('section_public_visibility')}</CardTitle>
          <CardDescription>{t('field_publicVisibility_help')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between pt-6">
          <div className="space-y-0.5">
            <Label
              htmlFor="isProviderVisible"
              className="font-medium text-base"
            >
              {t('field_isProviderVisible')}
            </Label>
            <p className="text-muted-foreground text-sm">
              {t('field_isProviderVisible_help')}
            </p>
          </div>
          <button
            type="button"
            id="isProviderVisible"
            onClick={handleVisibilityToggle}
            disabled={visibilityPending || updateVisibilityMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-muted-foreground text-sm hover:bg-accent hover:text-foreground disabled:opacity-50"
            title={
              isProviderVisible
                ? t('visibility_toggle_hide')
                : t('visibility_toggle_show')
            }
          >
            {visibilityPending || updateVisibilityMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isProviderVisible ? (
              <Eye className="h-4 w-4 text-success" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            {isProviderVisible
              ? t('visibility_visible')
              : t('visibility_hidden')}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
