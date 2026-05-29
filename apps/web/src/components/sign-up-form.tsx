import { Button } from '@base-fullstack-template/ui/components/button';
import { Input } from '@base-fullstack-template/ui/components/input';
import { Label } from '@base-fullstack-template/ui/components/label';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import z from 'zod';
import Loader from './loader';
import { authClient } from '@/lib/auth-client';
import { formatCPF, isValidCPF } from '@/utils/cpf';

export default function SignUpForm({
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
              to: '/dashboard/condo-setup',
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
        <h2 className="font-bold text-2xl text-slate-100 tracking-tight">
          Criar Conta
        </h2>
        <p className="text-slate-400 text-sm">
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
                <Label htmlFor={field.name} className="text-slate-300">
                  Nome Completo
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Seu nome legal completo"
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-400 text-xs">
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
                <Label htmlFor={field.name} className="text-slate-300">
                  E-mail
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="exemplo@email.com"
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-400 text-xs">
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
                <Label htmlFor={field.name} className="text-slate-300">
                  Senha
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-400 text-xs">
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
                <Label htmlFor={field.name} className="text-slate-300">
                  Telefone
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-400 text-xs">
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
                <Label htmlFor={field.name} className="text-slate-300">
                  CPF
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  placeholder="000.000.000-00"
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-600"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(formatCPF(e.target.value))
                  }
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-400 text-xs">
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
              className="w-full cursor-pointer rounded-lg bg-indigo-600 py-2 font-semibold text-white transition-colors hover:bg-indigo-700"
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
          className="cursor-pointer text-indigo-400 text-sm hover:text-indigo-300"
        >
          Já tem uma conta? Entrar
        </Button>
      </div>
    </div>
  );
}
