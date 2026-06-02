import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import { cn } from '@neighborhood-showcase/ui/lib/utils';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import SignInForm from '@/components/sign-in-form';
import SignUpForm from '@/components/sign-up-form';

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="flex border-b p-1">
          <button
            type="button"
            onClick={() => setActiveTab('signin')}
            className={cn(
              'flex-1 cursor-pointer rounded-lg py-3 text-center font-semibold text-sm transition-all duration-300',
              activeTab === 'signin'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={cn(
              'flex-1 cursor-pointer rounded-lg py-3 text-center font-semibold text-sm transition-all duration-300',
              activeTab === 'signup'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            Criar Conta
          </button>
        </div>
        <CardContent className="p-0">
          {activeTab === 'signin' ? (
            <SignInForm onSwitchToSignUp={() => setActiveTab('signup')} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setActiveTab('signin')} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
