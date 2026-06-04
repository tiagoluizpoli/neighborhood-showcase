import { Card, CardContent } from '@neighborhood-showcase/ui/components/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@neighborhood-showcase/ui/components/tabs';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ModeToggle } from '@/components/mode-toggle';
import SignInForm from '@/components/sign-in-form';
import SignUpForm from '@/components/sign-up-form';

const authSearchSchema = z.object({
  tab: z.enum(['signin', 'signup']).optional(),
});

export const Route = createFileRoute('/auth')({
  validateSearch: authSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = Route.useSearch();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(
    tab || 'signin',
  );
  const { i18n } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Focused Auth Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            to="/"
            className="font-bold text-primary text-xl tracking-tight"
          >
            Neighborhood Showcase
          </Link>
          <div className="flex items-center gap-4">
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="cursor-pointer rounded border border-input bg-transparent px-2 py-1 text-foreground text-sm outline-none"
            >
              <option value="pt" className="bg-background text-foreground">
                PT
              </option>
              <option value="en" className="bg-background text-foreground">
                EN
              </option>
            </select>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Auth Form Container */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as 'signin' | 'signup')
            }
            className="gap-0"
          >
            <TabsList className="w-full rounded-none border-b bg-transparent p-1">
              <TabsTrigger value="signin" className="flex-1">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                Criar Conta
              </TabsTrigger>
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
    </div>
  );
}
