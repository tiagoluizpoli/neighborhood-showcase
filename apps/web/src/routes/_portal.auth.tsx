import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@neighborhood-showcase/ui/components/tabs';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import SignInForm from '@/components/sign-in-form';
import SignUpForm from '@/components/sign-up-form';

const authSearchSchema = z.object({
  tab: z.enum(['signin', 'signup']).optional(),
});

export const Route = createFileRoute('/_portal/auth')({
  validateSearch: authSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = Route.useSearch();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(
    tab || 'signin',
  );

  return (
    <div className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}
          className="gap-0"
        >
          <TabsList className="w-full rounded-none border-b bg-transparent p-1">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>
        </Tabs>
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
