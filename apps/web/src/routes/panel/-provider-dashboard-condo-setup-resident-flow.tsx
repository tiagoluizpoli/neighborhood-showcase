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
import {
  ArrowLeft,
  Building,
  Loader2,
  Search,
  UploadCloud,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';

type ApprovedCondoOption = {
  id: string;
  name: string;
  city: string;
  state: string;
  cep: string;
};

type ProviderDashboardCondoSetupResidentFlowProps = {
  onBack: () => void;
  onRequestSuccess: () => void;
};

export function ProviderDashboardCondoSetupResidentFlow({
  onBack,
  onRequestSuccess,
}: ProviderDashboardCondoSetupResidentFlowProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCondo, setSelectedCondo] =
    useState<ApprovedCondoOption | null>(null);
  const [unitInfo, setUnitInfo] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploadingResident, setIsUploadingResident] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const approvedCondosQuery = useQuery(
    trpc.condominium.listApproved.queryOptions({ query: debouncedQuery }),
  );

  const requestAssignmentMutation = useMutation(
    trpc.assignment.request.mutationOptions({
      onSuccess: () => {
        toast.success('Solicitação de acesso enviada com sucesso!');
        onRequestSuccess();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao solicitar acesso.');
      },
    }),
  );

  const handleBack = () => {
    setSelectedCondo(null);
    setSearchQuery('');
    setUnitInfo('');
    setProofFile(null);
    onBack();
  };

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
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            onClick={handleBack}
            size="icon-sm"
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="pt-4 text-center">
            <CardTitle>Participar de Condomínio</CardTitle>
            <CardDescription className="mt-1">
              Busque o seu condomínio e envie os dados de moradia
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedCondo ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-condo">
                  Buscar Condomínio (Nome, Cidade ou CEP)
                </Label>
                <div className="relative">
                  <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-condo"
                    placeholder="Ex: Jardim das Flores, São Paulo..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {approvedCondosQuery.isPending && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {approvedCondosQuery.data &&
                approvedCondosQuery.data.length > 0 && (
                  <div className="max-h-60 divide-y divide-border overflow-y-auto rounded-lg border border bg-background">
                    {approvedCondosQuery.data.map((condo) => (
                      <button
                        key={condo.id}
                        type="button"
                        onClick={() => setSelectedCondo(condo)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-card"
                      >
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {condo.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {condo.city} - {condo.state} | CEP: {condo.cep}
                          </p>
                        </div>
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}

              {approvedCondosQuery.data &&
                approvedCondosQuery.data.length === 0 &&
                debouncedQuery.trim().length > 0 && (
                  <p className="py-4 text-center text-muted-foreground text-sm">
                    Nenhum condomínio aprovado encontrado.
                  </p>
                )}
            </div>
          ) : (
            <form onSubmit={handleResidentSubmit} className="space-y-4">
              <div className="rounded-lg border border bg-muted/50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">
                      {selectedCondo.name}
                    </h4>
                    <p className="mt-0.5 text-muted-foreground text-xs">
                      {selectedCondo.city} - {selectedCondo.state} | CEP:{' '}
                      {selectedCondo.cep}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setSelectedCondo(null)}
                    className="h-7 px-2"
                  >
                    Alterar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit-info">Identificação da Unidade *</Label>
                <Input
                  id="unit-info"
                  placeholder="Ex: Bloco B, Apto 104"
                  value={unitInfo}
                  onChange={(e) => setUnitInfo(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  Esta informação é privada e serve para o síndico validar sua
                  moradia.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Comprovante de Residência (Opcional)</Label>
                <div className="flex justify-center rounded-lg border border border-dashed bg-muted/50 px-6 py-8 transition-colors hover:border">
                  <div className="space-y-2 text-center">
                    <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                    <div className="flex justify-center text-muted-foreground text-sm">
                      <label
                        htmlFor="proof-upload"
                        className="relative cursor-pointer rounded-md font-semibold text-primary hover:text-primary"
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
                    <p className="text-muted-foreground text-xs">
                      Contas de água, luz ou contrato de locação (PDF/Imagem até
                      10MB)
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  isUploadingResident || requestAssignmentMutation.isPending
                }
                className="mt-6 w-full"
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
