import { Link } from '@tanstack/react-router';

export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-card py-6 text-center text-muted-foreground text-sm">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} Neighborhood Showcase. Todos os
          direitos reservados.
        </p>
        <Link
          to="/auth"
          search={{ tab: 'signup' }}
          className="font-medium text-primary hover:underline"
        >
          Quer anunciar seus serviços? Cadastre-se como Prestador
        </Link>
      </div>
    </footer>
  );
}
