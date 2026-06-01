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
    <div className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative background gradients */}
      <div className="absolute inset-0 -z-10 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.15),transparent_40%)]" />
      </div>

      <Card className="w-full max-w-md border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-xl">
        <div className="flex border-slate-800 border-b p-1">
          <button
            type="button"
            onClick={() => setActiveTab('signin')}
            className={cn(
              'flex-1 cursor-pointer rounded-lg py-3 text-center font-semibold text-sm transition-all duration-300',
              activeTab === 'signin'
                ? 'bg-indigo-600 text-white shadow-indigo-600/20 shadow-md'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200',
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
                ? 'bg-indigo-600 text-white shadow-indigo-600/20 shadow-md'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200',
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
