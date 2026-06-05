import { Label } from '@neighborhood-showcase/ui/components/label';
import { UploadCloud } from 'lucide-react';

type ProviderDashboardCondoSetupResidentProofUploadProps = {
  onChange: (file: File | null) => void;
};

export function ProviderDashboardCondoSetupResidentProofUpload({
  onChange,
}: ProviderDashboardCondoSetupResidentProofUploadProps) {
  return (
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
                  onChange(files && files.length > 0 ? files[0] : null);
                }}
              />
            </label>
          </div>
          <p className="text-muted-foreground text-xs">
            Contas de água, luz ou contrato de locação (PDF/Imagem até 10MB)
          </p>
        </div>
      </div>
    </div>
  );
}
