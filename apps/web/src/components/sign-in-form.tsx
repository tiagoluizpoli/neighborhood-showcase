import { Button } from '@neighborhood-showcase/ui/components/button';
import { Input } from '@neighborhood-showcase/ui/components/input';
import { Label } from '@neighborhood-showcase/ui/components/label';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import z from 'zod';
import Loader from './loader';
import { authClient } from '@/lib/auth-client';

export default function SignInForm({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp: () => void;
}) {
  const navigate = useNavigate();
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({
              to: '/panel/dashboard',
            });
            toast.success('Login realizado com sucesso!');
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onChange: z.object({
        email: z.string().email('Endereço de e-mail inválido'),
        password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
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
          Entrar
        </h2>
        <p className="text-muted-foreground text-sm">
          Entre com seu e-mail e senha cadastrados
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
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-foreground">
                  E-mail
                </Label>
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
                <Label htmlFor={field.name} className="text-foreground">
                  Senha
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  placeholder="Sua senha secreta"
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
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignUp}
          className="cursor-pointer text-primary text-sm hover:text-primary/90"
        >
          Não tem uma conta? Cadastre-se
        </Button>
      </div>
    </div>
  );
}
