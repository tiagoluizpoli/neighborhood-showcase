import { env } from '@neighborhood-showcase/env/web';
import { Button } from '@neighborhood-showcase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@neighborhood-showcase/ui/components/card';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Check,
  Clock,
  FileText,
  Home,
  Loader2,
  MapPin,
  Plus,
  UploadCloud,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ProviderDashboardCondoSetupExternalFlow } from './panel/-provider-dashboard-condo-setup-external-flow';
import { ProviderDashboardCondoSetupResidentFlow } from './panel/-provider-dashboard-condo-setup-resident-flow';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/panel/dashboard/condo-setup')({
  component: CondoSetupComponent,
});

function CondoSetupComponent() {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<
    'select' | 'sindico' | 'resident' | 'external'
  >('select');

  // Query my created condo status
  const myCondoQuery = useQuery(trpc.condominium.myCreated.queryOptions());

  // Query assignments status
  const myAssignmentsQuery = useQuery(
    trpc.assignment.getMyAssignments.queryOptions(),
  );

  // Form states for Sindico
  const [name, setName] = useState('');
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // tRPC condo request mutation
  const requestCondoMutation = useMutation(
    trpc.condominium.request.mutationOptions({
      onSuccess: () => {
        toast.success('Condomínio cadastrado com sucesso!');
        myCondoQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao cadastrar condomínio.');
      },
    }),
  );

  // CEP Autofill Effect
  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (data.erro) {
            toast.error('CEP não encontrado.');
            setCity('');
            setState('');
          } else {
            setCity(data.localidade || '');
            setState(data.uf || '');
          }
        })
        .catch(() => {
          toast.error('Erro ao buscar o CEP.');
        })
        .finally(() => {
          setIsSearchingCep(false);
        });
    }
  }, [cep]);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !cep || !city || !state) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!file) {
      toast.error('Por favor, envie o documento de convenção/ata de eleição.');
      return;
    }

    setIsUploading(true);
    let proofUrl = '';

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'document');

      const uploadRes = await fetch(`${env.VITE_SERVER_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!uploadRes.ok) {
        throw new Error('Falha no upload do documento.');
      }

      const uploadData = await uploadRes.json();
      proofUrl = uploadData.url;
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Erro ao realizar upload do documento.');
      setIsUploading(false);
      return;
    } finally {
      setIsUploading(false);
    }

    // Call tRPC mutation
    requestCondoMutation.mutate({
      name,
      city,
      state,
      cep: cep.replace(/\D/g, ''),
      contactInfo: {
        email: email || undefined,
        phone: phone || undefined,
      },
      proofUrl,
    });
  };

  const myCondo = myCondoQuery.data;
  const myAssignments = myAssignmentsQuery.data;

  const approvedAssignment = myAssignments?.find(
    (a) => a.status === 'APPROVED',
  );
  if (approvedAssignment) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-6 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
              <Check className="h-8 w-8" />
            </div>
            <CardTitle>Associação Aprovada!</CardTitle>
            <CardDescription className="mt-2">
              Sua associação ao condomínio{' '}
              <strong>{approvedAssignment.condominium?.name}</strong> foi
              aprovada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate({ to: '/panel/dashboard' })}
              className="w-full"
            >
              Ir para o Painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingAssignment = myAssignments?.find((a) => a.status === 'PENDING');
  if (pendingAssignment) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-lg p-6 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
              <Clock className="h-8 w-8" />
            </div>
            <CardTitle>Solicitação Pendente</CardTitle>
            <CardDescription className="mt-2">
              Sua solicitação de acesso para o condomínio{' '}
              <strong>{pendingAssignment.condominium?.name}</strong> está em
              análise.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground text-sm">
              O moderador do condomínio está verificando as suas informações.
              Você terá acesso assim que a solicitação for aprovada.
            </p>
            <div className="space-y-2 rounded-lg border border bg-muted/50 p-4 text-left text-muted-foreground text-xs">
              <div>
                <strong>Condomínio:</strong>{' '}
                {pendingAssignment.condominium?.name} (
                {pendingAssignment.condominium?.city} -{' '}
                {pendingAssignment.condominium?.state})
              </div>
              <div>
                <strong>Unidade:</strong> {pendingAssignment.unitInfo}
              </div>
              {pendingAssignment.proofOfResidency && (
                <div className="flex items-center space-x-1">
                  <strong>Comprovante:</strong>
                  <a
                    href={pendingAssignment.proofOfResidency}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-primary hover:underline"
                  >
                    Ver arquivo <FileText className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => myAssignmentsQuery.refetch()}
              className="mt-4"
            >
              Atualizar Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If the user already has a pending condo creation
  if (myCondo && myCondo.status === 'PENDING_APPROVAL') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-lg p-6 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
              <Clock className="h-8 w-8" />
            </div>
            <CardTitle>Cadastro em Análise</CardTitle>
            <CardDescription className="mt-2">
              O condomínio <strong>{myCondo.name}</strong> foi enviado para
              aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground text-sm">
              Nossos administradores estão verificando os documentos anexados.
              Você receberá acesso como <strong>Síndico/Moderador</strong> assim
              que for aprovado.
            </p>
            <div className="space-y-2 rounded-lg border border bg-muted/50 p-4 text-left text-muted-foreground text-xs">
              <div>
                <strong>Cidade/UF:</strong> {myCondo.city} - {myCondo.state}
              </div>
              <div>
                <strong>CEP:</strong> {myCondo.cep}
              </div>
              {myCondo.proofUrl && (
                <div className="flex items-center space-x-1">
                  <strong>Comprovante:</strong>
                  <a
                    href={myCondo.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-primary hover:underline"
                  >
                    Ver arquivo <FileText className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => myCondoQuery.refetch()}
              className="mt-4"
            >
              Atualizar Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If approved, redirect to dashboard or show completion
  if (myCondo && myCondo.status === 'APPROVED') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-6 text-center">
          <CardHeader>
            <CardTitle>Condomínio Aprovado!</CardTitle>
            <CardDescription className="mt-2">
              Seu acesso como moderador foi ativado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate({ to: '/panel/dashboard' })}
              className="w-full"
            >
              Ir para o Painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Selection Screen
  if (flow === 'select') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-4xl p-6">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
              <Home className="h-8 w-8" />
            </div>
            <CardTitle>Configuração do Provedor</CardTitle>
            <CardDescription className="mt-2">
              Você ainda não possui uma localização cadastrada. Escolha uma das
              opções abaixo para começar a anunciar seus serviços.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col justify-between rounded-xl border border bg-muted/50 p-6 transition-all hover:border">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">
                  Criar Novo Condomínio
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Cadastre um novo condomínio como{' '}
                  <strong>Síndico/Administrador</strong> para gerenciar
                  moradores e anúncios no local.
                </p>
              </div>
              <Button
                onClick={() => setFlow('sindico')}
                className="mt-6 w-full cursor-pointer"
              >
                Começar
              </Button>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border bg-muted/50 p-6 transition-all hover:border">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">
                  Morador de Condomínio
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Solicite associação a um condomínio existente informando sua
                  unidade e comprovante de residência.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setFlow('resident')}
                className="mt-6 w-full"
              >
                Solicitar Acesso
              </Button>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border bg-muted/50 p-6 transition-all hover:border">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">
                  Prestador Autônomo
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Trabalha fora de condomínios? Registre o endereço de seu
                  estabelecimento comercial ou residência para divulgar anúncios
                  na região.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setFlow('external')}
                className="mt-6 w-full"
              >
                Cadastrar Endereço
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Resident sub-flow (Issue 03)
  if (flow === 'resident') {
    return (
      <ProviderDashboardCondoSetupResidentFlow
        onBack={() => setFlow('select')}
        onRequestSuccess={() => myAssignmentsQuery.refetch()}
      />
    );
  }

  // External Path Form
  if (flow === 'external') {
    return (
      <ProviderDashboardCondoSetupExternalFlow
        onBack={() => setFlow('select')}
        onRegisterSuccess={() => {
          myAssignmentsQuery.refetch();
          navigate({ to: '/panel/dashboard' });
        }}
      />
    );
  }

  // Síndico Path Form
  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            onClick={() => setFlow('select')}
            size="icon-sm"
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="pt-4 text-center">
            <CardTitle>Cadastrar Condomínio</CardTitle>
            <CardDescription className="mt-1">
              Preencha os dados como administrador/síndico
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="condo-name">Nome do Condomínio *</Label>
              <Input
                id="condo-name"
                placeholder="Ex: Condomínio Residencial Vista Alegre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 space-y-2">
                <Label htmlFor="condo-cep">CEP *</Label>
                <div className="relative">
                  <Input
                    id="condo-cep"
                    placeholder="00000-000"
                    maxLength={9}
                    className="pr-8"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                  />
                  {isSearchingCep && (
                    <Loader2 className="absolute top-2.5 right-2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="col-span-1 space-y-2">
                <Label htmlFor="condo-city">Cidade *</Label>
                <Input
                  id="condo-city"
                  placeholder="Cidade"
                  disabled
                  value={city}
                />
              </div>

              <div className="col-span-1 space-y-2">
                <Label htmlFor="condo-state">UF *</Label>
                <Input
                  id="condo-state"
                  placeholder="UF"
                  disabled
                  value={state}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condo-email">E-mail de Contato</Label>
                <Input
                  id="condo-email"
                  type="email"
                  placeholder="admin@condo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condo-phone">Telefone / WhatsApp</Label>
                <Input
                  id="condo-phone"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ata de Eleição / Convenção *</Label>
              <div className="flex justify-center rounded-lg border border border-dashed bg-muted/50 px-6 py-8 transition-colors hover:border">
                <div className="space-y-2 text-center">
                  <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                  <div className="flex justify-center text-muted-foreground text-sm">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-primary hover:text-primary"
                    >
                      <span>Enviar arquivo</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="application/pdf,image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            setFile(files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    PDF ou Imagem de até 10MB
                  </p>
                  {file && (
                    <div className="inline-block rounded border border bg-background p-2 font-medium text-foreground text-xs">
                      📁 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isUploading || requestCondoMutation.isPending}
              className="mt-6 w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando documento...
                </>
              ) : requestCondoMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando dados...
                </>
              ) : (
                'Solicitar Aprovação'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
