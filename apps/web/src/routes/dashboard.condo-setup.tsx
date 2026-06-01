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
  Building,
  Check,
  Clock,
  FileText,
  Home,
  Loader2,
  MapPin,
  Plus,
  Search,
  UploadCloud,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/dashboard/condo-setup')({
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

  // Form states for Resident
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCondo, setSelectedCondo] = useState<{
    id: string;
    name: string;
    city: string;
    state: string;
    cep: string;
  } | null>(null);
  const [unitInfo, setUnitInfo] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploadingResident, setIsUploadingResident] = useState(false);

  // Form states for External Provider
  const [extCep, setExtCep] = useState('');
  const [extStreet, setExtStreet] = useState('');
  const [extNeighborhood, setExtNeighborhood] = useState('');
  const [extCity, setExtCity] = useState('');
  const [extState, setExtState] = useState('');
  const [extNumber, setExtNumber] = useState('');
  const [extComplement, setExtComplement] = useState('');
  const [isSearchingExtCep, setIsSearchingExtCep] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Query approved condos
  const approvedCondosQuery = useQuery(
    trpc.condominium.listApproved.queryOptions({ query: debouncedQuery }),
  );

  // tRPC assignment request mutation
  const requestAssignmentMutation = useMutation(
    trpc.assignment.request.mutationOptions({
      onSuccess: () => {
        toast.success('Solicitação de acesso enviada com sucesso!');
        myAssignmentsQuery.refetch();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao solicitar acesso.');
      },
    }),
  );

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

  // tRPC register external location mutation
  const registerExternalMutation = useMutation(
    trpc.assignment.registerExternal.mutationOptions({
      onSuccess: () => {
        toast.success('Localização registrada com sucesso!');
        myAssignmentsQuery.refetch();
        navigate({ to: '/dashboard' });
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao registrar localização.');
      },
    }),
  );

  // External CEP Autofill Effect
  useEffect(() => {
    const cleanCep = extCep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsSearchingExtCep(true);
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (data.erro) {
            toast.error('CEP não encontrado.');
            setExtStreet('');
            setExtNeighborhood('');
            setExtCity('');
            setExtState('');
          } else {
            setExtStreet(data.logradouro || '');
            setExtNeighborhood(data.bairro || '');
            setExtCity(data.localidade || '');
            setExtState(data.uf || '');
          }
        })
        .catch(() => {
          toast.error('Erro ao buscar o CEP.');
        })
        .finally(() => {
          setIsSearchingExtCep(false);
        });
    }
  }, [extCep]);

  const handleExternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !extCep ||
      !extStreet ||
      !extNeighborhood ||
      !extCity ||
      !extState ||
      !extNumber
    ) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    registerExternalMutation.mutate({
      cep: extCep.replace(/\D/g, ''),
      street: extStreet,
      neighborhood: extNeighborhood,
      city: extCity,
      state: extState.toUpperCase(),
      number: extNumber,
      complement: extComplement || undefined,
    });
  };

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
      <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.12),transparent_45%)]" />
        </div>

        <Card className="w-full max-w-md border-slate-800 bg-slate-900/60 p-6 text-center shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400">
              <Check className="h-8 w-8" />
            </div>
            <CardTitle className="font-bold text-2xl text-green-400">
              Associação Aprovada!
            </CardTitle>
            <CardDescription className="mt-2 text-slate-400">
              Sua associação ao condomínio{' '}
              <strong className="text-indigo-400">
                {approvedAssignment.condominium?.name}
              </strong>{' '}
              foi aprovada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate({ to: '/dashboard' })}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
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
      <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.12),transparent_45%)]" />
        </div>

        <Card className="w-full max-w-lg border-slate-800 bg-slate-900/60 p-6 text-center shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
              <Clock className="h-8 w-8" />
            </div>
            <CardTitle className="font-bold text-2xl text-slate-100">
              Solicitação Pendente
            </CardTitle>
            <CardDescription className="mt-2 text-slate-400">
              Sua solicitação de acesso para o condomínio{' '}
              <strong className="text-indigo-400">
                {pendingAssignment.condominium?.name}
              </strong>{' '}
              está em análise.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300 text-sm">
              O moderador do condomínio está verificando as suas informações.
              Você terá acesso assim que a solicitação for aprovada.
            </p>
            <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-left text-slate-400 text-xs">
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
                    className="flex items-center text-indigo-400 hover:underline"
                  >
                    Ver arquivo <FileText className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => myAssignmentsQuery.refetch()}
              className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800"
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
      <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.12),transparent_45%)]" />
        </div>

        <Card className="w-full max-w-lg border-slate-800 bg-slate-900/60 p-6 text-center shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
              <Clock className="h-8 w-8" />
            </div>
            <CardTitle className="font-bold text-2xl text-slate-100">
              Cadastro em Análise
            </CardTitle>
            <CardDescription className="mt-2 text-slate-400">
              O condomínio{' '}
              <strong className="text-indigo-400">{myCondo.name}</strong> foi
              enviado para aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300 text-sm">
              Nossos administradores estão verificando os documentos anexados.
              Você receberá acesso como <strong>Síndico/Moderador</strong> assim
              que for aprovado.
            </p>
            <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-left text-slate-400 text-xs">
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
                    className="flex items-center text-indigo-400 hover:underline"
                  >
                    Ver arquivo <FileText className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => myCondoQuery.refetch()}
              className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800"
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
      <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/60 p-6 text-center shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="font-bold text-2xl text-green-400">
              Condomínio Aprovado!
            </CardTitle>
            <CardDescription className="mt-2 text-slate-400">
              Seu acesso como moderador foi ativado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate({ to: '/dashboard' })}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
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
      <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.12),transparent_45%)]" />
        </div>

        <Card className="w-full max-w-4xl border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
              <Home className="h-8 w-8" />
            </div>
            <CardTitle className="font-bold text-2xl text-slate-100">
              Configuração do Provedor
            </CardTitle>
            <CardDescription className="mt-2 text-slate-400">
              Você ainda não possui uma localização cadastrada. Escolha uma das
              opções abaixo para começar a anunciar seus serviços.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-6 transition-all hover:border-slate-700">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg text-slate-200">
                  Criar Novo Condomínio
                </h3>
                <p className="mt-2 text-slate-400 text-sm">
                  Cadastre um novo condomínio como{' '}
                  <strong>Síndico/Administrador</strong> para gerenciar
                  moradores e anúncios no local.
                </p>
              </div>
              <Button
                onClick={() => setFlow('sindico')}
                className="mt-6 w-full animate-none cursor-pointer bg-indigo-600 hover:bg-indigo-700"
              >
                Começar
              </Button>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-6 transition-all hover:border-slate-700">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg text-slate-200">
                  Morador de Condomínio
                </h3>
                <p className="mt-2 text-slate-400 text-sm">
                  Solicite associação a um condomínio existente informando sua
                  unidade e comprovante de residência.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setFlow('resident')}
                className="mt-6 w-full cursor-pointer border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
              >
                Solicitar Acesso
              </Button>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-6 transition-all hover:border-slate-700">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg text-slate-200">
                  Prestador Autônomo
                </h3>
                <p className="mt-2 text-slate-400 text-sm">
                  Trabalha fora de condomínios? Registre o endereço de seu
                  estabelecimento comercial ou residência para divulgar anúncios
                  na região.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setFlow('external')}
                className="mt-6 w-full cursor-pointer border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
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
    const handleResidentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedCondo) {
        toast.error('Por favor, selecione um condomínio.');
        return;
      }

      if (!unitInfo.trim()) {
        toast.error('Por favor, preencha os detalhes da sua unidade.');
        return;
      }

      setIsUploadingResident(true);
      let proofUrl = '';

      try {
        if (proofFile) {
          const formData = new FormData();
          formData.append('file', proofFile);
          formData.append('type', 'document');

          const uploadRes = await fetch(`${env.VITE_SERVER_URL}/api/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (!uploadRes.ok) {
            throw new Error('Falha no upload do comprovante.');
          }

          const uploadData = await uploadRes.json();
          proofUrl = uploadData.url;
        }
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'Erro ao fazer upload do comprovante.');
        setIsUploadingResident(false);
        return;
      } finally {
        setIsUploadingResident(false);
      }

      requestAssignmentMutation.mutate({
        condominiumId: selectedCondo.id,
        unitInfo: unitInfo.trim(),
        proofOfResidency: proofUrl || undefined,
      });
    };

    return (
      <div className="relative flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.12),transparent_45%)]" />
        </div>

        <Card className="w-full max-w-lg border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-xl">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              onClick={() => {
                setFlow('select');
                setSelectedCondo(null);
                setSearchQuery('');
                setUnitInfo('');
                setProofFile(null);
              }}
              className="absolute top-4 left-4 h-8 w-8 cursor-pointer p-0 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="pt-4 text-center">
              <CardTitle className="font-bold text-2xl text-slate-100">
                Participar de Condomínio
              </CardTitle>
              <CardDescription className="mt-1 text-slate-400">
                Busque o seu condomínio e envie os dados de moradia
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedCondo ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search-condo" className="text-slate-300">
                    Buscar Condomínio (Nome, Cidade ou CEP)
                  </Label>
                  <div className="relative">
                    <Search className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
                    <Input
                      id="search-condo"
                      placeholder="Ex: Jardim das Flores, São Paulo..."
                      className="border-slate-800 bg-slate-950 pl-10 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {approvedCondosQuery.isPending && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  </div>
                )}

                {approvedCondosQuery.data &&
                  approvedCondosQuery.data.length > 0 && (
                    <div className="max-h-60 divide-y divide-slate-800 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60">
                      {approvedCondosQuery.data.map((condo) => (
                        <button
                          key={condo.id}
                          type="button"
                          onClick={() => setSelectedCondo(condo)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-900"
                        >
                          <div>
                            <p className="font-medium text-slate-200 text-sm">
                              {condo.name}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {condo.city} - {condo.state} | CEP: {condo.cep}
                            </p>
                          </div>
                          <Building className="h-4 w-4 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  )}

                {approvedCondosQuery.data &&
                  approvedCondosQuery.data.length === 0 &&
                  debouncedQuery.trim().length > 0 && (
                    <p className="py-4 text-center text-slate-500 text-sm">
                      Nenhum condomínio aprovado encontrado.
                    </p>
                  )}
              </div>
            ) : (
              <form onSubmit={handleResidentSubmit} className="space-y-4">
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">
                        {selectedCondo.name}
                      </h4>
                      <p className="mt-0.5 text-slate-400 text-xs">
                        {selectedCondo.city} - {selectedCondo.state} | CEP:{' '}
                        {selectedCondo.cep}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setSelectedCondo(null)}
                      className="h-7 cursor-pointer px-2 text-indigo-400 text-xs hover:bg-slate-800 hover:text-indigo-300"
                    >
                      Alterar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit-info" className="text-slate-300">
                    Identificação da Unidade *
                  </Label>
                  <Input
                    id="unit-info"
                    placeholder="Ex: Bloco B, Apto 104"
                    className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                    value={unitInfo}
                    onChange={(e) => setUnitInfo(e.target.value)}
                  />
                  <p className="text-slate-500 text-xs">
                    Esta informação é privada e serve para o síndico validar sua
                    moradia.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Comprovante de Residência (Opcional)
                  </Label>
                  <div className="flex justify-center rounded-lg border border-slate-800 border-dashed bg-slate-950/40 px-6 py-8 transition-colors hover:border-slate-700">
                    <div className="space-y-2 text-center">
                      <UploadCloud className="mx-auto h-10 w-10 text-slate-500" />
                      <div className="flex justify-center text-slate-400 text-sm">
                        <label
                          htmlFor="proof-upload"
                          className="relative cursor-pointer rounded-md font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          <span>Enviar comprovante</span>
                          <input
                            id="proof-upload"
                            name="proof-upload"
                            type="file"
                            accept="application/pdf,image/*"
                            className="sr-only"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                setProofFile(files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-slate-500 text-xs">
                        Contas de água, luz ou contrato de locação (PDF/Imagem
                        até 10MB)
                      </p>
                      {proofFile && (
                        <div className="inline-block rounded border border-slate-800 bg-slate-950 p-2 font-medium text-slate-300 text-xs">
                          📁 {proofFile.name} (
                          {(proofFile.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={
                    isUploadingResident || requestAssignmentMutation.isPending
                  }
                  className="mt-6 w-full cursor-pointer rounded-lg bg-indigo-600 py-2 font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  {isUploadingResident ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando comprovante...
                    </>
                  ) : requestAssignmentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando solicitação...
                    </>
                  ) : (
                    'Solicitar Acesso'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // External Path Form
  if (flow === 'external') {
    return (
      <div className="relative flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.12),transparent_45%)]" />
        </div>

        <Card className="w-full max-w-lg border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-xl">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              onClick={() => setFlow('select')}
              className="absolute top-4 left-4 h-8 w-8 cursor-pointer p-0 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="pt-4 text-center">
              <CardTitle className="font-bold text-2xl text-slate-100">
                Prestador Autônomo / Externo
              </CardTitle>
              <CardDescription className="mt-1 text-slate-400">
                Cadastre o endereço de atendimento do seu serviço autônomo
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleExternalSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label htmlFor="ext-cep" className="text-slate-300">
                    CEP *
                  </Label>
                  <div className="relative">
                    <Input
                      id="ext-cep"
                      placeholder="00000-000"
                      maxLength={9}
                      className="border-slate-800 bg-slate-950 pr-8 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                      value={extCep}
                      onChange={(e) => setExtCep(e.target.value)}
                    />
                    {isSearchingExtCep && (
                      <Loader2 className="absolute top-2.5 right-2 h-4 w-4 animate-spin text-slate-500" />
                    )}
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="ext-street" className="text-slate-300">
                    Rua / Logradouro *
                  </Label>
                  <Input
                    id="ext-street"
                    placeholder="Rua, Avenida..."
                    className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                    value={extStreet}
                    onChange={(e) => setExtStreet(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ext-neighborhood" className="text-slate-300">
                    Bairro *
                  </Label>
                  <Input
                    id="ext-neighborhood"
                    placeholder="Bairro"
                    className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                    value={extNeighborhood}
                    onChange={(e) => setExtNeighborhood(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="ext-city" className="text-slate-300">
                      Cidade *
                    </Label>
                    <Input
                      id="ext-city"
                      placeholder="Cidade"
                      disabled
                      className="border-slate-800 bg-slate-900 text-slate-400"
                      value={extCity}
                    />
                  </div>

                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="ext-state" className="text-slate-300">
                      UF *
                    </Label>
                    <Input
                      id="ext-state"
                      placeholder="UF"
                      disabled
                      className="border-slate-800 bg-slate-900 text-slate-400"
                      value={extState}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label htmlFor="ext-number" className="text-slate-300">
                    Número *
                  </Label>
                  <Input
                    id="ext-number"
                    placeholder="123"
                    className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                    value={extNumber}
                    onChange={(e) => setExtNumber(e.target.value)}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="ext-complement" className="text-slate-300">
                    Complemento
                  </Label>
                  <Input
                    id="ext-complement"
                    placeholder="Sala, Apto, Bloco..."
                    className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                    value={extComplement}
                    onChange={(e) => setExtComplement(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={registerExternalMutation.isPending}
                className="mt-6 w-full cursor-pointer rounded-lg bg-indigo-600 py-2 font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                {registerExternalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando endereço...
                  </>
                ) : (
                  'Confirmar Endereço'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Síndico Path Form
  return (
    <div className="relative flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.12),transparent_45%)]" />
      </div>

      <Card className="w-full max-w-lg border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            onClick={() => setFlow('select')}
            className="absolute top-4 left-4 h-8 w-8 cursor-pointer p-0 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="pt-4 text-center">
            <CardTitle className="font-bold text-2xl text-slate-100">
              Cadastrar Condomínio
            </CardTitle>
            <CardDescription className="mt-1 text-slate-400">
              Preencha os dados como administrador/síndico
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="condo-name" className="text-slate-300">
                Nome do Condomínio *
              </Label>
              <Input
                id="condo-name"
                placeholder="Ex: Condomínio Residencial Vista Alegre"
                className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 space-y-2">
                <Label htmlFor="condo-cep" className="text-slate-300">
                  CEP *
                </Label>
                <div className="relative">
                  <Input
                    id="condo-cep"
                    placeholder="00000-000"
                    maxLength={9}
                    className="border-slate-800 bg-slate-950 pr-8 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                  />
                  {isSearchingCep && (
                    <Loader2 className="absolute top-2.5 right-2 h-4 w-4 animate-spin text-slate-500" />
                  )}
                </div>
              </div>

              <div className="col-span-1 space-y-2">
                <Label htmlFor="condo-city" className="text-slate-300">
                  Cidade *
                </Label>
                <Input
                  id="condo-city"
                  placeholder="Cidade"
                  disabled
                  className="border-slate-800 bg-slate-900 text-slate-400"
                  value={city}
                />
              </div>

              <div className="col-span-1 space-y-2">
                <Label htmlFor="condo-state" className="text-slate-300">
                  UF *
                </Label>
                <Input
                  id="condo-state"
                  placeholder="UF"
                  disabled
                  className="border-slate-800 bg-slate-900 text-slate-400"
                  value={state}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condo-email" className="text-slate-300">
                  E-mail de Contato
                </Label>
                <Input
                  id="condo-email"
                  type="email"
                  placeholder="admin@condo.com"
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condo-phone" className="text-slate-300">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="condo-phone"
                  placeholder="(11) 99999-9999"
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">
                Ata de Eleição / Convenção *
              </Label>
              <div className="flex justify-center rounded-lg border border-slate-800 border-dashed bg-slate-950/40 px-6 py-8 transition-colors hover:border-slate-700">
                <div className="space-y-2 text-center">
                  <UploadCloud className="mx-auto h-10 w-10 text-slate-500" />
                  <div className="flex justify-center text-slate-400 text-sm">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-indigo-400 hover:text-indigo-300"
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
                  <p className="text-slate-500 text-xs">
                    PDF ou Imagem de até 10MB
                  </p>
                  {file && (
                    <div className="inline-block rounded border border-slate-800 bg-slate-950 p-2 font-medium text-slate-300 text-xs">
                      📁 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isUploading || requestCondoMutation.isPending}
              className="mt-6 w-full cursor-pointer rounded-lg bg-indigo-600 py-2 font-semibold text-white transition-colors hover:bg-indigo-700"
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
