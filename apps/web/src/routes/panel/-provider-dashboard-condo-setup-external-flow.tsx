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
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';

type ProviderDashboardCondoSetupExternalFlowProps = {
  onBack: () => void;
  onProviderCreated: (providerId: string) => void;
};

export function ProviderDashboardCondoSetupExternalFlow({
  onBack,
  onProviderCreated,
}: ProviderDashboardCondoSetupExternalFlowProps) {
  const [extCep, setExtCep] = useState('');
  const [extStreet, setExtStreet] = useState('');
  const [extNeighborhood, setExtNeighborhood] = useState('');
  const [extCity, setExtCity] = useState('');
  const [extState, setExtState] = useState('');
  const [extNumber, setExtNumber] = useState('');
  const [extComplement, setExtComplement] = useState('');
  const [isSearchingExtCep, setIsSearchingExtCep] = useState(false);

  const createProviderMutation = useMutation(
    trpc.providerProfile.create.mutationOptions(),
  );
  const registerExternalMutation = useMutation(
    trpc.assignment.registerExternal.mutationOptions(),
  );

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

    try {
      // Mint a new provider, then register its EXTERNAL (auto-approved)
      // location. Same repeatable path for the first and the Nth provider.
      // The address seeds an editable default display name (no profile yet).
      const displayName = `${extStreet}, ${extNumber}`.trim();
      const { providerId } = await createProviderMutation.mutateAsync({
        displayName,
      });
      await registerExternalMutation.mutateAsync({
        providerId,
        cep: extCep.replace(/\D/g, ''),
        street: extStreet,
        neighborhood: extNeighborhood,
        city: extCity,
        state: extState.toUpperCase(),
        number: extNumber,
        complement: extComplement || undefined,
      });
      toast.success('Localização registrada com sucesso!');
      onProviderCreated(providerId);
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao registrar localização.');
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            onClick={onBack}
            size="icon-sm"
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="pt-4 text-center">
            <CardTitle>Prestador Autônomo / Externo</CardTitle>
            <CardDescription className="mt-1">
              Cadastre o endereço de atendimento do seu serviço autônomo
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleExternalSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 space-y-2">
                <Label htmlFor="ext-cep">CEP *</Label>
                <div className="relative">
                  <Input
                    id="ext-cep"
                    placeholder="00000-000"
                    maxLength={9}
                    className="pr-8"
                    value={extCep}
                    onChange={(e) => setExtCep(e.target.value)}
                  />
                  {isSearchingExtCep && (
                    <Loader2 className="absolute top-2.5 right-2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="ext-street">Rua / Logradouro *</Label>
                <Input
                  id="ext-street"
                  placeholder="Rua, Avenida..."
                  value={extStreet}
                  onChange={(e) => setExtStreet(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ext-neighborhood">Bairro *</Label>
                <Input
                  id="ext-neighborhood"
                  placeholder="Bairro"
                  value={extNeighborhood}
                  onChange={(e) => setExtNeighborhood(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="ext-city">Cidade *</Label>
                  <Input
                    id="ext-city"
                    placeholder="Cidade"
                    disabled
                    value={extCity}
                  />
                </div>

                <div className="col-span-1 space-y-2">
                  <Label htmlFor="ext-state">UF *</Label>
                  <Input
                    id="ext-state"
                    placeholder="UF"
                    disabled
                    value={extState}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 space-y-2">
                <Label htmlFor="ext-number">Número *</Label>
                <Input
                  id="ext-number"
                  placeholder="123"
                  value={extNumber}
                  onChange={(e) => setExtNumber(e.target.value)}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="ext-complement">Complemento</Label>
                <Input
                  id="ext-complement"
                  placeholder="Sala, Apto, Bloco..."
                  value={extComplement}
                  onChange={(e) => setExtComplement(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                createProviderMutation.isPending ||
                registerExternalMutation.isPending
              }
              className="mt-6 w-full"
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
