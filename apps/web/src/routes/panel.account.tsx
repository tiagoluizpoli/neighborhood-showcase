import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  type AccountLanguage,
  AccountPreferencesSection,
  AccountProfileSection,
  type AccountTheme,
} from '@/components/account-page/profile-preferences';
import { AccountProviderAccessSection } from '@/components/account-page/provider-access';
import {
  AccountDangerZoneSection,
  AccountSecuritySection,
  DeleteDialog,
} from '@/components/account-page/security-danger';
import { useTheme } from '@/components/theme-provider';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/account')({
  component: AccountPage,
});

function AccountPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { data: profile, isLoading: profileLoading } = useQuery(
    trpc.user.getProfile.queryOptions(undefined, { enabled: !!session }),
  );
  const { data: accessProfile, isLoading: accessProfileLoading } = useQuery(
    trpc.user.getAccessProfile.queryOptions(undefined, { enabled: !!session }),
  );
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState('');
  const [language, setLanguage] = useState<AccountLanguage>('pt-BR');
  const [theme, setThemePreference] = useState<AccountTheme>('system');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setPhone(profile.phone ?? '');
    setImage(profile.image ?? '');
    setLanguage(profile.language === 'en' ? 'en' : 'pt-BR');
    setThemePreference(
      profile.theme === 'light' || profile.theme === 'dark'
        ? profile.theme
        : 'system',
    );
  }, [profile]);

  const invalidateProfile = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.user.getProfile.queryKey(),
    });
  };

  const updateProfileMutation = useMutation(
    trpc.user.update.mutationOptions({
      onError: (error) => {
        toast.error(error.message || t('account.toast_error'));
      },
      onSuccess: () => {
        toast.success(t('account.toast_success'));
        void authClient.getSession();
        invalidateProfile();
      },
    }),
  );

  const updatePreferencesMutation = useMutation(
    trpc.user.update.mutationOptions({
      onError: (error) => {
        toast.error(error.message || t('account.toast_error'));
      },
      onSuccess: () => {
        toast.success(t('account.toast_success'));
        void authClient.getSession();
        invalidateProfile();
      },
    }),
  );

  const deleteAccountMutation = useMutation(
    trpc.user.deleteAccount.mutationOptions({
      onError: (error) => {
        toast.error(error.message || t('account.toast_delete_error'));
      },
      onSuccess: async () => {
        toast.success(t('account.toast_delete_success'));
        await authClient.signOut();
        navigate({ to: '/' });
      },
    }),
  );

  const handleProfileSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim().length < 3) {
      toast.error(t('account.validation_name_min'));
      return;
    }

    updateProfileMutation.mutate({
      image: image || undefined,
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
  };

  const handlePreferencesSave = () => {
    setTheme(theme);
    void i18n.changeLanguage(language === 'pt-BR' ? 'pt' : 'en');
    updatePreferencesMutation.mutate({ language, theme });
  };

  if (sessionLoading || profileLoading || accessProfileLoading) {
    return (
      <AccountPageState
        icon={<Loader2 className="h-6 w-6 animate-spin text-primary" />}
        message={t('account.loading')}
      />
    );
  }

  if (!session) {
    return (
      <AccountPageState
        icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
        message={t('account.unauthenticated')}
      />
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          {t('account.page_title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('account.page_subtitle')}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <AccountProfileSection
            email={session.user.email}
            emailVerified={profile?.emailVerified ?? false}
            image={image}
            isPending={updateProfileMutation.isPending}
            name={name}
            onImageChange={setImage}
            onNameChange={setName}
            onPhoneChange={setPhone}
            onSubmit={handleProfileSave}
            phone={phone}
          />
          <AccountPreferencesSection
            isPending={updatePreferencesMutation.isPending}
            language={language}
            onLanguageChange={setLanguage}
            onSave={handlePreferencesSave}
            onThemeChange={setThemePreference}
            theme={theme}
          />
          <AccountProviderAccessSection
            isLoading={accessProfileLoading}
            onOpenActivation={() =>
              navigate({ to: '/panel/dashboard/condo-setup' })
            }
            onOpenProviderSettings={() =>
              navigate({ to: '/panel/provider/configuration' })
            }
            providerEnabled={accessProfile?.providerEnabled ?? false}
          />
        </div>

        <div className="space-y-6">
          <AccountSecuritySection />
          <AccountDangerZoneSection
            onOpenDelete={() => setIsDeleteOpen(true)}
          />
        </div>
      </div>

      <DeleteDialog
        body={t('account.modal_delete_body')}
        cancelLabel={t('account.modal_cancel')}
        confirmLabel={t('account.modal_confirm')}
        isOpen={isDeleteOpen}
        isPending={deleteAccountMutation.isPending}
        note={t('account.modal_delete_note')}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteAccountMutation.mutate()}
        title={t('account.modal_delete_title')}
      />
    </div>
  );
}

interface AccountPageStateProps {
  icon: ReactNode;
  message: string;
}

function AccountPageState({ icon, message }: AccountPageStateProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-3">
      {icon}
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
