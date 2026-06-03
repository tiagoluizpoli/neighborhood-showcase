import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Checkbox } from '@neighborhood-showcase/ui/components/checkbox';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Loader2, Save, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/conta')({
  component: AccountPageComponent,
});

function AccountPageComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { data: profile, isLoading: profileLoading } = useQuery(
    trpc.user.getProfile.queryOptions(undefined, {
      enabled: !!session,
    }),
  );

  const [name, setName] = useState('');
  const [isProviderVisible, setIsProviderVisible] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');
  const [website, setWebsite] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync state with profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setIsProviderVisible(profile.isProviderVisible ?? true);
      setWhatsapp(profile.socialLinks?.whatsapp || '');
      setPhone(profile.socialLinks?.phone || '');
      setEmail(profile.socialLinks?.email || '');
      setInstagram(profile.socialLinks?.instagram || '');
      setTiktok(profile.socialLinks?.tiktok || '');
      setFacebook(profile.socialLinks?.facebook || '');
      setWebsite(profile.socialLinks?.website || '');
    }
  }, [profile]);

  const updateProfileMutation = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        toast.success('Perfil atualizado com sucesso!');
        // Refresh session on client side and invalidate profile query
        authClient.getSession();
        queryClient.invalidateQueries({
          queryKey: trpc.user.getProfile.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao atualizar o perfil.');
      },
    }),
  );

  const deleteAccountMutation = useMutation(
    trpc.user.deleteAccount.mutationOptions({
      onSuccess: async () => {
        toast.success('Sua conta foi excluída permanentemente. Até logo!');
        await authClient.signOut();
        navigate({ to: '/' });
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao excluir conta.');
      },
    }),
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      toast.error('O nome de exibição deve ter pelo menos 3 caracteres.');
      return;
    }
    updateProfileMutation.mutate({
      name,
      isProviderVisible,
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

  if (sessionLoading || profileLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          Carregando dados da conta...
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground text-sm">
          Usuário não autenticado.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-bold text-3xl text-foreground tracking-tight">
          Minha Conta
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Gerencie seus dados cadastrais, redes sociais e opções de privacidade.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Form Container */}
        <div className="space-y-6 md:col-span-2">
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle>Perfil Público</CardTitle>
                <CardDescription>
                  Essas informações serão visíveis para outros moradores e
                  visitantes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome de Exibição</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Tiago Poli"
                    className="h-10 rounded-xl"
                  />
                  <p className="text-muted-foreground text-xs">
                    Use o nome pelo qual você quer ser identificado nos seus
                    anúncios.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Endereço de E-mail da Conta</Label>
                  <Input
                    type="email"
                    disabled
                    value={session.user.email}
                    className="h-10 rounded-xl bg-muted"
                  />
                  <p className="text-muted-foreground text-xs">
                    O e-mail da conta não pode ser alterado diretamente.
                  </p>
                </div>

                <div className="pt-2">
                  <div className="flex items-start space-x-3 rounded-lg border bg-muted/20 p-4">
                    <Checkbox
                      id="isProviderVisible"
                      checked={isProviderVisible}
                      onCheckedChange={(checked) =>
                        setIsProviderVisible(checked === true)
                      }
                    />
                    <div className="space-y-1 leading-none">
                      <Label
                        htmlFor="isProviderVisible"
                        className="cursor-pointer font-medium"
                      >
                        Exibir meu perfil no diretório de prestadores
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        Ao desativar, seu perfil não aparecerá nas buscas gerais
                        do diretório de prestadores, mas seus anúncios ativos
                        continuarão visíveis individualmente.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle>Canais de Contato & Redes Sociais</CardTitle>
                <CardDescription>
                  Forneça pelo menos um meio de contato para que os visitantes
                  consigam falar com você.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp (DDD + Número)</Label>
                    <Input
                      id="whatsapp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Ex: 11999999999"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / Celular</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: 11999999999"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de Contato</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: contato@exemplo.com"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">
                      Instagram (Nome de Usuário)
                    </Label>
                    <Input
                      id="instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="Ex: seunome.oficial"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok (Nome de Usuário)</Label>
                    <Input
                      id="tiktok"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="Ex: seunome.oficial"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook (Link ou Usuário)</Label>
                    <Input
                      id="facebook"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="Ex: seunome.oficial"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="website">Website / Link Externo</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Ex: https://meuservico.com.br"
                    className="h-10 rounded-xl"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-4">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm transition-all hover:bg-primary/90"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        {/* Account Info Side Panel */}
        <div className="space-y-6">
          <Card className="rounded-xl border border-destructive/20 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-destructive">Zona de Risco</CardTitle>
              <CardDescription>
                Ações irreversíveis relacionadas à sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs/relaxed">
                A exclusão da conta é feita em conformidade com a LGPD. Todos os
                seus dados pessoais e anúncios ativos serão excluídos
                permanentemente do sistema.
              </p>
            </CardContent>
            <CardFooter className="flex border-t p-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-sm"
              >
                <UserX className="h-4 w-4" />
                Excluir Minha Conta
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Soft Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/80 p-4 backdrop-blur-sm duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-foreground text-xl">
              Excluir Conta Permanentemente?
            </h3>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              Esta ação é <strong>irreversível</strong> e em conformidade com a{' '}
              <strong>LGPD</strong>.
            </p>
            <p className="mt-2 rounded-xl border border-border bg-muted/50 p-3 text-muted-foreground text-xs leading-relaxed">
              Seus dados pessoais (nome, e-mail, telefone e CPF) serão apagados
              permanentemente. Seus anúncios serão removidos da vitrine pública.
              Registros financeiros de transações serão mantidos de forma
              totalmente anônima.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-xl border border-border bg-secondary py-2.5 font-semibold text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteAccountMutation.mutate()}
                disabled={deleteAccountMutation.isPending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 font-semibold text-sm text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteAccountMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
