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
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2, UploadCloud } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';

type ProviderDashboardCondoSetupSindicoFlowProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export function ProviderDashboardCondoSetupSindicoFlow({
  onBack,
  onSuccess,
}: ProviderDashboardCondoSetupSindicoFlowProps) {
  const [name, setName] = useState('');
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const requestCondoMutation = useMutation(
    trpc.condominium.request.mutationOptions({
      onSuccess: () => {
        toast.success('Condomínio cadastrado com sucesso!');
        onSuccess();
      },
      onError: (err) => {
        toast.error(err.message || 'Erro ao cadastrar condomínio.');
      },
    }),
  );

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      toast.error(message || 'Erro ao realizar upload do documento.');
      setIsUploading(false);
      return;
    } finally {
      setIsUploading(false);
    }

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
                onChange={(event) => setName(event.target.value)}
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
                    onChange={(event) => setCep(event.target.value)}
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
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condo-phone">Telefone / WhatsApp</Label>
                <Input
                  id="condo-phone"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
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
                        onChange={(event) => {
                          const files = event.target.files;
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
