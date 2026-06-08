import { Button } from '@neighborhood-showcase/ui/components/button';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import z from 'zod';
import { Loader } from './loader';
import { authClient } from '@/lib/auth-client';
import { formatCPF, isValidCPF } from '@/utils/cpf';

export function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const navigate = useNavigate();
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      cpf: '',
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
          // @ts-expect-error - cpf is intercepted and processed by backend signup hook
          cpf: value.cpf,
          phone: value.phone,
        },
        {
          onSuccess: () => {
            navigate({
              to: '/panel/dashboard/condo-setup',
            });
            toast.success('Cadastro realizado com sucesso!');
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onChange: z.object({
        name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
        email: z.string().email('Endereço de e-mail inválido'),
        password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
        phone: z.string().min(10, 'O telefone deve ter pelo menos 10 dígitos'),
        cpf: z.string().refine((val) => isValidCPF(val), {
          message: 'CPF inválido',
        }),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h2 className="font-bold text-2xl text-foreground tracking-tight">
          Criar Conta
        </h2>
        <p className="text-muted-foreground text-sm">
          Preencha os dados abaixo para se cadastrar
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Nome Completo</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Seu nome legal completo"
                  className="border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive text-xs">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>E-mail</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="exemplo@email.com"
                  className="border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive text-xs">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Senha</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive text-xs">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="phone">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Telefone</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive text-xs">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="cpf">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>CPF</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  placeholder="000.000.000-00"
                  className="border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(formatCPF(e.target.value))
                  }
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive text-xs">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="w-full cursor-pointer rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? 'Cadastrando...' : 'Criar Conta'}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignIn}
          className="cursor-pointer text-primary text-sm hover:text-primary/90"
        >
          Já tem uma conta? Entrar
        </Button>
      </div>
    </div>
  );
}
